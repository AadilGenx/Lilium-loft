import { useBackendSyncStore } from '@/store';
import { currencySymbol } from '@/utils/formatters';

/**
 * The store's currency symbol for form labels, e.g. " (₹)" (with the leading space), or '' when the
 * currency is not known. Updates when the backend reports the currency.
 */
export function useCurrencyLabel(): string {
  const code = useBackendSyncStore((s) => s.summary?.currency ?? null);
  const symbol = currencySymbol(code);
  return symbol ? ` (${symbol})` : '';
}
