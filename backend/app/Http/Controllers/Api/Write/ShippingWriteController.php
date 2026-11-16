<?php

namespace App\Http\Controllers\Api\Write;

use App\Http\Controllers\Controller;
use App\Services\WooCommerce\WooWriteClient;
use App\Services\WooCommerce\WooWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

/** Shipping methods inside a zone. Zones themselves (their regions) are not changed here. */
class ShippingWriteController extends Controller
{
    public function __construct(private WooWriter $writer) {}

    #[OA\Post(
        path: '/api/v1/shipping/zones/{zone}/methods',
        operationId: 'shippingMethodCreate',
        summary: 'Add a shipping method to a zone',
        description: 'CHANGES THE LIVE STORE. Needs the "shipping.manage" write switch. `method_id` is the method type (see GET /shipping/methods), e.g. `flat_rate`, `free_shipping`, `local_pickup`. New methods start disabled unless `enabled` is true.',
        security: [['bearerAuth' => []]],
        tags: ['Shipping'],
        parameters: [new OA\Parameter(name: 'zone', in: 'path', required: true, description: 'WooCommerce zone id', schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(required: ['method_id'], properties: [
            new OA\Property(property: 'method_id', type: 'string', example: 'flat_rate'),
            new OA\Property(property: 'title', type: 'string'),
            new OA\Property(property: 'cost', type: 'string', example: '50'),
            new OA\Property(property: 'tax_status', type: 'string', enum: ['taxable', 'none']),
            new OA\Property(property: 'enabled', type: 'boolean'),
        ])),
        responses: [
            new OA\Response(response: 201, description: 'Created method'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function store(Request $request, int $zone): JsonResponse
    {
        $data = $request->validate(['method_id' => ['required', 'string', 'max:60', 'regex:/^[a-z0-9_]+$/']] + $this->rules());
        $payload = ['method_id' => $data['method_id'], 'enabled' => $data['enabled'] ?? false] + $this->settings($data);

        $method = $this->writer->run('shipping_methods', 'create', $zone, $payload, null, $request->user(), $request->ip(),
            fn (WooWriteClient $c) => $c->post("shipping/zones/{$zone}/methods", $payload));
        $this->writer->flushConfig();

        return response()->json($this->shape($method), 201);
    }

    #[OA\Put(
        path: '/api/v1/shipping/zones/{zone}/methods/{instance}',
        operationId: 'shippingMethodUpdate',
        summary: 'Change a shipping method in a zone',
        description: 'CHANGES THE LIVE STORE. Needs the "shipping.manage" write switch. `instance` is the method\'s instance id from GET /shipping/zones. Partial update.',
        security: [['bearerAuth' => []]],
        tags: ['Shipping'],
        parameters: [
            new OA\Parameter(name: 'zone', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'instance', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Updated method'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function update(Request $request, int $zone, int $instance): JsonResponse
    {
        $data = $request->validate($this->rules());
        $payload = array_intersect_key($data, ['enabled' => 1]) + $this->settings($data);
        abort_if($payload === [], 422, 'Send at least one field to change.');

        $method = $this->writer->run('shipping_methods', 'update', $instance, $payload, null, $request->user(), $request->ip(),
            fn (WooWriteClient $c) => $c->put("shipping/zones/{$zone}/methods/{$instance}", $payload));
        $this->writer->flushConfig();

        return response()->json($this->shape($method));
    }

    #[OA\Delete(
        path: '/api/v1/shipping/zones/{zone}/methods/{instance}',
        operationId: 'shippingMethodDelete',
        summary: 'Remove a shipping method from a zone',
        description: 'CHANGES THE LIVE STORE. WooCommerce removes shipping methods permanently, so this needs BOTH the "shipping.manage" and the "permanent_delete" write switches.',
        security: [['bearerAuth' => []]],
        tags: ['Shipping'],
        parameters: [
            new OA\Parameter(name: 'zone', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'instance', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Removed'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function destroy(Request $request, int $zone, int $instance): JsonResponse
    {
        $this->writer->run('shipping_methods', 'delete', $instance, ['zone' => $zone, 'force' => true], null, $request->user(), $request->ip(),
            fn (WooWriteClient $c) => $c->delete("shipping/zones/{$zone}/methods/{$instance}", true));
        $this->writer->flushConfig();

        return response()->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:100',
            'cost' => 'sometimes|nullable|numeric|min:0|max:99999999',
            'tax_status' => 'sometimes|in:taxable,none',
            'enabled' => 'sometimes|boolean',
        ];
    }

    /**
     * Title, cost and tax status live in the method's `settings` object.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function settings(array $data): array
    {
        $settings = array_intersect_key($data, ['title' => 1, 'tax_status' => 1]);
        if (array_key_exists('cost', $data)) {
            $settings['cost'] = $data['cost'] === null ? '' : (string) $data['cost'];
        }

        return $settings === [] ? [] : ['settings' => $settings];
    }

    /** @param array<string, mixed> $method */
    private function shape(array $method): array
    {
        unset($method['_links']);

        return $method;
    }
}
