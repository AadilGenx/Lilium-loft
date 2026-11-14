<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Product',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'woo_id', type: 'integer', example: 101),
        new OA\Property(property: 'name', type: 'string', example: 'Floral Crochet Wall Frame'),
        new OA\Property(property: 'slug', type: 'string'),
        new OA\Property(property: 'type', type: 'string', example: 'simple'),
        new OA\Property(property: 'status', type: 'string', example: 'publish'),
        new OA\Property(property: 'sku', type: 'string', nullable: true),
        new OA\Property(property: 'price', type: 'string', nullable: true, example: '1250.00'),
        new OA\Property(property: 'regular_price', type: 'string', nullable: true, example: '1500.00'),
        new OA\Property(property: 'sale_price', type: 'string', nullable: true, example: '1250.00'),
        new OA\Property(property: 'on_sale', type: 'boolean'),
        new OA\Property(property: 'stock_status', type: 'string', enum: ['instock', 'outofstock', 'onbackorder']),
        new OA\Property(property: 'manage_stock', type: 'boolean'),
        new OA\Property(property: 'stock_quantity', type: 'integer', nullable: true),
        new OA\Property(property: 'total_sales', type: 'integer'),
        new OA\Property(property: 'average_rating', type: 'string', example: '4.50'),
        new OA\Property(property: 'rating_count', type: 'integer'),
        new OA\Property(property: 'image_url', type: 'string', nullable: true),
        new OA\Property(property: 'permalink', type: 'string', nullable: true),
        new OA\Property(property: 'woo_created_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'woo_modified_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'categories', type: 'array', items: new OA\Items(ref: '#/components/schemas/Category')),
    ],
)]
final class ProductSchema {}
