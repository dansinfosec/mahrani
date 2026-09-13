from rest_framework import serializers

from cms.images import serialize_image

from ..models import (
    Product,
    ProductFeature,
    ProductImage,
    ProductLayer,
    ProductSpecification,
    ProductVariant,
)


class ImageField(serializers.Field):
    """Read-only Wagtail image → predictable JSON (see cms.images)."""

    def __init__(self, alt_source=None, **kwargs):
        self.alt_source = alt_source
        kwargs.setdefault("read_only", True)
        super().__init__(**kwargs)

    def to_representation(self, value):
        return serialize_image(value, self.context)


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "caption"]

    def get_image(self, obj):
        return serialize_image(obj.image, self.context, alt=obj.alt_text)


class ProductFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFeature
        fields = ["id", "icon", "title", "description"]


class ProductSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSpecification
        fields = ["id", "label", "value"]


class ProductLayerSerializer(serializers.ModelSerializer):
    image = ImageField()
    items = serializers.ListField(source="content_items", child=serializers.CharField())

    class Meta:
        model = ProductLayer
        fields = ["id", "number", "name", "title", "description", "items", "image"]


class ProductVariantSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(
        source="effective_price", max_digits=10, decimal_places=2, coerce_to_string=True
    )
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ["id", "name", "sku", "price", "stock_quantity", "in_stock"]

    def get_in_stock(self, obj):
        return obj.is_active and obj.stock_quantity > 0


class AvailabilityMixin(serializers.Serializer):
    availability = serializers.SerializerMethodField()

    def get_availability(self, obj):
        if not obj.is_active:
            return {"status": "unavailable", "label": "Unavailable", "quantity": 0}
        if not obj.in_stock:
            return {"status": "sold_out", "label": "Sold out", "quantity": 0}
        if obj.is_low_stock:
            return {
                "status": "low_stock",
                "label": f"Only {obj.stock_quantity} left",
                "quantity": obj.stock_quantity,
            }
        return {"status": "in_stock", "label": "In stock", "quantity": obj.stock_quantity}


class ProductListSerializer(AvailabilityMixin, serializers.ModelSerializer):
    primary_image = ImageField()
    is_on_sale = serializers.BooleanField(read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "url",
            "product_type",
            "collaboration_label",
            "short_description",
            "price",
            "compare_at_price",
            "currency",
            "is_on_sale",
            "is_featured",
            "availability",
            "primary_image",
        ]

    def get_url(self, obj):
        return f"/products/{obj.slug}"


class ProductDetailSerializer(ProductListSerializer):
    gallery = ProductImageSerializer(many=True, read_only=True)
    features = ProductFeatureSerializer(many=True, read_only=True)
    specifications = ProductSpecificationSerializer(many=True, read_only=True)
    layers = ProductLayerSerializer(many=True, read_only=True)
    variants = serializers.SerializerMethodField()
    dimensions = serializers.JSONField(read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            "sku",
            "description",
            "dimensions",
            "materials",
            "shipping_information",
            "gallery",
            "features",
            "specifications",
            "layers",
            "variants",
        ]

    def get_variants(self, obj):
        variants = obj.variants.filter(is_active=True)
        return ProductVariantSerializer(variants, many=True, context=self.context).data
