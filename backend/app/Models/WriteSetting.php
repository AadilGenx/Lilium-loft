<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * On/off switches for write features. A missing row counts as OFF.
 * Deliberately not cached: switching something off must take effect immediately.
 */
class WriteSetting extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['enabled' => 'boolean'];
    }

    public static function isOn(string $key): bool
    {
        return (bool) static::query()->where('key', $key)->value('enabled');
    }

    /** True only when the master switch ("Allow changes to the store", set in the web app) is on. */
    public static function writesOpen(): bool
    {
        return static::isOn('master');
    }
}
