# Lilium-loft

Admin panel for the Lilium & Loft crochet studio store.

- `backend/` - Laravel app: read-only admin panel (Filament) and JWT-secured read-only API over mirrored WooCommerce data, with Swagger docs at `/`.

## Backend setup

```
cd backend
composer install
cp .env.example .env      # then fill in the values
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan woo:sync      # one-off import from WooCommerce (read-only)
php artisan make:filament-user
php artisan serve
```

Required `.env` values: database (`DB_*`), `WOO_BASE_URL`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`, `JWT_SECRET`.
