<?php

namespace App\Filament\Resources\WriteSettings;

use App\Filament\Concerns\ReadOnlyResource;
use App\Filament\Resources\WriteSettings\Pages\ListWriteSettings;
use App\Models\WriteSetting;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Table;

/**
 * Switches that control whether the API may change WooCommerce.
 * Visible only to users granted write permission (users.can_write).
 */
class WriteSettingResource extends Resource
{
    use ReadOnlyResource;

    protected static ?string $model = WriteSetting::class;

    protected static ?string $modelLabel = 'Write switch';

    protected static ?string $navigationLabel = 'Write controls';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedShieldCheck;

    protected static ?int $navigationSort = 90;

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->can_write;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->heading('Write controls')
            ->description('The master switch and the switches below decide what the API may change in the live store. The same switches are in the web app under Settings → Store changes.')
            ->columns([
                TextColumn::make('label')->label('Feature'),
                ToggleColumn::make('enabled')->label('Enabled')
                    ->disabled(fn () => ! auth()->user()?->can_write),
            ])
            ->defaultSort('id')
            ->paginated(false);
    }

    public static function getPages(): array
    {
        return ['index' => ListWriteSettings::route('/')];
    }
}
