// Nothing in here assumes a currency or a country. The currency comes from the backend (the store's own
// orders) and numbers and dates follow the visitor's browser locale.

/** The store's currency, set once the backend has told us (see the dashboard summary). */
let displayCurrency: string | null = null;

export function setDisplayCurrency(code: string | null | undefined): void {
  displayCurrency = code || null;
}

/** The symbol for a currency code (for labels such as "Price (₹)"), or '' when the currency is unknown. */
export function currencySymbol(code: string | null | undefined = displayCurrency): string {
  if (!code) return '';
  try {
    const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? code;
  } catch {
    return code;
  }
}

const TWO_DECIMALS = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/**
 * Formats money in the given currency, or the store's. When no currency is known yet,
 * only the number is shown: no symbol is ever guessed.
 */
export function formatCurrency(amount: number, currency?: string | null): string {
  const code = currency || displayCurrency;
  if (!code) return new Intl.NumberFormat(undefined, TWO_DECIMALS).format(amount);

  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, ...TWO_DECIMALS }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(undefined, TWO_DECIMALS).format(amount)} ${code}`;
  }
}

/** Like formatCurrency, but a missing amount shows as a dash instead of a made-up zero. */
export function formatMoney(amount: number | null | undefined, currency?: string | null): string {
  return amount === null || amount === undefined ? '—' : formatCurrency(amount, currency);
}

export function formatDate(dateString: string | Date): string {
  if (!dateString) return '-';
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return '-';
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat(undefined).format(num);
}
