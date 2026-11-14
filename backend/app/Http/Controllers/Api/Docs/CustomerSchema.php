<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Customer',
    properties: [
        new OA\Property(property: 'id', type: 'integer'),
        new OA\Property(property: 'woo_id', type: 'integer'),
        new OA\Property(property: 'email', type: 'string', nullable: true),
        new OA\Property(property: 'first_name', type: 'string', nullable: true),
        new OA\Property(property: 'last_name', type: 'string', nullable: true),
        new OA\Property(property: 'username', type: 'string', nullable: true),
        new OA\Property(property: 'role', type: 'string', nullable: true, example: 'customer'),
        new OA\Property(property: 'phone', type: 'string', nullable: true),
        new OA\Property(property: 'city', type: 'string', nullable: true),
        new OA\Property(property: 'state', type: 'string', nullable: true),
        new OA\Property(property: 'country', type: 'string', nullable: true),
        new OA\Property(property: 'orders_count', type: 'integer'),
        new OA\Property(property: 'total_spent', type: 'string', example: '4500.00'),
        new OA\Property(property: 'woo_created_at', type: 'string', format: 'date-time', nullable: true),
    ],
)]
final class CustomerSchema {}
