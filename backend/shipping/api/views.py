from rest_framework import generics, serializers

from ..models import ShippingMethod


class ShippingMethodSerializer(serializers.ModelSerializer):
    is_free = serializers.BooleanField(read_only=True)
    countries = serializers.ListField(source="country_codes", child=serializers.CharField())

    class Meta:
        model = ShippingMethod
        fields = [
            "id",
            "name",
            "description",
            "price",
            "currency",
            "is_free",
            "estimated_min_days",
            "estimated_max_days",
            "countries",
        ]


class ShippingMethodListView(generics.ListAPIView):
    """GET /api/v1/shipping/methods/?country=AE"""

    serializer_class = ShippingMethodSerializer
    pagination_class = None

    def get_queryset(self):
        qs = ShippingMethod.objects.filter(is_active=True)
        country = self.request.query_params.get("country", "").strip().upper()
        if country:
            qs = [m for m in qs if not m.country_codes or country in m.country_codes]
        return qs
