from wagtail.admin.viewsets.chooser import ChooserViewSet

from .models import Product


class ProductChooserViewSet(ChooserViewSet):
    """Generic Wagtail chooser so CMS blocks can reference a Product."""

    model = Product
    icon = "pick"
    choose_one_text = "Choose a product"
    choose_another_text = "Choose another product"
    edit_item_text = "Edit this product"
    per_page = 20


product_chooser_viewset = ProductChooserViewSet("product_chooser")
