<?php

namespace App\Filament\Resources\WooCategories\Pages;

use App\Filament\Resources\WooCategories\WooCategoryResource;
use Filament\Resources\Pages\ListRecords;

class ListWooCategories extends ListRecords
{
    protected static string $resource = WooCategoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
        ];
    }
}
