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

    public const DETAIL_ATTRS = ['description', 'individual_use', 'minimum_amount', 'maximum_amount', 'exclude_sale_items'];

    public function getDescriptionAttribute(): ?string
    {
        return $this->raw['description'] ?? null;
    }

    public function getIndividualUseAttribute(): bool
    {
        return (bool) ($this->raw['individual_use'] ?? false);
    }

    public function getMinimumAmountAttribute(): ?string
    {
        $v = $this->raw['minimum_amount'] ?? null;

        return $v === '' ? null : $v;
    }

    public function getMaximumAmountAttribute(): ?string
    {
        $v = $this->raw['maximum_amount'] ?? null;

        return $v === '' ? null : $v;
    }

    public function getExcludeSaleItemsAttribute(): bool
    {
        return (bool) ($this->raw['exclude_sale_items'] ?? false);
    }
}
