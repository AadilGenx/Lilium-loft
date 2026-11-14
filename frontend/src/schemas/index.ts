import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  slug: z.string().min(2, 'Slug is required'),
  sku: z.string().min(1, 'SKU is required'),
  type: z.enum(['simple', 'variable']),
  status: z.enum(['publish', 'draft', 'pending']),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
  regularPrice: z.coerce.number().min(0, 'Regular price is required'),
  salePrice: z.coerce.number().optional(),
  manageStock: z.boolean().default(true),
  stockQuantity: z.coerce.number().int().min(0, 'Stock quantity cannot be negative'),
  stockStatus: z.enum(['instock', 'outofstock', 'onbackorder']),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  tags: z.array(z.string()).default([]),
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

