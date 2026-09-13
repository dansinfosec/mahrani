"""
Server-side cart. Identified by an opaque token the frontend stores locally and
sends as `X-Cart-Token`, which works across origins (Vercel → Railway) without
cookies.
"""

import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models


class CartStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    CONVERTED = "converted", "Converted to order"
    ABANDONED = "abandoned", "Abandoned"


class Cart(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    customer = models.ForeignKey(
        "customers.Customer", null=True, blank=True, on_delete=models.SET_NULL, related_name="carts"
    )
    currency = models.CharField(max_length=3, default=settings.SHOP_CURRENCY)
    status = models.CharField(max_length=16, choices=CartStatus.choices, default=CartStatus.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Cart {self.token}"

    @property
    def item_count(self) -> int:
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self) -> Decimal:
        return sum((item.line_total for item in self.items.all()), Decimal("0.00"))


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT, related_name="+")
    variant = models.ForeignKey(
        "catalog.ProductVariant", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    quantity = models.PositiveIntegerField(default=1)
    # Snapshot of the price at the time of adding; re-synced on every cart read.
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "product", "variant"], name="unique_cart_line"
            )
        ]

    def __str__(self):
        return f"{self.quantity} × {self.product.name}"

    @property
    def available_stock(self) -> int:
        if self.variant_id:
            return self.variant.stock_quantity if self.variant.is_active else 0
        return self.product.stock_quantity if self.product.is_active else 0

    @property
    def current_price(self) -> Decimal:
        return self.variant.effective_price if self.variant_id else self.product.price

    @property
    def line_total(self) -> Decimal:
        return self.unit_price * self.quantity
