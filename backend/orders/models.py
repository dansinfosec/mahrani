"""
Order records. No checkout flow exists yet; these models define the shape
Phase 2 checkout/payment will write into.
"""

import secrets

from django.conf import settings
from django.db import models


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending payment"
    PAID = "paid", "Paid"
    FULFILLED = "fulfilled", "Fulfilled"
    CANCELLED = "cancelled", "Cancelled"
    REFUNDED = "refunded", "Refunded"


def generate_order_number() -> str:
    return "MHR-" + secrets.token_hex(4).upper()


class Order(models.Model):
    number = models.CharField(max_length=20, unique=True, default=generate_order_number, editable=False)
    status = models.CharField(max_length=16, choices=OrderStatus.choices, default=OrderStatus.PENDING)

    customer = models.ForeignKey(
        "customers.Customer", null=True, blank=True, on_delete=models.SET_NULL, related_name="orders"
    )
    cart = models.OneToOneField(
        "cart.Cart", null=True, blank=True, on_delete=models.SET_NULL, related_name="order"
    )
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)

    currency = models.CharField(max_length=3, default=settings.SHOP_CURRENCY)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    shipping_method = models.ForeignKey(
        "shipping.ShippingMethod", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    shipping_name = models.CharField(max_length=120, blank=True)
    shipping_line1 = models.CharField(max_length=200, blank=True)
    shipping_line2 = models.CharField(max_length=200, blank=True)
    shipping_city = models.CharField(max_length=100, blank=True)
    shipping_region = models.CharField(max_length=100, blank=True)
    shipping_postal_code = models.CharField(max_length=20, blank=True)
    shipping_country = models.CharField(max_length=2, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.number

    def recalculate(self, save: bool = True) -> None:
        self.subtotal = sum((i.line_total for i in self.items.all()), 0)
        self.total = self.subtotal + self.shipping_total + self.tax_total - self.discount_total
        if save:
            self.save(update_fields=["subtotal", "total", "updated_at"])


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("catalog.Product", null=True, on_delete=models.SET_NULL, related_name="+")
    variant = models.ForeignKey(
        "catalog.ProductVariant", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    # Snapshots so the order stays readable if the catalog changes.
    product_name = models.CharField(max_length=200)
    sku = models.CharField(max_length=64)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} × {self.product_name}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity
