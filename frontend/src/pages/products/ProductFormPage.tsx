import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Save,
  ImagePlus,
  Trash2,
  Plus,
  Layers,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { productSchema, ProductFormValues } from '@/schemas';
import { useProductStore, useCategoryStore } from '@/store';
import { ProductAttribute, ProductVariation, ProductImage } from '@/types';
import { toast } from 'sonner';

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { products, addProduct, updateProduct } = useProductStore();
  const categories = useCategoryStore((s) => s.categories);
  const existingProduct = isEditing ? products.find((p) => p.id === id) : null;

  // Local state for images, attributes, and variations
  const [images, setImages] = useState<ProductImage[]>(
    existingProduct?.images || [
      {
        id: 'img-def',
        src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        alt: 'Product image',
      },
    ]
  );
  const [newImageUrl, setNewImageUrl] = useState('');

  const [attributes, setAttributes] = useState<ProductAttribute[]>(
    existingProduct?.attributes || [
      {
        id: 'attr-1',
        name: 'Color',
        options: ['Black', 'Silver', 'Brown'],
        visible: true,
        variation: true,
      },
      {
        id: 'attr-2',
        name: 'Size',
        options: ['Small', 'Medium', 'Large'],
        visible: true,
        variation: true,
      },
    ]
  );
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrOptions, setNewAttrOptions] = useState('');

  const [variations, setVariations] = useState<ProductVariation[]>(
    existingProduct?.variations || []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: existingProduct?.name || '',
      slug: existingProduct?.slug || '',
      sku: existingProduct?.sku || '',
      type: existingProduct?.type || 'simple',
      status: existingProduct?.status || 'publish',
      price: existingProduct?.price || 0,
      regularPrice: existingProduct?.regularPrice || 0,
      salePrice: existingProduct?.salePrice || undefined,
      manageStock: existingProduct?.manageStock ?? true,
      stockQuantity: existingProduct?.stockQuantity || 10,
      stockStatus: existingProduct?.stockStatus || 'instock',
      categories: existingProduct?.categories || ['Watches & Timepieces'],
      tags: existingProduct?.tags || ['Luxury', 'Modern'],
      shortDescription: existingProduct?.shortDescription || '',
      description: existingProduct?.description || '',
    },
  });

  const productType = watch('type');
  const manageStock = watch('manageStock');
  const selectedCategories = watch('categories') || [];

  // Auto generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);
    if (!isEditing) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug);
    }
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        id: `img-${Date.now()}`,
        src: newImageUrl.trim(),
        alt: 'Product image',
      },
    ]);
    setNewImageUrl('');
    toast.success('Image added to gallery preview.');
  };

  const handleRemoveImage = (imgId: string) => {
    setImages((prev) => prev.filter((i) => i.id !== imgId));
  };

  const handleAddAttribute = () => {
    if (!newAttrName.trim()) return;
    const opts = newAttrOptions
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const newAttr: ProductAttribute = {
      id: `attr-${Date.now()}`,
      name: newAttrName.trim(),
      options: opts.length ? opts : ['Default'],
      visible: true,
      variation: true,
    };
    setAttributes((prev) => [...prev, newAttr]);
    setNewAttrName('');
    setNewAttrOptions('');
    toast.success(`Attribute "${newAttr.name}" added.`);
  };

  const handleRemoveAttribute = (attrId: string) => {
    setAttributes((prev) => prev.filter((a) => a.id !== attrId));
  };

  const handleGenerateVariations = () => {
    if (attributes.length === 0) {
      toast.error('Add at least one attribute to generate variations.');
      return;
    }

    const currentPrice = watch('price') || 100;
    const currentSku = watch('sku') || 'PROD';

    const attr1 = attributes[0];
    const attr2 = attributes[1];

    const generated: ProductVariation[] = [];

    if (attr1 && attr2) {
      attr1.options.forEach((opt1, i) => {
        attr2.options.forEach((opt2, j) => {
          generated.push({
            id: `var-${Date.now()}-${i}-${j}`,
            sku: `${currentSku}-${opt1.slice(0, 3).toUpperCase()}-${opt2.slice(0, 3).toUpperCase()}`,
            price: currentPrice,
            regularPrice: currentPrice,
            stockQuantity: 10,
            stockStatus: 'instock',
            attributes: {
              [attr1.name]: opt1,
              [attr2.name]: opt2,
            },
          });
        });
      });
    } else if (attr1) {
      attr1.options.forEach((opt, i) => {
        generated.push({
          id: `var-${Date.now()}-${i}`,
          sku: `${currentSku}-${opt.slice(0, 3).toUpperCase()}`,
          price: currentPrice,
          regularPrice: currentPrice,
          stockQuantity: 10,
          stockStatus: 'instock',
          attributes: {
            [attr1.name]: opt,
          },
        });
      });
    }

    setVariations(generated);
    toast.success(`Generated ${generated.length} variations.`);
  };

  const toggleCategory = (catName: string) => {
    const current = new Set(selectedCategories);
    if (current.has(catName)) {
      current.delete(catName);
    } else {
      current.add(catName);
    }
    setValue('categories', Array.from(current));
  };

  const onSubmit = (data: ProductFormValues) => {
    const productData = {
      ...data,
      images,
      attributes: data.type === 'variable' ? attributes : [],
      variations: data.type === 'variable' ? variations : [],
    };

    if (isEditing && id) {
      updateProduct(id, productData);
      toast.success('Product updated successfully!');
      navigate(`/products/${id}`);
    } else {
      const created = addProduct(productData);
      toast.success('Product created successfully!');
      navigate(`/products/${created.id}`);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/products')}
            className="h-9 w-9 bg-white shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {isEditing ? `Edit: ${existingProduct?.name}` : 'Create New Product'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Update specifications, pricing, stock, or variations'
                : 'Configure a new product item in your WooCommerce catalog'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/products')}
            className="flex-1 sm:flex-none bg-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none gap-1.5 bg-red-600 hover:bg-red-700 text-white"
          >
            <Save className="h-4 w-4" />
            <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form: 8 cols on lg, 9 cols on xl */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* General Information Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">General Information</CardTitle>
                <CardDescription className="text-xs">
                  Basic details and public presentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Minimalist Chronograph Watch"
                    {...register('name')}
                    onChange={handleNameChange}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center rounded-md border border-slate-300 bg-slate-50 px-3 text-xs text-slate-500 overflow-x-auto">
                    <span className="shrink-0">store.com/product/</span>
                    <input
                      {...register('slug')}
                      className="w-full bg-transparent p-2 text-xs font-mono text-slate-800 outline-none min-w-[120px]"
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-xs text-red-600">{errors.slug.message}</p>
                  )}
                </div>

                {/* Short Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Short Description (Summary)
                  </label>
                  <Textarea
                    placeholder="Brief 1-2 sentence teaser shown next to the buy button..."
                    rows={2}
                    {...register('shortDescription')}
                  />
                </div>

                {/* Detailed Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Full Description
                  </label>
                  <Textarea
                    placeholder="Detailed specifications, materials, warranty, care instructions..."
                    rows={4}
                    {...register('description')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Stock Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Pricing & Inventory</CardTitle>
                <CardDescription className="text-xs">
                  SKU, stock thresholds, and regular vs sale price
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* SKU */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      SKU Code <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="WTC-001" {...register('sku')} />
                    {errors.sku && (
                      <p className="text-xs text-red-600">{errors.sku.message}</p>
                    )}
                  </div>

                  {/* Regular Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Regular Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('regularPrice')}
                    />
                    {errors.regularPrice && (
                      <p className="text-xs text-red-600">{errors.regularPrice.message}</p>
                    )}
                  </div>

                  {/* Sale Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Sale Price (₹)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('price')}
                    />
                  </div>
                </div>

                {/* Stock Controls */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Manage Stock Quantity
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Enable automated decrement on order placement
                      </div>
                    </div>
                    <Switch
                      checked={manageStock}
                      onCheckedChange={(val) => setValue('manageStock', val)}
                    />
                  </div>

                  {manageStock && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Stock Quantity Available
                        </label>
                        <Input
                          type="number"
                          min="0"
                          {...register('stockQuantity')}
                        />
                        {errors.stockQuantity && (
                          <p className="text-xs text-red-600">
                            {errors.stockQuantity.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Stock Status
                        </label>
                        <Select
                          value={watch('stockStatus')}
                          onValueChange={(val: any) => setValue('stockStatus', val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instock">In Stock</SelectItem>
                            <SelectItem value="outofstock">Out of Stock</SelectItem>
                            <SelectItem value="onbackorder">On Backorder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Variable Products: Attributes & Variations */}
            {productType === 'variable' && (
              <Card className="border-red-100">
                <CardHeader className="pb-3 bg-red-50/40 rounded-t-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-red-600" />
                        <span>Product Attributes & Variations</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Define option matrices (Sizes, Colors, Materials) and individual SKUs
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleGenerateVariations}
                      className="gap-1 bg-red-600 hover:bg-red-700 text-white text-xs h-8 self-start sm:self-auto"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate Variations</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {/* Attributes Section */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Active Attributes
                    </h4>

                    <div className="space-y-2 mb-3">
                      {attributes.map((attr) => (
                        <div
                          key={attr.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <div>
                            <span className="font-semibold text-xs text-slate-800">
                              {attr.name}:
                            </span>{' '}
                            <span className="text-xs text-slate-600">
                              {attr.options.join(', ')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttribute(attr.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Attribute Row */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Attribute Name (e.g. Size, Color)"
                        value={newAttrName}
                        onChange={(e) => setNewAttrName(e.target.value)}
                        className="sm:w-1/3"
                      />
                      <Input
                        placeholder="Comma separated values (e.g. S, M, L, XL)"
                        value={newAttrOptions}
                        onChange={(e) => setNewAttrOptions(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddAttribute}
                        className="shrink-0"
                      >
                        Add Attribute
                      </Button>
                    </div>
                  </div>

                  {/* Variations Matrix */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Generated Variations ({variations.length})
                      </h4>
                    </div>

                    {variations.length === 0 ? (
                      <div className="p-4 rounded-lg bg-slate-50 text-center text-xs text-slate-500">
                        Click "Generate Variations" above to auto-create variation rows based on attributes.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {variations.map((v) => (
                          <div
                            key={v.id}
                            className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-white text-xs"
                          >
                            <div className="font-medium text-slate-800">
                              {Object.entries(v.attributes)
                                .map(([k, val]) => `${k}: ${val}`)
                                .join(' / ')}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-mono text-[11px]">
                                {v.sku}
                              </span>
                              <span className="font-semibold text-slate-800">
                                ₹{v.price}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px]">
                                Qty: {v.stockQuantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setVariations((prev) =>
                                    prev.filter((item) => item.id !== v.id)
                                  )
                                }
                                className="text-slate-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Image Gallery */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Product Images & Gallery</CardTitle>
                <CardDescription className="text-xs">
                  Upload or link high resolution images for catalog display
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Paste image URL (Unsplash or CDN link)..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddImage}
                    className="gap-1.5 shrink-0 bg-white"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span>Add to Gallery</span>
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="h-full w-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold shadow">
                          Main
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar options: 4 cols on lg, 3 cols on xl */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            {/* Publish Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Status</label>
                  <Select
                    value={watch('status')}
                    onValueChange={(val: any) => setValue('status', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publish">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Product Type
                  </label>
                  <Select
                    value={productType}
                    onValueChange={(val: any) => setValue('type', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple Product</SelectItem>
                      <SelectItem value="variable">Variable Product</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-slate-400">
                    Variable products support size, color, and SKU combinations.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Categories Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Categories</CardTitle>
                <CardDescription className="text-xs">
                  Select matching taxonomy sections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No categories loaded yet.</p>
                ) : (
                  categories.map((cat) => {
                    const isChecked = selectedCategories.includes(cat.name);
                    return (
                      <label
                        key={cat.id}
                        onClick={() => toggleCategory(cat.name)}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 cursor-pointer text-xs"
                      >
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="text-slate-700 font-medium">{cat.name}</span>
                      </label>
                    );
                  })
                )}
                {errors.categories && (
                  <p className="text-xs text-red-600 pt-1">
                    {errors.categories.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
