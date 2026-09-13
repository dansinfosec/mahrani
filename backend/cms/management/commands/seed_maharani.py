"""
Seeds development content: campaign images (cropped from the supplied
reference collage), the hero product, shipping methods, site settings, the
home page and an "Our Story" page.

Idempotent: re-running updates existing records instead of duplicating them.

    python manage.py seed_maharani
    python manage.py seed_maharani --reset-home   # rebuild the home page body
"""

import io
import os
import secrets
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from PIL import Image as PILImage, ImageFilter
from wagtail.images.models import Image
from wagtail.models import Page, Site

from catalog.models import Product, ProductFeature, ProductImage, ProductLayer, ProductSpecification
from cms.models import HomePage, SiteSettings, StandardPage
from shipping.models import ShippingMethod

SEED_DIR = Path(settings.BASE_DIR) / "seed"
SOURCE_IMAGE = SEED_DIR / "maharani-campaign.jpg"

# Crops from the reference collage, as fractions of (width, height). Each panel
# is cropped to exclude baked-in captions so the site never shows collage text.
CROPS = {
    "hero-open": {
        "box": (0.322, 0.006, 0.572, 0.576),
        "title": "MAHARANI case open with illuminated mirror",
        "alt": "Open MAHARANI makeup case with the LED mirror lit and three drawers pulled out, on a marble vanity in candlelight.",
    },
    "closed-portrait": {
        "box": (0.812, 0.588, 0.996, 0.865),
        "title": "MAHARANI case closed, upright",
        "alt": "Closed MAHARANI makeup case in black leather-look finish with a rose-gold frame and crown emblem.",
    },
    "closed-landscape": {
        "box": (0.004, 0.588, 0.202, 0.905),
        "title": "MAHARANI case closed, on marble",
        "alt": "Closed MAHARANI makeup case resting on a marble surface beside cream roses.",
    },
    "drawer-top": {
        "box": (0.213, 0.588, 0.404, 0.855),
        "title": "Top drawer — lips & essentials",
        "alt": "Top drawer of the MAHARANI case holding lipsticks, glosses, brushes and powder.",
    },
    "drawer-middle": {
        "box": (0.412, 0.588, 0.600, 0.855),
        "title": "Middle drawer — complexion",
        "alt": "Middle drawer of the MAHARANI case with eyeshadows, blushes, powders and foundation.",
    },
    "drawer-bottom": {
        "box": (0.608, 0.588, 0.797, 0.855),
        "title": "Bottom drawer — eyes",
        "alt": "Bottom drawer of the MAHARANI case with lashes, liners and mascara.",
    },
    "mirror": {
        "box": (0.336, 0.020, 0.560, 0.245),
        "title": "Illuminated LED mirror",
        "alt": "Close-up of the MAHARANI lid with the LED-lit mirror glowing warm white.",
    },
    "dimensions": {
        "box": (0.712, 0.070, 0.972, 0.415),
        "title": "Case dimensions figure",
        "alt": "MAHARANI case shown with height, width and depth measurements: 14.7 by 7.1 by 3.0 centimetres.",
    },
}


def heading(*lines: str) -> str:
    return "\n".join(lines)


def image_block(key: str, images: dict, alt: str = "") -> dict:
    return {"image": images[key].pk, "alt_text": alt}


def link(label: str, url: str = "", page: Page | None = None, style: str = "primary") -> dict:
    return {"label": label, "page": page.pk if page else None, "url": url, "style": style}


class Command(BaseCommand):
    help = "Seed MAHARANI development content (images, product, pages, settings)."

    def add_arguments(self, parser):
        parser.add_argument("--reset-home", action="store_true", help="Rebuild the home page body.")
        parser.add_argument("--recrop", action="store_true", help="Regenerate cropped image files.")

    @transaction.atomic
    def handle(self, *args, **options):
        if not SOURCE_IMAGE.exists():
            raise CommandError(f"Reference image missing: {SOURCE_IMAGE}")

        self.ensure_admin()
        images = self.seed_images(recrop=options["recrop"])
        product = self.seed_product(images)
        self.seed_shipping()
        home = self.seed_home_page(images, product, reset=options["reset_home"])
        story = self.seed_story_page(home, images)
        self.seed_site_settings(home, story, product, images)
        self.stdout.write(self.style.SUCCESS("MAHARANI content seeded."))

    # ------------------------------------------------------------------
    def ensure_admin(self):
        """
        Development convenience only. Never runs when DEBUG is False, so a
        production bootstrap can safely run this command and create its admin
        with `python manage.py createsuperuser` instead.
        """
        User = get_user_model()
        if not settings.DEBUG or User.objects.filter(is_superuser=True).exists():
            return
        password = os.environ.get("DEV_ADMIN_PASSWORD") or secrets.token_urlsafe(12)
        User.objects.create_superuser("admin", "admin@example.com", password)
        self.stdout.write(self.style.WARNING(f"Created DEV superuser 'admin' with password: {password}"))
        self.stdout.write("Set DEV_ADMIN_PASSWORD to choose it. This never runs with DEBUG=False.")

    # ------------------------------------------------------------------
    def seed_images(self, recrop: bool = False) -> dict:
        source = PILImage.open(SOURCE_IMAGE).convert("RGB")
        width, height = source.size
        images = {}

        for key, spec in CROPS.items():
            existing = Image.objects.filter(title=spec["title"]).first()
            if existing and not recrop:
                if hasattr(existing, "description") and existing.description != spec["alt"]:
                    existing.description = spec["alt"]
                    existing.save(update_fields=["description"])
                images[key] = existing
                continue

            left, top, right, bottom = spec["box"]
            crop = source.crop((int(left * width), int(top * height), int(right * width), int(bottom * height)))
            # Gentle sharpening after cropping keeps small panels crisp on screen.
            crop = crop.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
            buffer = io.BytesIO()
            crop.save(buffer, format="JPEG", quality=92, optimize=True, progressive=True)

            image = existing or Image(title=spec["title"])
            if hasattr(image, "description"):
                image.description = spec["alt"]
            if existing:
                existing.renditions.all().delete()
                existing.file.delete(save=False)
            image.file.save(f"maharani-{key}.jpg", ContentFile(buffer.getvalue()), save=False)
            image.width, image.height = crop.size
            image.save()
            images[key] = image
            verb = "Re-cropped" if existing else "Created"
            self.stdout.write(f"{verb} image: {spec['title']} ({crop.size[0]}x{crop.size[1]})")

        source_title = "Campaign reference collage (source)"
        if not Image.objects.filter(title=source_title).exists():
            with open(SOURCE_IMAGE, "rb") as fh:
                image = Image(title=source_title, width=width, height=height)
                if hasattr(image, "description"):
                    image.description = "Reference collage of the MAHARANI makeup kit campaign."
                image.file.save("maharani-campaign-source.jpg", ContentFile(fh.read()), save=False)
                image.width, image.height = width, height
                image.save()
        return images

    # ------------------------------------------------------------------
    def seed_product(self, images: dict) -> Product:
        product, created = Product.objects.update_or_create(
            slug="maharani-luxury-makeup-kit",
            defaults={
                "name": "MAHARANI Luxury Makeup Kit",
                "product_type": "single",
                "short_description": "A multi-layer makeup case with a built-in LED mirror, touch control and three pull-out drawers — your entire ritual in one hand.",
                "description": (
                    "<p>The MAHARANI Luxury Makeup Kit organises a complete beauty collection across "
                    "three illuminated layers. Lift the lid and the integrated LED mirror wakes with a "
                    "single touch; pull each drawer to reveal lips, complexion and eyes in their own "
                    "compartments.</p>"
                    "<p>Wrapped in a black leather-look finish with rose-gold hardware, the case is "
                    "compact enough to travel yet composed enough for a vanity.</p>"
                ),
                "price": Decimal("189.00"),
                "compare_at_price": Decimal("229.00"),
                "currency": settings.SHOP_CURRENCY,
                "sku": "MHR-KIT-001",
                "stock_quantity": 120,
                "low_stock_threshold": 10,
                "is_active": True,
                "is_featured": True,
                "primary_image": images["hero-open"],
                "height_cm": Decimal("14.7"),
                "width_cm": Decimal("7.1"),
                "depth_cm": Decimal("3.0"),
                "dimensions_note": "Roughly the footprint of a phone, three phones deep.",
                "materials": "Leather-look exterior. Rose-gold tone metal frame and hardware. Glass mirror with integrated LED ring.",
                "shipping_information": (
                    "<p>Complimentary tracked shipping on every order. Dispatched within two business "
                    "days; delivery estimates are shown before you pay.</p>"
                ),
            },
        )
        self.stdout.write(("Created" if created else "Updated") + f" product: {product.name}")

        product.gallery.all().delete()
        for order, (key, caption) in enumerate(
            [
                ("hero-open", "Open, illuminated"),
                ("closed-portrait", "Closed"),
                ("drawer-top", "Layer 01 — Lips & Essentials"),
                ("drawer-middle", "Layer 02 — Complexion"),
                ("drawer-bottom", "Layer 03 — Eyes"),
                ("mirror", "LED mirror"),
                ("closed-landscape", "On the vanity"),
            ]
        ):
            ProductImage.objects.create(product=product, image=images[key], caption=caption, sort_order=order)

        product.features.all().delete()
        for order, (icon, title, description) in enumerate(
            [
                ("mirror", "Built-in LED mirror", "An integrated illuminated beauty mirror, framed in rose gold."),
                ("touch", "Touch control", "Simple touch on/off. No switches, no fuss."),
                ("drawers", "Multiple drawers", "Layered organisation for an entire makeup collection."),
                ("leather", "Premium finish", "Black leather-look exterior with rose-gold detailing."),
                ("travel", "Travel friendly", "A compact luxury case designed to carry your essentials."),
            ]
        ):
            ProductFeature.objects.create(product=product, icon=icon, title=title, description=description, sort_order=order)

        product.specifications.all().delete()
        for order, (label, value) in enumerate(
            [
                ("Exterior", "Premium leather-look finish"),
                ("Hardware", "Rose-gold tone frame and clasps"),
                ("Mirror", "Built-in LED illuminated mirror"),
                ("Control", "Touch on / off"),
                ("Storage", "Three pull-out drawers, multi-layer"),
                ("Dimensions", "14.7 × 7.1 × 3.0 cm  (5.8 × 2.8 × 1.2 in)"),
                ("Design", "Compact, travel-friendly construction"),
            ]
        ):
            ProductSpecification.objects.create(product=product, label=label, value=value, sort_order=order)

        product.layers.all().delete()
        for order, (number, name, title, description, contents, key) in enumerate(
            [
                (
                    1,
                    "Lips & Essentials",
                    heading("Everything the day", "_begins with._"),
                    "The first drawer holds colour and tools: lipsticks and glosses in a row, brushes at hand, powder beside them.",
                    "Lipsticks\nGlosses\nBrushes\nPowder",
                    "drawer-top",
                ),
                (
                    2,
                    "Complexion",
                    heading("A canvas,", "_perfected._"),
                    "The second layer is built for skin: shadows, blush and foundation arranged so nothing is buried.",
                    "Eyeshadows\nBlushes\nPowders\nFoundation",
                    "drawer-middle",
                ),
                (
                    3,
                    "Eyes",
                    heading("The finishing", "_gaze._"),
                    "The deepest drawer keeps lashes flat, liners straight and mascara upright and ready.",
                    "Eyelashes\nLiners\nMascara\nMore",
                    "drawer-bottom",
                ),
            ]
        ):
            ProductLayer.objects.create(
                product=product,
                number=number,
                name=name,
                title=title,
                description=description,
                contents=contents,
                image=images[key],
                sort_order=order,
            )
        return product

    # ------------------------------------------------------------------
    def seed_shipping(self):
        ShippingMethod.objects.update_or_create(
            name="Complimentary tracked shipping",
            defaults={
                "description": "Free on every order. Tracked door-to-door.",
                "price": Decimal("0.00"),
                "currency": settings.SHOP_CURRENCY,
                "estimated_min_days": 3,
                "estimated_max_days": 6,
                "is_active": True,
                "sort_order": 0,
            },
        )
        ShippingMethod.objects.update_or_create(
            name="Express",
            defaults={
                "description": "Priority courier, signature on delivery.",
                "price": Decimal("25.00"),
                "currency": settings.SHOP_CURRENCY,
                "estimated_min_days": 1,
                "estimated_max_days": 2,
                "is_active": True,
                "sort_order": 1,
            },
        )

    # ------------------------------------------------------------------
    def home_body(self, images: dict, product: Product) -> list:
        product_url = f"/products/{product.slug}"
        return [
            {
                "type": "hero",
                "value": {
                    "anchor_id": "top",
                    "eyebrow": "The Luxury Makeup Kit",
                    "title": "MAHARANI",
                    "tagline": "BEAUTY IN EVERY LAYER",
                    "headline": heading("A beauty ritual,", "_beautifully contained._"),
                    "body": "A built-in illuminated mirror, touch control and three pull-out drawers — a complete collection in a case that fits in one hand.",
                    "image": image_block("hero-open", images),
                    "primary_cta": link("Discover the collection", "#collection"),
                    "secondary_cta": link("Shop the box", "#shop", style="secondary"),
                    "scroll_hint": "Scroll",
                },
            },
            {
                "type": "editorial_text",
                "value": {
                    "anchor_id": "collection",
                    "eyebrow": "Introducing",
                    "heading": heading("Not just a makeup case.", "_A beauty experience._"),
                    "body": (
                        "<p>MAHARANI brings organisation, illumination and portability into one object. "
                        "Three layered drawers keep a full collection in order. A built-in LED mirror gives "
                        "you perfect light wherever you open it. And the whole case closes to the size of a "
                        "few stacked phones.</p>"
                    ),
                    "alignment": "left",
                    "size": "display",
                },
            },
            {
                "type": "features",
                "value": {
                    "anchor_id": "",
                    "eyebrow": "",
                    "heading": "",
                    "layout": "row",
                    "items": [
                        {"icon": "mirror", "title": "Built-in LED mirror", "description": "Integrated illuminated beauty mirror."},
                        {"icon": "touch", "title": "Touch control", "description": "Simple touch on / off operation."},
                        {"icon": "drawers", "title": "Multiple drawers", "description": "Layered organisation for a whole collection."},
                        {"icon": "leather", "title": "Premium finish", "description": "Black leather-look exterior, rose-gold details."},
                        {"icon": "travel", "title": "Travel friendly", "description": "Compact luxury that goes where you go."},
                    ],
                },
            },
            {
                "type": "product_reveal",
                "value": {
                    "anchor_id": "experience",
                    "eyebrow": "Open the experience",
                    "heading": heading("Closed.", "Opened.", "_Illuminated._"),
                    "intro": "Scroll to open the case, wake the mirror and pull each drawer.",
                    "media_mode": "stills",
                    "stages": [
                        {"label": "Closed", "caption": "Black leather-look. Rose-gold frame. A crown.", "image": image_block("closed-portrait", images), "glow": False},
                        {"label": "Opened", "caption": "Lift the lid. The mirror wakes to a touch.", "image": image_block("hero-open", images), "glow": True},
                        {"label": "Layer 01", "caption": "The first drawer slides out: lips and essentials.", "image": image_block("drawer-top", images), "glow": False},
                        {"label": "Layer 02", "caption": "The second: complexion.", "image": image_block("drawer-middle", images), "glow": False},
                        {"label": "Layer 03", "caption": "The third: eyes. Everything, in its place.", "image": image_block("drawer-bottom", images), "glow": False},
                    ],
                    "sequence_base_url": "",
                    "sequence_frame_count": None,
                    "video_url": "",
                    "product": product.pk,
                },
            },
            {
                "type": "drawer_showcase",
                "value": {
                    "anchor_id": "layers",
                    "eyebrow": "Beauty in every layer",
                    "heading": heading("Three drawers.", "_One ritual._"),
                    "intro": "Each layer is dedicated to a stage of your routine, so every product has a home and nothing is buried.",
                    "source": "product",
                    "product": product.pk,
                    "layers": [],
                },
            },
            {
                "type": "spotlight",
                "value": {
                    "anchor_id": "mirror",
                    "eyebrow": "The LED mirror",
                    "heading": heading("Light,", "_perfected._"),
                    "body": (
                        "<p>A ring of warm-white LEDs frames the mirror inside the lid, lighting your face evenly "
                        "wherever you are. One touch wakes it. One touch rests it.</p>"
                    ),
                    "image": image_block("mirror", images),
                    "glow": "warm",
                    "highlights": [
                        {"icon": "mirror", "title": "Integrated LED mirror", "description": "Even, flattering light built into the lid."},
                        {"icon": "touch", "title": "Touch on / off", "description": "A single sensor. No switches to find in the dark."},
                    ],
                    "cta": {},
                },
            },
            {
                "type": "product_details",
                "value": {
                    "anchor_id": "details",
                    "eyebrow": "Details",
                    "heading": heading("Considered,", "_down to the clasp._"),
                    "intro": "",
                    "product": product.pk,
                    "extra_items": [],
                    "image": image_block("dimensions", images),
                },
            },
            {
                "type": "product_purchase",
                "value": {
                    "anchor_id": "shop",
                    "eyebrow": "Shop",
                    "heading": heading("Make it", "_yours._"),
                    "product": product.pk,
                    "image": image_block("closed-landscape", images),
                    "show_shipping": True,
                    "note": "Secure checkout arrives with the next release. Your bag is saved in the meantime.",
                },
            },
            {
                "type": "brand_story",
                "value": {
                    "anchor_id": "story",
                    "words": ["Beauty", "Elegance", "You"],
                    "eyebrow": "The house",
                    "heading": heading("Made for the woman", "_who carries her own light._"),
                    "body": (
                        "<p>MAHARANI means queen. The name is a reminder that a beauty ritual is not a chore "
                        "but a moment of composure — a few minutes that belong entirely to you.</p>"
                        "<p>We design objects for that moment: precise, quietly luxurious, and made to be "
                        "carried from a marble vanity to a hotel room without losing an ounce of grace.</p>"
                    ),
                    "image": image_block("closed-portrait", images),
                    "cta": link("Our story", "/our-story/", style="text"),
                },
            },
            {
                "type": "faq",
                "value": {
                    "anchor_id": "faq",
                    "eyebrow": "Questions",
                    "heading": heading("Good to know."),
                    "items": [
                        {"question": "Does the kit come with makeup?", "answer": "<p>The MAHARANI Luxury Makeup Kit is the case itself — the illuminated mirror, drawers and hardware. Products shown are for illustration of how the layers organise a collection.</p>"},
                        {"question": "How is the mirror powered?", "answer": "<p>The LED mirror is built into the lid and controlled with a single touch. Charging and battery details are listed on the product page.</p>"},
                        {"question": "How big is it?", "answer": "<p>Approximately 14.7 cm tall, 7.1 cm wide and 3.0 cm deep — roughly three stacked phones. It fits in a handbag.</p>"},
                        {"question": "How long does shipping take?", "answer": "<p>Complimentary tracked shipping is included on every order, with delivery typically in three to six days. Express options are shown at checkout.</p>"},
                        {"question": "What is your return policy?", "answer": "<p>Unused items in original packaging can be returned within 14 days of delivery. Contact us and we will arrange collection.</p>"},
                    ],
                },
            },
        ]

    def seed_home_page(self, images: dict, product: Product, reset: bool = False) -> HomePage:
        root = Page.get_first_root_node()
        home = HomePage.objects.first()
        if home is None:
            home = HomePage(
                title="MAHARANI — Luxury Makeup Kit",
                slug="home",
                seo_title="MAHARANI | Luxury Makeup Kit with Built-in LED Mirror",
                search_description="MAHARANI is a multi-layer luxury makeup case with a built-in LED mirror, touch control and three pull-out drawers. Beauty in every layer.",
                og_image=images["hero-open"],
                body=self.home_body(images, product),
            )
            # Wagtail's default "Welcome" page occupies the slug; move it aside.
            for page in Page.objects.filter(slug="home", depth=2).exclude(pk=home.pk):
                page.slug = "welcome-legacy"
                page.save()
            root.add_child(instance=home)
            home.save_revision().publish()
            self.stdout.write("Created home page.")
        elif reset:
            home.body = self.home_body(images, product)
            home.og_image = home.og_image or images["hero-open"]
            home.save_revision().publish()
            self.stdout.write("Reset home page body.")

        site = Site.objects.filter(is_default_site=True).first()
        if site is None:
            # Derive the Wagtail Site from the public backend URL so the seed
            # also works as a first-run content bootstrap on Railway.
            public = urlparse(settings.WAGTAILADMIN_BASE_URL)
            site = Site(
                hostname=public.hostname or "localhost",
                port=public.port or (443 if public.scheme == "https" else 80),
                is_default_site=True,
            )
        site.root_page = home
        site.site_name = "MAHARANI"
        site.save()

        # Remove Wagtail's placeholder page once the real home page is live.
        Page.objects.filter(slug="welcome-legacy", depth=2).delete()
        return home

    # ------------------------------------------------------------------
    def seed_story_page(self, home: HomePage, images: dict) -> StandardPage:
        story = StandardPage.objects.filter(slug="our-story").first()
        if story:
            return story
        story = StandardPage(
            title="Our Story",
            slug="our-story",
            seo_title="Our Story",
            search_description="The story behind MAHARANI: beauty, elegance and the woman who carries her own light.",
            intro="Beauty, elegance, you.",
            body=[
                {
                    "type": "editorial_text",
                    "value": {
                        "anchor_id": "",
                        "eyebrow": "Our story",
                        "heading": heading("A queen keeps", "_her own counsel._"),
                        "body": (
                            "<p>MAHARANI began with a simple frustration: beautiful products, scattered across bags "
                            "and drawers, and never good light when it mattered. We wanted one object that held "
                            "everything, lit everything, and looked like it belonged on a marble vanity.</p>"
                        ),
                        "alignment": "left",
                        "size": "display",
                    },
                },
                {
                    "type": "brand_story",
                    "value": {
                        "anchor_id": "",
                        "words": ["Beauty", "Elegance", "You"],
                        "eyebrow": "The house",
                        "heading": heading("Designed in the spirit", "_of Dubai glamour._"),
                        "body": (
                            "<p>Black lacquer, rose gold and warm light: the palette of a night out and the calm of a "
                            "morning routine. Every MAHARANI piece is built around that contrast.</p>"
                        ),
                        "image": image_block("closed-landscape", images),
                        "cta": link("Shop the box", "/#shop", style="secondary"),
                    },
                },
                {
                    "type": "cta_section",
                    "value": {
                        "anchor_id": "",
                        "eyebrow": "The collection",
                        "heading": heading("Beauty in", "_every layer._"),
                        "body": "",
                        "primary_cta": link("Discover the kit", "/products/maharani-luxury-makeup-kit"),
                        "secondary_cta": {},
                        "background_image": {},
                    },
                },
            ],
        )
        home.add_child(instance=story)
        story.save_revision().publish()
        self.stdout.write("Created Our Story page.")
        return story

    # ------------------------------------------------------------------
    def seed_site_settings(self, home: HomePage, story: StandardPage, product: Product, images: dict):
        site = Site.objects.filter(is_default_site=True).first()
        site_settings = SiteSettings.for_site(site)
        if site_settings.navigation:
            # Already configured by an editor; don't overwrite.
            return
        site_settings.brand_name = "MAHARANI"
        site_settings.tagline = "Beauty • Elegance • You"
        site_settings.navigation = [
            {"type": "link", "value": link("Shop", "/#shop", style="text")},
            {"type": "link", "value": link("The Box", f"/products/{product.slug}", style="text")},
            {"type": "link", "value": link("Our Story", page=story, style="text")},
        ]
        site_settings.featured_product = product
        site_settings.collaboration_enabled = False
        site_settings.collaboration_label = "In collaboration with"
        site_settings.collaboration_partner_name = ""
        site_settings.collaboration_disclaimer = (
            "Partner names and marks are the property of their respective owners. "
            "Collaboration assets are shown only once approved."
        )
        site_settings.footer_tagline = "A beauty ritual, beautifully contained."
        site_settings.footer_links = [
            {"type": "link", "value": link("Our Story", page=story, style="text")},
            {"type": "link", "value": link("Shipping & Returns", "/#faq", style="text")},
            {"type": "link", "value": link("Contact", "mailto:hello@example.com", style="text")},
        ]
        site_settings.contact_email = "hello@example.com"
        site_settings.copyright_text = "© MAHARANI. All rights reserved."
        site_settings.seo_title_suffix = " | MAHARANI"
        site_settings.default_meta_description = (
            "MAHARANI — a luxury multi-layer makeup kit with a built-in LED mirror, touch control and pull-out drawers."
        )
        site_settings.default_og_image = images["hero-open"]
        site_settings.save()
        self.stdout.write("Configured site settings.")
