<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WooWriteAudit;
use App\Models\WriteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

/**
 * The on/off switches that decide whether this app may change the live WooCommerce store.
 * Everyone signed in can see them; only a user who is allowed to make changes can flip them.
 * Every flip is written to the audit log.
 */
class WriteSettingController extends Controller
{
    #[OA\Get(
        path: '/api/v1/write-settings',
        operationId: 'writeSettingsIndex',
        summary: 'Switches that control changes to the store',
        description: 'Nothing is ever sent to WooCommerce unless the `master` switch is on, the switch for that specific action is on, and the signed-in user is allowed to make changes. All switches start OFF. `can_manage` says whether the current user may flip them.',
        security: [['bearerAuth' => []]],
        tags: ['Write settings'],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'can_manage', type: 'boolean'),
                new OA\Property(property: 'master', properties: [
                    new OA\Property(property: 'key', type: 'string', example: 'master'),
                    new OA\Property(property: 'label', type: 'string'),
                    new OA\Property(property: 'enabled', type: 'boolean'),
                ], type: 'object'),
                new OA\Property(property: 'permanent_delete', type: 'object', properties: [
                    new OA\Property(property: 'key', type: 'string'),
                    new OA\Property(property: 'label', type: 'string'),
                    new OA\Property(property: 'enabled', type: 'boolean'),
                ]),
                new OA\Property(property: 'capabilities', type: 'array', items: new OA\Items(properties: [
                    new OA\Property(property: 'key', type: 'string', example: 'products.create'),
                    new OA\Property(property: 'group', type: 'string', example: 'products'),
                    new OA\Property(property: 'label', type: 'string'),
                    new OA\Property(property: 'enabled', type: 'boolean'),
                ])),
            ])),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        return response()->json($this->snapshot($request));
    }

    #[OA\Put(
        path: '/api/v1/write-settings/{key}',
        operationId: 'writeSettingsUpdate',
        summary: 'Turn one switch on or off',
        description: 'Only a user who is allowed to make changes may do this (otherwise 403). The change takes effect immediately and is recorded in the audit log with who made it. Returns the full list as GET does.',
        security: [['bearerAuth' => []]],
        tags: ['Write settings'],
        parameters: [new OA\Parameter(name: 'key', in: 'path', required: true, description: '`master`, `permanent_delete` or an action such as `products.create`', schema: new OA\Schema(type: 'string'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(required: ['enabled'], properties: [
            new OA\Property(property: 'enabled', type: 'boolean'),
        ])),
        responses: [
            new OA\Response(response: 200, description: 'Updated list'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 403, description: 'This user may not change these settings', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
        ],
    )]
    public function update(Request $request, string $key): JsonResponse
    {
        if (! $request->user()?->can_write) {
            return response()->json(['message' => 'Your account is not permitted to change these settings.', 'code' => 'not_permitted'], 403);
        }

        $data = $request->validate(['enabled' => 'required|boolean']);
        $setting = WriteSetting::where('key', $key)->firstOrFail();
        $enabled = (bool) $data['enabled'];

        if ($setting->enabled !== $enabled) {
            WooWriteAudit::create([
                'user_id' => $request->user()->getKey(),
                'resource' => 'write_settings',
                'action' => $enabled ? 'enable' : 'disable',
                'status' => 'success',
                'request' => ['key' => $key, 'enabled' => $enabled],
                'before' => ['enabled' => $setting->enabled],
                'after' => ['enabled' => $enabled],
                'ip' => $request->ip(),
            ]);

            $setting->update(['enabled' => $enabled]);
        }

        return response()->json($this->snapshot($request));
    }

    /** @return array<string, mixed> */
    private function snapshot(Request $request): array
    {
        $all = WriteSetting::orderBy('id')->get();
        $shape = fn (WriteSetting $s) => ['key' => $s->key, 'label' => $s->label, 'enabled' => (bool) $s->enabled];

        return [
            'can_manage' => (bool) $request->user()?->can_write,
            'master' => $shape($all->firstWhere('key', 'master') ?? new WriteSetting(['key' => 'master', 'label' => 'Allow changes to the store', 'enabled' => false])),
            'permanent_delete' => $shape($all->firstWhere('key', 'permanent_delete') ?? new WriteSetting(['key' => 'permanent_delete', 'label' => 'Allow permanent deletion', 'enabled' => false])),
            'capabilities' => $all->reject(fn ($s) => in_array($s->key, ['master', 'permanent_delete'], true))
                ->map(fn ($s) => $shape($s) + ['group' => explode('.', $s->key)[0]])
                ->values(),
        ];
    }
}
