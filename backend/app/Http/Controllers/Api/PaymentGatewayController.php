<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WooCommerce\WooConfigReader;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

/** Payment gateway configuration, read live (GET only). API keys and secrets are masked. */
class PaymentGatewayController extends Controller
{
    public function __construct(private WooConfigReader $woo) {}

    #[OA\Get(
        path: '/api/v1/payments',
        operationId: 'paymentsIndex',
        summary: 'Payment gateways and their configuration',
        description: 'Read live from WooCommerce and cached for a few minutes. **Credentials are never returned**: any password, key, secret, token or webhook field has its value replaced by `********` and is flagged `redacted: true`.',
        security: [['bearerAuth' => []]],
        tags: ['Payments'],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'array', items: new OA\Items(properties: [
                new OA\Property(property: 'id', type: 'string', example: 'razorpay'),
                new OA\Property(property: 'title', type: 'string'),
                new OA\Property(property: 'description', type: 'string'),
                new OA\Property(property: 'order', type: 'integer'),
                new OA\Property(property: 'enabled', type: 'boolean'),
                new OA\Property(property: 'method_title', type: 'string'),
                new OA\Property(property: 'method_description', type: 'string'),
                new OA\Property(property: 'method_supports', type: 'array', items: new OA\Items(type: 'string')),
                new OA\Property(property: 'settings', type: 'object', description: 'Gateway settings keyed by field id; secret fields are masked'),
            ]))),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 502, description: 'WooCommerce could not be read', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function index(): JsonResponse
    {
        return response()->json($this->woo->fetch('payment_gateways'));
    }

    #[OA\Get(
        path: '/api/v1/payments/{id}',
        operationId: 'paymentsShow',
        summary: 'One payment gateway and its configuration',
        security: [['bearerAuth' => []]],
        tags: ['Payments'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Gateway id, e.g. cod, bacs, razorpay', schema: new OA\Schema(type: 'string'))],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 502, description: 'WooCommerce could not be read', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function show(string $id): JsonResponse
    {
        return response()->json($this->woo->fetch("payment_gateways/{$id}"));
    }
}
