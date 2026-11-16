<?php

namespace App\Http\Controllers\Api\Write;

use App\Http\Controllers\Controller;
use App\Models\WooCategory;
use App\Services\WooCommerce\WooWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class CategoryWriteController extends Controller
{
    public function __construct(private WooWriter $writer) {}

    #[OA\Post(
        path: '/api/v1/categories',
        operationId: 'categoriesCreate',
        summary: 'Create a product category',
        description: 'CHANGES THE LIVE STORE. Needs the "categories.create" write switch. `parent` is the WooCommerce id (`woo_id`) of the parent category, or 0.',
        security: [['bearerAuth' => []]],
        tags: ['Categories'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(required: ['name'], properties: [
            new OA\Property(property: 'name', type: 'string'),
            new OA\Property(property: 'slug', type: 'string'),
            new OA\Property(property: 'parent', type: 'integer', example: 0),
            new OA\Property(property: 'description', type: 'string'),
        ])),
        responses: [
            new OA\Response(response: 201, description: 'Created category'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function store(Request $request): JsonResponse
    {
        $data = $this->withImage($request->validate(['name' => 'required|string|max:200'] + $this->rules()));

        return response()->json($this->writer->create('categories', $data, $request->user(), $request->ip()), 201);
    }

    #[OA\Put(
        path: '/api/v1/categories/{id}',
        operationId: 'categoriesUpdate',
        summary: 'Update a product category',
        description: 'CHANGES THE LIVE STORE. Needs the "categories.update" write switch. Partial update.',
        security: [['bearerAuth' => []]],
        tags: ['Categories'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local category id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Updated category'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function update(Request $request, int $id): JsonResponse
    {
        $category = WooCategory::findOrFail($id);
        $data = $this->withImage($request->validate(['name' => 'sometimes|string|max:200'] + $this->rules()));
        abort_if($data === [], 422, 'Send at least one field to change.');

        if (isset($data['parent']) && (int) $data['parent'] === $category->woo_id) {
            abort(422, 'A category cannot be its own parent.');
        }

        return response()->json($this->writer->update('categories', $category, $data, $request->user(), $request->ip()));
    }

    #[OA\Delete(
        path: '/api/v1/categories/{id}',
        operationId: 'categoriesDelete',
        summary: 'Delete a product category permanently',
        description: 'CHANGES THE LIVE STORE. WooCommerce has no trash for categories, so this is permanent and needs BOTH the "categories.delete" and the "permanent_delete" write switches. Products in it are kept (they become uncategorised).',
        security: [['bearerAuth' => []]],
        tags: ['Categories'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Local category id', schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Deleted'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->writer->delete('categories', WooCategory::findOrFail($id), $request->user(), $request->ip());

        return response()->json(null, 204);
    }

    /** @return array<string, string> */
    private function rules(): array
    {
        return [
            'slug' => 'sometimes|string|max:200|regex:/^[a-z0-9-]+$/',
            'parent' => 'sometimes|integer|min:0',
            'description' => 'sometimes|nullable|string|max:5000',
            'image' => 'sometimes|nullable|url|max:2000',
        ];
    }

    /** WooCommerce wants the image as {src}; an empty value means "leave the image alone". */
    private function withImage(array $data): array
    {
        if (empty($data['image'])) {
            unset($data['image']);
        } else {
            $data['image'] = ['src' => $data['image']];
        }

        return $data;
    }
}
