<?php

namespace App\Filament\Resources\WooProducts;

use App\Filament\Resources\WooProducts\Pages\ListWooProducts;
use App\Filament\Resources\WooProducts\Pages\ViewWooProduct;
use App\Models\WooProduct;
use BackedEnum;
use Filament\Actions\ViewAction;
use Filament\Infolists\Components\ImageEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class WooProductResource extends Resource
{
    protected static ?string $model = WooProduct::class;

    protected static ?string $modelLabel = 'Product';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCube;

    protected static ?int $navigationSort = 2;

    protected static ?string $recordTitleAttribute = 'name';

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    public static function canDeleteAny(): bool
    {
        return false;
    }

    private static function stockColor(?string $s): string
    {
        return match ($s) {
            'instock' => 'success',
            'outofstock' => 'danger',
            default => 'warning',
        };
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Product')->columns(4)->schema([
                ImageEntry::make('image_url')->label('Image')->columnSpan(1),
                TextEntry::make('name')->columnSpan(3)->weight('bold'),
                TextEntry::make('sku')->placeholder('-'),
                TextEntry::make('type')->badge(),
                TextEntry::make('status')->badge(),
                TextEntry::make('categories.name')->badge()->label('Categories'),
            ]),
            Section::make('Pricing & stock')->columns(4)->schema([
                TextEntry::make('regular_price')->money('INR')->placeholder('-'),
                TextEntry::make('sale_price')->money('INR')->placeholder('-'),
                TextEntry::make('stock_status')->badge()->color(fn ($state) => self::stockColor($state)),
                TextEntry::make('stock_quantity')->placeholder('Not tracked'),
                TextEntry::make('total_sales'),
                TextEntry::make('average_rating'),
                TextEntry::make('rating_count'),
                TextEntry::make('woo_modified_at')->label('Last modified')->dateTime(),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('woo_modified_at', 'desc')
            ->columns([
                ImageColumn::make('image_url')->label('')->square(),
                TextColumn::make('name')->searchable()->sortable()->wrap()->limit(60),
                TextColumn::make('sku')->searchable()->toggleable()->placeholder('-'),
                TextColumn::make('categories.name')->badge()->label('Categories'),
                TextColumn::make('price')->money('INR')->sortable(),
                TextColumn::make('stock_status')->badge()->color(fn ($state) => self::stockColor($state))->sortable(),
                TextColumn::make('stock_quantity')->label('Qty')->sortable()->placeholder('-'),
                TextColumn::make('total_sales')->label('Sold')->sortable(),
                TextColumn::make('status')->badge()->toggleable(),
            ])
            ->filters([
                SelectFilter::make('stock_status')->options([
                    'instock' => 'In stock', 'outofstock' => 'Out of stock', 'onbackorder' => 'On backorder',
                ]),
                SelectFilter::make('status')->options(fn () => WooProduct::query()->distinct()->pluck('status', 'status')->all()),
                SelectFilter::make('category')->label('Category')->relationship('categories', 'name'),
            ])
            ->recordActions([ViewAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListWooProducts::route('/'),
            'view' => ViewWooProduct::route('/{record}'),
        ];
    }
}
