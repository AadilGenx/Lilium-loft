<?php

namespace App\Filament\Resources\WooWriteAudits;

use App\Filament\Concerns\ReadOnlyResource;
use App\Filament\Resources\WooWriteAudits\Pages\ListWooWriteAudits;
use App\Models\WooWriteAudit;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

/** Read-only history of every attempted change to WooCommerce. */
class WooWriteAuditResource extends Resource
{
    use ReadOnlyResource;

    protected static ?string $model = WooWriteAudit::class;

    protected static ?string $modelLabel = 'Change log entry';

    protected static ?string $navigationLabel = 'Change log';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClipboardDocumentList;

    protected static ?int $navigationSort = 91;

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->can_write;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('created_at')->label('When')->dateTime()->sortable(),
                TextColumn::make('user.name')->label('Who')->placeholder('—'),
                TextColumn::make('resource'),
                TextColumn::make('action'),
                TextColumn::make('woo_id')->label('Woo ID'),
                TextColumn::make('status')->badge()->color(fn (string $state) => match ($state) {
                    'success' => 'success',
                    'failed' => 'danger',
                    default => 'warning',
                }),
                TextColumn::make('request')->label('Sent')->formatStateUsing(fn ($state) => json_encode($state))->wrap()->limit(80),
                TextColumn::make('before')->label('Before')->formatStateUsing(fn ($state) => json_encode($state))->wrap()->limit(80),
                TextColumn::make('error')->limit(60)->placeholder('—'),
            ])
            ->defaultSort('id', 'desc');
    }

    public static function getPages(): array
    {
        return ['index' => ListWooWriteAudits::route('/')];
    }
}
