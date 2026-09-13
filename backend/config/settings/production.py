"""
Production settings (Railway).

Every value that differs between environments comes from environment
variables. Missing critical values fail loudly at import time rather than
silently degrading (no SQLite fallback, no default SECRET_KEY).
"""

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import ALLOWED_HOSTS, LOGGING, SECRET_KEY, STORAGES, env

DEBUG = False

# Railway probes the container with Host: healthcheck.railway.app and injects
# the service's public/private domains; allow them alongside ALLOWED_HOSTS.
for _host in (
    "healthcheck.railway.app",
    env("RAILWAY_PUBLIC_DOMAIN", default=""),
    env("RAILWAY_PRIVATE_DOMAIN", default=""),
):
    if _host and _host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(_host)

if SECRET_KEY == "insecure-dev-key-change-me" or len(SECRET_KEY) < 32:
    raise ImproperlyConfigured("SECRET_KEY must be set to a long random value in production.")

# --------------------------------------------------------------------------
# Database: PostgreSQL only. Railway injects DATABASE_URL from the attached
# Postgres service; production never falls back to SQLite.
# --------------------------------------------------------------------------

if not env("DATABASE_URL", default=""):
    raise ImproperlyConfigured("DATABASE_URL must be set in production (Railway PostgreSQL).")

DATABASES = {"default": env.db("DATABASE_URL")}
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=60)
DATABASES["default"]["CONN_HEALTH_CHECKS"] = True
if DATABASES["default"]["ENGINE"] == "django.db.backends.sqlite3":
    raise ImproperlyConfigured("SQLite is not allowed in production; use a postgres:// DATABASE_URL.")

# --------------------------------------------------------------------------
# HTTPS / security. Railway terminates TLS at its proxy and forwards the
# original scheme in X-Forwarded-Proto.
# --------------------------------------------------------------------------

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=60 * 60 * 24 * 30)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True)
SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=False)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

# Explicit allow-lists only. CORS_ALLOW_ALL_ORIGINS is never enabled.
CORS_ALLOW_ALL_ORIGINS = False

# --------------------------------------------------------------------------
# Static files: WhiteNoise serves the collected files (Django + Wagtail admin).
# --------------------------------------------------------------------------

WHITENOISE_MAX_AGE = 60 * 60 * 24 * 365

# --------------------------------------------------------------------------
# Media. Two supported strategies, chosen by environment:
#   * default: local filesystem at MEDIA_ROOT -> mount a Railway volume there.
#   * S3-compatible object storage (Cloudflare R2, AWS S3): set
#     AWS_STORAGE_BUCKET_NAME (+ credentials/endpoint) and uploads go there.
# --------------------------------------------------------------------------

if env("AWS_STORAGE_BUCKET_NAME", default=""):
    STORAGES["default"] = {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": env("AWS_STORAGE_BUCKET_NAME"),
            "access_key": env("AWS_ACCESS_KEY_ID", default=None),
            "secret_key": env("AWS_SECRET_ACCESS_KEY", default=None),
            "endpoint_url": env("AWS_S3_ENDPOINT_URL", default=None),
            "region_name": env("AWS_S3_REGION_NAME", default="auto"),
            "custom_domain": env("AWS_S3_CUSTOM_DOMAIN", default=None),
            "default_acl": None,
            "querystring_auth": False,
            "file_overwrite": False,
        },
    }
    if env("AWS_S3_CUSTOM_DOMAIN", default=""):
        MEDIA_URL = f"https://{env('AWS_S3_CUSTOM_DOMAIN')}/"

# --------------------------------------------------------------------------
# Logging / email
# --------------------------------------------------------------------------

LOGGING["root"]["level"] = env("LOG_LEVEL", default="INFO")
LOGGING["loggers"] = {
    "django.request": {"handlers": ["console"], "level": "WARNING", "propagate": False},
}

EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="MAHARANI <no-reply@example.com>")
