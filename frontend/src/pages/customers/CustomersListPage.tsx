import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Download,
  Mail,
  ShoppingBag,
  DollarSign,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { useCustomerStore } from '@/store';
import { Customer } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { exportToCSV } from '@/utils/csv';
import { toast } from 'sonner';

export function CustomersListPage() {
  const navigate = useNavigate();
  const { customers, addCustomer } = useCustomerStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Add customer modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    address1: '',
    city: '',
    state: '',
    postcode: '',
    country: 'United States',
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const full = `${c.firstName} ${c.lastName}`.toLowerCase();
      const query = searchTerm.toLowerCase();
      return full.includes(query) || c.email.toLowerCase().includes(query) || c.username.toLowerCase().includes(query);
    });
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('First name, last name, and email are required.');
      return;
    }

    const created = addCustomer({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      username: formData.username || formData.email.split('@')[0],
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
      role: 'Customer',
      billing: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address1: formData.address1,
        city: formData.city,
        state: formData.state,
        postcode: formData.postcode,
        country: formData.country,
        email: formData.email,
        phone: formData.phone,
      },
      shipping: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address1: formData.address1,
        city: formData.city,
        state: formData.state,
        postcode: formData.postcode,
        country: formData.country,
      },
    });

    toast.success(`Customer "${created.firstName} ${created.lastName}" registered.`);
    setAddModalOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      phone: '',
      address1: '',
      city: '',
      state: '',
      postcode: '',
      country: 'United States',
    });
  };

  const handleExport = () => {
    exportToCSV(
      customers.map((c) => ({
        ID: c.id,
        Name: `${c.firstName} ${c.lastName}`,
        Email: c.email,
        Username: c.username,
        Registered: c.registeredDate,
        TotalOrders: c.totalOrders,
        TotalSpent: c.totalSpent,
      })),
      'woocommerce-customers'
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Customers
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View registered buyers, order histories, addresses, and customer profiles.
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
            <span>Export CSV</span>
          </Button>
          <Button
            onClick={() => setAddModalOpen(true)}
            size="sm"
            className="flex-1 sm:flex-none gap-1.5 bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search customers by name, username or email..."
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

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {filteredCustomers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No customers found"
                description="No buyers match your search query."
                actionLabel="Register Customer"
                onAction={() => setAddModalOpen(true)}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Avatar</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <TableCell>
                      <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                        <img
                          src={customer.avatarUrl}
                          alt={customer.firstName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900 text-sm">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {customer.email}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      @{customer.username}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(customer.registeredDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-xs text-slate-700">
                        {customer.totalOrders}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChevronRight className="h-4 w-4 text-slate-400 inline" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Add New Customer
            </DialogTitle>
            <DialogDescription className="text-xs">
              Register a customer profile for offline or administrative purchases.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">First Name *</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Last Name *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Email Address *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Street Address</label>
              <Input
                value={formData.address1}
                onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                placeholder="123 Fifth Ave, Apt 4"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Create Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

