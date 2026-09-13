"""
Payment records only. No provider integration or processing exists in this
first pass; Phase 2 wires a provider (e.g. Stripe) into these models.
"""

from django.conf import settings
from django.db import models


class PaymentProvider(models.TextChoices):
    STRIPE = "stripe", "Stripe"
    MANUAL = "manual", "Manual / offline"


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    AUTHORIZED = "authorized", "Authorized"
    CAPTURED = "captured", "Captured"
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"


class Payment(models.Model):
    order = models.ForeignKey("orders.Order", on_delete=models.CASCADE, related_name="payments")
    provider = models.CharField(max_length=20, choices=PaymentProvider.choices, default=PaymentProvider.MANUAL)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default=settings.SHOP_CURRENCY)
    provider_reference = models.CharField(max_length=200, blank=True, help_text="Provider-side id.")
    raw_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_provider_display()} {self.amount} {self.currency} ({self.status})"
