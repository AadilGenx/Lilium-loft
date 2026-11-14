<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Coupon',
    properties: [
        new OA\Property(property: 'id', type: 'integer'),
        new OA\Property(property: 'woo_id', type: 'integer'),
        new OA\Property(property: 'code', type: 'string', example: 'WELCOME10'),
        new OA\Property(property: 'status', type: 'string', nullable: true),
        new OA\Property(property: 'discount_type', type: 'string', nullable: true, example: 'percent'),
        new OA\Property(property: 'amount', type: 'string', example: '10.00'),
        new OA\Property(property: 'usage_count', type: 'integer'),
        new OA\Property(property: 'usage_limit', type: 'integer', nullable: true),
        new OA\Property(property: 'free_shipping', type: 'boolean'),
        new OA\Property(property: 'expires_at', type: 'string', format: 'date-time', nullable: true),
    ],
)]
final class CouponSchema {}
