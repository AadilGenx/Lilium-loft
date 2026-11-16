import { useEffect } from 'react';
import {
  syncApi,
  getStoredToken,
  ChangeCounters,
} from '@/services/api';
import {
  useProductStore,
  useOrderStore,
  useCustomerStore,
  useCategoryStore,
  useCouponStore,
  useUIStore,
  useBackendSyncStore,
} from '@/store';

/** How often the panel asks the backend whether anything changed (a few bytes per check). */
const POLL_MS = 3000;

/**
 * Keeps every screen current without a manual refresh.
 *
 * The backend raises a counter whenever WooCommerce changes something (webhook, import, or a change made
 * here). Every few seconds we read those counters and reload only the lists whose counter moved, so a
 * product created in WooCommerce shows up within a few seconds. It stays quiet while the tab is hidden
 * and catches up the moment the tab is visible again. Failures are ignored: the next check just tries again.
 */
export function useLiveUpdates() {
  useEffect(() => {
    let last: ChangeCounters | null = null;
    let inFlight = false;
    let stopped = false;

    const check = async () => {
      if (stopped || inFlight || document.hidden || !getStoredToken()) return;
      inFlight = true;
      try {
        const now = await syncApi.changes();
        const previous = last;
        last = now;
        // The first answer is only the starting point: the screens were just loaded.
        if (!previous) return;

        const changed = (k: keyof ChangeCounters) => now[k] !== previous[k];
        const jobs: Promise<unknown>[] = [];

        if (changed('products')) jobs.push(useProductStore.getState().fetchProducts({ silent: true }));
        if (changed('orders')) jobs.push(useOrderStore.getState().fetchOrders({ silent: true }));
        if (changed('customers')) jobs.push(useCustomerStore.getState().fetchCustomers({ silent: true }));
        if (changed('categories')) jobs.push(useCategoryStore.getState().fetchCategories({ silent: true }));
        if (changed('coupons')) jobs.push(useCouponStore.getState().fetchCoupons({ silent: true }));

        // Totals, charts, top products and alerts are computed from products and orders.
        if (changed('products') || changed('orders')) {
          jobs.push(useBackendSyncStore.getState().refreshDashboard());
          jobs.push(useUIStore.getState().fetchNotifications());
        }

        await Promise.allSettled(jobs);
      } catch {
        // Offline or a hiccup: keep the old baseline and try again on the next tick.
      } finally {
        inFlight = false;
      }
    };

    const timer = window.setInterval(check, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener('visibilitychange', onVisible);
    check();

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
