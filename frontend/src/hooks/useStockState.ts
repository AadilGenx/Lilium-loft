import { useCallback } from 'react';
import { useBackendSyncStore } from '@/store';
import { Product } from '@/types';
import { stockState, StockState } from '@/utils/stock';

/** Returns a function that gives a product's stock state using WooCommerce's own low-stock level. */
export function useStockState(): (p: Product) => StockState {
  const storeLowStock = useBackendSyncStore((s) => s.summary?.low_stock_threshold ?? null);
  return useCallback((p: Product) => stockState(p, storeLowStock), [storeLowStock]);
}
