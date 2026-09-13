from django.conf import settings
from django.db import models


class ShippingMethod(models.Model):
    """A shipping option shown in the purchase section and used by orders later."""

    name = models.CharField(max_length=80)
    description = models.CharField(max_length=200, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default=settings.SHOP_CURRENCY)
    estimated_min_days = models.PositiveSmallIntegerField(default=2)
    estimated_max_days = models.PositiveSmallIntegerField(default=5)
    countries = models.CharField(
        max_length=400,
        blank=True,
        help_text="Comma-separated ISO country codes this method serves. Empty = worldwide.",
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "price"]

    def __str__(self):
        return self.name

    @property
    def is_free(self) -> bool:
        return self.price == 0

    @property
    def country_codes(self) -> list[str]:
        return [c.strip().upper() for c in self.countries.split(",") if c.strip()]
