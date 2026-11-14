<?php

namespace App\Filament\Resources\WooCategories;

use App\Filament\Concerns\ReadOnlyResource;
use App\Filament\Resources\WooCategories\Pages\ListWooCategories;
use App\Filament\Resources\WooCategories\Pages\ViewWooCategory;
use App\Models\WooCategory;
use BackedEnum;
use Filament\Actions\ViewAction;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class WooCategoryResource extends Resource
{
    use ReadOnlyResource;

    protected static ?string $model = WooCategory::class;

    protected static ?string $modelLabel = 'Category';

    protected static ?string $pluralModelLabel = 'Categories';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTag;

    protected static ?int $navigationSort = 5;

    public static function infolist(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Category')->columns(3)->schema([
                TextEntry::make('name'),
                TextEntry::make('slug'),
                TextEntry::make('products_count')->label('Products'),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('name')
            ->columns([
                ImageColumn::make('image_url')->label('')->square(),
                TextColumn::make('name')->searchable()->sortable(),
                TextColumn::make('slug'),
                TextColumn::make('products_count')->label('Products')->sortable(),
            ])
            ->recordActions([ViewAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListWooCategories::route('/'),
            'view' => ViewWooCategory::route('/{record}'),
        ];
    }
}
