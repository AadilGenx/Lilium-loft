import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  Tag,
  Package,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  RotateCcw,
  X,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterModal } from '@/components/ui/filter-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCategoryStore } from '@/store';
import { getErrorMessage } from '@/utils/errors';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { STICKY_COLUMN } from '@/utils/sticky';
import { toast } from 'sonner';

export function CategoriesPage() {
  const { categories, isLoading, fetchCategories, createCategory, deleteCategory } = useCategoryStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [nameError, setNameError] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<'all' | 'with-products' | 'empty'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'count-desc' | 'count-asc'>('name-asc');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const hasActiveFilters = Boolean(
    searchTerm.trim() || productFilter !== 'all' || sortBy !== 'name-asc'
  );

  const activeFilterCount =
    (searchTerm.trim() ? 1 : 0) +
    (productFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'name-asc' ? 1 : 0);

  const handleClearFilters = () => {
    setSearchTerm('');
    setProductFilter('all');
    setSortBy('name-asc');
  };

  const filteredCategories = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    let result = categories.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q);

      const matchesProduct =
        productFilter === 'all' ||
        (productFilter === 'with-products' && (c.count || 0) > 0) ||
        (productFilter === 'empty' && (c.count || 0) === 0);

      return matchesSearch && matchesProduct;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'count-desc') return (b.count || 0) - (a.count || 0);
      if (sortBy === 'count-asc') return (a.count || 0) - (b.count || 0);
      return 0;
    });

    return result;
  }, [categories, searchTerm, productFilter, sortBy]);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [fetchCategories, categories.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCategories();
      toast.success('Categories synced from WooCommerce.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Category name is required.');
      return;
    }
    setNameError('');

    const newSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : undefined;

    setSubmitting(true);
    try {
      await createCategory({
        name: name.trim(),
        slug: newSlug,
        description: description.trim() || undefined,
        image: imageUrl.trim() || undefined,
      });
      toast.success(`Category "${name.trim()}" added successfully.`);
      setName('');
      setSlug('');
      setDescription('');
      setImageUrl('');
      setNameError('');
      setAddModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, catName: string) => {
    try {
      await deleteCategory(id);
      toast.success(`Category "${catName}" removed.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Product Categories
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Organize your WooCommerce merchandise hierarchy and department taxonomies.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Mobile & Tablet Add Category button */}
          <Button
            onClick={() => setAddModalOpen(true)}
            size="sm"
            className="lg:hidden flex-1 sm:flex-none gap-1.5 bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex-1 sm:flex-none gap-1.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200 bg-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing || isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync WooCommerce</span>
            <span className="sm:hidden">Sync</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Add Category Form (4 cols on desktop only) */}
        <div className={`hidden lg:block lg:col-span-4 space-y-6 ${STICKY_COLUMN}`}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Add New Category
              </CardTitle>
              <CardDescription className="text-xs">
                Create a department or catalog grouping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Footwear & Boots"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      if (nameError) setNameError('');
                    }}
                    className={nameError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {nameError && (
                    <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{nameError}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Slug
                  </label>
                  <Input
                    placeholder="e.g. footwear-boots"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  <span className="text-[11px] text-slate-400">
                    The “slug” is the URL-friendly version of the name.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Thumbnail Image URL
                  </label>
                  <Input
                    placeholder="https://"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Description
                  </label>
                  <Textarea
                    placeholder="Optional category description shown on category archive..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add New Category</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Categories Table (full width on mobile/tablet, 8 cols on desktop) */}
        <div className="col-span-1 lg:col-span-8">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold">
                Existing Categories ({filteredCategories.length}
                {filteredCategories.length !== categories.length ? ` of ${categories.length}` : ''})
              </CardTitle>
              <CardDescription className="text-xs">
                Taxonomy list synced with WooCommerce
              </CardDescription>
            </CardHeader>

            {/* Search & Filter Bar */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/40">
              {/* Mobile & Tablet: Search + Filter button + Clear button */}
              <div className="flex sm:hidden items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-8 bg-white text-xs sm:text-sm h-9"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <Button
                  type="button"
                  variant={activeFilterCount > 0 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterModalOpen(true)}
                  className={`h-9 px-3 gap-1.5 shrink-0 ${
                    activeFilterCount > 0
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-xs font-medium">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-600 text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-9 px-2 text-slate-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    title="Clear all filters"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Desktop & Tablet: Search + Product Count Filter + Sort + Clear button */}
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, slug or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-8 bg-white text-xs h-9"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="w-36">
                  <Select
                    value={productFilter}
                    onValueChange={(val: 'all' | 'with-products' | 'empty') => setProductFilter(val)}
                  >
                    <SelectTrigger className="bg-white text-xs h-9">
                      <SelectValue placeholder="Products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="with-products">Has Products</SelectItem>
                      <SelectItem value="empty">No Products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-36">
                  <Select
                    value={sortBy}
                    onValueChange={(val: 'name-asc' | 'name-desc' | 'count-desc' | 'count-asc') => setSortBy(val)}
                  >
                    <SelectTrigger className="bg-white text-xs h-9">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="count-desc">Most Products</SelectItem>
                      <SelectItem value="count-asc">Least Products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-9 px-2.5 text-xs text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 shrink-0 gap-1 bg-white"
                    title="Clear all filters"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Clear</span>
                  </Button>
                )}
              </div>
            </div>

            <CardContent className="p-0">
              {isLoading && categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-red-600" />
                  <p className="text-xs">Loading categories from WooCommerce...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={FolderTree}
                    title="No categories found"
                    description="No categories have been synced from WooCommerce yet."
                    actionLabel="Fetch Categories"
                    onAction={handleRefresh}
                  />
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-8 text-center">
                  <EmptyState
                    icon={FolderTree}
                    title="No matching categories"
                    description="No categories match your search and filter criteria."
                    actionLabel="Clear Filters"
                    onAction={handleClearFilters}
                  />
                </div>
              ) : (
                <>
                  {/* Mobile & Tablet Card View (< lg) */}
                  <div className="lg:hidden p-3 sm:p-4 space-y-3 bg-slate-50/40">
                    {filteredCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-white shadow-sm hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                              {cat.image ? (
                                <img
                                  src={cat.image}
                                  alt={cat.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-400">
                                  <FolderTree className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-slate-900 text-sm">
                                {cat.name}
                              </h4>
                              {cat.description && (
                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                  {cat.description}
                                </p>
                              )}
                              <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                                /{cat.slug}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold text-xs border border-red-100">
                              {cat.count} {cat.count === 1 ? 'item' : 'items'}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCategoryToDelete({ id: cat.id, name: cat.name })}
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              title="Remove category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (lg and above) */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-14">Image</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead className="text-center">Products</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCategories.map((cat) => (
                          <TableRow key={cat.id}>
                            <TableCell>
                              <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                {cat.image ? (
                                  <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      // Fallback to icon if remote image is blocked or broken
                                      (e.currentTarget as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-slate-400">
                                    <FolderTree className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-slate-800">
                              {cat.name}
                              {cat.description && (
                                <span className="block text-xs font-normal text-slate-500 line-clamp-1">
                                  {cat.description}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-500">
                              {cat.slug}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold text-xs border border-red-100">
                                {cat.count}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCategoryToDelete({ id: cat.id, name: cat.name })}
                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                title="Remove category"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile/Tablet Filter Modal */}
      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        title="Filter Categories"
        activeCount={activeFilterCount}
        onClear={handleClearFilters}
      >
        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Search Query</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Category name, slug or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Product Content</label>
            <Select
              value={productFilter}
              onValueChange={(val: 'all' | 'with-products' | 'empty') => setProductFilter(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="with-products">Has Products</SelectItem>
                <SelectItem value="empty">No Products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Sort Order</label>
            <Select
              value={sortBy}
              onValueChange={(val: 'name-asc' | 'name-desc' | 'count-desc' | 'count-asc') => setSortBy(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="count-desc">Most Products</SelectItem>
                <SelectItem value="count-asc">Least Products</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterModal>

      {/* Mobile & Tablet Add Category Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Add New Category
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a department or catalog grouping synced with WooCommerce
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCategory} className="space-y-4 p-5 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Category Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Footwear & Boots"
                value={name}
                autoFocus
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  if (nameError) setNameError('');
                }}
                className={nameError ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {nameError && (
                <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{nameError}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Slug
              </label>
              <Input
                placeholder="e.g. footwear-boots"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <span className="text-[11px] text-slate-400">
                The “slug” is the URL-friendly version of the name.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Thumbnail Image URL
              </label>
              <Input
                placeholder="https://"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Description
              </label>
              <Textarea
                placeholder="Optional category description shown on category archive..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5 text-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New Category</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={categoryToDelete !== null}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Delete category permanently"
        description={`Delete "${categoryToDelete?.name}" from WooCommerce? Categories have no trash, so this cannot be undone. Products in it are kept.`}
        confirmLabel="Delete category"
        onConfirm={async () => {
          if (!categoryToDelete) return;
          await handleDeleteCategory(categoryToDelete.id, categoryToDelete.name);
          setCategoryToDelete(null);
        }}
      />
    </div>
  );
}

