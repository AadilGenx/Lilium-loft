export type ProductType = 'simple' | 'variable';
export type ProductStatus = 'publish' | 'draft' | 'pending';
export type StockStatus = 'instock' | 'outofstock' | 'onbackorder';

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  options: string[];
  visible: boolean;
  variation: boolean;
}

export interface ProductVariation {
  id: string;
  sku: string;
  price: number;
  regularPrice: number;
  salePrice?: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  attributes: Record<string, string>; // e.g. { "Size": "M", "Color": "Red" }
  image?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count: number;
  image?: string;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  type: ProductType;
  status: ProductStatus;
  price: number;
  regularPrice: number;
  salePrice?: number;
  manageStock: boolean;
  stockQuantity: number;
  stockStatus: StockStatus;
  categories: string[];
  tags: string[];
  images: ProductImage[];
  shortDescription: string;
  description: string;
  attributes: ProductAttribute[];
  variations: ProductVariation[];
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
  variationId?: string;
  attributes?: Record<string, string>;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface OrderNote {
  id: string;
  content: string;
  date: string;
  author: string;
  isCustomerNote: boolean;
}

export interface OrderRefund {
  id: string;
  amount: number;
  reason: string;
  date: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  dateCreated: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  billing: Address;
  shipping: Address;
  items: OrderItem[];
  paymentMethod: string;
  paymentMethodTitle: string;
  transactionId: string;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes: OrderNote[];
  refunds: OrderRefund[];
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  avatarUrl: string;
  role: string;
  registeredDate: string;
  totalOrders: number;
  totalSpent: number;
  billing: Address;
  shipping: Address;
  notes?: string;
}

export type CouponDiscountType = 'percent' | 'fixed_cart' | 'fixed_product';

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  amount: number;
  description: string;
  expiryDate?: string;
  usageCount: number;
  usageLimit?: number;
  individualUse: boolean;
  minimumAmount?: number;
  maximumAmount?: number;
  excludeSaleItems: boolean;
  status: 'active' | 'expired' | 'draft';
}

export interface ShippingMethod {
  id: string;
  type: 'flat_rate' | 'free_shipping' | 'local_pickup';
  title: string;
  cost: number;
  enabled: boolean;
  taxStatus: 'taxable' | 'none';
}

export interface ShippingZone {
  id: string;
  name: string;
  regions: string[];
  methods: ShippingMethod[];
}

export interface PaymentGateway {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  methodTitle: string;
  methodDescription: string;
  instructions?: string;
  testMode?: boolean;
}

export interface Transaction {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  date: string;
  transactionReference: string;
}

export interface SettingsState {
  general: {
    storeName: string;
    storeAddress: string;
    storeCity: string;
    storePostcode: string;
    storeCountry: string;
    storeCurrency: string;
    currencyPosition: 'left' | 'right' | 'left_space' | 'right_space';
    thousandSeparator: string;
    decimalSeparator: string;
    numberOfDecimals: number;
  };
  products: {
    weightUnit: string;
    dimensionUnit: string;
    enableReviews: boolean;
    enableProductRatings: boolean;
    manageStock: boolean;
    lowStockThreshold: number;
    outOfStockThreshold: number;
    notifyLowStock: boolean;
    notifyOutOfStock: boolean;
    notificationRecipient: string;
  };
  tax: {
    enableTaxes: boolean;
    pricesIncludeTax: boolean;
    calculateTaxBasedOn: 'shipping' | 'billing' | 'base';
    shippingTaxClass: string;
    roundTaxAtSubtotal: boolean;
    standardTaxRate: number;
  };
  shipping: {
    enableShipping: boolean;
    shippingCalculations: boolean;
    shippingDestination: 'shipping' | 'billing' | 'force_billing';
    defaultShippingCost: number;
  };
  payments: {
    defaultGateway: string;
    allowGuestCheckout: boolean;
    enforceSsl: boolean;
  };
  email: {
    senderName: string;
    senderEmail: string;
    adminNewOrder: boolean;
    customerCompletedOrder: boolean;
    customerInvoice: boolean;
    emailFooterText: string;
  };
}

