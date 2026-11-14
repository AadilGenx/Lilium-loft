<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'Lilium & Loft Admin API',
    description: "Read-only API over the mirrored WooCommerce data (orders, products, customers, coupons, categories) used by the Lilium & Loft admin panel.\n\n**This API never writes to WooCommerce.** Data is imported by the `woo:sync` command.\n\nAuthenticate with `POST /api/v1/auth/login`, then click **Authorize** and paste the returned `access_token` (JWT, no `Bearer ` prefix needed).",
)]
#[OA\SecurityScheme(securityScheme: 'bearerAuth', type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT returned by POST /api/v1/auth/login')]
#[OA\Tag(name: 'Auth', description: 'Token authentication')]
#[OA\Tag(name: 'Dashboard', description: 'Sales summary and chart data')]
#[OA\Tag(name: 'Orders')]
#[OA\Tag(name: 'Products')]
#[OA\Tag(name: 'Customers')]
#[OA\Tag(name: 'Categories')]
#[OA\Tag(name: 'Coupons')]
#[OA\Tag(name: 'Sync', description: 'Status of the WooCommerce to local mirror import')]
final class ApiInfo {}
