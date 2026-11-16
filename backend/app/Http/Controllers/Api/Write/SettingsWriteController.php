<?php

namespace App\Http\Controllers\Api\Write;

use App\Http\Controllers\Controller;
use App\Services\WooCommerce\WooConfigReader;
use App\Services\WooCommerce\WooWriteClient;
use App\Services\WooCommerce\WooWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class SettingsWriteController extends Controller
{
    /** Groups that may be changed. `advanced` (API keys, webhooks, site visibility) is deliberately left out. */
    public const GROUPS = ['general', 'products', 'tax', 'shipping', 'checkout', 'account', 'email'];

    public function __construct(private WooWriter $writer, private WooConfigReader $config) {}

    #[OA\Put(
        path: '/api/v1/settings/{group}',
        operationId: 'settingsGroupUpdate',
        summary: 'Change one or more settings in a group',
        description: 'CHANGES THE LIVE STORE. Needs the "settings.update" write switch. Send `settings` as `{setting_id: value}` (ids as returned by GET /settings/{group}). Booleans are sent to WooCommerce as `yes`/`no`. Allowed groups: general, products, tax, shipping, checkout, account, email. Credential-like settings (keys, secrets, tokens, passwords) are refused. All changes are applied in one WooCommerce batch.',
        security: [['bearerAuth' => []]],
        tags: ['Settings'],
        parameters: [new OA\Parameter(name: 'group', in: 'path', required: true, schema: new OA\Schema(type: 'string'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(required: ['settings'], properties: [
            new OA\Property(property: 'settings', type: 'object', example: ['woocommerce_currency' => 'INR', 'woocommerce_calc_taxes' => true]),
        ])),
        responses: [
            new OA\Response(response: 200, description: 'The group after the change (secrets masked)'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function updateGroup(Request $request, string $group): JsonResponse
    {
        abort_unless(in_array($group, self::GROUPS, true), 422, 'Settings in this group cannot be changed through the API.');

        $request->validate(['settings' => 'required|array|min:1|max:50']);
        $changes = [];
        foreach ($request->input('settings') as $id => $value) {
            $changes[] = ['id' => $this->checkId((string) $id), 'value' => $this->checkValue((string) $id, $value)];
        }

        $this->apply($request, $group, $changes);

        return response()->json($this->config->fetch("settings/{$group}"));
    }

    #[OA\Put(
        path: '/api/v1/settings/{group}/{id}',
        operationId: 'settingsUpdate',
        summary: 'Change one setting',
        description: 'CHANGES THE LIVE STORE. Same rules as changing a whole group; needs the "settings.update" write switch.',
        security: [['bearerAuth' => []]],
        tags: ['Settings'],
        parameters: [
            new OA\Parameter(name: 'group', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(required: ['value'], properties: [
            new OA\Property(property: 'value', example: 'INR'),
        ])),
        responses: [
            new OA\Response(response: 200, description: 'The setting after the change'),
            new OA\Response(response: 403, description: 'Writes are disabled or the user is not allowed to write', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
            new OA\Response(response: 502, description: 'WooCommerce rejected the change or could not be reached', content: new OA\JsonContent(ref: '#/components/schemas/Error')),
        ],
    )]
    public function update(Request $request, string $group, string $id): JsonResponse
    {
        abort_unless(in_array($group, self::GROUPS, true), 422, 'Settings in this group cannot be changed through the API.');

        $request->validate(['value' => 'present']);
        $this->apply($request, $group, [['id' => $this->checkId($id), 'value' => $this->checkValue($id, $request->input('value'))]]);

        return response()->json($this->config->fetch("settings/{$group}/{$id}"));
    }

    /** @param array<int, array{id: string, value: mixed}> $changes */
    private function apply(Request $request, string $group, array $changes): void
    {
        $audit = array_column($changes, 'value', 'id');

        $this->writer->run('settings', $group, null, $audit, null, $request->user(), $request->ip(),
            fn (WooWriteClient $c) => $c->post("settings/{$group}/batch", ['update' => $changes]));
        $this->writer->flushConfig();
    }

    private function checkId(string $id): string
    {
        if (preg_match('/^[a-z0-9_]{1,100}$/', $id) !== 1) {
            abort(422, "Invalid setting id '{$id}'.");
        }
        if (WooConfigReader::looksSecret($id)) {
            abort(422, 'This setting cannot be changed through the API.');
        }

        return $id;
    }

    private function checkValue(string $id, mixed $value): mixed
    {
        if (is_bool($value)) {
            return $value ? 'yes' : 'no';
        }
        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }
        if (is_string($value) && mb_strlen($value) <= 2000) {
            return $value;
        }
        if (is_array($value) && count($value) <= 200 && array_is_list($value) && collect($value)->every(fn ($v) => is_string($v) || is_int($v))) {
            return array_map('strval', $value);
        }

        abort(422, "Invalid value for '{$id}'.");
    }
}
