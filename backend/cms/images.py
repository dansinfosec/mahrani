"""
Predictable JSON representation for Wagtail images.

Every image exposed through the API (stream blocks, product images, settings)
goes through `serialize_image` so the React frontend can rely on one shape:

{
  "id": 12,
  "title": "MAHARANI case, closed",
  "alt": "...",
  "width": 1312, "height": 1199,
  "aspect_ratio": 1.094,
  "focal_point": {"x": 0.5, "y": 0.4} | null,
  "src": "https://.../original.jpg",
  "srcset": [{"url": "...", "width": 800}, ...],
  "sizes": {"thumb": "...", "medium": "...", "large": "..."}
}
"""

from __future__ import annotations

from django.conf import settings

RENDITION_WIDTHS = (480, 800, 1200, 1600)
NAMED_RENDITIONS = {
    "thumb": "width-480",
    "medium": "width-800",
    "large": "width-1600",
}


def absolute_url(url: str, context: dict | None = None) -> str:
    if not url or url.startswith(("http://", "https://")):
        return url
    request = (context or {}).get("request")
    if request is not None:
        return request.build_absolute_uri(url)
    return f"{settings.WAGTAILADMIN_BASE_URL}{url}"


def image_alt(image, override: str = "") -> str:
    if override:
        return override
    return (getattr(image, "description", "") or image.title or "").strip()


def serialize_image(image, context: dict | None = None, alt: str = "") -> dict | None:
    if image is None:
        return None

    # Never upscale: only request widths the source image can honour.
    filters = [f"width-{w}" for w in RENDITION_WIDTHS if w <= image.width] or ["original"]
    named = {
        name: spec if int(spec.split("-")[1]) <= image.width else "original"
        for name, spec in NAMED_RENDITIONS.items()
    }
    filters += [spec for spec in named.values() if spec not in filters]
    renditions = image.get_renditions(*filters)

    srcset = []
    seen_widths = set()
    for w in RENDITION_WIDTHS:
        key = f"width-{w}"
        if key in renditions and renditions[key].width not in seen_widths:
            rendition = renditions[key]
            seen_widths.add(rendition.width)
            srcset.append({"url": absolute_url(rendition.url, context), "width": rendition.width})
    if not srcset:
        srcset.append({"url": absolute_url(image.file.url, context), "width": image.width})

    focal = None
    if image.has_focal_point():
        point = image.get_focal_point()
        focal = {
            "x": round(point.centroid_x / image.width, 4),
            "y": round(point.centroid_y / image.height, 4),
        }

    return {
        "id": image.pk,
        "title": image.title,
        "alt": image_alt(image, alt),
        "width": image.width,
        "height": image.height,
        "aspect_ratio": round(image.width / image.height, 4) if image.height else None,
        "focal_point": focal,
        "src": absolute_url(image.file.url, context),
        "srcset": srcset,
        "sizes": {
            name: absolute_url(renditions[spec].url, context)
            for name, spec in named.items()
            if spec in renditions
        },
    }
