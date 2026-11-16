<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WooOrder;
use App\Models\WooProduct;
use App\Models\WooSyncLog;
use App\Models\WooWriteAudit;
use App\Services\WooCommerce\WooErrors;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use OpenApi\Attributes as OA;

class NotificationController extends Controller
{
    private const TYPES = ['new_order', 'order_problem', 'out_of_stock', 'low_stock', 'sync_failed', 'write_failed'];

    #[OA\Get(
        path: '/api/v1/notifications',
        operationId: 'notificationsIndex',
        summary: 'Alerts for the header bell',
        description: "Computed on the fly from the local mirror, newest first; nothing is stored and WooCommerce is not called. Types: `new_order` (pending/on-hold/processing orders), `order_problem` (failed or refunded orders), `out_of_stock`, `low_stock`, `sync_failed`, and `write_failed` (only for users allowed to write).\n\nEach alert carries a per-user `read` flag (set with POST /notifications/read); `unread` counts the alerts that are not read. `since` can still be passed to get only newer alerts.",
        security: [['bearerAuth' => []]],
        tags: ['Notifications'],
        parameters: [
            new OA\Parameter(name: 'since', in: 'query', description: 'ISO 8601 time; only alerts newer than this are returned', schema: new OA\Schema(type: 'string', format: 'date-time')),
            new OA\Parameter(name: 'type', in: 'query', schema: new OA\Schema(type: 'string', enum: self::TYPES)),
            new OA\Parameter(name: 'days', in: 'query', description: 'How far back order alerts look', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 30, default: 7)),
            new OA\Parameter(name: 'limit', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 30)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'unread', type: 'integer', description: 'Alerts this user has not marked read (limited to those newer than `since` when given)'),
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(properties: [
                    new OA\Property(property: 'id', type: 'string', example: 'new_order:1234:processing', description: 'Stable id, unchanged while the underlying state is unchanged'),
                    new OA\Property(property: 'type', type: 'string', enum: self::TYPES),
                    new OA\Property(property: 'severity', type: 'string', enum: ['info', 'warning', 'danger']),
                    new OA\Property(property: 'title', type: 'string', example: 'New order #1234'),
                    new OA\Property(property: 'message', type: 'string'),
                    new OA\Property(property: 'resource', type: 'string', nullable: true, example: 'orders'),
                    new OA\Property(property: 'resource_id', type: 'integer', nullable: true, description: 'Local id, usable with GET /api/v1/{resource}/{id}'),
                    new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
                ])),
            ])),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'since' => 'date',
            'type' => 'in:'.implode(',', self::TYPES),
            'days' => 'integer|min:1|max:30',
            'limit' => 'integer|min:1|max:100',
        ]);

        $days = (int) $request->input('days', 7);
        $limit = (int) $request->input('limit', 30);
        $since = $request->filled('since') ? Carbon::parse($request->input('since')) : null;
        $threshold = (int) config('woocommerce.low_stock_threshold');
        $recent = now()->subDays($days);

        $items = collect();

        // Orders waiting for attention.
        WooOrder::whereIn('status', ['pending', 'on-hold', 'processing'])->where('woo_created_at', '>=', $recent)
            ->get(['id', 'woo_id', 'number', 'status', 'total', 'currency', 'billing_name', 'woo_created_at'])
            ->each(fn ($o) => $items->push($this->item(
                "new_order:{$o->woo_id}:{$o->status}", 'new_order', 'info',
                "New order #{$o->number}",
                trim("{$o->currency} {$o->total} from ".($o->billing_name ?: 'a guest')." ({$o->status})"),
                'orders', $o->id, $o->woo_created_at,
            )));

        // Failed or refunded orders.
        WooOrder::whereIn('status', ['failed', 'refunded'])->where('woo_created_at', '>=', $recent)
            ->get(['id', 'woo_id', 'number', 'status', 'total', 'currency', 'woo_created_at'])
            ->each(fn ($o) => $items->push($this->item(
                "order_problem:{$o->woo_id}:{$o->status}", 'order_problem', 'danger',
                "Order #{$o->number} {$o->status}",
                "{$o->currency} {$o->total}",
                'orders', $o->id, $o->woo_created_at,
            )));

        // Stock.
        WooProduct::where('status', 'publish')->where('stock_status', 'outofstock')
            ->get(['id', 'woo_id', 'name', 'woo_modified_at'])
            ->each(fn ($p) => $items->push($this->item(
                "out_of_stock:{$p->woo_id}", 'out_of_stock', 'warning',
                'Out of stock', $p->name, 'products', $p->id, $p->woo_modified_at,
            )));

        WooProduct::where('status', 'publish')->where('manage_stock', true)
            ->where('stock_quantity', '>', 0)->where('stock_quantity', '<=', $threshold)
            ->get(['id', 'woo_id', 'name', 'stock_quantity', 'woo_modified_at'])
            ->each(fn ($p) => $items->push($this->item(
                "low_stock:{$p->woo_id}:{$p->stock_quantity}", 'low_stock', 'warning',
                'Low stock', "{$p->name}: {$p->stock_quantity} left", 'products', $p->id, $p->woo_modified_at,
            )));

        // Latest import run per resource, only if it failed.
        $latest = WooSyncLog::selectRaw('MAX(id) as id')->groupBy('resource');
        WooSyncLog::whereIn('id', $latest)->where('status', 'failed')->get()
            ->each(fn ($s) => $items->push($this->item(
                "sync_failed:{$s->resource}:{$s->id}", 'sync_failed', 'danger',
                "Import of {$s->resource} failed", WooErrors::IMPORT_FAILED.' See the server log.', null, null, $s->started_at,
            )));

        // Failed changes to the store: only for people who can make changes.
        if ($request->user()?->can_write && Schema::hasTable('woo_write_audits')) {
            WooWriteAudit::where('status', 'failed')->where('created_at', '>=', $recent)->get()
                ->each(fn ($a) => $items->push($this->item(
                    "write_failed:{$a->id}", 'write_failed', 'danger',
                    "Change to {$a->resource} #{$a->woo_id} failed", WooErrors::REFUSED.' See the audit log.', null, null, $a->created_at,
                )));
        }

        $items = $items
            ->when($request->filled('type'), fn ($c) => $c->where('type', $request->input('type')))
            ->when($since, fn ($c) => $c->filter(fn ($i) => Carbon::parse($i['created_at'])->gt($since)))
            ->sortByDesc('created_at')->values();

        $read = DB::table('notification_reads')->where('user_id', $request->user()?->getKey())
            ->whereIn('notification_id', $items->pluck('id'))->pluck('notification_id')->flip();
        $items = $items->map(fn ($i) => $i + ['read' => $read->has($i['id'])]);

        return response()->json([
            'unread' => $items->where('read', false)->count(),
            'data' => $items->take($limit)->values(),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/notifications/read',
        operationId: 'notificationsMarkRead',
        summary: 'Mark alerts as read for the current user',
        description: 'Stored locally per user; WooCommerce is never contacted. Send `ids` (alert ids from GET /notifications) or `all: true` to mark every current alert read.',
        security: [['bearerAuth' => []]],
        tags: ['Notifications'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(properties: [
            new OA\Property(property: 'ids', type: 'array', items: new OA\Items(type: 'string')),
            new OA\Property(property: 'all', type: 'boolean'),
        ])),
        responses: [
            new OA\Response(response: 200, description: 'OK', content: new OA\JsonContent(properties: [new OA\Property(property: 'marked', type: 'integer')])),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation failed', content: new OA\JsonContent(ref: '#/components/schemas/ValidationError')),
        ],
    )]
    public function markRead(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => 'required_without:all|array|max:200',
            'ids.*' => 'string|max:120',
            'all' => 'sometimes|boolean',
        ]);

        $ids = $data['ids'] ?? [];
        if ($request->boolean('all')) {
            $current = Request::create('/', 'GET', ['days' => 30, 'limit' => 100]);
            $current->setUserResolver($request->getUserResolver());
            $ids = array_merge($ids, collect($this->index($current)->getData(true)['data'])->pluck('id')->all());
        }

        $ids = array_values(array_unique($ids));
        $userId = $request->user()->getKey();
        $now = now();
        DB::table('notification_reads')->insertOrIgnore(array_map(
            fn ($id) => ['user_id' => $userId, 'notification_id' => $id, 'read_at' => $now],
            $ids,
        ));

        return response()->json(['marked' => count($ids)]);
    }

    private function item(string $id, string $type, string $severity, string $title, string $message, ?string $resource, ?int $resourceId, mixed $at): array
    {
        return [
            'id' => $id,
            'type' => $type,
            'severity' => $severity,
            'title' => $title,
            'message' => $message,
            'resource' => $resource,
            'resource_id' => $resourceId,
            'created_at' => Carbon::parse($at ?? now())->toIso8601String(),
        ];
    }
}
