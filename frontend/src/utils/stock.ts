import { Product } from '@/types';

/** On sale only when both prices exist and the regular one is higher. */
export function isOnSale(p: Pick<Product, 'price' | 'regularPrice'>): boolean {
  return p.price !== undefined && p.regularPrice !== undefined && p.regularPrice > p.price;
}

export type StockState = 'out' | 'low' | 'in' | 'backorder';

/**
 * Stock state exactly as WooCommerce defines it:
 *  - the stock status WooCommerce reports always wins (out of stock / on backorder);
 *  - "low" uses WooCommerce's own low-stock level: the product's own, otherwise the store-wide one.
 * If WooCommerce has not told us a level, nothing is called "low": no number is ever guessed.
 */
export function stockState(
  p: Pick<Product, 'manageStock' | 'stockQuantity' | 'stockStatus' | 'lowStockAmount'>,
  storeLowStock?: number | null
): StockState {
  if (p.stockStatus === 'outofstock') return 'out';
  if (p.stockStatus === 'onbackorder') return 'backorder';

  const level = p.lowStockAmount ?? storeLowStock ?? undefined;
  if (p.manageStock && level !== undefined && p.stockQuantity <= level) return 'low';

  return 'in';
}
