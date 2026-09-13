"""
Content models. Pages are headless: Wagtail stores and edits the content,
React renders it. Page URLs on the Django host redirect to the frontend.
"""

from django.conf import settings
from django.db import models
from django.http import HttpResponse, HttpResponseRedirect
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting
from wagtail.fields import StreamField
from wagtail.models import Page

from .blocks import PAGE_BLOCKS, LinkBlock


class SeoMixin(models.Model):
    """Extra SEO/OpenGraph fields on top of Wagtail's seo_title/search_description."""

    og_title = models.CharField("Social title", max_length=120, blank=True)
    og_description = models.CharField("Social description", max_length=300, blank=True)
    og_image = models.ForeignKey(
        "wagtailimages.Image",
        verbose_name="Social image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    canonical_url = models.URLField(
        blank=True, help_text="Leave empty to use this page's own URL."
    )
    no_index = models.BooleanField(default=False, help_text="Ask search engines not to index.")

    seo_panels = [
        MultiFieldPanel(
            [
                FieldPanel("og_title"),
                FieldPanel("og_description"),
                FieldPanel("og_image"),
                FieldPanel("canonical_url"),
                FieldPanel("no_index"),
            ],
            heading="Social sharing & indexing",
        )
    ]

    class Meta:
        abstract = True


class HeadlessPageMixin:
    """Routes Django-side page requests to the React frontend."""

    def get_frontend_path(self) -> str:
        parts = self.get_url_parts()
        if parts is None:
            return "/"
        _site_id, _root_url, page_path = parts
        return page_path or "/"

    def get_frontend_url(self) -> str:
        return f"{settings.FRONTEND_URL}{self.get_frontend_path()}"

    def serve(self, request, *args, **kwargs):
        return HttpResponseRedirect(self.get_frontend_url())

    def serve_preview(self, request, mode_name):
        # Live headless preview is a Phase 2 item (wagtail-headless-preview).
        html = (
            "<!doctype html><meta charset='utf-8'><title>Preview</title>"
            "<body style='font-family:system-ui;padding:2rem;background:#0a0807;color:#f4ece1'>"
            f"<h1>{self.title}</h1><p>Save/publish, then view this page on the frontend: "
            f"<a style='color:#c9a07e' href='{self.get_frontend_url()}'>{self.get_frontend_url()}</a>"
            "</p><p>Live draft preview arrives in Phase 2.</p></body>"
        )
        return HttpResponse(html)


class HomePage(HeadlessPageMixin, SeoMixin, Page):
    body = StreamField(PAGE_BLOCKS, blank=True, use_json_field=True)

    content_panels = Page.content_panels + [FieldPanel("body")]
    promote_panels = Page.promote_panels + SeoMixin.seo_panels

    parent_page_types = ["wagtailcore.Page"]
    subpage_types = ["cms.StandardPage"]
    max_count = 1

    api_fields = [APIField("body")]

    class Meta:
        verbose_name = "Home page"


class StandardPage(HeadlessPageMixin, SeoMixin, Page):
    """Editorial page built from the same section blocks (e.g. Our Story)."""

    intro = models.TextField(blank=True)
    body = StreamField(PAGE_BLOCKS, blank=True, use_json_field=True)

    content_panels = Page.content_panels + [FieldPanel("intro"), FieldPanel("body")]
    promote_panels = Page.promote_panels + SeoMixin.seo_panels

    parent_page_types = ["cms.HomePage", "cms.StandardPage"]

    api_fields = [APIField("intro"), APIField("body")]

    class Meta:
        verbose_name = "Standard page"


@register_setting(icon="cog")
class SiteSettings(BaseSiteSetting):
    """Global content: header, footer, collaboration, SEO defaults."""

    brand_name = models.CharField(max_length=60, default="MAHARANI")
    tagline = models.CharField(max_length=120, default="Beauty • Elegance • You")

    announcement_enabled = models.BooleanField(default=False)
    announcement_text = models.CharField(max_length=160, blank=True)

    navigation = StreamField([("link", LinkBlock())], blank=True, use_json_field=True)
    featured_product = models.ForeignKey(
        "catalog.Product",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="Used for 'Shop the box' shortcuts in the header and empty bag.",
    )

    # Collaboration content is fully editable and OFF by default. Nothing in
    # code names a partner; approved names/logos are entered here.
    collaboration_enabled = models.BooleanField(default=False)
    collaboration_label = models.CharField(
        max_length=60, blank=True, default="In collaboration with"
    )
    collaboration_partner_name = models.CharField(max_length=80, blank=True)
    collaboration_logo = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    collaboration_disclaimer = models.CharField(
        max_length=300,
        blank=True,
        help_text="Small print shown wherever the collaboration is referenced.",
    )

    footer_tagline = models.CharField(max_length=160, blank=True)
    footer_links = StreamField([("link", LinkBlock())], blank=True, use_json_field=True)
    instagram_url = models.URLField(blank=True)
    tiktok_url = models.URLField(blank=True)
    contact_email = models.EmailField(blank=True)
    copyright_text = models.CharField(max_length=120, blank=True)

    seo_title_suffix = models.CharField(max_length=60, default=" | MAHARANI")
    default_meta_description = models.CharField(max_length=300, blank=True)
    default_og_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    panels = [
        MultiFieldPanel([FieldPanel("brand_name"), FieldPanel("tagline")], heading="Brand"),
        MultiFieldPanel(
            [FieldPanel("announcement_enabled"), FieldPanel("announcement_text")],
            heading="Announcement bar",
        ),
        MultiFieldPanel(
            [FieldPanel("navigation"), FieldPanel("featured_product")], heading="Header"
        ),
        MultiFieldPanel(
            [
                FieldPanel("collaboration_enabled"),
                FieldPanel("collaboration_label"),
                FieldPanel("collaboration_partner_name"),
                FieldPanel("collaboration_logo"),
                FieldPanel("collaboration_disclaimer"),
            ],
            heading="Collaboration",
        ),
        MultiFieldPanel(
            [
                FieldPanel("footer_tagline"),
                FieldPanel("footer_links"),
                FieldPanel("instagram_url"),
                FieldPanel("tiktok_url"),
                FieldPanel("contact_email"),
                FieldPanel("copyright_text"),
            ],
            heading="Footer",
        ),
        MultiFieldPanel(
            [
                FieldPanel("seo_title_suffix"),
                FieldPanel("default_meta_description"),
                FieldPanel("default_og_image"),
            ],
            heading="SEO defaults",
        ),
    ]

    class Meta:
        verbose_name = "Site settings"
