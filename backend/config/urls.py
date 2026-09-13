from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls

from config.api import api_v2_router
from config.api_v1 import health

urlpatterns = [
    # Lightweight health check for Railway (no DB / external calls).
    path("health/", health, name="health"),
    path("django-admin/", admin.site.urls),
    path("admin/", include(wagtailadmin_urls)),
    path("documents/", include(wagtaildocs_urls)),
    # Project API consumed by the React frontend.
    path("api/v1/", include("config.api_v1")),
    # Standard Wagtail API v2 (pages / images) for tooling and future use.
    path("api/v2/", api_v2_router.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # Local/volume media is served by Django. Skipped automatically when media
    # lives in S3/R2 (MEDIA_URL becomes absolute).
    from django.views.static import serve

    if settings.MEDIA_URL.startswith("/"):
        urlpatterns += [
            path("media/<path:path>", serve, {"document_root": settings.MEDIA_ROOT}),
        ]

urlpatterns += [
    # Wagtail page routes. Pages are headless and redirect to the frontend.
    path("", include(wagtail_urls)),
]
