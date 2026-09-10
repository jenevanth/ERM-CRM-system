# Apex Operations Portal - Mini ERP & CRM UI Progress Tracker

> **Tracking Document**: Built against specifications defined in `/developer-docs/detailed_specs.md` and `/developer-docs/plan.md`.  
> **System Scope**: Production-ready B2B internal operations portal for a wholesale distribution enterprise supporting 4 organizational roles: **Admin**, **Sales**, **Warehouse**, and **Accounts**.

---

## 1. System Architecture & Foundation

- [x] **Relational Schema (PostgreSQL 17 on Supabase)**
  - [x] `profiles` table with role check constraint (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`)
  - [x] `customers` table with dual-compatibility columns (`company` + `business_name`, `gstin` + `gst_number`, `customer_type`, `status`, `follow_up_date`, `notes`)
  - [x] Bi-directional synchronization trigger (`sync_customer_fields`) ensuring backward compatibility
  - [x] `products` table with SKU indexing, categories, unit pricing, real-time stock balances, and low-stock threshold triggers
  - [x] `challans` table with sequential reference numbering (`CH-YYYYMMDD-XXXX`), status transitions (`DRAFT`, `CONFIRMED`, `CANCELLED`), and customer associations
  - [x] `challan_items` table with historical snapshot data (`product_name_snapshot`, `sku_snapshot`, `unit_price_snapshot`)
  - [x] `stock_movements` ledger table for append-only audit trail with movement types (`IN`, `OUT`, `ADJUSTMENT`)
  - [x] `followups` / `customer_followups` table and view for CRM interaction timelines
  - [x] Automatic profile provisioning trigger (`handle_new_user`) for new Supabase signups
- [x] **Backend Infrastructure (FastAPI + asyncpg)**
  - [x] Root health directory route (`GET /`) returning 200 OK
  - [x] Connection pooling via `asyncpg` with graceful lifecycle management
  - [x] Supabase JWT authentication middleware with cached JWKS retrieval (supporting both ES256 and HS256 tokens)
  - [x] Permissive CORS policy accommodating localhost and Vercel preview environments (`https://*.vercel.app`)
  - [x] Centralized error handlers for 400 (Bad Request / Insufficient Stock), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 422 (Validation), and 500 (Internal Server Error)
- [x] **Frontend Infrastructure (React + TypeScript + Vite + Tailwind CSS)**
  - [x] Enterprise Design System tokens (CSS custom variables for surface containers, typography hierarchy, status badges)
  - [x] Axios API client with automatic token attachment, base URL normalization, and 401 interceptor
  - [x] React Router v7 application layout with collapsible sidebar and active tab indicators
  - [x] TypeScript build validation with zero type errors

---

## 2. Authentication & 4 Enterprise Roles

- [x] **Live Provisioned Test Accounts**:
  - [x] **Admin**: `admin@apex.in` / `Admin@123` (Full system access, inventory overrides, challan cancellation)
  - [x] **Sales**: `sales@apex.in` / `Sales@123` (Customer management, CRM follow-ups, challan drafting and confirmation)
  - [x] **Warehouse**: `warehouse@apex.in` / `Warehouse@123` (Stock movement logs, inventory adjustments, GRN receipts)
  - [x] **Accounts**: `accounts@apex.in` / `Accounts@123` (Customer records, challan audits, invoice ledgers)
- [x] **Auth Flows**:
  - [x] Email/password login with Supabase Auth integration
  - [x] Session persistence via `localStorage` with real-time profile hydration (`GET /api/auth/me`)
  - [x] Role registration with role selector dropdown (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`)
  - [x] Logout flow with clean token clearance and route redirection

---

## 3. Customer CRM & Relationship Management

- [x] **Customer Directory (`/customers`)**:
  - [x] Paginated table with search by name, business entity, phone, or GSTIN
  - [x] Filter by lifecycle status (`ACTIVE`, `LEAD`, `INACTIVE`)
  - [x] Status badges with enterprise color coding
  - [x] Total customer count badge
  - [x] Action button linking directly to customer dossier
- [x] **Add Customer Modal & Route (`/customers/new`)**:
  - [x] Interactive modal opened via "Add Customer" button or `/customers/new` URL
  - [x] Required validation for Contact Name and Mobile Number
  - [x] Form fields: Business Name, Email, GSTIN, Customer Classification (`WHOLESALE`, `RETAIL`, `DISTRIBUTOR`), Status, Follow-up Date, Address, Notes
  - [x] Instant `POST /api/customers` submission with error handling
  - [x] Table refresh and direct redirection to new customer profile
- [x] **Customer Dossier & Follow-up Timeline (`/customers/:id`)**:
  - [x] Comprehensive account dossier (Contact Person, Entity, GSTIN, Address, Internal Notes)
  - [x] Next scheduled follow-up countdown card
  - [x] "Edit Profile" modal with full `PUT /api/customers/:id` support
  - [x] CRM Follow-ups timeline (`GET /api/customers/:id/followups`) displaying chronological history
  - [x] "Record New Interaction" quick form (`POST /api/customers/:id/followups`) for logging phone calls, quotes, and next follow-up dates
  - [x] Associated Sales Challans table (`GET /api/challans?customer_id=:id`) with direct links

---

## 4. Product Catalog & Inventory Operations

- [x] **Products Catalog (`/products`)**:
  - [x] Paginated product table with search by name or SKU
  - [x] "Low stock only" filter toggle
  - [x] Dynamic visual stock level progress bar compared against minimum threshold
  - [x] Stock warning badges for depleted or low inventory items
- [x] **Add & Edit Product Modals (`/products/new`)**:
  - [x] "Add Product" modal with SKU auto-generator, Category, Unit Price, Initial Stock, Minimum Threshold, and Warehouse Bay
  - [x] "Edit Product" modal for updating pricing, minimum reorder thresholds, and warehouse locations
  - [x] Instant validation and automatic table refresh
- [x] **Inventory & Stock Ledger (`/inventory`)**:
  - [x] Tabbed interface switching between "Current Stock Balances" and "Movement Audit Ledger"
  - [x] Stock adjustment modal supporting Goods Receipt (`INWARD_GRN`), Physical Audit (`ADJUSTMENT`), and Damaged Write-off (`DAMAGE`)
  - [x] Audit ledger tracking SKU, delta quantity, movement type, reason, user, and timestamp

---

## 5. Sales Challan Engine (Core Business Logic)

- [x] **Challan Listing (`/challans`)**:
  - [x] Paginated list with search by challan number and status filter (`DRAFT`, `CONFIRMED`, `CANCELLED`)
  - [x] Total quantity, item line count, customer details, and timestamp display
- [x] **Create Sales Challan (`/challans/new`)**:
  - [x] Customer selector with auto-selection support from URL parameter (`?customer_id=...`)
  - [x] Dynamic line item builder with product selector, quantity steppers, and pricing calculations
  - [x] Real-time warehouse balance validation with deficit indicators
  - [x] Dispatch details (Transporter, Vehicle number, Notes)
  - [x] Dual-action submission:
    - [x] **Save as Draft**: Creates challan in `DRAFT` status without deducting stock or checking shortages
    - [x] **Validate & Confirm**: Performs immediate stock decrement inside a database transaction
  - [x] Robust error handling preventing React object child crashes
- [x] **Transaction & Concurrency Safety (`POST /api/challans/:id/confirm`)**:
  - [x] PostgreSQL transaction with row-level locking (`SELECT FOR UPDATE`) on products
  - [x] Atomic verification that `current_stock >= requested_quantity` for every item
  - [x] 100% rollback on any shortage with HTTP 400 error and descriptive deficit message
  - [x] Immediate deduction of physical inventory on success
  - [x] Automatic creation of `OUT` stock movement records linked to the challan
  - [x] Immutable product snapshot retention (`name`, `sku`, `unit_price`) on `challan_items`
- [x] **Challan Details & Dispatch Dossier (`/challans/:id`)**:
  - [x] Printable enterprise delivery challan layout
  - [x] Customer shipping address, GSTIN, and transporter details
  - [x] Itemized snapshot table with SKU, description, unit price, quantity, and subtotal
  - [x] "Confirm Challan" button for pending drafts
  - [x] "Cancel Challan" button (Admin only) with automatic stock restoration

---

## 6. Executive Dashboard & Metrics (`/` and `/dashboard`)

- [x] Key Performance Indicator (KPI) metric cards:
  - [x] Total Active Customers count
  - [x] Total Product SKUs count
  - [x] Low Stock alerts count
  - [x] Confirmed Delivery Challans count
- [x] Quick Action shortcuts:
  - [x] New Sales Challan
  - [x] Add Wholesale Customer
  - [x] Catalog Product
  - [x] Adjust Physical Stock
- [x] Recent activity feed showing latest dispatch challans and CRM follow-ups

---

## 7. Verification & Quality Assurance

- [x] **Automated Flow Testing**:
  - [x] Automated test script (`test_customer_challan_flow.py`) passing 100%
  - [x] Add Customer -> Verify HTTP 201
  - [x] Log CRM Follow-up -> Verify HTTP 201
  - [x] Create Draft Challan -> Verify HTTP 201 & zero stock decrement
  - [x] Confirm Challan -> Verify HTTP 200 & exact stock reduction
  - [x] Attempt Overdraft -> Verify HTTP 400 rejection with detailed error
- [x] **Frontend Production Build**:
  - [x] Vite + TypeScript build compiles with zero errors (`tsc -b && vite build`) in 1.70s
- [x] **Git Version Control**:
  - [x] Synchronized on branches `main` and `Jenevanth`
  - [x] All commits pushed to GitHub remote repository (`https://github.com/jenevanthm/ERM-CRM-system.git`)

---

## 8. Summary Status

| Feature / Module | Status | Notes |
|---|---|---|
| **Add New Customer** | ✅ Complete | Interactive modal + `/customers/new` route + validation |
| **Customer Dossier** | ✅ Complete | Profile view + Edit modal + CRM follow-up timeline |
| **New Sales Challan** | ✅ Complete | Draft creation + Snapshot records + Concurrency lock confirm |
| **Add New Product** | ✅ Complete | Interactive modal + SKU generator + validation |
| **Inventory Ledger** | ✅ Complete | Stock balances + Inward GRN / Audit / Damage adjustments |
| **4 Roles RBAC** | ✅ Complete | Admin, Sales, Warehouse, Accounts configured across backend & UI |
| **Vercel & Supabase** | ✅ Complete | Compatible with production hosting and preview deployments |
