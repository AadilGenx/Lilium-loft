<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WooCommerce\WooConfigReader;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/** Shipping configuration, read live (GET only) from WooCommerce. */
class ShippingController extends Controller
{
    public function __construct(private WooConfigReader $woo) {}

    #[OA\Get(
        path: '/api/v1/shipping/zones',
        operationId: 'shippingZones',
        summary: 'Shipping zones with their regions and shipping methods',
        description: 'Read live from WooCommerce and cached for a few minutes. Secret-looking values are masked.',
        security: [['bearerAuth' => []]],
        tags: ['Shipping'],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'array', items: new OA\Items(properties: [
                new OA\Property(property: 'id', type: 'integer', example: 1),
                new OA\Property(property: 'name', type: 'string', example: 'India'),
                new OA\Property(property: 'order', type: 'integer'),
                new OA\Property(property: 'locations', type: 'array', items: new OA\Items(properties: [
                    new OA\Property(property: 'code', type: 'string', example: 'IN'),
                    new OA\Property(property: 'type', type: 'string', example: 'country'),
                ])),
                new OA\Property(property: 'methods', type: 'array', items: new OA\Items(type: 'object')),
            ]))),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 502, description: 'WooCommerce could not be read', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function zones(): JsonResponse
    {
        $zones = array_map(fn (array $zone) => $this->withDetails($zone), $this->woo->fetch('shipping/zones'));

        return response()->json(array_values($zones));
    }

    #[OA\Get(
        path: '/api/v1/shipping/zones/{id}',
        operationId: 'shippingZoneShow',
        summary: 'One shipping zone with its regions and methods',
        security: [['bearerAuth' => []]],
        tags: ['Shipping'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'WooCommerce zone id (0 = regions not covered by other zones)', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 502, description: 'WooCommerce could not be read', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function zone(int $id): JsonResponse
    {
        return response()->json($this->withDetails($this->woo->fetch("shipping/zones/{$id}")));
    }

    #[OA\Get(
        path: '/api/v1/shipping/methods',
        operationId: 'shippingMethods',
        summary: 'Shipping method types available in the store',
        description: 'The kinds of method that can be added to a zone (flat rate, free shipping, local pickup, ...).',
        security: [['bearerAuth' => []]],
        tags: ['Shipping'],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'array', items: new OA\Items(type: 'object'))),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 502, description: 'WooCommerce could not be read', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function methods(): JsonResponse
    {
        return response()->json($this->woo->fetch('shipping_methods'));
    }

    #[OA\Get(
        path: '/api/v1/shipping/classes',
        operationId: 'shippingClasses',
        summary: 'Product shipping classes',
        security: [['bearerAuth' => []]],
        tags: ['Shipping'],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(type: 'array', items: new OA\Items(properties: [
                new OA\Property(property: 'id', type: 'integer'),
                new OA\Property(property: 'name', type: 'string'),
                new OA\Property(property: 'slug', type: 'string'),
                new OA\Property(property: 'description', type: 'string'),
                new OA\Property(property: 'count', type: 'integer', description: 'Products in this class'),
            ]))),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 502, description: 'WooCommerce could not be read', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function classes(): JsonResponse
    {
        return response()->json($this->woo->fetch('products/shipping_classes', ['per_page' => 100]));
    }

    /** @param array<string, mixed> $zone */
    private function withDetails(array $zone): array
    {
        $id = $zone['id'];

        try {
            $zone['locations'] = $this->woo->fetch("shipping/zones/{$id}/locations");
        } catch (NotFoundHttpException) {
            $zone['locations'] = []; // the "rest of the world" zone has no region list
        }
        $zone['methods'] = $this->woo->fetch("shipping/zones/{$id}/methods");

        return $zone;
    }
}
