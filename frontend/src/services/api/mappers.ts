import {
  Product,
  Order,
  Customer,
  ProductCategory,
  Coupon,
  OrderStatus,
  OrderItem,
  Address,
} from '@/types';
import {
  BackendProduct,
  BackendOrder,
  BackendCustomer,
  BackendCategory,
  BackendCoupon,
} from './types';

export function mapBackendProduct(p: BackendProduct): Product {
  const priceNum = parseFloat(p.price || '0');
  const regPriceNum = parseFloat(p.regular_price || p.price || '0');
  const salePriceNum = p.sale_price ? parseFloat(p.sale_price) : undefined;

  return {
    id: String(p.id),
    name: p.name,
    slug: p.slug,
    sku: p.sku || `SKU-${p.woo_id || p.id}`,
    type: p.type === 'variable' ? 'variable' : 'simple',
    status: (['publish', 'draft', 'pending'].includes(p.status) ? p.status : 'publish') as any,
    price: priceNum,
    regularPrice: regPriceNum,
    salePrice: salePriceNum,
    manageStock: Boolean(p.manage_stock),
    stockQuantity: p.stock_quantity ?? (p.stock_status === 'instock' ? 10 : 0),
    stockStatus: p.stock_status,
    categories: p.categories?.map((c) => c.name) || [],
    tags: [],
    images: p.image_url ? [{ id: '1', src: p.image_url, alt: p.name }] : [],
    shortDescription: '',
    description: '',
    attributes: [],
    variations: [],
    createdAt: p.woo_created_at || new Date().toISOString(),
    updatedAt: p.woo_modified_at || p.woo_created_at || new Date().toISOString(),
    featured: false,
  };
}

export function mapBackendOrder(o: BackendOrder): Order {
  const totalNum = parseFloat(o.total || '0');
  const shippingNum = parseFloat(o.shipping_total || '0');
  const discountNum = parseFloat(o.discount_total || '0');
  const taxNum = parseFloat(o.total_tax || '0');

  const validStatuses: OrderStatus[] = [
    'pending',
    'processing',
    'on-hold',
    'completed',
    'cancelled',
    'refunded',
    'failed',
  ];
  const status: OrderStatus = validStatuses.includes(o.status as OrderStatus)
    ? (o.status as OrderStatus)
    : 'processing';

  const items: OrderItem[] = (o.items || []).map((item) => ({
    id: String(item.id),
    productId: String(item.product_woo_id),
    name: item.name,
    sku: item.sku || '',
    price: item.quantity > 0 ? parseFloat(item.total || '0') / item.quantity : 0,
    quantity: item.quantity,
    total: parseFloat(item.total || '0'),
  }));

  const nameParts = (o.billing_name || 'Customer').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const billingAddress: Address = {
    firstName,
    lastName,
    address1: '',
    city: o.billing_city || '',
    state: o.billing_state || '',
    postcode: '',
    country: 'IN',
    email: o.billing_email || '',
    phone: o.billing_phone || '',
  };

  const shippingAddress: Address = {
    firstName,
    lastName,
    address1: '',
    city: o.shipping_city || o.billing_city || '',
    state: o.shipping_state || o.billing_state || '',
    postcode: '',
    country: 'IN',
    phone: o.billing_phone || '',
  };

  return {
    id: String(o.id),
    orderNumber: o.number || `#${o.woo_id || o.id}`,
    status,
    dateCreated: o.woo_created_at || new Date().toISOString(),
    customerId: String(o.customer_woo_id || o.id),
    customerName: o.billing_name || 'Customer',
    customerEmail: o.billing_email || '',
    billing: billingAddress,
    shipping: shippingAddress,
    items,
    paymentMethod: o.payment_method || 'online',
    paymentMethodTitle: o.payment_method_title || o.payment_method || 'Online Payment',
    transactionId: o.transaction_id || '',
    subtotal: Math.max(0, totalNum - shippingNum + discountNum),
    shippingTotal: shippingNum,
    discountTotal: discountNum,
    taxTotal: taxNum,
    total: totalNum,
    notes: o.customer_note
      ? [
          {
            id: '1',
            content: o.customer_note,
            date: o.woo_created_at || new Date().toISOString(),
            author: 'Customer',
            isCustomerNote: true,
          },
        ]
      : [],
    refunds: [],
  };
}

export function mapBackendCustomer(c: BackendCustomer): Customer {
  const billing: Address = {
    firstName: c.first_name || '',
    lastName: c.last_name || '',
    address1: '',
    city: c.city || '',
    state: c.state || '',
    postcode: '',
    country: c.country || 'IN',
    email: c.email || '',
    phone: c.phone || '',
  };

  return {
    id: String(c.id),
    firstName: c.first_name || c.username || 'Customer',
    lastName: c.last_name || '',
    email: c.email || '',
    username: c.username || c.email || `customer_${c.id}`,
    avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
    role: c.role || 'customer',
    registeredDate: c.woo_created_at || new Date().toISOString(),
    totalOrders: c.orders_count || 0,
    totalSpent: parseFloat(c.total_spent || '0'),
    billing,
    shipping: { ...billing },
  };
}

export function mapBackendCategory(c: BackendCategory): ProductCategory {
  return {
    id: String(c.id),
    name: c.name,
    slug: c.slug,
    count: c.products_count,
    image: c.image_url || undefined,
  };
}

export function mapBackendCoupon(c: BackendCoupon): Coupon {
  return {
    id: String(c.id),
    code: c.code,
    discountType: c.discount_type === 'percent' ? 'percent' : 'fixed_cart',
    amount: parseFloat(c.amount || '0'),
    description: `WooCommerce Coupon ${c.code}`,
    expiryDate: c.expires_at || undefined,
    usageCount: c.usage_count || 0,
    usageLimit: c.usage_limit ?? undefined,
    individualUse: false,
    excludeSaleItems: false,
    status: c.status === 'publish' ? 'active' : 'draft',
  };
}
