from django.db.models import Q
from rest_framework import viewsets

from ..models import Product
from .serializers import ProductDetailSerializer, ProductListSerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /api/v1/products/            list (active products; ?featured=1&q=term)
    /api/v1/products/<slug>/     detail
    """

    lookup_field = "slug"
    lookup_value_regex = r"[-a-zA-Z0-9_]+"

    def get_queryset(self):
        qs = Product.objects.active().select_related("primary_image")
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                "gallery__image", "features", "specifications", "layers__image", "variants"
            )
        if self.request.query_params.get("featured") in ("1", "true"):
            qs = qs.filter(is_featured=True)
        query = self.request.query_params.get("q", "").strip()
        if query:
            qs = qs.filter(Q(name__icontains=query) | Q(short_description__icontains=query) | Q(sku__iexact=query))
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer
