import { apiClient, setStoredToken, getStoredToken } from './client';
import {
  BackendPagination,
  BackendProduct,
  BackendOrder,
  BackendCustomer,
  BackendCategory,
  BackendCoupon,
  BackendDashboardSummary,
  BackendRevenuePoint,
  BackendTopProduct,
  BackendSyncLog,
} from './types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
}

// ----------------- Auth -----------------
export const authApi = {
  async login(email: string, password: string):Promise<LoginResponse> {
    const res = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.access_token);
    return res;
  },

  async me(): Promise<UserResponse> {
    return apiClient<UserResponse>('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await apiClient<void>('/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  isAuthenticated(): boolean {
    return Boolean(getStoredToken());
  },
};

// ----------------- Dashboard -----------------
export const dashboardApi = {
  async getSummary(days = 30): Promise<BackendDashboardSummary> {
    return apiClient<BackendDashboardSummary>(`/dashboard/summary?days=${days}`);
  },

  async getRevenue(): Promise<BackendRevenuePoint[]> {
    return apiClient<BackendRevenuePoint[]>('/dashboard/revenue');
  },

  async getOrdersByStatus(): Promise<Record<string, number>> {
    return apiClient<Record<string, number>>('/dashboard/orders-by-status');
  },

  async getTopProducts(): Promise<BackendTopProduct[]> {
    return apiClient<BackendTopProduct[]>('/dashboard/top-products');
  },

  async getSyncStatus(): Promise<BackendSyncLog[]> {
    return apiClient<BackendSyncLog[]>('/sync/status');
  },
};

// ----------------- Products -----------------
export interface ProductQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  stock_status?: string;
  category_id?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export const productsApi = {
  async list(params: ProductQueryParams = {}): Promise<BackendPagination<BackendProduct>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.per_page) searchParams.set('per_page', String(params.per_page));
    if (params.search) searchParams.set('search', params.search);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.stock_status && params.stock_status !== 'all') searchParams.set('stock_status', params.stock_status);
    if (params.category_id) searchParams.set('category_id', String(params.category_id));
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.direction) searchParams.set('direction', params.direction);

    const query = searchParams.toString();
    return apiClient<BackendPagination<BackendProduct>>(`/products${query ? `?${query}` : ''}`);
  },

  async get(id: number | string): Promise<BackendProduct> {
    return apiClient<BackendProduct>(`/products/${id}`);
  },
};

// ----------------- Orders -----------------
export interface OrderQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  with_items?: number;
}

export const ordersApi = {
  async list(params: OrderQueryParams = {}): Promise<BackendPagination<BackendOrder>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.per_page) searchParams.set('per_page', String(params.per_page));
    if (params.search) searchParams.set('search', params.search);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.date_from) searchParams.set('date_from', params.date_from);
    if (params.date_to) searchParams.set('date_to', params.date_to);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.direction) searchParams.set('direction', params.direction);
    searchParams.set('with_items', String(params.with_items ?? 1));

    const query = searchParams.toString();
    return apiClient<BackendPagination<BackendOrder>>(`/orders${query ? `?${query}` : ''}`);
  },

  async get(id: number | string): Promise<BackendOrder> {
    return apiClient<BackendOrder>(`/orders/${id}`);
  },
};

// ----------------- Customers -----------------
export interface CustomerQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export const customersApi = {
  async list(params: CustomerQueryParams = {}): Promise<BackendPagination<BackendCustomer>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.per_page) searchParams.set('per_page', String(params.per_page));
    if (params.search) searchParams.set('search', params.search);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.direction) searchParams.set('direction', params.direction);

    const query = searchParams.toString();
    return apiClient<BackendPagination<BackendCustomer>>(`/customers${query ? `?${query}` : ''}`);
  },

  async get(id: number | string): Promise<BackendCustomer> {
    return apiClient<BackendCustomer>(`/customers/${id}`);
  },
};

// ----------------- Categories -----------------
export const categoriesApi = {
  async list(search?: string, perPage = 100): Promise<BackendPagination<BackendCategory>> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (perPage) params.set('per_page', String(perPage));
    const query = params.toString();
    return apiClient<BackendPagination<BackendCategory>>(`/categories${query ? `?${query}` : ''}`);
  },

  async get(id: number | string): Promise<BackendCategory> {
    return apiClient<BackendCategory>(`/categories/${id}`);
  },
};

// ----------------- Coupons -----------------
export const couponsApi = {
  async list(search?: string, perPage = 100): Promise<BackendPagination<BackendCoupon>> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (perPage) params.set('per_page', String(perPage));
    const query = params.toString();
    return apiClient<BackendPagination<BackendCoupon>>(`/coupons${query ? `?${query}` : ''}`);
  },

  async get(id: number | string): Promise<BackendCoupon> {
    return apiClient<BackendCoupon>(`/coupons/${id}`);
  },
};

