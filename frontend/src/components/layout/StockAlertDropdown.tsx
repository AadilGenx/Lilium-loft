import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageX, Package, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useProductStore, useBackendSyncStore } from '@/store';
import { useStockState } from '@/hooks/useStockState';
import { Product } from '@/types';

type Alert = { product: Product; kind: 'out' | 'low'; level?: number };

/**
 * A separate alert button for stock problems: published products that are out of stock, or at/below
 * WooCommerce's low-stock level. While there is anything to report the icon shakes and pulses so it
 * cannot be missed. It is computed from the product list, so it updates by itself when WooCommerce changes.
 */
export function StockAlertDropdown() {
  const navigate = useNavigate();
  const products = useProductStore((s) => s.products);
  const storeLevel = useBackendSyncStore((s) => s.summary?.low_stock_threshold ?? null);
  const stockOf = useStockState();

  const alerts = useMemo<Alert[]>(() => {
    const list: Alert[] = [];
    for (const product of products) {
      // Drafts and private products are not being sold, so their stock is not an alert.
      if (product.status !== 'publish') continue;
      const state = stockOf(product);
      if (state === 'out') list.push({ product, kind: 'out' });
      else if (state === 'low') list.push({ product, kind: 'low', level: product.lowStockAmount ?? storeLevel ?? undefined });
    }
    // Out of stock first, then the lowest quantities.
    return list.sort((a, b) =>
      a.kind !== b.kind ? (a.kind === 'out' ? -1 : 1) : a.product.stockQuantity - b.product.stockQuantity
    );
  }, [products, stockOf, storeLevel]);

  const outCount = alerts.filter((a) => a.kind === 'out').length;
  const lowCount = alerts.length - outCount;
  const hasAlerts = alerts.length > 0;
  // Red when something is completely out of stock, amber when it is only running low.
  const tone = outCount > 0 ? 'red' : 'amber';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={hasAlerts ? `${alerts.length} stock alert${alerts.length === 1 ? '' : 's'}` : 'No stock alerts'}
          className={`relative ${
            hasAlerts
              ? tone === 'red'
                ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
                : 'text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PackageX className={`h-5 w-5 ${hasAlerts ? 'stock-alert-shake' : ''}`} />
          {hasAlerts && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center">
              <span
                className={`motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${
                  tone === 'red' ? 'bg-red-500' : 'bg-amber-500'
                }`}
              />
              <span
                className={`relative inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                  tone === 'red' ? 'bg-red-600' : 'bg-amber-500'
                }`}
              >
                {alerts.length}
              </span>
            </span>
          )}
          <span className="sr-only">Stock alerts</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" collisionPadding={8} className="w-80 max-w-[calc(100vw-1rem)] p-0">
        <div className="p-3 border-b border-slate-100">
          <div className="text-sm font-semibold text-slate-800">Stock alerts</div>
          <div className="text-xs text-slate-500">
            {hasAlerts
              ? `${outCount} out of stock · ${lowCount} low stock`
              : 'Nothing is out of stock or running low.'}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
          {!hasAlerts ? (
            <div className="p-4 text-center text-xs text-slate-400">No stock alerts</div>
          ) : (
            alerts.map(({ product, kind, level }) => (
              <button
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="h-9 w-9 rounded-md bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                  {product.images[0] ? (
                    <img src={product.images[0].src} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{product.name}</p>
                  {(product.sku || (kind === 'low' && level !== undefined)) && (
                    <p className="text-[11px] text-slate-400 truncate">
                      {[product.sku && `SKU ${product.sku}`, kind === 'low' && level !== undefined && `alert level ${level}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-bold ${
                    kind === 'out' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {kind === 'out' ? 'Out of stock' : `${product.stockQuantity} left`}
                </span>
              </button>
            ))
          )}
        </div>

        {storeLevel === null && (
          <div className="px-3 py-2 text-[11px] text-slate-400 border-t border-slate-100">
            WooCommerce's low-stock level has not been read yet, so only out-of-stock products and
            products with their own level are listed. Click Sync to read it.
          </div>
        )}

        <DropdownMenuSeparator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-slate-600 hover:text-red-600 h-8 gap-1.5"
            onClick={() => navigate('/inventory?filter=alerts')}
          >
            <span>View inventory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
