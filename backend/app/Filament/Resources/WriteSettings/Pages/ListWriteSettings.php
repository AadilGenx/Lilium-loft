<?php

namespace App\Filament\Resources\WriteSettings\Pages;

use App\Filament\Resources\WriteSettings\WriteSettingResource;
use Filament\Resources\Pages\ListRecords;

class ListWriteSettings extends ListRecords
{
    protected static string $resource = WriteSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}
