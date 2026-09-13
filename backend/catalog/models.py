"""
Commerce catalog models.

These are plain Django models (editable in the Wagtail admin through a
ModelViewSet) and deliberately *not* Wagtail pages: content lives in `cms`,
commerce facts live here.
"""

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify
from modelcluster.fields import ParentalKey
from modelcluster.models import ClusterableModel
from wagtail.admin.panels import FieldPanel, FieldRowPanel, InlinePanel, MultiFieldPanel
from wagtail.fields import RichTextField

CM_PER_INCH = Decimal("2.54")


class ProductType(models.TextChoices):
    SINGLE = "single", "Individual product"
    BUNDLE = "bundle", "Bundle"
    LIMITED = "limited_edition", "Limited edition"
    COLLABORATION = "collaboration", "Collaboration edition"


class FeatureIcon(models.TextChoices):
    """Icon keys rendered by the frontend. Keep in sync with the React icon set."""

    MIRROR = "mirror", "LED mirror"
    TOUCH = "touch", "Touch control"
    DRAWERS = "drawers", "Drawers"
    LEATHER = "leather", "Premium finish"
    TRAVEL = "travel", "Travel"
    SIZE = "size", "Compact size"
    CROWN = "crown", "Crown"
    SPARKLE = "sparkle", "Sparkle"


class ProductQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def featured(self):
        return self.active().filter(is_featured=True)


class Product(ClusterableModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    product_type = models.CharField(
        max_length=32, choices=ProductType.choices, default=ProductType.SINGLE
    )
    collaboration_label = models.CharField(
        max_length=120,
        blank=True,
        help_text="Optional edition label shown near the product name, e.g. "
        "'Collaboration edition'. Partner naming/logos are managed in Site settings.",
    )

    short_description = models.CharField(max_length=300)
    description = RichTextField(features=["bold", "italic", "link", "ol", "ul"])

    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    compare_at_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Original price shown struck-through when higher than the price.",
    )
    currency = models.CharField(max_length=3, default=settings.SHOP_CURRENCY)
    sku = models.CharField(max_length=64, unique=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)

    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    primary_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    # Physical
    height_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    width_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    depth_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    weight_grams = models.PositiveIntegerField(null=True, blank=True)
    dimensions_note = models.CharField(
        max_length=200, blank=True, help_text="e.g. 'Approximately three stacked phones.'"
    )
    materials = models.TextField(blank=True)
    shipping_information = RichTextField(
        blank=True, features=["bold", "italic", "link", "ol", "ul"]
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProductQuerySet.as_manager()

    panels = [
        MultiFieldPanel(
            [
                FieldPanel("name"),
                FieldPanel("slug"),
                FieldRowPanel([FieldPanel("product_type"), FieldPanel("collaboration_label")]),
                FieldPanel("short_description"),
                FieldPanel("description"),
                FieldPanel("primary_image"),
            ],
            heading="Product",
        ),
        MultiFieldPanel(
            [
                FieldRowPanel([FieldPanel("price"), FieldPanel("compare_at_price"), FieldPanel("currency")]),
                FieldRowPanel([FieldPanel("sku"), FieldPanel("stock_quantity"), FieldPanel("low_stock_threshold")]),
                FieldRowPanel([FieldPanel("is_active"), FieldPanel("is_featured")]),
            ],
            heading="Pricing & inventory",
        ),
        MultiFieldPanel(
            [
                FieldRowPanel([FieldPanel("height_cm"), FieldPanel("width_cm"), FieldPanel("depth_cm")]),
                FieldRowPanel([FieldPanel("weight_grams"), FieldPanel("dimensions_note")]),
                FieldPanel("materials"),
                FieldPanel("shipping_information"),
            ],
            heading="Physical details & shipping",
        ),
        InlinePanel("gallery", heading="Gallery", label="Image"),
        InlinePanel("features", heading="Key features", label="Feature"),
        InlinePanel("specifications", heading="Specifications", label="Specification"),
        InlinePanel("layers", heading="Layers / drawers", label="Layer"),
        InlinePanel("variants", heading="Variants (optional)", label="Variant"),
    ]

    class Meta:
        ordering = ["-is_featured", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    # -- Derived ----------------------------------------------------------

    @property
    def in_stock(self) -> bool:
        return self.stock_quantity > 0

    @property
    def is_low_stock(self) -> bool:
        return 0 < self.stock_quantity <= self.low_stock_threshold

    @property
    def is_on_sale(self) -> bool:
        return bool(self.compare_at_price and self.compare_at_price > self.price)

    @property
    def dimensions(self) -> dict | None:
        if not any([self.height_cm, self.width_cm, self.depth_cm]):
            return None

        def entry(cm):
            if cm is None:
                return None
            return {"cm": float(cm), "in": round(float(cm / CM_PER_INCH), 1)}

        return {
            "height": entry(self.height_cm),
            "width": entry(self.width_cm),
            "depth": entry(self.depth_cm),
            "weight_grams": self.weight_grams,
            "note": self.dimensions_note,
        }

    def get_frontend_url(self) -> str:
        return f"{settings.FRONTEND_URL}/products/{self.slug}"


class Orderable(models.Model):
    sort_order = models.PositiveIntegerField(default=0, blank=True)

    class Meta:
        abstract = True
        ordering = ["sort_order"]


class ProductImage(Orderable):
    product = ParentalKey(Product, on_delete=models.CASCADE, related_name="gallery")
    image = models.ForeignKey("wagtailimages.Image", on_delete=models.CASCADE, related_name="+")
    alt_text = models.CharField(
        max_length=255, blank=True, help_text="Overrides the image's default alt text."
    )
    caption = models.CharField(max_length=200, blank=True)

    panels = [FieldPanel("image"), FieldPanel("alt_text"), FieldPanel("caption")]

    class Meta(Orderable.Meta):
        pass


class ProductFeature(Orderable):
    product = ParentalKey(Product, on_delete=models.CASCADE, related_name="features")
    icon = models.CharField(max_length=32, choices=FeatureIcon.choices, default=FeatureIcon.SPARKLE)
    title = models.CharField(max_length=80)
    description = models.CharField(max_length=300, blank=True)

    panels = [FieldPanel("icon"), FieldPanel("title"), FieldPanel("description")]

    class Meta(Orderable.Meta):
        pass


class ProductSpecification(Orderable):
    product = ParentalKey(Product, on_delete=models.CASCADE, related_name="specifications")
    label = models.CharField(max_length=80)
    value = models.CharField(max_length=200)

    panels = [FieldPanel("label"), FieldPanel("value")]

    class Meta(Orderable.Meta):
        pass


class ProductLayer(Orderable):
    """A drawer / layer inside the product and what it holds."""

    product = ParentalKey(Product, on_delete=models.CASCADE, related_name="layers")
    number = models.PositiveSmallIntegerField(default=1, help_text="Displayed as LAYER 01, 02…")
    name = models.CharField(max_length=80, help_text="e.g. 'Lips & Essentials'")
    title = models.CharField(max_length=120, blank=True, help_text="Editorial headline for the layer.")
    description = models.TextField(blank=True)
    contents = models.TextField(
        blank=True, help_text="One item per line, e.g. Lipsticks / Glosses / Brushes."
    )
    image = models.ForeignKey(
        "wagtailimages.Image", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    panels = [
        FieldRowPanel([FieldPanel("number"), FieldPanel("name")]),
        FieldPanel("title"),
        FieldPanel("description"),
        FieldPanel("contents"),
        FieldPanel("image"),
    ]

    class Meta(Orderable.Meta):
        pass

    @property
    def content_items(self) -> list[str]:
        return [line.strip() for line in self.contents.splitlines() if line.strip()]


class ProductVariant(Orderable):
    """
    Light-weight variant support. A product with no variants sells at the
    product price; variants can override price/stock (e.g. colourways or
    edition packs) without a full option-matrix system.
    """

    product = ParentalKey(Product, on_delete=models.CASCADE, related_name="variants")
    name = models.CharField(max_length=120)
    sku = models.CharField(max_length=64, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    panels = [
        FieldRowPanel([FieldPanel("name"), FieldPanel("sku")]),
        FieldRowPanel([FieldPanel("price"), FieldPanel("stock_quantity"), FieldPanel("is_active")]),
    ]

    class Meta(Orderable.Meta):
        pass

    def __str__(self):
        return f"{self.product.name} — {self.name}"

    @property
    def effective_price(self):
        return self.price if self.price is not None else self.product.price
