import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNameMap: Record<string, string> = {
  products: 'Products',
  new: 'Create Product',
  edit: 'Edit Product',
  categories: 'Categories',
  orders: 'Orders',
  customers: 'Customers',
  inventory: 'Inventory',
  coupons: 'Coupons',
  reports: 'Reports',
  shipping: 'Shipping',
  payments: 'Payments',
  settings: 'Settings',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return (
      <div className="flex items-center text-xs text-slate-500 mb-4">
        <Home className="h-3.5 w-3.5 mr-1 text-slate-400" />
        <span className="font-medium text-slate-700">Dashboard</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-4 overflow-x-auto whitespace-nowrap py-0.5 scrollbar-none">
      <Link
        to="/"
        className="flex items-center hover:text-red-600 transition-colors text-slate-400"
      >
        <Home className="h-3.5 w-3.5 mr-1" />
        <span>Dashboard</span>
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const name = routeNameMap[value] || (value.startsWith('ord-') || value.startsWith('prod-') || value.startsWith('cust-') ? `#${value}` : value);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            {isLast ? (
              <span className="font-semibold text-slate-800 capitalize">{name}</span>
            ) : (
              <Link to={to} className="hover:text-red-600 transition-colors capitalize">
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

