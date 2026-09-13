"""
Imports the MAHARANI campaign photography (backend/seed/campaign/*.jpg) into
Wagtail and rebuilds the home page around it.

Every master was generated from the real product reference collage with the
compact geometry locked (14.7 × 7.1 × 3.0 cm, three thin layers, eight LEDs,
crown + MAHARANI mark) and audited before being committed. The masters live
in the repository so a lost media volume can always be restored by re-running
this command.

Idempotent: re-running replaces the existing Wagtail images (new rows, so no
web process keeps serving stale cached renditions) and reassigns them.

    python manage.py import_campaign_assets
    python manage.py import_campaign_assets --dry-run
    python manage.py import_campaign_assets --keep-home   # assets only
"""

from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from PIL import Image as PILImage
from wagtail.images.models import Image

from catalog.models import Product
from cms.images import NAMED_RENDITIONS, RENDITION_WIDTHS
from cms.models import HomePage, SiteSettings, StandardPage

CAMPAIGN_DIR = Path(settings.BASE_DIR) / "seed" / "campaign"

# key → (file, title, alt). Ratios follow the website slots: landscape for
# desktop sections, 4:5 only for dedicated mobile art direction, 1:1 for the
# purchase image.
ASSETS = {
    "hero-closed": (
        "maharani-hero-closed-16x9.jpg",
        "Campaign — closed case, desktop hero (16:9)",
        "Closed MAHARANI compact makeup case standing on dark marble, black leather with rose-gold crown and MAHARANI lettering.",
    ),
    "hero-mobile": (
        "maharani-hero-mobile-closed-4x5.jpg",
        "Campaign — closed case, mobile hero (4:5)",
        "Closed MAHARANI compact makeup case lying on dark marble, photographed for phones.",
    ),
    "full-open": (
        "maharani-full-open-3x2.jpg",
        "Campaign — fully open case (3:2)",
        "Open MAHARANI case: the thin lid stands upright as a lit LED mirror while the tray and two thin drawers extend forward.",
    ),
    "led-mirror": (
        "maharani-led-mirror-3x2.jpg",
        "Campaign — LED mirror (3:2)",
        "The open MAHARANI lid with its square mirror lit by eight warm-white LEDs, crown and MAHARANI lettering on the glass.",
    ),
    "layer-01": (
        "maharani-layer-01-4x3.jpg",
        "Campaign — layer 01, lips & essentials (4:3)",
        "Top layer of the MAHARANI case: brushes, a compact, a small bottle and a row of lipsticks and glosses.",
    ),
    "layer-02": (
        "maharani-layer-02-4x3.jpg",
        "Campaign — layer 02, complexion (4:3)",
        "Middle layer of the MAHARANI case: blush and powder pans, a rose-gold compact and a black MAHARANI compact.",
    ),
    "layer-03": (
        "maharani-layer-03-4x3.jpg",
        "Campaign — layer 03, eyes (4:3)",
        "Bottom layer of the MAHARANI case: false lashes in a clear box, liners and mascaras.",
    ),
    "material": (
        "maharani-material-macro-3x2.jpg",
        "Campaign — leather and rose-gold macro (3:2)",
        "Macro of the MAHARANI case corner: pebbled black leather with cream stitching, rose-gold frame and three thin stacked layers.",
    ),
    "thickness": (
        "maharani-thickness-16x9.jpg",
        "Campaign — compact form, 3 cm thick (16:9)",
        "Closed MAHARANI case lying flat on marble, seen from a low angle: three thin stacked layers, three centimetres in total.",
    ),
    "purchase": (
        "maharani-purchase-1x1.jpg",
        "Campaign — closed case, product shot (1:1)",
        "Closed MAHARANI compact makeup case on a near-black studio background.",
    ),
}

# Desktop opening sequence, first to last, locked camera (16:9).
SEQUENCE = [
    ("seq-a", "maharani-seq-a-closed-16x9.jpg", "Sequence A — closed", "Closed MAHARANI case lying flat on marble."),
    ("seq-b", "maharani-seq-b-lid-20-16x9.jpg", "Sequence B — lid at 20°", "MAHARANI case with the lid just lifting."),
    ("seq-c", "maharani-seq-c-lid-45-16x9.jpg", "Sequence C — lid at 45°", "MAHARANI case with the lid half raised."),
    ("seq-e", "maharani-seq-e-open-dark-16x9.jpg", "Sequence E — lid upright, mirror off", "MAHARANI case open, mirror unlit."),
    ("seq-f", "maharani-seq-f-illuminated-16x9.jpg", "Sequence F — illuminated", "MAHARANI case open with the LED mirror lit."),
    ("seq-h", "maharani-seq-h-layer-out-16x9.jpg", "Sequence H — first drawer forward", "MAHARANI case with the first thin drawer slid forward."),
    ("seq-j", "maharani-seq-j-final-16x9.jpg", "Sequence J — fully open", "MAHARANI case fully open, both thin drawers forward."),
]

# Mobile opening sequence (4:5), closed → open.
MOBILE_SEQUENCE = [
    ("mseq-a", "maharani-mseq-a-closed-4x5.jpg", "Mobile sequence A — closed", "Closed MAHARANI case lying flat on marble."),
    ("mseq-j", "maharani-mseq-j-open-4x5.jpg", "Mobile sequence J — fully open", "MAHARANI case fully open with the LED mirror lit."),
]

DEFAULT_FAQ = [
    {"question": "Does the kit come with makeup?", "answer": "<p>The MAHARANI Luxury Makeup Kit is the case itself — the illuminated mirror, drawers and hardware. Products shown are for illustration of how the layers organise a collection.</p>"},
    {"question": "How is the mirror powered?", "answer": "<p>The LED mirror is built into the lid and controlled with a single touch. Charging and battery details are listed on the product page.</p>"},
    {"question": "How big is it?", "answer": "<p>Approximately 14.7 cm tall, 7.1 cm wide and 3.0 cm deep — roughly three stacked phones. It fits in a handbag.</p>"},
    {"question": "How long does shipping take?", "answer": "<p>Complimentary tracked shipping is included on every order, with delivery typically in three to six days. Express options are shown at checkout.</p>"},
    {"question": "What is your return policy?", "answer": "<p>Unused items in original packaging can be returned within 14 days of delivery. Contact us and we will arrange collection.</p>"},
]

GALLERY = [
    ("purchase", "Closed"),
    ("full-open", "Open, illuminated"),
    ("led-mirror", "LED mirror"),
    ("layer-01", "Layer 01 — Lips & Essentials"),
    ("layer-02", "Layer 02 — Complexion"),
    ("layer-03", "Layer 03 — Eyes"),
    ("thickness", "Three centimetres"),
    ("material", "Leather and rose gold"),
]


class Command(BaseCommand):
    help = "Import MAHARANI campaign photography into Wagtail and rebuild the home page around it."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Report without writing.")
        parser.add_argument("--keep-home", action="store_true", help="Import assets and product imagery only.")

    @transaction.atomic
    def handle(self, *args, **options):
        dry = options["dry_run"]
        missing = [spec[0] for spec in ASSETS.values() if not (CAMPAIGN_DIR / spec[0]).exists()]
        if missing:
            raise CommandError(f"Missing campaign files in {CAMPAIGN_DIR}: {', '.join(missing)}")

        images = {}
        for key, (filename, title, alt) in ASSETS.items():
            image = self.import_image(filename, title, alt, dry)
            if image is not None:
                images[key] = image
        for key, filename, title, alt in SEQUENCE + MOBILE_SEQUENCE:
            if not (CAMPAIGN_DIR / filename).exists():
                self.stdout.write(self.style.WARNING(f"Sequence frame missing, skipped: {filename}"))
                continue
            image = self.import_image(filename, title, alt, dry)
            if image is not None:
                images[key] = image

        if dry:
            self.stdout.write("Dry run: no changes written.")
            transaction.set_rollback(True)
            return

        self.assign_product(images)
        if not options["keep_home"]:
            self.assign_home(images)
        self.assign_standard_pages(images)
        self.assign_settings(images)
        self.warm_renditions(images)
        self.purge_superseded(images)
        self.stdout.write(self.style.SUCCESS("Campaign assets imported and assigned."))

    # ------------------------------------------------------------------
    def import_image(self, filename: str, title: str, alt: str, dry: bool):
        path = CAMPAIGN_DIR / filename
        with PILImage.open(path) as pil:
            width, height = pil.size
        existing = list(Image.objects.filter(title=title))
        self.stdout.write(f"{'Replaced' if existing else 'Created'} image: {title} ({width}x{height})")
        if dry:
            return existing[0] if existing else None
        # Replace rather than update: Wagtail caches renditions per image pk in
        # each web process, so updating a row in place leaves running workers
        # serving rendition URLs whose files no longer exist. A fresh row gets
        # fresh cache keys; deleting the old row removes its file and renditions.
        for old in existing:
            old.delete()
        image = Image(title=title)
        if hasattr(image, "description"):
            image.description = alt
        with open(path, "rb") as fh:
            image.file.save(filename, ContentFile(fh.read()), save=False)
        image.width, image.height = width, height
        image.save()
        return image

    def warm_renditions(self, images: dict):
        """Pre-generate every rendition the API serves so the first visitor never
        waits on Pillow (and so the files exist before the page is published)."""
        for image in images.values():
            filters = [f"width-{w}" for w in RENDITION_WIDTHS if w <= image.width] or ["original"]
            filters += [spec for spec in NAMED_RENDITIONS.values() if spec not in filters and int(spec.split("-")[1]) <= image.width]
            image.get_renditions(*filters)
        self.stdout.write(f"Warmed renditions for {len(images)} images.")

    def purge_superseded(self, images: dict):
        """Delete campaign images from earlier manifests (recognisable by their
        title prefixes) so the media volume holds only what the site references."""
        keep = {image.pk for image in images.values()}
        stale = Image.objects.filter(title__regex=r"^(Campaign|Sequence|Mobile sequence) ").exclude(pk__in=keep)
        count = stale.count()
        for image in stale:
            image.delete()
        if count:
            self.stdout.write(f"Purged {count} superseded campaign images.")

    def assign_product(self, images: dict):
        product = Product.objects.filter(slug="maharani-luxury-makeup-kit").first() or Product.objects.first()
        if product is None:
            self.stdout.write(self.style.WARNING("No product found; skipping product images."))
            return
        product.primary_image = images["purchase"]
        product.save(update_fields=["primary_image"])
        product.gallery.all().delete()
        for order, (key, caption) in enumerate(GALLERY):
            product.gallery.create(image=images[key], caption=caption, sort_order=order)
        for layer in product.layers.all():
            key = f"layer-{layer.number:02d}"
            if key in images:
                layer.image = images[key]
                layer.save(update_fields=["image"])
        self.stdout.write(f"Assigned product imagery for {product.name}.")

    def assign_home(self, images: dict):
        """Rebuild the home page as the campaign: opening, the box, the light, the
        layers, compact form, purchase finale, the house, questions. Editor-owned
        copy (FAQ, house story, purchase note) is carried over."""
        home = HomePage.objects.first()
        if home is None:
            self.stdout.write(self.style.WARNING("No home page; skipping."))
            return
        product = Product.objects.filter(slug="maharani-luxury-makeup-kit").first() or Product.objects.first()
        if product is None:
            self.stdout.write(self.style.WARNING("No product; skipping home rebuild."))
            return

        def img(key):
            return {"image": images[key].pk, "alt_text": ""}

        def link(label, url, style="primary"):
            return {"label": label, "page": None, "url": url, "style": style}

        frames = [img(key) for key, *_ in SEQUENCE if key in images]
        mobile_frames = [img(key) for key, *_ in MOBILE_SEQUENCE if key in images]

        current = {block["type"]: block["value"] for block in home.body.raw_data}
        faq_items = (current.get("faq") or {}).get("items") or DEFAULT_FAQ
        story = current.get("brand_story") or {}
        purchase_note = (current.get("product_purchase") or {}).get("note", "")

        body = [
            {"type": "hero", "value": {
                "anchor_id": "top", "chapter": "",
                "eyebrow": "Beauty fit for a queen",
                "title": "MAHARANI",
                "tagline": "More than\n_makeup._",
                "headline": "A complete beauty ritual in one extraordinary case.",
                "body": "",
                "image": img("hero-closed"),
                "mobile_image": images["hero-mobile"].pk,
                "frames": frames,
                "mobile_frames": mobile_frames,
                "side_label": "Small size. Big beauty.",
                "add_to_bag": True,
                "primary_cta": link("Discover the kit", "#box"),
                "secondary_cta": link("Add to bag", "#shop", "text"),
                "scroll_hint": "Scroll to open",
            }},
            {"type": "features", "value": {
                "anchor_id": "chapters", "chapter": "", "eyebrow": "", "heading": "", "layout": "row",
                "items": [
                    {"icon": "leather", "title": "The box", "description": "Premium leather, rose-gold hardware.", "link": "#box"},
                    {"icon": "mirror", "title": "The light", "description": "Built-in LED mirror.", "link": "#light"},
                    {"icon": "drawers", "title": "The layers", "description": "Three curated layers.", "link": "#layers"},
                    {"icon": "travel", "title": "Compact form", "description": "Three centimetres thick.", "link": "#form"},
                    {"icon": "sparkle", "title": "Your ritual", "description": "Make it yours.", "link": "#shop"},
                ],
            }},
            {"type": "image_text", "value": {
                "anchor_id": "box", "chapter": "01",
                "eyebrow": "The box",
                "heading": "Not a makeup bag.\n_A beauty ritual._",
                "body": "<p>Premium leather. Rose-gold hardware. Designed to travel.</p>",
                "image": img("full-open"),
                "image_position": "right",
                "cta": link("Discover the kit", f"/products/{product.slug}", "text"),
            }},
            {"type": "spotlight", "value": {
                "anchor_id": "light", "chapter": "02",
                "eyebrow": "The light",
                "heading": "Light,\n_perfected._",
                "body": "<p>Built-in illumination.<br/>Touch-controlled.<br/>Ready wherever you are.</p>",
                "image": img("led-mirror"), "glow": "warm", "highlights": [], "cta": {},
            }},
            {"type": "drawer_showcase", "value": {
                "anchor_id": "layers", "chapter": "03",
                "eyebrow": "The layers",
                "heading": "Beauty\n_in every layer._",
                "intro": "",
                "source": "product", "product": product.pk, "layers": [],
            }},
            {"type": "product_details", "value": {
                "anchor_id": "form", "chapter": "04",
                "eyebrow": "Compact form",
                "heading": "Small size.\n_Big beauty._",
                "intro": "",
                "product": product.pk, "extra_items": [],
                "image": img("thickness"),
            }},
            {"type": "product_purchase", "value": {
                "anchor_id": "shop", "chapter": "05",
                "eyebrow": "Your ritual",
                "heading": "Make it\n_yours._",
                "product": product.pk,
                "image": img("purchase"),
                "show_shipping": True,
                "note": purchase_note,
            }},
            {"type": "brand_story", "value": {
                "anchor_id": "story", "chapter": "",
                "words": story.get("words") or ["Beauty", "Elegance", "You"],
                "eyebrow": story.get("eyebrow") or "The house",
                "heading": story.get("heading") or "Made for the woman\n_who carries her own light._",
                "body": story.get("body") or "<p>MAHARANI means queen.</p>",
                "image": img("material"),
                "cta": story.get("cta") or link("Our story", "/our-story/", "text"),
            }},
            {"type": "faq", "value": {
                "anchor_id": "faq", "chapter": "", "eyebrow": "Questions", "heading": "Good to know.",
                "items": faq_items,
            }},
        ]
        home.body = body
        home.og_image = images["full-open"]
        home.save_revision().publish()
        self.stdout.write("Rebuilt home page as the campaign and published.")

    # Block type → campaign asset used on editorial pages (e.g. Our Story), so
    # no page keeps pointing at the original low-resolution seed crops.
    STANDARD_PAGE_IMAGES = {
        "brand_story": ("image", "material"),
        "image_text": ("image", "full-open"),
        "spotlight": ("image", "led-mirror"),
        "cta_section": ("background_image", "thickness"),
    }

    def assign_standard_pages(self, images: dict):
        for page in StandardPage.objects.all():
            body = page.body.raw_data
            changed = False
            for block in body:
                mapping = self.STANDARD_PAGE_IMAGES.get(block["type"])
                if not mapping:
                    continue
                field, key = mapping
                current = block["value"].get(field)
                if current is None or (isinstance(current, dict) and not current.get("image")):
                    continue  # the editor left this image empty on purpose
                block["value"][field] = {"image": images[key].pk, "alt_text": ""}
                changed = True
            if changed:
                page.body = body
                page.save_revision().publish()
                self.stdout.write(f"Reassigned imagery on page: {page.title}")

    def assign_settings(self, images: dict):
        for site_settings in SiteSettings.objects.all():
            site_settings.default_og_image = images["full-open"]
            nav = site_settings.navigation.raw_data
            for item in nav:
                if item.get("value", {}).get("label") == "The Box":
                    item["value"]["label"] = "The Kit"
            site_settings.navigation = nav
            site_settings.save()
