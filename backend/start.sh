#!/bin/sh
# Railway start command (also referenced by Procfile and railway.json):
# apply migrations, collect static files, then serve with gunicorn.
set -e
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.production}"

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# One-shot content refresh: set IMPORT_CAMPAIGN_ASSETS=1 on the service to
# (re)import the campaign masters from the repo into Wagtail on this deploy,
# then remove the variable. The command is idempotent.
if [ "${IMPORT_CAMPAIGN_ASSETS:-0}" = "1" ]; then
  python manage.py import_campaign_assets
fi

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-2}" \
  --threads "${GUNICORN_THREADS:-2}" \
  --timeout "${GUNICORN_TIMEOUT:-120}" \
  --graceful-timeout 30 \
  --keep-alive 5 \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  --access-logfile - \
  --error-logfile - \
  --log-level "${GUNICORN_LOG_LEVEL:-info}"
