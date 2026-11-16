<?php

namespace App\Services\WooCommerce;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * The one place that turns a WooCommerce failure into text a user may see.
 *
 * Users only ever get a short generic sentence. The real cause (exception, URL,
 * WooCommerce's own reply) goes to laravel.log, never into an API response.
 */
final class WooErrors
{
    public const NOT_CONFIGURED = 'WooCommerce is not configured.';

    public const UNREACHABLE = 'WooCommerce could not be reached.';

    public const REFUSED = 'WooCommerce did not accept the request.';

    public const FAILED = 'The request to WooCommerce failed.';

    public const IMPORT_FAILED = 'The import from WooCommerce failed.';

    /**
     * Log the real error and return the generic message for it.
     *
     * @param  string  $context  what was being done, e.g. "write products.create"
     */
    public static function describe(Throwable $e, string $context): string
    {
        Log::error("WooCommerce: {$context} failed", self::details($e));

        return self::publicMessage($e);
    }

    /** The generic message only (no logging), for exceptions that were already logged. */
    public static function publicMessage(Throwable $e): string
    {
        return match (true) {
            $e instanceof WooNotConfigured => self::NOT_CONFIGURED,
            // Authored by us (e.g. "Writes to WooCommerce are disabled."): safe by construction.
            $e instanceof WriteBlocked => $e->getMessage(),
            $e instanceof ConnectionException => self::UNREACHABLE,
            $e instanceof RequestException => self::REFUSED,
            default => self::FAILED,
        };
    }

    /** @return array<string, mixed> */
    private static function details(Throwable $e): array
    {
        $details = ['exception' => $e::class, 'message' => $e->getMessage()];

        if ($e instanceof RequestException) {
            $details['status'] = $e->response->status();
            $details['response'] = mb_substr($e->response->body(), 0, 1000);
        }

        return $details;
    }
}
