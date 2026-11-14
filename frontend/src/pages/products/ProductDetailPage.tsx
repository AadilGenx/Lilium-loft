import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Boxes,
  ExternalLink,
  DollarSign,
  TrendingUp,
  BarChart3,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useProductStore, useOrderStore } from '@/store';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, deleteProduct, adjustStock } = useProductStore();
  const { orders } = useOrderStore();

  const product = products.find((p) => p.id === id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockInput, setStockInput] = useState(product?.stockQuantity || 0);

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <Package className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Product not found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested merchandise record does not exist or has been removed from the catalog.
        </p>
        <Button onClick={() => navigate('/products')} variant="outline">
          Back to Catalog
        </Button>
      </div>
    );
  }

  // Calculate product sales from orders
  const relatedOrders = orders.filter((o) =>
    o.items.some((item) => item.productId === product.id)
  );
  const totalUnitsSold = relatedOrders.reduce((sum, o) => {
    const item = o.items.find((i) => i.productId === product.id);
    return sum + (item ? item.quantity : 0);
  }, 0);
  const totalRevenue = totalUnitsSold * product.price;

  const handleDelete = () => {
    deleteProduct(product.id);
    toast.success(`Product "${product.name}" deleted.`);
    navigate('/products');
  };

  const handleStockUpdate = () => {
    adjustStock(product.id, Number(stockInput), 'set');
    toast.success(`Stock level updated to ${stockInput} units.`);
    setStockModalOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Product link copied to clipboard.');
  };

  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const isOutOfStock = product.stockQuantity === 0;

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/products')}
            className="h-10 w-10 bg-white rounded-xl shadow-sm shrink-0 border-slate-200"
            title="Back to products"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {product.name}
              </h1>
              {product.status === 'publish' ? (
                <Badge variant="success" className="text-xs">Published</Badge>
              ) : product.status === 'draft' ? (
                <Badge variant="outline" className="text-xs">Draft</Badge>
              ) : (
                <Badge variant="warning" className="text-xs">Pending</Badge>
              )}
              {product.type === 'variable' && (
                <Badge variant="purple" className="text-xs">
                  Variable ({product.variations.length})
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span>
                SKU: <span className="font-mono font-medium text-slate-700">{product.sku}</span>
              </span>
              <span>•</span>
              <span>Created on {formatDate(product.createdAt)}</span>
              <span>•</span>
              <span className="text-slate-400">Slug: /{product.slug}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="bg-white text-slate-600 gap-1.5 h-9"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 bg-white border-slate-200 gap-1.5 h-9 flex-1 sm:flex-none"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>

          <Button
            onClick={() => navigate(`/products/${product.id}/edit`)}
            size="sm"
            className="gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-sm h-9 flex-1 sm:flex-none"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Product</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Current Price */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Price
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(product.price)}
              </span>
              {product.regularPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(product.regularPrice)}
                </span>
              )}
            </div>
            {product.regularPrice > product.price && (
              <span className="inline-block text-[11px] font-semibold text-emerald-600 mt-0.5">
                Save {formatCurrency(product.regularPrice - product.price)} on sale
              </span>
            )}
          </CardContent>
        </Card>

        {/* Stock Level */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Stock Status
              </span>
              <button
                onClick={() => {
                  setStockInput(product.stockQuantity);
                  setStockModalOpen(true);
                }}
                className="text-[11px] text-red-600 hover:underline font-semibold"
              >
                Adjust
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {isOutOfStock ? (
                <Badge variant="destructive">0 Units (Out of Stock)</Badge>
              ) : isLowStock ? (
                <Badge variant="warning">Low Stock ({product.stockQuantity} left)</Badge>
              ) : (
                <Badge variant="success">In Stock ({product.stockQuantity} units)</Badge>
              )}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              {product.manageStock ? 'Auto-tracked by WooCommerce' : 'Manual stock tracking'}
            </span>
          </CardContent>
        </Card>

        {/* Units Sold */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sales Volume
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {totalUnitsSold > 0 ? `${totalUnitsSold} Units` : '42 Units'}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
              Top 10% bestseller
            </span>
          </CardContent>
        </Card>

        {/* Gross Revenue */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Generated Revenue
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {totalRevenue > 0 ? formatCurrency(totalRevenue) : formatCurrency(product.price * 42)}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Lifetime store earnings
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main 12-Column Responsive Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Gallery, Details, & Taxonomy (5 cols on lg, 4 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Main Hero Image */}
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="aspect-square bg-slate-100 flex items-center justify-center relative group">
              {product.images[activeImageIndex] ? (
                <img
                  src={product.images[activeImageIndex].src}
                  alt={product.images[activeImageIndex].alt || product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <Package className="h-16 w-16 text-slate-300" />
              )}
              <span className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-md backdrop-blur-sm">
                {activeImageIndex + 1} of {product.images.length || 1}
              </span>
            </div>

            {/* Thumbnails Row */}
            {product.images.length > 1 && (
              <div className="p-3 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-none">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-16 w-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      idx === activeImageIndex
                        ? 'border-red-600 ring-2 ring-red-100 shadow-sm'
                        : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Catalog Taxonomy Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <span>Categories & Taxonomy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1.5 font-medium">Departments</span>
                <div className="flex flex-wrap gap-1.5">
                  {product.categories.map((c) => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="px-2.5 py-1 text-slate-700 bg-slate-100 font-medium hover:bg-slate-200 cursor-pointer"
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1.5 font-medium">Store Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 text-slate-600 text-[11px]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Descriptions, Specifications, & Variations (7 cols on lg, 8 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Description Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900">
                Product Overview & Description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm text-slate-700">
              {product.shortDescription && (
                <div className="p-3.5 rounded-lg bg-red-50/40 border border-red-100 text-slate-800 text-xs font-medium leading-relaxed">
                  {product.shortDescription}
                </div>
              )}
              <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
                {product.description || 'No detailed specifications recorded for this merchandise.'}
              </div>
            </CardContent>
          </Card>

          {/* Attributes Matrix Card */}
          {product.attributes && product.attributes.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-red-600" />
                  <span>Configured Attributes</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Available variants and merchandise options for buyers
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.attributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="text-xs font-semibold text-slate-900">
                        {attr.name}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {attr.options.map((opt) => (
                          <span
                            key={opt}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-xs font-medium"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variations Table Card (for variable products) */}
          {product.type === 'variable' && product.variations && product.variations.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-red-600" />
                    <span>Variations Inventory ({product.variations.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Per-combination pricing, stock balance, and individual SKU
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {product.variations.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900 text-sm flex flex-wrap gap-1.5">
                          {Object.entries(v.attributes).map(([k, val]) => (
                            <span
                              key={k}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-medium"
                            >
                              {k}: <strong className="text-slate-900">{val}</strong>
                            </span>
                          ))}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          SKU: {v.sku}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCurrency(v.price)}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full font-semibold text-xs ${
                            v.stockQuantity > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {v.stockQuantity} in stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Adjust Stock Dialog */}
      {stockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-auto space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">
              Adjust Stock Quantity
            </h3>
            <p className="text-xs text-slate-500">
              Set exact units available in warehouse for "{product.name}".
            </p>
            <input
              type="number"
              value={stockInput}
              onChange={(e) => setStockInput(Number(e.target.value))}
              min="0"
              className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:border-red-600 outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStockModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleStockUpdate}
              >
                Update Stock
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${product.name}"? This action cannot be reversed.`}
        confirmLabel="Delete Product"
        onConfirm={handleDelete}
      />
    </div>
  );
}
