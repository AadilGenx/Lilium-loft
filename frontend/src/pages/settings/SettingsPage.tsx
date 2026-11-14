import React, { useState } from 'react';
import {
  Settings,
  Store,
  Package,
  Receipt,
  Truck,
  CreditCard,
  Mail,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSettingsStore } from '@/store';
import { SettingsState } from '@/types';
import { toast } from 'sonner';

export function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('general');
  const [formState, setFormState] = useState<SettingsState>(settings);

  const handleSave = (section: keyof SettingsState) => {
    updateSettings(section, formState[section]);
    toast.success(`${section.toUpperCase()} settings saved successfully.`);
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          WooCommerce Store Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure global store parameters, catalog units, tax policies, and automated notifications.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-1.5 text-xs">
            <Store className="h-3.5 w-3.5" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5 text-xs">
            <Package className="h-3.5 w-3.5" />
            <span>Products</span>
          </TabsTrigger>
          <TabsTrigger value="tax" className="gap-1.5 text-xs">
            <Receipt className="h-3.5 w-3.5" />
            <span>Tax</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-1.5 text-xs">
            <Truck className="h-3.5 w-3.5" />
            <span>Shipping</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Payments</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5 text-xs">
            <Mail className="h-3.5 w-3.5" />
            <span>Emails</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. General Settings */}
        <TabsContent value="general" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Store Address & Currency</CardTitle>
                <CardDescription className="text-xs">
                  Basic store identification and localization
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => handleSave('general')}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs self-start sm:self-auto"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save General</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Store Name</label>
                <Input
                  value={formState.general.storeName}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      general: { ...formState.general, storeName: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Street Address</label>
                <Input
                  value={formState.general.storeAddress}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      general: { ...formState.general, storeAddress: e.target.value },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">City</label>
                  <Input
                    value={formState.general.storeCity}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        general: { ...formState.general, storeCity: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Postcode / ZIP</label>
                  <Input
                    value={formState.general.storePostcode}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        general: { ...formState.general, storePostcode: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Country / State</label>
                  <Input
                    value={formState.general.storeCountry}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        general: { ...formState.general, storeCountry: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Store Currency</label>
                  <Select
                    value={formState.general.storeCurrency}
                    onValueChange={(val) =>
                      setFormState({
                        ...formState,
                        general: { ...formState.general, storeCurrency: val },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">United States Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Currency Position</label>
                  <Select
                    value={formState.general.currencyPosition}
                    onValueChange={(val: any) =>
                      setFormState({
                        ...formState,
                        general: { ...formState.general, currencyPosition: val },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left (₹99)</SelectItem>
                      <SelectItem value="right">Right (99₹)</SelectItem>
                      <SelectItem value="left_space">Left with space (₹ 99)</SelectItem>
                      <SelectItem value="right_space">Right with space (99 ₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Products Settings */}
        <TabsContent value="products" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Measurements & Stock Alerts</CardTitle>
                <CardDescription className="text-xs">
                  Physical units and automated threshold warnings
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => handleSave('products')}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs self-start sm:self-auto"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Products</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Weight Unit</label>
                  <Select
                    value={formState.products.weightUnit}
                    onValueChange={(val) =>
                      setFormState({
                        ...formState,
                        products: { ...formState.products, weightUnit: val },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                      <SelectItem value="oz">Ounces (oz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Dimension Unit</label>
                  <Select
                    value={formState.products.dimensionUnit}
                    onValueChange={(val) =>
                      setFormState({
                        ...formState,
                        products: { ...formState.products, dimensionUnit: val },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">Centimeters (cm)</SelectItem>
                      <SelectItem value="m">Meters (m)</SelectItem>
                      <SelectItem value="in">Inches (in)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Low Stock Threshold</label>
                  <Input
                    type="number"
                    value={formState.products.lowStockThreshold}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        products: {
                          ...formState.products,
                          lowStockThreshold: Number(e.target.value),
                        },
                      })
                    }
                  />
                  <span className="text-[11px] text-slate-400">
                    Triggers warning badge when units fall to or below this count.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Alert Recipient Email</label>
                  <Input
                    type="email"
                    value={formState.products.notificationRecipient}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        products: {
                          ...formState.products,
                          notificationRecipient: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">Enable Product Reviews</div>
                    <div className="text-slate-400">Allow customers to submit verified buyer reviews</div>
                  </div>
                  <Switch
                    checked={formState.products.enableReviews}
                    onCheckedChange={(val) =>
                      setFormState({
                        ...formState,
                        products: { ...formState.products, enableReviews: val },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">Star Ratings</div>
                    <div className="text-slate-400">Require 1 to 5 star ratings on reviews</div>
                  </div>
                  <Switch
                    checked={formState.products.enableProductRatings}
                    onCheckedChange={(val) =>
                      setFormState({
                        ...formState,
                        products: { ...formState.products, enableProductRatings: val },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Tax Settings */}
        <TabsContent value="tax" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Tax Rates & Calculations</CardTitle>
                <CardDescription className="text-xs">
                  WooCommerce automated VAT/sales tax rules
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => handleSave('tax')}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs self-start sm:self-auto"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Tax</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Enable Taxes & Calculations</div>
                  <div className="text-slate-400">Calculate tax during checkout calculation</div>
                </div>
                <Switch
                  checked={formState.tax.enableTaxes}
                  onCheckedChange={(val) =>
                    setFormState({
                      ...formState,
                      tax: { ...formState.tax, enableTaxes: val },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Calculate Tax Based On</label>
                  <Select
                    value={formState.tax.calculateTaxBasedOn}
                    onValueChange={(val: any) =>
                      setFormState({
                        ...formState,
                        tax: { ...formState.tax, calculateTaxBasedOn: val },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shipping">Customer Shipping Address</SelectItem>
                      <SelectItem value="billing">Customer Billing Address</SelectItem>
                      <SelectItem value="base">Shop Base Address</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Standard Tax Rate (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formState.tax.standardTaxRate}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        tax: { ...formState.tax, standardTaxRate: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Shipping Settings */}
        <TabsContent value="shipping" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Shipping Destination Options</CardTitle>
                <CardDescription className="text-xs">
                  Control address defaults and freight calculation
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => handleSave('shipping')}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs self-start sm:self-auto"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Shipping</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Enable Shipping</div>
                  <div className="text-slate-400">Offer shipping methods at checkout</div>
                </div>
                <Switch
                  checked={formState.shipping.enableShipping}
                  onCheckedChange={(val) =>
                    setFormState({
                      ...formState,
                      shipping: { ...formState.shipping, enableShipping: val },
                    })
                  }
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="font-semibold text-slate-700">Shipping Destination</label>
                <Select
                  value={formState.shipping.shippingDestination}
                  onValueChange={(val: any) =>
                    setFormState({
                      ...formState,
                      shipping: { ...formState.shipping, shippingDestination: val },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipping">Default to customer shipping address</SelectItem>
                    <SelectItem value="billing">Default to customer billing address</SelectItem>
                    <SelectItem value="force_billing">Force shipping to billing address</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Payments Settings */}
        <TabsContent value="payments" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Payment Policies</CardTitle>
                <CardDescription className="text-xs">
                  Checkout access controls and gateway defaults
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => handleSave('payments')}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs self-start sm:self-auto"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Payments</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Allow Guest Checkout</div>
                  <div className="text-slate-400">Enable buyers to order without creating an account</div>
                </div>
                <Switch
                  checked={formState.payments.allowGuestCheckout}
                  onCheckedChange={(val) =>
                    setFormState({
                      ...formState,
                      payments: { ...formState.payments, allowGuestCheckout: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <div className="font-semibold text-slate-800">Enforce SSL / HTTPS</div>
                  <div className="text-slate-400">Force encrypted payment transmission on checkout</div>
                </div>
                <Switch
                  checked={formState.payments.enforceSsl}
                  onCheckedChange={(val) =>
                    setFormState({
                      ...formState,
                      payments: { ...formState.payments, enforceSsl: val },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Email Settings */}
        <TabsContent value="email" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Automated Email Notifications</CardTitle>
                <CardDescription className="text-xs">
                  WooCommerce transactional templates and dispatch headers
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => handleSave('email')}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs self-start sm:self-auto"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Emails</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">"From" Sender Name</label>
                  <Input
                    value={formState.email.senderName}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        email: { ...formState.email, senderName: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">"From" Email Address</label>
                  <Input
                    type="email"
                    value={formState.email.senderEmail}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        email: { ...formState.email, senderEmail: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">Admin New Order Alert</div>
                    <div className="text-slate-400">Send confirmation to store manager on new purchases</div>
                  </div>
                  <Switch
                    checked={formState.email.adminNewOrder}
                    onCheckedChange={(val) =>
                      setFormState({
                        ...formState,
                        email: { ...formState.email, adminNewOrder: val },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">Customer Completed Order Email</div>
                    <div className="text-slate-400">Send shipment tracking notification when fulfilled</div>
                  </div>
                  <Switch
                    checked={formState.email.customerCompletedOrder}
                    onCheckedChange={(val) =>
                      setFormState({
                        ...formState,
                        email: { ...formState.email, customerCompletedOrder: val },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <label className="font-semibold text-slate-700">Email Footer Copyright Text</label>
                <Textarea
                  rows={2}
                  value={formState.email.emailFooterText}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      email: { ...formState.email, emailFooterText: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
