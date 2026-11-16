import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  Pencil,
  Edit2,
  Tag,
  Package,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { MobileList, MobileRow, TableOnly } from '@/components/ui/mobile-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { useCategoryStore } from '@/store';
import { getErrorMessage } from '@/utils/errors';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { STICKY_COLUMN } from '@/utils/sticky';
import { EditCategoryDialog } from '@/components/products/EditCategoryDialog';
import { ProductCategory } from '@/types';
import { toast } from 'sonner';

export function CategoriesPage() {
  const { categories, isLoading, fetchCategories, createCategory, deleteCategory } = useCategoryStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ProductCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

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
      toast.error('Category name is required.');
      return;
    }

    const newSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : undefined;

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
    } catch (err) {
      toast.error(getErrorMessage(err));
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Product Categories
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Organize your WooCommerce merchandise hierarchy and department taxonomies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Add Category Form (4 cols) */}
        <div className={`lg:col-span-4 space-y-6 ${STICKY_COLUMN}`}>
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
                    }}
                  />
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
                  className="w-full bg-red-600 hover:bg-red-700 text-white gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Category</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Categories Table (8 cols) */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Existing Categories ({categories.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Taxonomy list synced with WooCommerce
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing || isLoading}
                className="h-8 gap-1.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing || isLoading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </Button>
            </CardHeader>
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
              ) : (
                <>
<MobileList>
  {categories.map((cat) => (
    <MobileRow key={cat.id}>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
          {cat.image ? (
            <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
          ) : (
            <FolderTree className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-800 truncate">{cat.name}</div>
          <div className="font-mono text-[11px] text-slate-400 truncate">{cat.slug}</div>
        </div>
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold text-xs border border-red-100 shrink-0">
          {cat.count}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCategoryToEdit(cat)}
          className="h-9 w-9 text-slate-400 hover:text-slate-700 shrink-0"
          title="Edit category"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCategoryToDelete({ id: cat.id, name: cat.name })}
          className="h-9 w-9 text-slate-400 hover:text-red-600 shrink-0"
          title="Remove category"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </MobileRow>
  ))}
</MobileList>
<TableOnly>
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
                    {categories.map((cat) => (
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
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCategoryToEdit(cat)}
                            className="h-8 w-8 text-slate-400 hover:text-slate-700"
                            title="Edit category"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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
</TableOnly>
</>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EditCategoryDialog category={categoryToEdit} onClose={() => setCategoryToEdit(null)} />

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

