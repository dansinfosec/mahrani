from django.contrib import admin

from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ["unit_price"]


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ["token", "status", "customer", "currency", "updated_at"]
    list_filter = ["status"]
    readonly_fields = ["token", "created_at", "updated_at"]
    inlines = [CartItemInline]
