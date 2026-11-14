<?php

namespace App\Http\Controllers\Api\Docs;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Order',
    properties: [
        new OA\Property(property: 'id', type: 'integer'),
        new OA\Property(property: 'woo_id', type: 'integer'),
        new OA\Property(property: 'number', type: 'string', example: '1024'),
        new OA\Property(property: 'status', type: 'string', example: 'processing'),
        new OA\Property(property: 'currency', type: 'string', example: 'INR'),
        new OA\Property(property: 'total', type: 'string', example: '2450.00'),
        new OA\Property(property: 'discount_total', type: 'string', example: '0.00'),
        new OA\Property(property: 'shipping_total', type: 'string', example: '50.00'),
        new OA\Property(property: 'total_tax', type: 'string', example: '0.00'),
        new OA\Property(property: 'payment_method', type: 'string', nullable: true, example: 'razorpay'),
        new OA\Property(property: 'payment_method_title', type: 'string', nullable: true),
        new OA\Property(property: 'transaction_id', type: 'string', nullable: true),
        new OA\Property(property: 'customer_woo_id', type: 'integer', description: '0 for guest checkout'),
        new OA\Property(property: 'billing_name', type: 'string', nullable: true),
        new OA\Property(property: 'billing_email', type: 'string', nullable: true),
        new OA\Property(property: 'billing_phone', type: 'string', nullable: true),
        new OA\Property(property: 'billing_city', type: 'string', nullable: true),
        new OA\Property(property: 'billing_state', type: 'string', nullable: true),
        new OA\Property(property: 'shipping_city', type: 'string', nullable: true),
        new OA\Property(property: 'shipping_state', type: 'string', nullable: true),
        new OA\Property(property: 'customer_note', type: 'string', nullable: true),
        new OA\Property(property: 'coupon_codes', type: 'array', items: new OA\Items(type: 'string')),
        new OA\Property(property: 'woo_created_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'woo_paid_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'woo_completed_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'items', type: 'array', description: 'Included on the detail endpoint, and on the list when with_items=1.', items: new OA\Items(ref: '#/components/schemas/OrderItem')),
    ],
)]
final class OrderSchema {}
