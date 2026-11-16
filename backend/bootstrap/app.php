<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'woo.write' => \App\Http\Middleware\EnsureWritesAllowed::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(fn (\App\Services\WooCommerce\UpstreamUnavailable $e) => response()->json(['message' => $e->getMessage()], 502));

        $exceptions->render(fn (\App\Services\WooCommerce\WriteFailed $e) => response()->json(['message' => $e->getMessage()], 502));

        // Anything unexpected (a 500) gets a plain message, even with APP_DEBUG on. It is still logged by Laravel as usual.
        $exceptions->render(function (\Throwable $e, Request $request) {
            $expected = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface
                || $e instanceof \Illuminate\Validation\ValidationException
                || $e instanceof \Illuminate\Auth\AuthenticationException
                || $e instanceof \Illuminate\Auth\Access\AuthorizationException
                || $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException
                || $e instanceof \Illuminate\Http\Exceptions\ThrottleRequestsException;

            if ($request->is('api/*') && ! $expected) {
                return response()->json(['message' => 'Something went wrong on the server.'], 500);
            }

            return null;
        });

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
