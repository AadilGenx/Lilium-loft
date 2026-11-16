<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WooCommerce\WooConfigReader;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

/** WooCommerce store settings, read live (GET only). Secrets are masked. */
class SettingsController extends Controller
{
    public function __construct(private WooConfigReader $woo) {}

    #[OA\Get(
        path: '/api/v1/settings',
        operationId: 'settingsGroups',
        summary: 'List the store settings groups',
        description: 'Groups such as general, products, tax, shipping, checkout, account, email and advanced. Read live from WooCommerce and cached for a few minutes.',
        security: [['bearerAuth' => []]],
        tags: ['Settings'],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'array', items: new OA\Items(properties: [
                new OA\Property(property: 'id', type: 'string', example: 'general'),
                new OA\Property(property: 'label', type: 'string', example: 'General'),
                new OA\Property(property: 'description', type: 'string'),
                new OA\Property(property: 'parent_id', type: 'string'),
                new OA\Property(property: 'sub_groups', type: 'array', items: new OA\Items(type: 'string')),
            ]))),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 502, description: 'WooCommerce could not be read', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function groups(): JsonResponse
    {
        return response()->json($this->woo->fetch('settings'));
    }

    #[OA\Get(
        path: '/api/v1/settings/{group}',
        operationId: 'settingsGroupShow',
        summary: 'Every setting in one group, with its current value',
        description: 'Values of password, key, secret or token fields are replaced by `********` and flagged `redacted: true`.',
        security: [['bearerAuth' => []]],
        tags: ['Settings'],
        parameters: [new OA\Parameter(name: 'group', in: 'path', required: true, description: 'Group id from the groups list', schema: new OA\Schema(type: 'string', example: 'general'))],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'array', items: new OA\Items(properties: [
                new OA\Property(property: 'id', type: 'string', example: 'woocommerce_currency'),
                new OA\Property(property: 'label', type: 'string', example: 'Currency'),
                new OA\Property(property: 'type', type: 'string', example: 'select'),
                new OA\Property(property: 'value', type: 'string', example: 'INR'),
                new OA\Property(property: 'default', type: 'string'),
                new OA\Property(property: 'description', type: 'string'),
                new OA\Property(property: 'redacted', type: 'boolean', description: 'Present and true when the value was masked'),
            ]))),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 502, description: 'WooCommerce could not be read', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function group(string $group): JsonResponse
    {
        return response()->json($this->woo->fetch("settings/{$group}"));
    }
}
