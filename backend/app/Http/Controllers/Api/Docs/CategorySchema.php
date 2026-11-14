<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Category',
    properties: [
        new OA\Property(property: 'id', type: 'integer', description: 'Local id', example: 1),
        new OA\Property(property: 'woo_id', type: 'integer', description: 'WooCommerce id', example: 15),
        new OA\Property(property: 'parent_woo_id', type: 'integer', example: 0),
        new OA\Property(property: 'name', type: 'string', example: 'Crochet Wall Art'),
        new OA\Property(property: 'slug', type: 'string', example: 'crochet-wall-art'),
        new OA\Property(property: 'products_count', type: 'integer', example: 12),
        new OA\Property(property: 'image_url', type: 'string', nullable: true),
    ],
)]
final class CategorySchema {}
