<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WooCustomer extends Model
{
    protected $table = 'woo_customers';

    protected $guarded = [];

    protected $hidden = ['raw'];

    protected function casts(): array
    {
        return [
            'total_spent' => 'decimal:2',
            'woo_created_at' => 'datetime',
            'raw' => 'array',
        ];
    }


    public function orders(): HasMany
    {
        return $this->hasMany(WooOrder::class, 'customer_woo_id', 'woo_id');
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name) ?: ($this->username ?? 'Guest');
    }
}
