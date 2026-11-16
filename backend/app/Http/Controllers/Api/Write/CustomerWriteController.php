<?php

namespace App\Http\Controllers\Api\Write;

use App\Http\Controllers\Controller;
use App\Models\WooCustomer;
use App\Services\WooCommerce\WooWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class CustomerWriteController extends Controller
{
    private const ADDRESS_FIELDS = ['phone', 'address_1', 'address_2', 'city', 'state', 'postcode', 'country'];

    public function __construct(private WooWriter $writer) {}

    #[OA\Post(
        path: '/api/v1/customers',
        operationId: 'customersCreate',
        summary: 'Create a customer',
        description: 'CHANGES THE LIVE STORE. Needs the "customers.create" write switch. No password is accepted: WooCommerce generates one and follows its own account e-mail settings. Address fields are stored as both billing and shipping address.',
        security: [['bearerAuth' => []]],
        tags: ['Customers'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(required: ['email', 'first_name'], properties: [
            new OA\Property(property: 'email', type: 'string', format: 'email'),
            new OA\Property(property: 'first_name', type: 'string'),
            new OA\Property(property: 'last_name', type: 'string'),
            new OA\Property(property: 'username', type: 'string'),
            new OA\Property(property: 'phone', type: 'string'),
            new OA\Property(property: 'address_1', type: 'string'),
            new OA\Property(property: 'city', type: 'string'),
            new OA\Property(property: 'state', type: 'string'),
            new OA\Property(property: 'postcode', type: 'string'),
            new OA\Property(property: 'country', type: 'string', example: 'IN'),
        ])),
        responses: [
            new OA\Response(response: 201, description: 'Created customer'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email|max:190',
            'first_name' => 'required|string|max:100',
            ...$this->rules(),
        ]);

        $created = $this->writer->create('customers', $this->payload($data), $request->user(), $request->ip());

        return response()->json($created, 201);
    }

    #[OA\Put(
        path: '/api/v1/customers/{id}',
        operationId: 'customersUpdate',
        summary: 'Update a customer',
        description: 'CHANGES THE LIVE STORE. Needs the "customers.update" write switch. Partial update: send only the fields to change.',
        security: [['bearerAuth' => []]],
        tags: ['Customers'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local customer id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Updated customer'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function update(Request $request, int $id): JsonResponse
    {
        $customer = WooCustomer::findOrFail($id);

        $data = $request->validate([
            'email' => 'sometimes|email|max:190',
            'first_name' => 'sometimes|string|max:100',
            ...$this->rules(),
        ]);
        $payload = $this->payload($data);
        abort_if($payload === [], 422, 'Send at least one field to change.');

        return response()->json($this->writer->update('customers', $customer, $payload, $request->user(), $request->ip()));
    }

    #[OA\Delete(
        path: '/api/v1/customers/{id}',
        operationId: 'customersDelete',
        summary: 'Delete a customer permanently',
        description: 'CHANGES THE LIVE STORE. WooCommerce has no trash for customers, so this is permanent and needs BOTH the "customers.delete" and the "permanent_delete" write switches. Their past orders are kept by WooCommerce.',
        security: [['bearerAuth' => []]],
        tags: ['Customers'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local customer id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Deleted'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->writer->delete('customers', WooCustomer::findOrFail($id), $request->user(), $request->ip());

        return response()->json(null, 204);
    }

    /** @return array<string, string> */
    private function rules(): array
    {
        return [
            'last_name' => 'sometimes|nullable|string|max:100',
            'username' => 'sometimes|string|max:60|regex:/^[A-Za-z0-9._@-]+$/',
            'phone' => 'sometimes|nullable|string|max:40',
            'address_1' => 'sometimes|nullable|string|max:200',
            'address_2' => 'sometimes|nullable|string|max:200',
            'city' => 'sometimes|nullable|string|max:100',
            'state' => 'sometimes|nullable|string|max:100',
            'postcode' => 'sometimes|nullable|string|max:20',
            'country' => 'sometimes|nullable|string|size:2',
        ];
    }

    /**
     * Flat input becomes WooCommerce's nested billing and shipping addresses.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function payload(array $data): array
    {
        $payload = array_intersect_key($data, array_flip(['email', 'first_name', 'last_name', 'username']));

        $address = [];
        foreach (self::ADDRESS_FIELDS as $field) {
            if (array_key_exists($field, $data)) {
                $address[$field] = (string) ($data[$field] ?? '');
            }
        }
        foreach (['first_name', 'last_name'] as $field) {
            if (array_key_exists($field, $data)) {
                $address[$field] = (string) ($data[$field] ?? '');
            }
        }

        if ($address !== []) {
            $payload['billing'] = $address + (isset($data['email']) ? ['email' => $data['email']] : []);
            $payload['shipping'] = array_diff_key($address, ['phone' => 1]);
        }

        return $payload;
    }
}
