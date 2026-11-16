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

    /** Fields that live only in the raw WooCommerce payload. Append them where the full record is needed. */
    public const DETAIL_ATTRS = ['description', 'short_description', 'featured', 'gallery', 'low_stock_amount'];

    public function getDescriptionAttribute(): ?string
    {
        return $this->raw['description'] ?? null;
    }

    public function getShortDescriptionAttribute(): ?string
    {
        return $this->raw['short_description'] ?? null;
    }

    /** The product's own low-stock level in WooCommerce (null = it uses the store-wide setting). */
    public function getLowStockAmountAttribute(): ?int
    {
        $v = $this->raw['low_stock_amount'] ?? null;

        return is_numeric($v) && $v !== '' ? (int) $v : null;
    }

    public function getFeaturedAttribute(): bool
    {
        return (bool) ($this->raw['featured'] ?? false);
    }

    /** @return array<int, array{id: int, src: string, alt: string}> */
    public function getGalleryAttribute(): array
    {
        return collect($this->raw['images'] ?? [])->map(fn ($i) => [
            'id' => $i['id'] ?? 0,
            'src' => $i['src'] ?? '',
            'alt' => $i['alt'] ?? '',
        ])->values()->all();
    }
}
