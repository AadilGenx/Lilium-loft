import { Product } from '@/types';

/** Matches the backend's default low-stock threshold (WOO_LOW_STOCK_THRESHOLD). */
export const LOW_STOCK_THRESHOLD = 5;

export type StockState = 'out' | 'low' | 'in';

/**
 * Stock state from what WooCommerce reports: the stock status always counts,
 * and the quantity only counts when the product actually tracks stock.
 */
export function stockState(p: Pick<Product, 'manageStock' | 'stockQuantity' | 'stockStatus'>): StockState {
  if (p.stockStatus === 'outofstock') return 'out';
  if (p.manageStock && p.stockQuantity <= 0) return 'out';
  if (p.manageStock && p.stockQuantity <= LOW_STOCK_THRESHOLD) return 'low';
  return 'in';
}
