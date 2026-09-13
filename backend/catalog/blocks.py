"""
StreamField block that lets CMS content reference a catalog Product.

The API representation embeds the serialized product so the frontend can
render purchase / detail sections from a single page request.
"""

from .choosers import product_chooser_viewset

_BaseProductChooserBlock = product_chooser_viewset.get_block_class(
    name="_BaseProductChooserBlock", module_path="catalog.blocks"
)


class ProductChooserBlock(_BaseProductChooserBlock):
    class Meta:
        icon = "pick"
        label = "Product"

    def get_api_representation(self, value, context=None):
        if value is None:
            return None
        # Imported lazily to keep block definitions importable during app loading.
        from catalog.api.serializers import ProductDetailSerializer

        if not value.is_active:
            return None
        return ProductDetailSerializer(value, context=context or {}).data
