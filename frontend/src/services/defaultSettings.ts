import { SettingsState } from '@/types';

export const initialSettings: SettingsState = {
  general: {
    storeName: 'Lilium & Loft Studio',
    storeAddress: 'Store Address',
    storeCity: 'Chennai',
    storePostcode: '600001',
    storeCountry: 'India (IN)',
    storeCurrency: 'INR',
    currencyPosition: 'left',
    thousandSeparator: ',',
    decimalSeparator: '.',
    numberOfDecimals: 2,
  },
  products: {
    weightUnit: 'kg',
    dimensionUnit: 'cm',
    enableReviews: true,
    enableProductRatings: true,
    manageStock: true,
    lowStockThreshold: 5,
    outOfStockThreshold: 0,
    notifyLowStock: true,
    notifyOutOfStock: true,
    notificationRecipient: 'admin@liliumloft.com',
  },
  tax: {
    enableTaxes: true,
    pricesIncludeTax: false,
    calculateTaxBasedOn: 'shipping',
    shippingTaxClass: 'standard',
    roundTaxAtSubtotal: true,
    standardTaxRate: 18.0,
  },
  shipping: {
    enableShipping: true,
    shippingCalculations: true,
    shippingDestination: 'shipping',
    defaultShippingCost: 100.0,
  },
  payments: {
    defaultGateway: 'razorpay',
    allowGuestCheckout: true,
    enforceSsl: true,
  },
  email: {
    senderName: 'Lilium & Loft Store',
    senderEmail: 'orders@liliumloft.com',
    adminNewOrder: true,
    customerCompletedOrder: true,
    customerInvoice: true,
    emailFooterText: '© 2026 Lilium & Loft. All rights reserved.',
  },
};

