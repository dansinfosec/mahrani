from django.contrib import admin

from .models import ShippingMethod


@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    list_display = ["name", "price", "currency", "estimated_min_days", "estimated_max_days", "is_active", "sort_order"]
    list_editable = ["is_active", "sort_order"]
