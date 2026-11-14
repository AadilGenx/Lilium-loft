<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WooCategory extends Model
{
    protected $table = 'woo_categories';

    protected $guarded = [];

    protected $hidden = ['pivot'];

    protected function casts(): array
    {
        return [

        ];
    }


    public function products(): BelongsToMany
    {
        return $this->belongsToMany(WooProduct::class, 'woo_category_product', 'category_woo_id', 'product_woo_id', 'woo_id', 'woo_id');
    }
}
