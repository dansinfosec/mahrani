from django.contrib import admin

from .models import Address, Customer


class AddressInline(admin.StackedInline):
    model = Address
    extra = 0


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["email", "first_name", "last_name", "accepts_marketing", "created_at"]
    search_fields = ["email", "first_name", "last_name"]
    inlines = [AddressInline]
