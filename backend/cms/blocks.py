"""
Reusable StreamField blocks for MAHARANI pages.

Every block serialises to `{"type": "<name>", "id": "<uuid>", "value": {...}}`
via the Wagtail API machinery. Images always use the shape defined in
`cms.images.serialize_image`; links always serialise to `{label, href, style}`.
The React frontend maps `type` → section component.

Heading conventions (documented in help text so editors can use them):
  * a line break starts a new heading line
  * text wrapped in underscores, e.g. _beautifully_ , renders in italic serif
"""

from wagtail import blocks
from wagtail.embeds.blocks import EmbedBlock
from wagtail.images.blocks import ImageChooserBlock
from wagtail.models import Site

from catalog.blocks import ProductChooserBlock
from catalog.models import FeatureIcon

from .images import serialize_image

HEADING_HELP = "Line breaks create new lines. Wrap words in _underscores_ for italic serif."


# --------------------------------------------------------------------------
# Primitives
# --------------------------------------------------------------------------


class APIImageChooserBlock(ImageChooserBlock):
    def get_api_representation(self, value, context=None):
        return serialize_image(value, context)


class ImageBlock(blocks.StructBlock):
    image = APIImageChooserBlock()
    alt_text = blocks.CharBlock(
        required=False, help_text="Overrides the image's default alt text for this placement."
    )

    class Meta:
        icon = "image"
        label = "Image"

    def get_api_representation(self, value, context=None):
        if not value:
            return None
        return serialize_image(value.get("image"), context, alt=value.get("alt_text") or "")


def page_href(page, context=None) -> str:
    """Site-relative path for a page, matching the React router."""
    request = (context or {}).get("request")
    site = Site.find_for_request(request) if request is not None else None
    site = site or Site.objects.filter(is_default_site=True).first()
    if site is None:
        return page.url_path
    return page.relative_url(site) or "/"


class LinkBlock(blocks.StructBlock):
    label = blocks.CharBlock(max_length=60)
    page = blocks.PageChooserBlock(required=False)
    url = blocks.CharBlock(
        required=False,
        help_text="Used when no page is chosen: a path (/products/the-box), anchor (#shop) or URL.",
    )
    style = blocks.ChoiceBlock(
        choices=[("primary", "Primary"), ("secondary", "Secondary"), ("text", "Text link")],
        default="primary",
    )

    class Meta:
        icon = "link"
        label = "Link"

    def get_api_representation(self, value, context=None):
        if not value or not value.get("label"):
            return None
        page = value.get("page")
        href = page_href(page, context) if page else (value.get("url") or "#")
        return {
            "label": value["label"],
            "href": href,
            "style": value.get("style") or "primary",
            "external": href.startswith(("http://", "https://")),
        }


class RichText(blocks.RichTextBlock):
    def __init__(self, **kwargs):
        kwargs.setdefault("features", ["bold", "italic", "link", "ol", "ul"])
        super().__init__(**kwargs)


class SectionMeta:
    group = "Sections"


class SectionBlock(blocks.StructBlock):
    """Base for full-width sections: gives every section an optional anchor id."""

    anchor_id = blocks.CharBlock(
        required=False,
        max_length=40,
        help_text="Optional id for in-page links, e.g. 'shop' → #shop.",
    )



# --------------------------------------------------------------------------
# Sections
# --------------------------------------------------------------------------


class HeroBlock(SectionBlock):
    eyebrow = blocks.CharBlock(
        required=False, help_text="Small line above the title, e.g. 'The Collection'."
    )
    title = blocks.CharBlock(default="MAHARANI")
    tagline = blocks.CharBlock(default="BEAUTY IN EVERY LAYER")
    headline = blocks.TextBlock(
        default="A beauty ritual,\n_beautifully contained._", help_text=HEADING_HELP
    )
    body = blocks.TextBlock(required=False)
    image = ImageBlock(help_text="The product, ideally on a dark background.")
    mobile_image = APIImageChooserBlock(
        required=False,
        help_text="Optional portrait (4:5) art direction for phones. Falls back to the main image.",
    )
    primary_cta = LinkBlock()
    secondary_cta = LinkBlock(required=False)
    scroll_hint = blocks.CharBlock(required=False, default="Scroll")

    class Meta(SectionMeta):
        icon = "image"
        label = "Hero"


class EditorialTextBlock(SectionBlock):
    eyebrow = blocks.CharBlock(required=False)
    heading = blocks.TextBlock(help_text=HEADING_HELP)
    body = RichText(required=False)
    alignment = blocks.ChoiceBlock(
        choices=[("left", "Left"), ("center", "Centered")], default="left"
    )
    size = blocks.ChoiceBlock(
        choices=[("large", "Large"), ("display", "Display (largest)")], default="display"
    )

    class Meta(SectionMeta):
        icon = "title"
        label = "Editorial text"


class ImageTextBlock(SectionBlock):
    eyebrow = blocks.CharBlock(required=False)
    heading = blocks.TextBlock(help_text=HEADING_HELP)
    body = RichText(required=False)
    image = ImageBlock()
    image_position = blocks.ChoiceBlock(
        choices=[("left", "Image left"), ("right", "Image right")], default="right"
    )
    cta = LinkBlock(required=False)

    class Meta(SectionMeta):
        icon = "doc-full"
        label = "Image + text"


class VideoBlock(SectionBlock):
    eyebrow = blocks.CharBlock(required=False)
    heading = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    video_url = blocks.URLBlock(
        required=False, help_text="Direct MP4/WebM URL for a self-hosted, muted campaign loop."
    )
    embed = EmbedBlock(required=False, help_text="Or an embeddable URL (YouTube/Vimeo).")
    poster = ImageBlock(required=False)
    autoplay = blocks.BooleanBlock(required=False, default=True)
    loop = blocks.BooleanBlock(required=False, default=True)
    caption = blocks.CharBlock(required=False)

    class Meta(SectionMeta):
        icon = "media"
        label = "Video"


class RevealStageBlock(blocks.StructBlock):
    label = blocks.CharBlock(help_text="Short stage name, e.g. 'Closed', 'Illuminated'.")
    caption = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    image = ImageBlock()
    glow = blocks.BooleanBlock(
        required=False, default=False, help_text="Add the warm mirror glow behind this stage."
    )

    class Meta:
        icon = "view"
        label = "Stage"


class ProductRevealBlock(SectionBlock):
    """
    Scroll-driven reveal. Only `stills` is rendered today; the other modes are
    architectural hooks for Phase 2 (image sequences, video scrubbing, 3D).
    """

    eyebrow = blocks.CharBlock(required=False, default="Open the experience")
    heading = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    intro = blocks.TextBlock(required=False)
    media_mode = blocks.ChoiceBlock(
        choices=[
            ("stills", "Still images (crossfade per stage)"),
            ("sequence", "Image sequence (Phase 2)"),
            ("video", "Scrubbed video (Phase 2)"),
            ("model", "3D model (Phase 2)"),
        ],
        default="stills",
    )
    stages = blocks.ListBlock(RevealStageBlock(), min_num=2, max_num=8)
    sequence_base_url = blocks.CharBlock(
        required=False, help_text="Phase 2: base URL of a WebP frame sequence."
    )
    sequence_frame_count = blocks.IntegerBlock(required=False, min_value=0)
    video_url = blocks.URLBlock(required=False, help_text="Phase 2: scrubbable video.")
    product = ProductChooserBlock(required=False, help_text="Optional: links the reveal to a product.")

    class Meta(SectionMeta):
        icon = "view"
        label = "Product reveal (scroll)"

    def get_api_representation(self, value, context=None):
        data = super().get_api_representation(value, context)
        if data and data.get("product"):
            # Keep the payload light: the reveal only needs a link target.
            product = data["product"]
            data["product"] = {"name": product["name"], "slug": product["slug"], "url": product["url"]}
        return data


class FeatureItemBlock(blocks.StructBlock):
    icon = blocks.ChoiceBlock(choices=FeatureIcon.choices, default=FeatureIcon.SPARKLE)
    title = blocks.CharBlock(max_length=60)
    description = blocks.CharBlock(required=False, max_length=200)

    class Meta:
        icon = "tick"
        label = "Feature"


class FeatureBlock(SectionBlock):
    eyebrow = blocks.CharBlock(required=False)
    heading = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    items = blocks.ListBlock(FeatureItemBlock(), min_num=1, max_num=8)
    layout = blocks.ChoiceBlock(
        choices=[("row", "Single row / strip"), ("grid", "Grid")], default="row"
    )

    class Meta(SectionMeta):
        icon = "list-ul"
        label = "Features"


class LayerBlock(blocks.StructBlock):
    number = blocks.IntegerBlock(min_value=1, default=1)
    name = blocks.CharBlock(max_length=60, help_text="e.g. 'Lips & Essentials'")
    title = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    description = blocks.TextBlock(required=False)
    items = blocks.ListBlock(blocks.CharBlock(max_length=60), required=False)
    image = ImageBlock(required=False)

    class Meta:
        icon = "folder-open-1"
        label = "Layer"


class DrawerShowcaseBlock(SectionBlock):
    """
    Editorial layer sections. Layers come from the chosen product (the
    commerce source of truth) unless 'custom' is selected.
    """

    eyebrow = blocks.CharBlock(required=False, default="Beauty in every layer")
    heading = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    intro = blocks.TextBlock(required=False)
    source = blocks.ChoiceBlock(
        choices=[("product", "Use the product's layers"), ("custom", "Custom layers below")],
        default="product",
    )
    product = ProductChooserBlock(required=False)
    layers = blocks.ListBlock(LayerBlock(), required=False, default=[])

    class Meta(SectionMeta):
        icon = "folder-open-inverse"
        label = "Drawer showcase"

    def get_api_representation(self, value, context=None):
        data = super().get_api_representation(value, context)
        if not data:
            return data
        product = data.get("product")
        if data.get("source") == "product" and product:
            data["layers"] = [
                {
                    "number": layer["number"],
                    "name": layer["name"],
                    "title": layer["title"],
                    "description": layer["description"],
                    "items": layer["items"],
                    "image": layer["image"],
                }
                for layer in product.get("layers", [])
            ]
        if product:
            data["product"] = {"name": product["name"], "slug": product["slug"], "url": product["url"]}
        return data


class SpotlightBlock(SectionBlock):
    """Dramatic dark section with a warm glow (used for the LED mirror)."""

    eyebrow = blocks.CharBlock(required=False)
    heading = blocks.TextBlock(help_text=HEADING_HELP)
    body = RichText(required=False)
    image = ImageBlock(required=False)
    glow = blocks.ChoiceBlock(
        choices=[("none", "None"), ("soft", "Soft"), ("warm", "Warm")], default="warm"
    )
    highlights = blocks.ListBlock(FeatureItemBlock(), required=False, default=[])
    cta = LinkBlock(required=False)

    class Meta(SectionMeta):
        icon = "spinner"
        label = "Spotlight (glow)"


class DetailItemBlock(blocks.StructBlock):
    label = blocks.CharBlock(max_length=60)
    value = blocks.CharBlock(max_length=200)


class ProductDetailsBlock(SectionBlock):
    eyebrow = blocks.CharBlock(required=False, default="Details")
    heading = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    intro = blocks.TextBlock(required=False)
    product = ProductChooserBlock(help_text="Specifications, dimensions and materials come from the product.")
    extra_items = blocks.ListBlock(DetailItemBlock(), required=False, default=[])
    image = ImageBlock(required=False)

    class Meta(SectionMeta):
        icon = "list-ol"
        label = "Product details"

    def get_api_representation(self, value, context=None):
        data = super().get_api_representation(value, context)
        product = data.get("product") if data else None
        if product:
            data["product"] = {
                "name": product["name"],
                "slug": product["slug"],
                "url": product["url"],
                "specifications": product["specifications"],
                "dimensions": product["dimensions"],
                "materials": product["materials"],
                "primary_image": product["primary_image"],
            }
        return data


class ProductPurchaseBlock(SectionBlock):
    eyebrow = blocks.CharBlock(required=False, default="Shop")
    heading = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    product = ProductChooserBlock()
    image = ImageBlock(required=False, help_text="Overrides the product's primary image here.")
    show_shipping = blocks.BooleanBlock(required=False, default=True)
    note = blocks.TextBlock(required=False, help_text="Short reassurance line under the button.")

    class Meta(SectionMeta):
        icon = "pick"
        label = "Product purchase"


class GalleryBlock(SectionBlock):
    eyebrow = blocks.CharBlock(required=False)
    heading = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    images = blocks.ListBlock(ImageBlock(), min_num=1, max_num=12)
    layout = blocks.ChoiceBlock(
        choices=[("strip", "Horizontal strip"), ("mosaic", "Editorial mosaic")], default="mosaic"
    )

    class Meta(SectionMeta):
        icon = "image"
        label = "Gallery"


class QuoteBlock(SectionBlock):
    quote = blocks.TextBlock()
    attribution = blocks.CharBlock(required=False)
    role = blocks.CharBlock(required=False)

    class Meta(SectionMeta):
        icon = "openquote"
        label = "Quote"


class ReviewItemBlock(blocks.StructBlock):
    quote = blocks.TextBlock()
    author = blocks.CharBlock(max_length=80)
    location = blocks.CharBlock(required=False, max_length=80)
    rating = blocks.IntegerBlock(min_value=1, max_value=5, default=5)

    class Meta:
        icon = "user"
        label = "Review"


class ReviewBlock(SectionBlock):
    eyebrow = blocks.CharBlock(required=False)
    heading = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    reviews = blocks.ListBlock(ReviewItemBlock(), min_num=1)

    class Meta(SectionMeta):
        icon = "group"
        label = "Reviews"


class BrandStoryBlock(SectionBlock):
    words = blocks.ListBlock(
        blocks.CharBlock(max_length=30),
        default=["Beauty", "Elegance", "You"],
        help_text="Displayed as a large separated word-mark, e.g. BEAUTY • ELEGANCE • YOU.",
    )
    eyebrow = blocks.CharBlock(required=False)
    heading = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    body = RichText(required=False)
    image = ImageBlock(required=False)
    cta = LinkBlock(required=False)

    class Meta(SectionMeta):
        icon = "crown"
        label = "Brand story"


class CTASectionBlock(SectionBlock):
    eyebrow = blocks.CharBlock(required=False)
    heading = blocks.TextBlock(help_text=HEADING_HELP)
    body = blocks.TextBlock(required=False)
    primary_cta = LinkBlock()
    secondary_cta = LinkBlock(required=False)
    background_image = ImageBlock(required=False)

    class Meta(SectionMeta):
        icon = "link-external"
        label = "Call to action"


class FAQItemBlock(blocks.StructBlock):
    question = blocks.CharBlock(max_length=200)
    answer = RichText()

    class Meta:
        icon = "help"
        label = "Question"


class FAQBlock(SectionBlock):
    eyebrow = blocks.CharBlock(required=False, default="Questions")
    heading = blocks.TextBlock(required=False, help_text=HEADING_HELP)
    items = blocks.ListBlock(FAQItemBlock(), min_num=1)

    class Meta(SectionMeta):
        icon = "help"
        label = "FAQ"


# Ordered list used by page StreamFields.
PAGE_BLOCKS = [
    ("hero", HeroBlock()),
    ("editorial_text", EditorialTextBlock()),
    ("image_text", ImageTextBlock()),
    ("video", VideoBlock()),
    ("product_reveal", ProductRevealBlock()),
    ("features", FeatureBlock()),
    ("drawer_showcase", DrawerShowcaseBlock()),
    ("spotlight", SpotlightBlock()),
    ("product_details", ProductDetailsBlock()),
    ("product_purchase", ProductPurchaseBlock()),
    ("gallery", GalleryBlock()),
    ("quote", QuoteBlock()),
    ("reviews", ReviewBlock()),
    ("brand_story", BrandStoryBlock()),
    ("cta_section", CTASectionBlock()),
    ("faq", FAQBlock()),
]
