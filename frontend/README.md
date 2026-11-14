# LiliumLoft | Modern WooCommerce Custom React Admin Dashboard

A modern, high-performance eCommerce Admin Dashboard for WooCommerce built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **shadcn/ui**.

Designed specifically for headless commerce management and tailored for high-volume stores with a clean white/light-grey aesthetic, dark primary typography, and crisp red accent branding (`#DC2626`).

---

## 🚀 Key Features & Modules

### 1. 📊 Executive Dashboard
- **Real-Time KPIs**: Total Revenue, Total Orders, Catalog Items, Customer Growth with percentage metrics.
- **Sales Analytics**: Interactive Recharts area chart with date filtering (7 Days, 30 Days, 90 Days).
- **Recent Orders Feed**: Quick inspection of incoming orders, customer identities, line items, and fulfillment statuses.
- **Top Performing Products**: Best-selling units ranked by revenue and volume.
- **Low-Stock Alert Center**: Active inventory watchlist with direct restock links.
- **CSV Summary Export**: One-click extraction of sales summaries.

### 2. 📦 Products Management
- **Catalog Explorer**: Complete product table with thumbnail previews, SKU codes, categories, status badges, price, and stock levels.
- **Search & Multi-Filters**: Filter by category, stock status (In Stock, Low Stock, Out of Stock), and product type.
- **Create & Edit Product**:
  - Supports both **Simple** and **Variable** WooCommerce product types.
  - Tabbed workflow: General Info, Pricing, Inventory (SKU, auto-stock management, thresholds).
  - **Dynamic Attribute & Variation Generator**: Combinatorial generator for sizes, colors, materials, with per-variation SKU and pricing.
  - **Media Gallery Preview**: Dynamic image gallery with featured image selection and deletion.
  - **Zod & React Hook Form Validation**: Type-safe input validation.
- **Product Details View**: In-depth merchandise overview with image gallery preview, specifications, and variation matrices.
- **Taxonomy Categories Manager**: Department management with thumbnail previews, product counters, and creation forms.

### 3. 🛒 Orders Fulfillment & Refunds
- **Order Pipeline**: Orders listing filterable by statuses (*Processing, Completed, On-Hold, Pending, Refunded, Cancelled*).
- **Comprehensive Order Details**:
  - Live order status switcher (*Processing ➔ Completed, etc.*).
  - Customer profile overview with direct navigation to purchase history.
  - Detailed line items with thumbnails, variation attributes, quantities, unit prices, and line totals.
  - Subtotal, shipping freight, coupon discounts, tax totals, and net revenue breakdown.
  - Billing & shipping destination cards.
  - **Refund Interface**: Partial and full refund workflow with amount validation and audit trail.
  - **Order Notes & Timeline**: Internal administrative memos alongside customer-facing notifications.

### 4. 👥 Customer Management
- **Buyer Directory**: Searchable list with avatar images, contact info, total orders placed, and lifetime spend.
- **Customer Details**:
  - Profile insights: Lifetime Value (LTV), Order Count, Average Order Value (AOV).
  - Complete chronological order history table.
  - Editable default billing and shipping addresses.
  - Administrative customer notes.
- **Customer Registration Dialog**: Register offline or custom retail buyers.

### 5. 📦 Inventory & Stock Control
- **Stock Audit Dashboard**: Counters for Total Tracked Items, Normal Stock, Low Stock (≤ 5 units), and Out of Stock (0 units).
- **Quick-Adjustment Modal**:
  - Supports `Set Exact Quantity`, `+ Add Incoming Stock`, and `- Deduct Shrinkage/Damaged`.
  - Reference note logging (e.g. PO numbers, cycle count audits).
- **Inventory CSV Export**.

### 6. 🏷️ Coupons & Promotions
- **Promotion Center**: Table of active and expired coupons with usage counters and limit caps.
- **Coupon Creator & Editor**:
  - Code generation (e.g. `WELCOME10`, `FREESHIP50`).
  - Discount types: Percentage (%), Fixed Cart ($), Fixed Product ($).
  - Expiry date configuration, minimum/maximum spend thresholds, and restrictions (*Individual use only*, *Exclude sale goods*).
  - One-click copy code functionality.

### 7. 📈 Reports & Analytics
- **Sales Analytics**: Gross vs. Net revenue bar chart comparisons across time periods.
- **Category & Department Reports**: Units sold and revenue volume per department.
- **Customer Cohorts**: New vs. returning customer trends over time.
- **Multi-Dataset CSV Exports**: Instant download of CSV reports for accounting and analysis.

### 8. 🚚 Shipping Zones & Methods
- **Geographic Zones**: Manage fulfillment zones (*Domestic USA, Europe & UK, Rest of World*).
- **Rate Methods**: Flat Rate, Free Shipping, Local Curbside Pickup with cost configuration and taxability toggles.
- **Freight Rules**: Toggle shipping calculations and delivery destination logic.

### 9. 💳 Payment Processors & Ledger
- **Gateway Management**: Configure and toggle *Stripe Credit/Debit Cards, PayPal Express, Direct Bank Transfer (BACS)*, and *Cash on Delivery (COD)*.
- **Processor Settings**: Display titles, checkout descriptions, customer instructions, and sandbox/test mode.
- **Transaction Ledger**: Real-time table of transaction IDs, order associations, gateways, statuses, and amounts.

### 10. ⚙️ Global WooCommerce Settings
- **General**: Store address, city, country, currency selection, position, and formatting.
- **Products**: Weight & dimension units, product review and rating toggles, stock threshold notifications.
- **Tax**: Automated tax calculation options, address baseline, standard tax percentage rate.
- **Shipping**: Freight calculation toggles and destination defaults.
- **Payments**: Guest checkout permissions and SSL enforcement.
- **Emails**: Dispatcher name, sender email, transactional notification toggles, and email footer text.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: React 18 with TypeScript
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS with custom Red branding (`#DC2626`)
- **UI Components**: shadcn/ui primitives built on Radix UI
- **Icons**: Lucide React
- **Charting**: Recharts
- **State Management**: Zustand with automated `localStorage` persistence
- **Forms & Validation**: React Hook Form + Zod
- **Data Caching & Async Queries**: TanStack Query
- **Notifications**: Sonner

### Folder Structure
```
src/
├── components/
│   ├── layout/         # Sidebar, TopHeader, MobileNav, SearchModal, Notifications, Breadcrumbs
│   └── ui/             # Reusable shadcn/ui primitives (Button, Card, Dialog, Table, Tabs, etc.)
├── pages/
│   ├── dashboard/      # Executive Dashboard
│   ├── products/       # Products List, Form, Details, Categories
│   ├── orders/         # Orders List, Order Details & Refunds
│   ├── customers/      # Customers List, Customer Profile & History
│   ├── inventory/      # Stock Overview & Quick Adjustment
│   ├── coupons/        # Promotion Codes & Discounts
│   ├── reports/        # Analytics Charts & Data Slices
│   ├── shipping/       # Shipping Zones & Methods
│   ├── payments/       # Gateways & Transaction Ledger
│   └── settings/       # Global Store Configuration
├── schemas/            # Zod validation schemas
├── services/           # Mock data and WooCommerce-ready service contracts
├── store/              # Zustand stores with localStorage persistence
├── types/              # Domain TypeScript interfaces
├── utils/              # Formatting, CSV export, Tailwind helper (cn)
├── App.tsx             # React Router v7 configuration
├── index.css           # Tailwind base styles and theme tokens
└── main.tsx            # Application entrypoint
```

---

## 💻 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v22)
- npm or pnpm

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

