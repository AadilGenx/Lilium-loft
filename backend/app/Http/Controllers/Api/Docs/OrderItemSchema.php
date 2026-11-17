<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'OrderItem',
    properties: [
        new OA\Property(property: 'id', type: 'integer'),
        new OA\Property(property: 'order_woo_id', type: 'integer'),
        new OA\Property(property: 'woo_item_id', type: 'integer'),
        new OA\Property(property: 'product_woo_id', type: 'integer'),
        new OA\Property(property: 'variation_woo_id', type: 'integer'),
        new OA\Property(property: 'name', type: 'string'),
        new OA\Property(property: 'sku', type: 'string', nullable: true),
        new OA\Property(property: 'quantity', type: 'integer'),
        new OA\Property(property: 'subtotal', type: 'string', example: '1250.00'),
        new OA\Property(property: 'total', type: 'string', example: '1250.00'),
        new OA\Property(property: 'image_url', type: 'string', nullable: true),
    ],
)]
final class OrderItemSchema {}
