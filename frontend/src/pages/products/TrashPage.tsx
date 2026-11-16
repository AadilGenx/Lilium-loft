import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobileList, MobileRow, TableOnly } from '@/components/ui/mobile-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/page-loading';
import { ProductStatusBadge } from '@/components/products/ProductStatusBadge';
import { productsApi, type BackendTrashedProduct } from '@/services/api/endpoints';
import { useProductStore } from '@/store';
import { formatDateTime, formatMoney } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import { toast } from 'sonner';

type Status = 'publish' | 'draft' | 'pending' | 'private';

const price = (p: BackendTrashedProduct) => {
  const value = p.price ?? p.regular_price;
  return value === null ? '—' : formatMoney(Number(value));
};

/** Products moved to the WooCommerce trash. Read live from WooCommerce; restoring brings back the status they had. */
export function TrashPage() {
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const [items, setItems] = useState<BackendTrashedProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [target, setTarget] = useState<BackendTrashedProduct | null>(null);
  const [chosen, setChosen] = useState<Status | ''>('');
  const [restoring, setRestoring] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await productsApi.trash();
      setItems(res.data);
      setLoadFailed(false);
    } catch (err) {
      console.warn('Failed to load the trash:', err);
      setLoadFailed(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openRestore = (p: BackendTrashedProduct) => {
    setTarget(p);
    setChosen('');
  };

  const confirmRestore = async () => {
    if (!target) return;
    const status = target.previous_status ?? (chosen || undefined);
    if (!status) return;
    setRestoring(true);
    try {
      await productsApi.restore(target.woo_id, target.previous_status ? undefined : status);
      toast.success(`Product "${target.name}" restored.`);
      setItems((prev) => prev.filter((i) => i.woo_id !== target.woo_id));
      setTarget(null);
      fetchProducts({ silent: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-9 w-9 bg-white shrink-0">
            <Link to="/products" aria-label="Back to products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Trash</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Products moved to the WooCommerce trash. Restoring one puts it back as it was.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing} className="gap-1.5 bg-white w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {!loaded ? (
        <PageLoading />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title={loadFailed ? 'The trash could not be loaded' : 'The trash is empty'}
          description={
            loadFailed
              ? 'Try again in a moment.'
              : 'Products you move to the trash show up here until they are restored or removed in WooCommerce.'
          }
          actionLabel={loadFailed ? 'Try again' : undefined}
          onAction={loadFailed ? refresh : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <MobileList>
              {items.map((p) => (
                <MobileRow key={p.woo_id}>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 line-clamp-2">{p.name}</div>
                      {p.sku && <div className="text-xs text-slate-400 truncate">SKU {p.sku}</div>}
                    </div>
                    <span className="font-semibold text-slate-900 text-sm shrink-0">{price(p)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.previous_status ? (
                      <ProductStatusBadge status={p.previous_status} />
                    ) : (
                      <Badge variant="outline" className="whitespace-nowrap">Status unknown</Badge>
                    )}
                    {p.trashed_at && <span className="text-xs text-slate-400">{formatDateTime(p.trashed_at)}</span>}
                    <Button size="sm" variant="outline" onClick={() => openRestore(p)} className="ml-auto gap-1.5 bg-white">
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restore</span>
                    </Button>
                  </div>
                </MobileRow>
              ))}
            </MobileList>

            <TableOnly>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden lg:table-cell">Categories</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status before trash</TableHead>
                    <TableHead className="hidden lg:table-cell">Trashed</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p) => (
                    <TableRow key={p.woo_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate max-w-xs">{p.name}</div>
                            {p.sku && <div className="text-xs font-mono text-slate-400">{p.sku}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-slate-600">{p.categories.join(', ')}</TableCell>
                      <TableCell className="font-medium text-slate-900">{price(p)}</TableCell>
                      <TableCell>
                        {p.previous_status ? (
                          <ProductStatusBadge status={p.previous_status} />
                        ) : (
                          <Badge variant="outline" className="whitespace-nowrap">Unknown</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                        {p.trashed_at ? formatDateTime(p.trashed_at) : ''}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openRestore(p)} className="gap-1.5 bg-white">
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableOnly>
          </CardContent>
        </Card>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore product</DialogTitle>
            <DialogDescription>
              {target?.previous_status
                ? `"${target.name}" will be restored exactly as it was: its status goes back to what it was before it was trashed.`
                : `"${target?.name}" was moved to the trash outside this app, so its earlier status is not known. Choose the status to restore it with.`}
            </DialogDescription>
          </DialogHeader>

          {target && !target.previous_status && (
            <Select value={chosen} onValueChange={(v) => setChosen(v as Status)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publish">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTarget(null)} disabled={restoring}>
              Cancel
            </Button>
            <Button
              onClick={confirmRestore}
              disabled={restoring || (!target?.previous_status && !chosen)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {restoring ? 'Restoring...' : 'Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
