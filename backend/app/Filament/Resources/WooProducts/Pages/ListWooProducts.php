<?php

namespace App\Filament\Resources\WooProducts\Pages;

use App\Filament\Resources\WooProducts\WooProductResource;
use Filament\Resources\Pages\ListRecords;

class ListWooProducts extends ListRecords
{
    protected static string $resource = WooProductResource::class;

    protected function getHeaderActions(): array
    {
        return [
        ];
    }
}
