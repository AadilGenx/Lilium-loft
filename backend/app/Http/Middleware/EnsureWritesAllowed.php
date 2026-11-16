<?php

namespace App\Http\Middleware;

use App\Models\WriteSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate for every route that can change WooCommerce.
 * Usage: ->middleware('woo.write:products.update')
 *
 * All four must be true, otherwise the request is rejected before the
 * controller (and therefore before any WooCommerce call) runs:
 *   1. WOO_WRITES_ALLOWED=true in the environment
 *   2. the master switch is on
 *   3. the capability switch for this action is on
 *   4. the authenticated user has can_write
 */
class EnsureWritesAllowed
{
    public function handle(Request $request, Closure $next, string $capability): Response
    {
        $reason = match (true) {
            config('woocommerce.writes_allowed') !== true => 'Changes to the store are disabled for this environment.',
            ! WriteSetting::isOn('master') => 'Changes to the store are switched off in settings.',
            ! WriteSetting::isOn($capability) => 'This action is switched off in settings.',
            ! $request->user()?->can_write => 'Your account is not permitted to make changes.',
            default => null,
        };

        if ($reason !== null) {
            return response()->json(['message' => $reason, 'code' => 'writes_disabled'], 403);
        }

        return $next($request);
    }
}
