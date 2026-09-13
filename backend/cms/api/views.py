"""
Content endpoints consumed by the React frontend.

  GET /api/v1/site/            header/footer/collaboration/SEO defaults
  GET /api/v1/pages/home/      the site's home page (StreamField body)
  GET /api/v1/pages/<slug>/    any live page by slug
"""

from django.conf import settings
from django.http import Http404
from rest_framework.response import Response
from rest_framework.views import APIView
from wagtail.models import Page, Site

from catalog.api.serializers import ProductListSerializer

from ..images import serialize_image
from ..models import SiteSettings


def get_site(request) -> Site | None:
    return Site.find_for_request(request) or Site.objects.filter(is_default_site=True).first()


def serialize_links(stream, context) -> list[dict]:
    if not stream:
        return []
    return [
        item
        for item in stream.stream_block.get_api_representation(stream, context)
        if item.get("value")
    ]


def serialize_site_settings(site_settings: SiteSettings, request) -> dict:
    context = {"request": request}
    nav = [item["value"] for item in serialize_links(site_settings.navigation, context)]
    footer = [item["value"] for item in serialize_links(site_settings.footer_links, context)]
    featured = site_settings.featured_product
    if featured is not None and not featured.is_active:
        featured = None
    return {
        "brand_name": site_settings.brand_name,
        "tagline": site_settings.tagline,
        "announcement": {
            "enabled": site_settings.announcement_enabled and bool(site_settings.announcement_text),
            "text": site_settings.announcement_text,
        },
        "navigation": nav,
        "featured_product": ProductListSerializer(featured, context=context).data if featured else None,
        "collaboration": {
            "enabled": site_settings.collaboration_enabled
            and bool(site_settings.collaboration_partner_name),
            "label": site_settings.collaboration_label,
            "partner_name": site_settings.collaboration_partner_name,
            "logo": serialize_image(site_settings.collaboration_logo, context),
            "disclaimer": site_settings.collaboration_disclaimer,
        },
        "footer": {
            "tagline": site_settings.footer_tagline,
            "links": footer,
            "instagram_url": site_settings.instagram_url,
            "tiktok_url": site_settings.tiktok_url,
            "contact_email": site_settings.contact_email,
            "copyright_text": site_settings.copyright_text,
        },
        "seo": {
            "title_suffix": site_settings.seo_title_suffix,
            "default_description": site_settings.default_meta_description,
            "default_og_image": serialize_image(site_settings.default_og_image, context),
        },
        "frontend_url": settings.FRONTEND_URL,
        "currency": settings.SHOP_CURRENCY,
    }


def serialize_seo(page, site_settings: SiteSettings | None, request) -> dict:
    context = {"request": request}
    suffix = site_settings.seo_title_suffix if site_settings else ""
    title = page.seo_title or page.title
    description = page.search_description or (
        site_settings.default_meta_description if site_settings else ""
    )
    og_image = getattr(page, "og_image", None) or (
        site_settings.default_og_image if site_settings else None
    )
    path = page.get_frontend_path() if hasattr(page, "get_frontend_path") else page.url
    canonical = getattr(page, "canonical_url", "") or f"{settings.FRONTEND_URL}{path}"
    return {
        "title": title,
        "full_title": title if page.depth <= 2 else f"{title}{suffix}",
        "description": description,
        "canonical": canonical,
        "no_index": bool(getattr(page, "no_index", False)),
        "og": {
            "title": getattr(page, "og_title", "") or title,
            "description": getattr(page, "og_description", "") or description,
            "image": serialize_image(og_image, context),
            "type": "website",
        },
    }


def serialize_page(page, request) -> dict:
    site_settings = SiteSettings.for_request(request) if get_site(request) else None
    context = {"request": request}
    body = page.body.stream_block.get_api_representation(page.body, context) if hasattr(page, "body") else []
    return {
        "id": page.pk,
        "type": page.specific_class.__name__ if page.specific_class else page.__class__.__name__,
        "title": page.title,
        "slug": page.slug,
        "path": page.get_frontend_path() if hasattr(page, "get_frontend_path") else page.url,
        "intro": getattr(page, "intro", ""),
        "last_published_at": page.last_published_at,
        "seo": serialize_seo(page, site_settings, request),
        "body": body,
    }


class SiteSettingsView(APIView):
    def get(self, request):
        if get_site(request) is None:
            return Response({"detail": "No Wagtail site configured."}, status=503)
        return Response(serialize_site_settings(SiteSettings.for_request(request), request))


class HomePageView(APIView):
    def get(self, request):
        site = get_site(request)
        if site is None:
            return Response({"detail": "No Wagtail site configured."}, status=503)
        page = site.root_page.specific
        if not page.live or not hasattr(page, "body"):
            return Response({"detail": "Home page is not published yet."}, status=404)
        return Response(serialize_page(page, request))


class PageBySlugView(APIView):
    def get(self, request, slug):
        page = (
            Page.objects.live().public().filter(slug=slug).exclude(depth__lte=1).first()
        )
        if page is None:
            raise Http404("Page not found")
        page = page.specific
        if not hasattr(page, "body"):
            raise Http404("Page has no renderable content")
        return Response(serialize_page(page, request))
