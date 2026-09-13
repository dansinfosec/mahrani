"""
Registers commerce models in the Wagtail admin. Products stay ordinary Django
models; Wagtail only provides the editing UI and the chooser used by CMS blocks.
"""

from wagtail import hooks
from wagtail.admin.viewsets.model import ModelViewSet

from .choosers import product_chooser_viewset
from .models import Product


class ProductViewSet(ModelViewSet):
    model = Product
    icon = "pick"
    menu_label = "Products"
    menu_name = "products"
    menu_order = 150
    add_to_admin_menu = True
    list_display = [
        "name",
        "sku",
        "product_type",
        "price",
        "stock_quantity",
        "is_active",
        "is_featured",
    ]
    list_filter = ["product_type", "is_active", "is_featured"]
    search_fields = ["name", "sku", "short_description"]
    ordering = ["name"]


product_viewset = ProductViewSet("products")


@hooks.register("register_admin_viewset")
def register_admin_viewsets():
    return [product_viewset, product_chooser_viewset]
