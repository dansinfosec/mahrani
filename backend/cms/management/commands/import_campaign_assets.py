"""
Imports the MAHARANI campaign photography (backend/seed/campaign/*.jpg) into
Wagtail and assigns it to the home page blocks, the product and site settings.

The masters were produced from the real product reference imagery and checked
for product fidelity (geometry, drawer count, LED count, hardware, logo) before
being committed. Real reference crops stay in place wherever no campaign asset
exists (dimensions figure, "Our Story" page).

Idempotent: re-running updates the existing Wagtail images in place.

    python manage.py import_campaign_assets
    python manage.py import_campaign_assets --dry-run
"""

from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from PIL import Image as PILImage
from wagtail.images.models import Image

from catalog.models import Product
from cms.models import HomePage, SiteSettings

CAMPAIGN_DIR = Path(settings.BASE_DIR) / "seed" / "campaign"

ASSETS = {
    "hero-desktop": {
        "file": "maharani-hero-desktop.jpg",
        "title": "Campaign — open case, desktop hero (3:2)",
        "alt": "Open MAHARANI makeup case with the LED mirror lit and three drawers pulled out, standing on dark marble under warm studio light.",
    },
    "hero-mobile": {
        "file": "maharani-hero-mobile.jpg",
        "title": "Campaign — open case, mobile hero (4:5)",
        "alt": "Open MAHARANI makeup case with the LED mirror lit and three drawers pulled out, photographed upright on dark marble.",
    },
    "open-case": {
        "file": "maharani-open-case.jpg",
        "title": "Campaign — open case, clean product view (4:5)",
        "alt": "MAHARANI makeup case open at a three-quarter angle: lit LED mirror, brush tray and three stepped drawers.",
    },
    "led-mirror": {
        "file": "maharani-led-mirror.jpg",
        "title": "Campaign — LED mirror close-up (4:5)",
        "alt": "Close-up of the open MAHARANI lid with the square LED mirror glowing warm white, crown and MAHARANI lettering on the glass.",
    },
    "layer-01": {
        "file": "maharani-layer-01.jpg",
        "title": "Campaign — layer 01, lips & essentials (1:1)",
        "alt": "Top drawer of the MAHARANI case slid open: brushes, a compact, a small bottle and a row of lipsticks and glosses.",
    },
    "layer-02": {
        "file": "maharani-layer-02.jpg",
        "title": "Campaign — layer 02, complexion (1:1)",
        "alt": "Middle drawer of the MAHARANI case slid open: blush and powder pans, a rose-gold compact and a black MAHARANI compact.",
    },
    "layer-03": {
        "file": "maharani-layer-03.jpg",
        "title": "Campaign — layer 03, eyes (1:1)",
        "alt": "Bottom drawer of the MAHARANI case slid open: false lashes in a clear box, liners and mascaras in long compartments.",
    },
    "material-detail": {
        "file": "maharani-material-detail.jpg",
        "title": "Campaign — leather and rose-gold detail (1:1)",
        "alt": "Macro of the closed MAHARANI case: pebbled black leather with stitched border, rose-gold frame and the embossed crown and MAHARANI lettering.",
    },
    "purchase": {
        "file": "maharani-purchase.jpg",
        "title": "Campaign — closed case, product shot (4:5)",
        "alt": "Closed MAHARANI makeup case standing upright on dark marble, black leather front with rose-gold crown and MAHARANI lettering.",
    },
}

# Product gallery captions (from the seed) → campaign asset.
GALLERY_MAP = {
    "Open, illuminated": "open-case",
    "Closed": "purchase",
    "Layer 01 — Lips & Essentials": "layer-01",
    "Layer 02 — Complexion": "layer-02",
    "Layer 03 — Eyes": "layer-03",
    "LED mirror": "led-mirror",
    "On the vanity": "hero-desktop",
}

# Product reveal stage labels → campaign asset.
STAGE_MAP = {
    "Closed": "purchase",
    "Opened": "open-case",
    "Layer 01": "layer-01",
    "Layer 02": "layer-02",
    "Layer 03": "layer-03",
}


class Command(BaseCommand):
    help = "Import MAHARANI campaign photography into Wagtail and assign it to the home page and product."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Report without writing.")

    @transaction.atomic
    def handle(self, *args, **options):
        dry = options["dry_run"]
        missing = [spec["file"] for spec in ASSETS.values() if not (CAMPAIGN_DIR / spec["file"]).exists()]
        if missing:
            raise CommandError(f"Missing campaign files in {CAMPAIGN_DIR}: {', '.join(missing)}")

        images = self.import_images(dry)
        if dry:
            self.stdout.write("Dry run: no changes written.")
            transaction.set_rollback(True)
            return

        self.assign_product(images)
        self.assign_home(images)
        self.assign_settings(images)
        self.stdout.write(self.style.SUCCESS("Campaign assets imported and assigned."))

    # ------------------------------------------------------------------
    def import_images(self, dry: bool) -> dict:
        images = {}
        for key, spec in ASSETS.items():
            path = CAMPAIGN_DIR / spec["file"]
            with PILImage.open(path) as pil:
                width, height = pil.size
            existing = Image.objects.filter(title=spec["title"]).first()
            verb = "Updated" if existing else "Created"
            self.stdout.write(f"{verb} image: {spec['title']} ({width}x{height})")
            if dry:
                continue
            image = existing or Image(title=spec["title"])
            if hasattr(image, "description"):
                image.description = spec["alt"]
            with open(path, "rb") as fh:
                image.file.save(spec["file"], ContentFile(fh.read()), save=False)
            image.width, image.height = width, height
            image.save()
            # Renditions of the previous file are stale once the file changes.
            image.renditions.all().delete()
            images[key] = image
        return images

    def assign_product(self, images: dict):
        product = Product.objects.filter(slug="maharani-luxury-makeup-kit").first() or Product.objects.first()
        if product is None:
            self.stdout.write(self.style.WARNING("No product found; skipping product images."))
            return
        product.primary_image = images["open-case"]
        product.save(update_fields=["primary_image"])
        for item in product.gallery.all():
            key = GALLERY_MAP.get(item.caption)
            if key:
                item.image = images[key]
                item.save(update_fields=["image"])
        for layer in product.layers.all():
            key = f"layer-{layer.number:02d}"
            if key in images:
                layer.image = images[key]
                layer.save(update_fields=["image"])
        self.stdout.write(f"Assigned product imagery for {product.name}.")

    def assign_home(self, images: dict):
        home = HomePage.objects.first()
        if home is None:
            self.stdout.write(self.style.WARNING("No home page; skipping."))
            return

        def image_block(key: str, current=None) -> dict:
            block = dict(current or {})
            block["image"] = images[key].pk
            block.setdefault("alt_text", "")
            return block

        body = home.body.raw_data
        for block in body:
            kind, value = block["type"], block["value"]
            if kind == "hero":
                value["image"] = image_block("hero-desktop", value.get("image"))
                value["mobile_image"] = images["hero-mobile"].pk
            elif kind == "product_reveal":
                for stage in value.get("stages", []):
                    stage_value = stage.get("value", stage)
                    key = STAGE_MAP.get(stage_value.get("label"))
                    if key:
                        stage_value["image"] = image_block(key, stage_value.get("image"))
            elif kind == "drawer_showcase":
                for layer in value.get("layers", []):
                    layer_value = layer.get("value", layer)
                    key = f"layer-{int(layer_value.get('number') or 0):02d}"
                    if key in images:
                        layer_value["image"] = image_block(key, layer_value.get("image"))
            elif kind == "spotlight":
                value["image"] = image_block("led-mirror", value.get("image"))
            elif kind == "product_purchase":
                value["image"] = image_block("purchase", value.get("image"))
            elif kind == "brand_story":
                value["image"] = image_block("material-detail", value.get("image"))
        home.body = body
        home.og_image = images["hero-desktop"]
        home.save_revision().publish()
        self.stdout.write("Assigned home page imagery and published.")

    def assign_settings(self, images: dict):
        for site_settings in SiteSettings.objects.all():
            site_settings.default_og_image = images["hero-desktop"]
            site_settings.save(update_fields=["default_og_image"])
