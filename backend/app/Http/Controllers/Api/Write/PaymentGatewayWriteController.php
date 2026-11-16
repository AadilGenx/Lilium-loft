<?php

namespace App\Http\Controllers\Api\Write;

use App\Http\Controllers\Controller;
use App\Services\WooCommerce\WooConfigReader;
use App\Services\WooCommerce\WooWriteClient;
use App\Services\WooCommerce\WooWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class PaymentGatewayWriteController extends Controller
{
    public function __construct(private WooWriter $writer, private WooConfigReader $config) {}

    #[OA\Put(
        path: '/api/v1/payments/{id}',
        operationId: 'paymentsUpdate',
        summary: 'Enable, disable or relabel a payment gateway',
        description: 'CHANGES THE LIVE STORE (customers see this at checkout). Needs the "payments.update" write switch. Only `enabled`, `title`, `description`, `instructions` and `order` can be changed. **Credentials (API keys, secrets, webhooks) can never be written through this API**; configure those in WooCommerce itself. The response is the masked gateway, as returned by GET.',
        security: [['bearerAuth' => []]],
        tags: ['Payments'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Gateway id, e.g. `cod`', schema: new OA\Schema(type: 'string'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(properties: [
            new OA\Property(property: 'enabled', type: 'boolean'),
            new OA\Property(property: 'title', type: 'string'),
            new OA\Property(property: 'description', type: 'string'),
            new OA\Property(property: 'instructions', type: 'string'),
            new OA\Property(property: 'order', type: 'integer'),
        ])),
        responses: [
            new OA\Response(response: 200, description: 'Updated gateway (credentials masked)'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function update(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'enabled' => 'sometimes|boolean',
            'title' => 'sometimes|string|max:150',
            'description' => 'sometimes|nullable|string|max:1000',
            'instructions' => 'sometimes|nullable|string|max:2000',
            'order' => 'sometimes|integer|min:0|max:1000',
        ]);
        abort_if($data === [], 422, 'Send at least one field to change.');

        // Anything that is not a top-level gateway field goes into WooCommerce's `settings` object.
        $payload = array_intersect_key($data, array_flip(['enabled', 'title', 'description', 'order']));
        if (array_key_exists('instructions', $data)) {
            $payload['settings'] = ['instructions' => (string) ($data['instructions'] ?? '')];
        }
        if (array_key_exists('description', $payload)) {
            $payload['description'] = (string) ($payload['description'] ?? '');
        }

        $this->writer->run('payment_gateways', 'update', null, ['gateway' => $id] + $payload, null, $request->user(), $request->ip(),
            fn (WooWriteClient $c) => $c->put("payment_gateways/{$id}", $payload));
        $this->writer->flushConfig();

        return response()->json($this->config->fetch("payment_gateways/{$id}"));
    }
}
