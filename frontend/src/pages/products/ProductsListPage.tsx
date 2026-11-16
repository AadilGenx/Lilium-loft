import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  Package,
  Layers,
  CheckCircle,
} from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { MobileList, MobileRow, TableOnly } from '@/components/ui/mobile-list';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useProductStore } from '@/store';
import { Product } from '@/types';
import { formatCurrency, formatMoney } from '@/utils/formatters';
import { exportToCSV } from '@/utils/csv';
import { isOnSale } from '@/utils/stock';
import { ProductStatusBadge } from '@/components/products/ProductStatusBadge';
import { useStockState } from '@/hooks/useStockState';
import { getErrorMessage } from '@/utils/errors';
import { toast } from 'sonner';

export function ProductsListPage() {
  const stockOf = useStockState();
  const navigate = useNavigate();
  const { products, deleteProduct } = useProductStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStock, setSelectedStock] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Extract distinct categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.categories.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' || p.categories.includes(selectedCategory);

      const matchesStock =
        selectedStock === 'all' ||
        (selectedStock === 'instock' && stockOf(p) === 'in') ||
        (selectedStock === 'lowstock' && stockOf(p) === 'low') ||
        (selectedStock === 'outofstock' && stockOf(p) === 'out') ||
        (selectedStock === 'onbackorder' && stockOf(p) === 'backorder');

      const matchesType = selectedType === 'all' || p.type === selectedType;

      return matchesSearch && matchesCat && matchesStock && matchesType;
    });
  }, [products, searchTerm, selectedCategory, selectedStock, selectedType, stockOf]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      toast.success(`Product "${productToDelete.name}" moved to the trash.`);
      setProductToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleExport = () => {
    exportToCSV(
      products.map((p) => ({
        ID: p.id,
        Name: p.name,
        SKU: p.sku,
        Type: p.type,
        Price: p.price ?? '',
        StockQuantity: p.manageStock ? p.stockQuantity : '',
        StockStatus: p.stockStatus,
        Categories: p.categories.join('; '),
        Status: p.status,
      })),
      'woocommerce-products'
    );
  };

  const getStockBadge = (prod: Product) => {
    const state = stockOf(prod);
    if (state === 'out') {
      return <Badge variant="destructive" className="whitespace-nowrap">Out of Stock</Badge>;
    }
    if (state === 'backorder') {
      return <Badge variant="warning" className="whitespace-nowrap">On Backorder</Badge>;
    }
    if (state === 'low') {
      return (
        <Badge variant="warning" className="whitespace-nowrap">
          Low Stock ({prod.stockQuantity})
        </Badge>
      );
    }
    return (
      <Badge variant="success" className="whitespace-nowrap">
        {prod.manageStock ? `In Stock (${prod.stockQuantity})` : 'In Stock'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Products
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your store inventory, pricing and catalog.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex-1 sm:flex-none gap-1.5 bg-white"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </Button>
          <Button
            onClick={() => navigate('/products/new')}
            size="sm"
            className="flex-1 sm:flex-none gap-1.5 bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-slate-50/50"
              />
            </div>

            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-slate-50/50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesList.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock Status Filter */}
            <Select
              value={selectedStock}
              onValueChange={(val) => {
                setSelectedStock(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-slate-50/50">
                <SelectValue placeholder="All Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Status</SelectItem>
                <SelectItem value="instock">In Stock</SelectItem>
                <SelectItem value="lowstock">Low Stock</SelectItem>
                <SelectItem value="outofstock">Out of Stock</SelectItem>
                <SelectItem value="onbackorder">On Backorder</SelectItem>
              </SelectContent>
            </Select>

            {/* Product Type Filter */}
            <Select
              value={selectedType}
              onValueChange={(val) => {
                setSelectedType(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="bg-slate-50/50">
                <SelectValue placeholder="All Product Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="simple">Simple Product</SelectItem>
                <SelectItem value="variable">Variable Product</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Product Table */}
      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Package}
                title="No products found"
                description="Try modifying your search or filter options to locate your products."
                actionLabel="Add New Product"
                onAction={() => navigate('/products/new')}
              />
            </div>
          ) : (
            <>
<MobileList>
  {paginatedProducts.map((product) => (
    <MobileRow key={product.id} onClick={() => navigate(`/products/${product.id}`)}>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
          {product.images[0] ? (
            <img src={product.images[0].src} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-5 w-5 text-slate-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-slate-900 line-clamp-2">{product.name}</div>
          <div className="text-xs text-slate-400 truncate">
            {product.sku ? `SKU ${product.sku}` : product.categories.join(', ')}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => navigate(`/products/${product.id}`)} className="gap-2">
              <Eye className="h-4 w-4 text-slate-500" />
              <span>View Details</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/products/${product.id}/edit`)} className="gap-2">
              <Edit className="h-4 w-4 text-slate-500" />
              <span>Edit Product</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setProductToDelete(product)}
              className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {getStockBadge(product)}
        <ProductStatusBadge status={product.status} />
        <span className="ml-auto font-semibold text-slate-900">
          {product.type === 'variable' && product.price !== undefined ? 'From ' : ''}
          {formatMoney(product.price)}
        </span>
      </div>
    </MobileRow>
  ))}
</MobileList>
<TableOnly>
<Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="hidden lg:table-cell">SKU</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden lg:table-cell">Categories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    {/* Thumbnail */}
                    <TableCell>
                      <div className="h-11 w-11 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                        {product.images[0] ? (
                          <img
                            src={product.images[0].src}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Name */}
                    <TableCell>
                      <button
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="text-left font-medium text-slate-900 hover:text-red-600 transition-colors line-clamp-1"
                      >
                        {product.name}
                      </button>
                      <span className="hidden lg:block text-[11px] text-slate-400 mt-0.5">
                        Slug: {product.slug}
                      </span>
                    </TableCell>

                    {/* SKU */}
                    <TableCell className="hidden lg:table-cell font-mono text-xs text-slate-600">
                      {product.sku}
                    </TableCell>

                    {/* Type */}
                    <TableCell className="hidden lg:table-cell">
                      {product.type === 'variable' ? (
                        <Badge variant="purple" className="text-[10px]">
                          Variable
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Simple
                        </Badge>
                      )}
                    </TableCell>

                    {/* Stock */}
                    <TableCell>{getStockBadge(product)}</TableCell>

                    {/* Price */}
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {product.type === 'variable' && product.price !== undefined ? 'From ' : ''}
                        {formatMoney(product.price)}
                      </div>
                      {isOnSale(product) && (
                        <div className="text-[11px] text-slate-400 line-through">
                          {formatMoney(product.regularPrice)}
                        </div>
                      )}
                    </TableCell>

                    {/* Categories */}
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {product.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <ProductStatusBadge status={product.status} />
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4 text-slate-500" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/products/${product.id}/edit`)}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4 text-slate-500" />
                            <span>Edit Product</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setProductToDelete(product)}
                            className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
</TableOnly>
</>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        title="Move product to trash"
        description={`Move "${productToDelete?.name}" to the trash in WooCommerce? It will no longer be sold or shown in your store. It can be restored from the WooCommerce trash.`}
        confirmLabel="Move to trash"
        onConfirm={handleDelete}
      />
    </div>
  );
}

