#!/bin/sh
set -e

cd /var/www/html

if [ ! -f .env ] && [ -f .env.production ]; then
    cp .env.production .env
fi

if [ -z "$APP_KEY" ] && [ -f .env ] && ! grep -q "^APP_KEY=base64:" .env; then
    php artisan key:generate --force
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    php artisan migrate --force
fi

php artisan storage:link || true

exec "$@"
