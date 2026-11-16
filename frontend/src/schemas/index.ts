import { z } from 'zod';

// An empty number input means "not set", not zero.
const optionalNumber = z.preprocess(
  (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : v),
  z.coerce.number().min(0, 'Must be 0 or more').optional()
);

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  slug: z.string().regex(/^[a-z0-9-]*$/, 'Use lowercase letters, numbers and dashes').default(''),
  sku: z.string().default(''),
  type: z.enum(['simple', 'variable', 'grouped', 'external']),
  status: z.enum(['publish', 'draft', 'pending', 'private']),
  regularPrice: optionalNumber,
  salePrice: optionalNumber,
  manageStock: z.boolean().default(false),
  stockQuantity: z.coerce.number().int().min(0, 'Stock quantity cannot be negative').default(0),
  stockStatus: z.enum(['instock', 'outofstock', 'onbackorder']),
  categories: z.array(z.string()).default([]),
  shortDescription: z.string().default(''),
  description: z.string().default(''),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
  discountType: z.enum(['percent', 'fixed_cart', 'fixed_product']),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  description: z.string().min(3, 'Description is required'),
  expiryDate: z.string().optional(),
  usageLimit: z.coerce.number().optional(),
  individualUse: z.boolean().default(false),
  minimumAmount: z.coerce.number().optional(),
  maximumAmount: z.coerce.number().optional(),
  excludeSaleItems: z.boolean().default(false),
});

export type CouponFormValues = z.infer<typeof couponSchema>;

export const refundSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Refund amount must be positive'),
  reason: z.string().min(3, 'Refund reason is required'),
});

export type RefundFormValues = z.infer<typeof refundSchema>;

export const stockAdjustmentSchema = z.object({
  productId: z.string(),
  adjustmentType: z.enum(['set', 'add', 'subtract']),
  quantity: z.coerce.number().int().min(0, 'Quantity must be positive'),
  note: z.string().optional(),
});

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>;

