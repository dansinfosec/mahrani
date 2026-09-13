from .base import *  # noqa: F401,F403
from .base import REST_FRAMEWORK, STORAGES, env

DEBUG = env("DEBUG", default=True)
ALLOWED_HOSTS = ["*"]

# Plain static file storage in dev (no manifest requirement).
STORAGES["staticfiles"] = {
    "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
}

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
