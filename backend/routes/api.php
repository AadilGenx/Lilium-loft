<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

// Read-only API: apart from token login/logout, every endpoint is GET.
Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware(['auth:api', 'throttle:120,1'])->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/refresh', [AuthController::class, 'refresh']);

        Route::get('dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('dashboard/revenue', [DashboardController::class, 'revenue']);
        Route::get('dashboard/orders-by-status', [DashboardController::class, 'ordersByStatus']);
        Route::get('dashboard/top-products', [DashboardController::class, 'topProducts']);
        Route::get('sync/status', [DashboardController::class, 'syncStatus']);

        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{id}', [OrderController::class, 'show'])->whereNumber('id');
        Route::get('products', [ProductController::class, 'index']);
        Route::get('products/{id}', [ProductController::class, 'show'])->whereNumber('id');
        Route::get('customers', [CustomerController::class, 'index']);
        Route::get('customers/{id}', [CustomerController::class, 'show'])->whereNumber('id');
        Route::get('categories', [CategoryController::class, 'index']);
        Route::get('categories/{id}', [CategoryController::class, 'show'])->whereNumber('id');
        Route::get('coupons', [CouponController::class, 'index']);
        Route::get('coupons/{id}', [CouponController::class, 'show'])->whereNumber('id');
    });
});
