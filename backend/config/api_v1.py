"""
Project API (v1). Content endpoints live in `cms.api`, commerce endpoints in
their respective apps. Everything is mounted under /api/v1/.
"""

from django.http import JsonResponse
from django.urls import include, path

app_name = "api_v1"


def health(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", health, name="health"),
    path("", include("cms.api.urls")),
    path("", include("catalog.api.urls")),
    path("", include("cart.api.urls")),
    path("", include("shipping.api.urls")),
]
