<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WooCoupon extends Model
{
    protected $table = 'woo_coupons';

    protected $guarded = [];

    protected $hidden = ['raw'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'free_shipping' => 'boolean',
            'expires_at' => 'datetime',
            'woo_created_at' => 'datetime',
            'raw' => 'array',
        ];
    }
}
