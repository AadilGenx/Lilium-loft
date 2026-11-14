import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Plus,
  Minus,
  Edit3,
  Package,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { useProductStore } from '@/store';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { exportToCSV } from '@/utils/csv';
import { toast } from 'sonner';

export function InventoryPage() {
  const { products, adjustStock } = useProductStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Quick Adjust Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'set' | 'add' | 'subtract'>('set');
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustNote, setAdjustNote] = useState('');

  // Stock Counters
  const counts = useMemo(() => {
    return {
      total: products.length,
      inStock: products.filter((p) => p.stockQuantity > 5).length,
      lowStock: products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length,
      outOfStock: products.filter((p) => p.stockQuantity === 0).length,
    };
  }, [products]);

  // Filtered inventory list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesTab = true;
      if (filterTab === 'low') matchesTab = p.stockQuantity > 0 && p.stockQuantity <= 5;
      if (filterTab === 'out') matchesTab = p.stockQuantity === 0;
      if (filterTab === 'in') matchesTab = p.stockQuantity > 5;

      return matchesSearch && matchesTab;
    });
  }, [products, searchTerm, filterTab]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustType('set');
    setAdjustAmount(product.stockQuantity);
    setAdjustNote('');
  };

  const handleApplyAdjustment = () => {
    if (!selectedProduct) return;
    if (adjustAmount < 0) {
      toast.error('Adjustment amount cannot be negative.');
      return;
    }

    adjustStock(selectedProduct.id, adjustAmount, adjustType);

    const actionText =
      adjustType === 'set'
        ? `set to ${adjustAmount}`
        : adjustType === 'add'
        ? `increased by ${adjustAmount}`
        : `decreased by ${adjustAmount}`;

    toast.success(`Stock for "${selectedProduct.name}" ${actionText}.`);
    setSelectedProduct(null);
  };

  const handleExport = () => {
    exportToCSV(
      products.map((p) => ({
        SKU: p.sku,
        Name: p.name,
        StockQuantity: p.stockQuantity,
        StockStatus: p.stockStatus,
        Price: p.price,
        Categories: p.categories.join('; '),
      })),
      'woocommerce-inventory-audit'
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Inventory & Stock Control
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit inventory levels, track replenishment thresholds, and make quick stock adjustments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex-1 sm:flex-none gap-1.5 bg-white text-slate-700"
          >
            <Download className="h-4 w-4" />
            <span>Export Inventory Report</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => {
            setFilterTab('all');
            setCurrentPage(1);
          }}
          className={`cursor-pointer transition-all ${
            filterTab === 'all' ? 'border-red-500 ring-1 ring-red-500' : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Tracked Items
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {counts.total}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => {
            setFilterTab('in');
            setCurrentPage(1);
          }}
          className={`cursor-pointer transition-all ${
            filterTab === 'in' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                In Stock (&gt;5)
              </span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {counts.inStock}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => {
            setFilterTab('low');
            setCurrentPage(1);
          }}
          className={`cursor-pointer transition-all ${
            filterTab === 'low' ? 'border-amber-500 ring-1 ring-amber-500' : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Low Stock (≤5)
              </span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {counts.lowStock}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => {
            setFilterTab('out');
            setCurrentPage(1);
          }}
          className={`cursor-pointer transition-all ${
            filterTab === 'out' ? 'border-red-500 ring-1 ring-red-500' : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Out of Stock (0)
              </span>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {counts.outOfStock}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search inventory by product name or SKU code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-slate-50/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Boxes}
                title="No inventory records found"
                description="No products match the selected inventory condition."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((p) => {
                  const isOut = p.stockQuantity === 0;
                  const isLow = p.stockQuantity > 0 && p.stockQuantity <= 5;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="h-11 w-11 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {p.images[0] ? (
                            <img
                              src={p.images[0].src}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 m-3 text-slate-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {p.name}
                        <span className="block text-xs font-normal text-slate-400">
                          {p.categories.join(', ')}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {p.sku}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {formatCurrency(p.price)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold font-mono text-sm ${
                            isOut
                              ? 'text-red-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {p.stockQuantity} units
                        </span>
                      </TableCell>
                      <TableCell>
                        {isOut ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">Low Stock Alert</Badge>
                        ) : (
                          <Badge variant="success">Normal Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjustModal(p)}
                          className="gap-1.5 text-xs bg-white text-slate-700 hover:text-red-600 hover:border-red-300"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Adjust</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Quick Stock Adjustment Dialog */}
      {selectedProduct && (
        <Dialog
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
        >
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <Boxes className="h-5 w-5 text-red-600" />
                <span>Adjust Stock: {selectedProduct.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Current stock on hand: <strong className="text-slate-800">{selectedProduct.stockQuantity} units</strong> (SKU: {selectedProduct.sku})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Adjustment Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('set')}
                    className={`py-2 px-3 rounded-md font-medium border text-xs transition-colors ${
                      adjustType === 'set'
                        ? 'bg-red-50 border-red-600 text-red-600 font-semibold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Set Exact Qty
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2 px-3 rounded-md font-medium border text-xs transition-colors ${
                      adjustType === 'add'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-600 font-semibold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    + Add Inflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('subtract')}
                    className={`py-2 px-3 rounded-md font-medium border text-xs transition-colors ${
                      adjustType === 'subtract'
                        ? 'bg-amber-50 border-amber-600 text-amber-600 font-semibold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    - Deduct
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">
                  {adjustType === 'set'
                    ? 'New Total Quantity'
                    : adjustType === 'add'
                    ? 'Quantity to Add'
                    : 'Quantity to Deduct'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="font-mono text-base font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Reason / Reference Note</label>
                <Input
                  placeholder="e.g. Supplier PO #492, Cycle count audit, Damaged goods"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProduct(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApplyAdjustment}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Adjustment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

