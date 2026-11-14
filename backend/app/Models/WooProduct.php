<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WooProduct extends Model
{
    protected $table = 'woo_products';

    protected $guarded = [];

    protected $hidden = ['raw'];

    protected function casts(): array
    {
        return [
            'on_sale' => 'boolean',
            'manage_stock' => 'boolean',
            'price' => 'decimal:2',
            'regular_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'woo_created_at' => 'datetime',
            'woo_modified_at' => 'datetime',
            'raw' => 'array',
        ];
    }


    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(WooCategory::class, 'woo_category_product', 'product_woo_id', 'category_woo_id', 'woo_id', 'woo_id');
    }
}
