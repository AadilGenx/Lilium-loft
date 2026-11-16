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
 * All three must be true, otherwise the request is rejected before the
 * controller (and therefore before any WooCommerce call) runs:
 *   1. the master switch is on (Settings → Store changes in the web app)
 *   2. the capability switch for this action is on
 *   3. the authenticated user has can_write
 */
class EnsureWritesAllowed
{
    public function handle(Request $request, Closure $next, string $capability): Response
    {
        $reason = match (true) {
            ! WriteSetting::isOn('master') => 'Changes to the store are switched off. Turn them on in Settings → Store changes.',
            ! WriteSetting::isOn($capability) => 'This action is switched off. Turn it on in Settings → Store changes.',
            ! $request->user()?->can_write => 'Your account is not permitted to make changes.',
            default => null,
        };

        if ($reason !== null) {
            return response()->json(['message' => $reason, 'code' => 'writes_disabled'], 403);
        }

        return $next($request);
    }
}
