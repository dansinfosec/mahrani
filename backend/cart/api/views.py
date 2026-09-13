"""
Cart API.

  GET    /api/v1/cart/                  current cart (empty shape if none)
  DELETE /api/v1/cart/                  clear the cart
  POST   /api/v1/cart/items/            {product: <slug>, variant_id?, quantity}
  PATCH  /api/v1/cart/items/<id>/       {quantity}   (0 removes)
  DELETE /api/v1/cart/items/<id>/

The cart token travels in the `X-Cart-Token` header (also echoed back in the
response header and body).
"""

import uuid

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.api.serializers import ProductListSerializer
from catalog.models import Product, ProductVariant

from ..models import Cart, CartItem, CartStatus

MAX_LINE_QUANTITY = 10


# --------------------------------------------------------------------------
# Serialization
# --------------------------------------------------------------------------


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    variant = serializers.SerializerMethodField()
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    available_stock = serializers.IntegerField(read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "variant", "quantity", "unit_price", "line_total", "available_stock"]

    def get_variant(self, obj):
        if not obj.variant_id:
            return None
        return {"id": obj.variant_id, "name": obj.variant.name, "sku": obj.variant.sku}


def empty_cart_payload() -> dict:
    return {
        "token": None,
        "currency": settings.SHOP_CURRENCY,
        "items": [],
        "item_count": 0,
        "subtotal": "0.00",
    }


def serialize_cart(cart: Cart | None, request) -> dict:
    if cart is None:
        return empty_cart_payload()
    items = list(cart.items.select_related("product", "product__primary_image", "variant"))
    return {
        "token": str(cart.token),
        "currency": cart.currency,
        "items": CartItemSerializer(items, many=True, context={"request": request}).data,
        "item_count": sum(i.quantity for i in items),
        "subtotal": f"{sum((i.line_total for i in items), 0):.2f}",
    }


def sync_prices(cart: Cart) -> None:
    """Keep unit prices aligned with the catalog on every read."""
    for item in cart.items.select_related("product", "variant"):
        price = item.current_price
        if item.unit_price != price:
            item.unit_price = price
            item.save(update_fields=["unit_price", "updated_at"])


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------


def get_cart(request, create: bool = False) -> Cart | None:
    raw = request.META.get(settings.CART_TOKEN_HEADER, "").strip()
    cart = None
    if raw:
        try:
            cart = Cart.objects.filter(token=uuid.UUID(raw), status=CartStatus.ACTIVE).first()
        except ValueError:
            cart = None
    if cart is None and create:
        cart = Cart.objects.create()
    return cart


def cart_response(cart: Cart | None, request, status_code=status.HTTP_200_OK) -> Response:
    if cart is not None:
        sync_prices(cart)
    response = Response(serialize_cart(cart, request), status=status_code)
    if cart is not None:
        response["X-Cart-Token"] = str(cart.token)
    return response


class AddItemSerializer(serializers.Serializer):
    product = serializers.SlugField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, max_value=MAX_LINE_QUANTITY, default=1)


class UpdateItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0, max_value=MAX_LINE_QUANTITY)


def clamp_to_stock(requested: int, available: int) -> int:
    if available <= 0:
        raise serializers.ValidationError({"quantity": "This item is sold out."})
    if requested > available:
        raise serializers.ValidationError(
            {"quantity": f"Only {available} available.", "available": available}
        )
    return requested


# --------------------------------------------------------------------------
# Views
# --------------------------------------------------------------------------


class CartView(APIView):
    def get(self, request):
        return cart_response(get_cart(request), request)

    def delete(self, request):
        cart = get_cart(request)
        if cart is not None:
            cart.items.all().delete()
        return cart_response(cart, request)


class CartItemsView(APIView):
    @transaction.atomic
    def post(self, request):
        payload = AddItemSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        product = get_object_or_404(Product.objects.active(), slug=data["product"])
        variant = None
        if data.get("variant_id"):
            variant = get_object_or_404(
                ProductVariant, pk=data["variant_id"], product=product, is_active=True
            )

        cart = get_cart(request, create=True)
        item, created = CartItem.objects.select_for_update().get_or_create(
            cart=cart,
            product=product,
            variant=variant,
            defaults={"quantity": 0, "unit_price": variant.effective_price if variant else product.price},
        )
        requested = item.quantity + data["quantity"]
        item.quantity = clamp_to_stock(min(requested, MAX_LINE_QUANTITY), item.available_stock)
        item.unit_price = item.current_price
        item.save()
        return cart_response(cart, request, status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CartItemDetailView(APIView):
    def _get_item(self, request, item_id) -> tuple[Cart, CartItem]:
        cart = get_cart(request)
        if cart is None:
            raise serializers.ValidationError({"detail": "No active cart."})
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        return cart, item

    @transaction.atomic
    def patch(self, request, item_id):
        cart, item = self._get_item(request, item_id)
        payload = UpdateItemSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        quantity = payload.validated_data["quantity"]
        if quantity == 0:
            item.delete()
        else:
            item.quantity = clamp_to_stock(quantity, item.available_stock)
            item.save(update_fields=["quantity", "updated_at"])
        return cart_response(cart, request)

    def delete(self, request, item_id):
        cart, item = self._get_item(request, item_id)
        item.delete()
        return cart_response(cart, request)
