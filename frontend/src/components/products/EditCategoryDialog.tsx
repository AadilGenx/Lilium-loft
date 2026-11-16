import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCategoryStore } from '@/store';
import { ProductCategory } from '@/types';
import { htmlToText } from '@/utils/html';
import { getErrorMessage } from '@/utils/errors';
import { toast } from 'sonner';

/** Edits a category in WooCommerce. Only the fields that were changed are sent. */
export function EditCategoryDialog({ category, onClose }: { category: ProductCategory | null; onClose: () => void }) {
  const updateCategory = useCategoryStore((s) => s.updateCategory);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);

  const startDescription = htmlToText(category?.description);

  useEffect(() => {
    if (!category) return;
    setName(category.name);
    setSlug(category.slug);
    setSlugEdited(false);
    setDescription(htmlToText(category.description));
    setImage(category.image ?? '');
    // Only when a different category is opened: background refreshes must not overwrite what is being typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    if (!name.trim()) {
      toast.error('Category name is required.');
      return;
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const changes: { name?: string; slug?: string; description?: string; image?: string } = {};
    if (name.trim() !== category.name) changes.name = name.trim();
    if (cleanSlug && cleanSlug !== category.slug) changes.slug = cleanSlug;
    if (description.trim() !== startDescription.trim()) changes.description = description.trim();
    if (image.trim() && image.trim() !== (category.image ?? '')) changes.image = image.trim();

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    setBusy(true);
    try {
      await updateCategory(category.id, changes);
      toast.success(`Category "${name.trim()}" updated.`);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={category !== null} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Edit category</DialogTitle>
          <DialogDescription className="text-xs">Changes are saved to WooCommerce.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Category Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Same as the create form: the slug follows the name, until the slug itself is edited by hand.
                if (!slugEdited) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Slug</label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value);
              }}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400">The slug is part of the category's web address; changing it changes that address.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Description</label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Image URL</label>
            <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." className="text-xs" />
            <p className="text-[11px] text-slate-400">
              Paste a new image address to replace the image. An existing image can be replaced here but not removed.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="bg-red-600 hover:bg-red-700 text-white">
              {busy ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
