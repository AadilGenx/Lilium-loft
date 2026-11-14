<?php

namespace App\Filament\Resources\WooCategories\Pages;

use App\Filament\Resources\WooCategories\WooCategoryResource;
use Filament\Resources\Pages\ViewRecord;

class ViewWooCategory extends ViewRecord
{
    protected static string $resource = WooCategoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
        ];
    }
}
