<?php

namespace App\Filament\Resources\WooProducts\Pages;

use App\Filament\Resources\WooProducts\WooProductResource;
use Filament\Resources\Pages\ViewRecord;

class ViewWooProduct extends ViewRecord
{
    protected static string $resource = WooProductResource::class;

    protected function getHeaderActions(): array
    {
        return [
        ];
    }
}
