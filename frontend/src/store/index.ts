import { create } from 'zustand';
import {
  Product,
  Order,
  Customer,
  Coupon,
  ShippingZone,
  PaymentGateway,
  Transaction,
  SettingsState,
  OrderStatus,
  ShippingMethod,
  ProductCategory,
} from '@/types';
import { initialSettings } from '@/services/defaultSettings';
import {
  authApi,
  productsApi,
  ordersApi,
  customersApi,
  categoriesApi,
  couponsApi,
  dashboardApi,
  mapBackendProduct,
  mapBackendOrder,
  mapBackendCustomer,
  mapBackendCategory,
  mapBackendCoupon,
  BackendDashboardSummary,
  BackendRevenuePoint,
  BackendTopProduct,
  getStoredToken,
} from '@/services/api';

// Helper for local storage with mock-cleanup check
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(`lilium_${key}`);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    // If cached data contains legacy mock items, clear it so API data takes precedence
    if (
      Array.isArray(parsed) &&
      parsed.some(
        (x: any) =>
          String(x?.id || '').startsWith('prod-10') ||
          String(x?.id || '').startsWith('ord-100') ||
          String(x?.id || '').startsWith('cust-100') ||
          String(x?.id || '').startsWith('cat-') ||
          String(x?.id || '').startsWith('coup-')
      )
    ) {
      localStorage.removeItem(`lilium_${key}`);
      return defaultValue;
    }
    return parsed;
  } catch (e) {
    console.error('Error loading from storage', e);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(`lilium_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to storage', e);
  }
};

const defaultShippingZones: ShippingZone[] = [
  {
    id: 'zone-1',
    name: 'India Domestic',
    regions: ['India (All states)'],
    methods: [
      { id: 'm-1', title: 'Standard Delivery', type: 'flat_rate', cost: 100, enabled: true, taxStatus: 'none' },
      { id: 'm-2', title: 'Free Shipping', type: 'free_shipping', cost: 0, enabled: true, taxStatus: 'none' },
    ],
  },
];

const defaultPaymentGateways: PaymentGateway[] = [
  {
    id: 'phonepe',
    title: 'PhonePe Payment Solutions',
    description: 'Accept UPI, Cards, NetBanking via PhonePe',
    enabled: true,
    methodTitle: 'PhonePe',
    methodDescription: 'Pay with UPI, PhonePe or Cards',
  },
  {
    id: 'razorpay',
    title: 'Razorpay',
    description: 'Credit Cards, Debit Cards, UPI, NetBanking',
    enabled: true,
    methodTitle: 'Razorpay',
    methodDescription: 'Cards, NetBanking, Wallets & UPI',
  },
  {
    id: 'cod',
    title: 'Cash on Delivery',
    description: 'Pay with cash upon delivery',
    enabled: true,
    methodTitle: 'Cash on Delivery',
    methodDescription: 'Pay with cash upon delivery',
  },
];

// ================= PRODUCT STORE =================
interface ProductStore {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, quantity: number, type: 'set' | 'add' | 'subtract') => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: loadFromStorage<Product[]>('products', []),
  isLoading: false,
  error: null,
  setProducts: (products) => {
    set({ products });
    saveToStorage('products', products);
  },
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await productsApi.list({ per_page: 100 });
      if (res.data) {
        const mapped = res.data.map(mapBackendProduct);
        set({ products: mapped, isLoading: false });
        saveToStorage('products', mapped);
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      console.warn('Failed to fetch products from backend API:', err);
      set({ isLoading: false, error: err?.message || 'Failed to fetch products' });
    }
  },
  addProduct: (newProd) => {
    const now = new Date().toISOString();
    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [product, ...get().products];
    set({ products: updated });
    saveToStorage('products', updated);
    return product;
  },
  updateProduct: (id, updates) => {
    const updated = get().products.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    set({ products: updated });
    saveToStorage('products', updated);
  },
  deleteProduct: (id) => {
    const updated = get().products.filter((p) => p.id !== id);
    set({ products: updated });
    saveToStorage('products', updated);
  },
  adjustStock: (id, quantity, type) => {
    const updated = get().products.map((p) => {
      if (p.id !== id) return p;
      let newQty = p.stockQuantity;
      if (type === 'set') newQty = quantity;
      else if (type === 'add') newQty += quantity;
      else if (type === 'subtract') newQty = Math.max(0, newQty - quantity);

      const stockStatus = newQty > 0 ? 'instock' : 'outofstock';
      return {
        ...p,
        stockQuantity: newQty,
        stockStatus: stockStatus as Product['stockStatus'],
        updatedAt: new Date().toISOString(),
      };
    });
    set({ products: updated });
    saveToStorage('products', updated);
  },
}));

// ================= ORDER STORE =================
interface OrderStore {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  setOrders: (orders: Order[]) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  addOrderNote: (orderId: string, content: string, isCustomerNote: boolean) => void;
  refundOrder: (orderId: string, amount: number, reason: string) => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: loadFromStorage<Order[]>('orders', []),
  isLoading: false,
  error: null,
  setOrders: (orders) => {
    set({ orders });
    saveToStorage('orders', orders);
  },
  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await ordersApi.list({ per_page: 100, with_items: 1 });
      if (res.data) {
        const mapped = res.data.map(mapBackendOrder);
        set({ orders: mapped, isLoading: false });
        saveToStorage('orders', mapped);

        // Derive live payment transactions from real orders
        const mappedTransactions: Transaction[] = mapped.map((o) => ({
          id: `tx-${o.id}`,
          orderId: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          amount: o.total,
          currency: 'INR',
          status:
            o.status === 'completed'
              ? 'completed'
              : o.status === 'refunded'
              ? 'refunded'
              : 'pending',
          paymentMethod: o.paymentMethodTitle || o.paymentMethod,
          date: o.dateCreated,
          transactionReference: o.transactionId || `TX-${o.orderNumber}`,
        }));
        usePaymentStore.setState({ transactions: mappedTransactions });
        saveToStorage('transactions', mappedTransactions);
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      console.warn('Failed to fetch orders from backend API:', err);
      set({ isLoading: false, error: err?.message || 'Failed to fetch orders' });
    }
  },
  updateOrderStatus: (id, status) => {
    const updated = get().orders.map((o) => {
      if (o.id !== id) return o;
      const newNotes = [
        ...o.notes,
        {
          id: `note-${Date.now()}`,
          content: `Order status updated to ${status}.`,
          date: new Date().toISOString(),
          author: 'Admin',
          isCustomerNote: false,
        },
      ];
      return { ...o, status, notes: newNotes };
    });
    set({ orders: updated });
    saveToStorage('orders', updated);
  },
  addOrderNote: (orderId, content, isCustomerNote) => {
    const updated = get().orders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        notes: [
          ...o.notes,
          {
            id: `note-${Date.now()}`,
            content,
            date: new Date().toISOString(),
            author: isCustomerNote ? 'Customer' : 'Admin',
            isCustomerNote,
          },
        ],
      };
    });
    set({ orders: updated });
    saveToStorage('orders', updated);
  },
  refundOrder: (orderId, amount, reason) => {
    const updated = get().orders.map((o) => {
      if (o.id !== orderId) return o;
      const newRefunds = [
        ...o.refunds,
        {
          id: `ref-${Date.now()}`,
          amount,
          reason,
          date: new Date().toISOString(),
        },
      ];
      const totalRefunded = newRefunds.reduce((sum, r) => sum + r.amount, 0);
      const isFullRefund = totalRefunded >= o.total;

      return {
        ...o,
        status: isFullRefund ? ('refunded' as OrderStatus) : o.status,
        refunds: newRefunds,
        notes: [
          ...o.notes,
          {
            id: `note-${Date.now()}`,
            content: `Processed refund of ₹${amount.toFixed(2)}. Reason: ${reason}`,
            date: new Date().toISOString(),
            author: 'Admin',
            isCustomerNote: false,
          },
        ],
      };
    });
    set({ orders: updated });
    saveToStorage('orders', updated);
  },
}));

// ================= CUSTOMER STORE =================
interface CustomerStore {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'registeredDate' | 'totalOrders' | 'totalSpent'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: loadFromStorage<Customer[]>('customers', []),
  isLoading: false,
  error: null,
  setCustomers: (customers) => {
    set({ customers });
    saveToStorage('customers', customers);
  },
  fetchCustomers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await customersApi.list({ per_page: 100 });
      if (res.data) {
        const mapped = res.data.map(mapBackendCustomer);
        set({ customers: mapped, isLoading: false });
        saveToStorage('customers', mapped);
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      console.warn('Failed to fetch customers from backend API:', err);
      set({ isLoading: false, error: err?.message || 'Failed to fetch customers' });
    }
  },
  addCustomer: (newCust) => {
    const cust: Customer = {
      ...newCust,
      id: `cust-${Date.now()}`,
      registeredDate: new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0,
    };
    const updated = [cust, ...get().customers];
    set({ customers: updated });
    saveToStorage('customers', updated);
    return cust;
  },
  updateCustomer: (id, updates) => {
    const updated = get().customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    set({ customers: updated });
    saveToStorage('customers', updated);
  },
  deleteCustomer: (id) => {
    const updated = get().customers.filter((c) => c.id !== id);
    set({ customers: updated });
    saveToStorage('customers', updated);
  },
}));

// ================= CATEGORY STORE =================
interface CategoryStore {
  categories: ProductCategory[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  setCategories: (categories: ProductCategory[]) => void;
  addCategory: (category: ProductCategory) => void;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: loadFromStorage<ProductCategory[]>('categories', []),
  isLoading: false,
  error: null,
  setCategories: (categories) => {
    set({ categories });
    saveToStorage('categories', categories);
  },
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await categoriesApi.list(undefined, 100);
      const rawList = Array.isArray(res)
        ? res
        : res && Array.isArray((res as any).data)
        ? (res as any).data
        : [];
      const mapped = rawList.map(mapBackendCategory);
      set({ categories: mapped, isLoading: false });
      saveToStorage('categories', mapped);
    } catch (err: any) {
      console.warn('Failed to fetch categories from backend API:', err);
      set({ isLoading: false, error: err?.message || 'Failed to fetch categories' });
    }
  },
  addCategory: (category) => {
    const updated = [category, ...get().categories];
    set({ categories: updated });
    saveToStorage('categories', updated);
  },
}));

// ================= COUPON STORE =================
interface CouponStore {
  coupons: Coupon[];
  isLoading: boolean;
  error: string | null;
  fetchCoupons: () => Promise<void>;
  setCoupons: (coupons: Coupon[]) => void;
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usageCount' | 'status'>) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
}

export const useCouponStore = create<CouponStore>((set, get) => ({
  coupons: loadFromStorage<Coupon[]>('coupons', []),
  isLoading: false,
  error: null,
  setCoupons: (coupons) => {
    set({ coupons });
    saveToStorage('coupons', coupons);
  },
  fetchCoupons: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await couponsApi.list(undefined, 100);
      const rawList = Array.isArray(res)
        ? res
        : res && Array.isArray((res as any).data)
        ? (res as any).data
        : [];
      const mapped = rawList.map(mapBackendCoupon);
      set({ coupons: mapped, isLoading: false });
      saveToStorage('coupons', mapped);
    } catch (err: any) {
      console.warn('Failed to fetch coupons from backend API:', err);
      set({ isLoading: false, error: err?.message || 'Failed to fetch coupons' });
    }
  },
  addCoupon: (newCoup) => {
    const coupon: Coupon = {
      ...newCoup,
      id: `coup-${Date.now()}`,
      usageCount: 0,
      status: 'active',
    };
    const updated = [coupon, ...get().coupons];
    set({ coupons: updated });
    saveToStorage('coupons', updated);
  },
  updateCoupon: (id, updates) => {
    const updated = get().coupons.map((c) => (c.id === id ? { ...c, ...updates } : c));
    set({ coupons: updated });
    saveToStorage('coupons', updated);
  },
  deleteCoupon: (id) => {
    const updated = get().coupons.filter((c) => c.id !== id);
    set({ coupons: updated });
    saveToStorage('coupons', updated);
  },
}));

// ================= SHIPPING & PAYMENT STORES =================
interface ShippingStore {
  shippingZones: ShippingZone[];
  updateShippingMethod: (zoneId: string, methodId: string, updates: Partial<ShippingMethod>) => void;
  addShippingMethod: (zoneId: string, method: Omit<ShippingMethod, 'id'>) => void;
  deleteShippingMethod: (zoneId: string, methodId: string) => void;
}

export const useShippingStore = create<ShippingStore>((set, get) => ({
  shippingZones: loadFromStorage<ShippingZone[]>('shipping_zones', defaultShippingZones),
  updateShippingMethod: (zoneId, methodId, updates) => {
    const updated = get().shippingZones.map((zone) => {
      if (zone.id !== zoneId) return zone;
      return {
        ...zone,
        methods: zone.methods.map((m) => (m.id === methodId ? { ...m, ...updates } : m)),
      };
    });
    set({ shippingZones: updated });
    saveToStorage('shipping_zones', updated);
  },
  addShippingMethod: (zoneId, method) => {
    const updated = get().shippingZones.map((zone) => {
      if (zone.id !== zoneId) return zone;
      return {
        ...zone,
        methods: [...zone.methods, { ...method, id: `m-${Date.now()}` }],
      };
    });
    set({ shippingZones: updated });
    saveToStorage('shipping_zones', updated);
  },
  deleteShippingMethod: (zoneId, methodId) => {
    const updated = get().shippingZones.map((zone) => {
      if (zone.id !== zoneId) return zone;
      return {
        ...zone,
        methods: zone.methods.filter((m) => m.id !== methodId),
      };
    });
    set({ shippingZones: updated });
    saveToStorage('shipping_zones', updated);
  },
}));

interface PaymentStore {
  gateways: PaymentGateway[];
  transactions: Transaction[];
  toggleGateway: (id: string, enabled: boolean) => void;
  updateGateway: (id: string, updates: Partial<PaymentGateway>) => void;
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  gateways: loadFromStorage<PaymentGateway[]>('payment_gateways', defaultPaymentGateways),
  transactions: loadFromStorage<Transaction[]>('transactions', []),
  toggleGateway: (id, enabled) => {
    const updated = get().gateways.map((g) => (g.id === id ? { ...g, enabled } : g));
    set({ gateways: updated });
    saveToStorage('payment_gateways', updated);
  },
  updateGateway: (id, updates) => {
    const updated = get().gateways.map((g) => (g.id === id ? { ...g, ...updates } : g));
    set({ gateways: updated });
    saveToStorage('payment_gateways', updated);
  },
}));

// ================= SETTINGS & UI STORES =================
interface SettingsStore {
  settings: SettingsState;
  updateSettings: <K extends keyof SettingsState>(section: K, updates: Partial<SettingsState[K]>) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: loadFromStorage<SettingsState>('settings', initialSettings),
  updateSettings: (section, updates) => {
    const updated = {
      ...get().settings,
      [section]: { ...get().settings[section], ...updates },
    };
    set({ settings: updated });
    saveToStorage('settings', updated);
  },
}));

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'order' | 'stock' | 'system';
  link?: string;
}

interface UIStore {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  notifications: NotificationItem[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  searchOpen: false,
  notifications: loadFromStorage<NotificationItem[]>('notifications', []),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  markNotificationRead: (id) => {
    const updated = get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    set({ notifications: updated });
    saveToStorage('notifications', updated);
  },
  markAllNotificationsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications: updated });
    saveToStorage('notifications', updated);
  },
}));

// ================= BACKEND SYNC STORE =================
export interface BackendSyncState {
  status: 'idle' | 'syncing' | 'connected' | 'offline' | 'error';
  lastSynced: string | null;
  errorMessage: string | null;
  currentUser: { id: number; name: string; email: string } | null;
  summary: BackendDashboardSummary | null;
  revenueHistory: BackendRevenuePoint[];
  topProducts: BackendTopProduct[];
  ordersByStatus: Record<string, number>;
  syncAll: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useBackendSyncStore = create<BackendSyncState>((set, get) => ({
  status: 'idle',
  lastSynced: localStorage.getItem('lilium_last_synced'),
  errorMessage: null,
  currentUser: null,
  summary: null,
  revenueHistory: [],
  topProducts: [],
  ordersByStatus: {},

  login: async (email, password) => {
    set({ status: 'syncing', errorMessage: null });
    try {
      await authApi.login(email, password);
      const user = await authApi.me();
      set({ currentUser: user });
      await get().syncAll();
      return true;
    } catch (err: any) {
      set({ status: 'error', errorMessage: err?.message || 'Login failed' });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    set({ currentUser: null, status: 'offline' });
  },

  syncAll: async () => {
    set({ status: 'syncing', errorMessage: null });
    try {
      // 1. Verify token exists
      if (!getStoredToken()) {
        set({ status: 'offline' });
        return false;
      }

      // 2. Fetch user if not in store
      if (!get().currentUser) {
        try {
          const user = await authApi.me();
          set({ currentUser: user });
        } catch {
          // Token expired or invalid
          authApi.logout();
          set({ currentUser: null, status: 'offline' });
          return false;
        }
      }

      // 3. Fetch Dashboard metrics
      try {
        const [sum, rev, obs, top] = await Promise.all([
          dashboardApi.getSummary(30),
          dashboardApi.getRevenue(),
          dashboardApi.getOrdersByStatus(),
          dashboardApi.getTopProducts(),
        ]);
        set({
          summary: sum,
          revenueHistory: rev || [],
          ordersByStatus: obs || {},
          topProducts: top || [],
        });
      } catch (dashErr) {
        console.warn('Dashboard fetch error:', dashErr);
      }

      // 4. Fetch Products, Orders, Customers, Categories, Coupons in parallel from API
      await Promise.allSettled([
        useProductStore.getState().fetchProducts(),
        useOrderStore.getState().fetchOrders(),
        useCustomerStore.getState().fetchCustomers(),
        useCategoryStore.getState().fetchCategories(),
        useCouponStore.getState().fetchCoupons(),
      ]);

      const now = new Date().toISOString();
      localStorage.setItem('lilium_last_synced', now);
      set({ status: 'connected', lastSynced: now, errorMessage: null });
      return true;
    } catch (err: any) {
      console.warn('Backend sync failed:', err);
      set({
        status: 'offline',
        errorMessage: err?.message || 'Could not connect to backend API',
      });
      return false;
    }
  },
}));
