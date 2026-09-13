from django.contrib import admin

from .models import Product, ProductFeature, ProductImage, ProductLayer, ProductSpecification, ProductVariant


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class ProductFeatureInline(admin.TabularInline):
    model = ProductFeature
    extra = 0


class ProductSpecificationInline(admin.TabularInline):
    model = ProductSpecification
    extra = 0


class ProductLayerInline(admin.StackedInline):
    model = ProductLayer
    extra = 0


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "sku", "product_type", "price", "stock_quantity", "is_active", "is_featured"]
    list_filter = ["product_type", "is_active", "is_featured"]
    search_fields = ["name", "sku"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [
        ProductImageInline,
        ProductFeatureInline,
        ProductSpecificationInline,
        ProductLayerInline,
        ProductVariantInline,
    ]
