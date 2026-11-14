export interface BackendPagination<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface BackendCategory {
  id: number;
  woo_id: number;
  parent_woo_id: number;
  name: string;
  slug: string;
  products_count: number;
  image_url: string | null;
}

export interface BackendProduct {
  id: number;
  woo_id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  sku: string | null;
  price: string | null;
  regular_price: string | null;
  sale_price: string | null;
  on_sale: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  manage_stock: boolean;
  stock_quantity: number | null;
  total_sales: number;
  average_rating: string;
  rating_count: number;
  image_url: string | null;
  permalink: string | null;
  woo_created_at: string | null;
  woo_modified_at: string | null;
  categories?: BackendCategory[];
}

export interface BackendOrderItem {
  id: number;
  order_woo_id: number;
  woo_item_id: number;
  product_woo_id: number;
  variation_woo_id: number;
  name: string;
  sku: string | null;
  quantity: number;
  subtotal: string;
  total: string;
}

export interface BackendOrder {
  id: number;
  woo_id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  discount_total: string;
  shipping_total: string;
  total_tax: string;
  payment_method: string | null;
  payment_method_title: string | null;
  transaction_id: string | null;
  customer_woo_id: number;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  billing_city: string | null;
  billing_state: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  customer_note: string | null;
  coupon_codes: string[];
  woo_created_at: string | null;
  woo_paid_at: string | null;
  woo_completed_at: string | null;
  items?: BackendOrderItem[];
}

export interface BackendCustomer {
  id: number;
  woo_id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  role: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  orders_count: number;
  total_spent: string;
  woo_created_at: string | null;
}

export interface BackendCoupon {
  id: number;
  woo_id: number;
  code: string;
  status: string | null;
  discount_type: string | null;
  amount: string;
  usage_count: number;
  usage_limit: number | null;
  free_shipping: boolean;
  expires_at: string | null;
}

export interface BackendDashboardSummary {
  days: number;
  revenue: number;
  previous_revenue: number;
  orders: number;
  previous_orders: number;
  average_order_value: number;
  awaiting_fulfilment: number;
  customers: number;
  published_products: number;
  out_of_stock_products: number;
}

export interface BackendRevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface BackendTopProduct {
  id: number;
  name: string;
  total_sales: number;
  revenue: number;
}

export interface BackendSyncLog {
  id: number;
  resource: string;
  status: 'started' | 'completed' | 'failed';
  records_synced: number;
  error: string | null;
  created_at: string;
}

