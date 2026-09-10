# Mini ERP + CRM Operations Portal

Full stack operations portal for a wholesale distribution business to manage customers, product catalog, warehouse stock balances, and sales delivery challans with role-based access control.

---

## 1. Project Links

- **GitHub Repository**: [https://github.com/jenevanthm/ERM-CRM-system](https://github.com/jenevanthm/ERM-CRM-system)
- **Live Frontend Application**: [https://erm-crm-system.vercel.app](https://erm-crm-system.vercel.app) *(or `http://localhost:5173` locally)*
- **Live Backend API (Swagger UI)**: `http://localhost:8000/docs` *(API Base: `http://localhost:8000/api`)*
- **Postman Collection**: Included in repository root as `Apex_Wholesale_ERP.postman_collection.json`

---

## 2. Test Login Credentials & Features by Role

You can log in manually using the credentials below, or click any of the 4 quick demo login buttons on the login page (`/login`).

### Features in Admin Login
- **Email**: `admin@apex.in`
- **Password**: `Admin@123`
- **Role**: `ADMIN`
- **Features**:
  - Executive Dashboard with KPI cards (Active Customers, Catalog SKUs, Low Stock warnings, Today's Dispatches).
  - Customer CRM: Add customer, Edit customer, Search customer by name/mobile/company/GSTIN, View customer dossier, and Log follow-up notes.
  - Product Catalog: Add new product with automatic SKU generator, Edit unit price, reorder thresholds, and warehouse bays.
  - Inventory Operations: Record stock inward (GRN receipts), log physical audit adjustments, and write off damaged stock.
  - Stock Movement Ledger: Full append-only audit trail tracking every IN and OUT transaction with operator name, reason, and timestamp.
  - Sales Challans: Create draft challans, Confirm & Dispatch with atomic stock deduction, Print challan delivery receipts, and Cancel challan (with automatic stock restoration).
  - Full system privileges to manage roles and data records.

---

### Features in Sales Login
- **Email**: `sales@apex.in`
- **Password**: `Sales@123`
- **Role**: `SALES`
- **Features**:
  - Customer CRM: Add new wholesale/retail customers, Edit customer profiles, and View customer details.
  - CRM Timeline: Schedule next follow-up dates and record interaction notes (phone calls, price quotes, feedback).
  - Customer Search: Instant search across contact person, company name, mobile, and GSTIN.
  - Product Catalog: Browse items and check live available stock levels before taking customer orders (read-only).
  - Create Sales Challan:
    - Select existing customer (or open directly from customer profile).
    - Add multiple products with real-time stock availability indicators.
    - Set custom wholesale unit prices and order quantities.
    - Automatic sequential challan number generation (`CH-YYYYMMDD-XXXX`).
    - Save as Draft (without affecting physical stock).
    - Validate & Confirm (immediately locks rows and reduces warehouse stock).
  - Print Challan: Generate clean printable delivery challans with customer address, GSTIN, transporter details, and item snapshots.

---

### Features in Warehouse Login
- **Email**: `warehouse@apex.in`
- **Password**: `Warehouse@123`
- **Role**: `WAREHOUSE`
- **Features**:
  - Product Cataloging: Add new products to warehouse catalog and update aisle/bay storage locations.
  - Inward Stock Receipts: Record incoming supplier goods (GRN) with batch reference notes.
  - Stock Adjustments: Record physical stock audit adjustments and report damaged write-offs.
  - Stock Warning Dashboard: View products with critical stock levels (stock <= minimum threshold).
  - Movement History: Inspect complete log of all inventory changes (both manual inwards and sales dispatch deductions).
  - Challan Reference: View dispatch challans to verify quantities for picking and packing.

---

### Features in Accounts Login
- **Email**: `accounts@apex.in`
- **Password**: `Accounts@123`
- **Role**: `ACCOUNTS`
- **Features**:
  - Financial Verification: Review all delivery challans across Draft, Confirmed, and Cancelled statuses.
  - Snapshot Pricing Audit: View immutable product snapshot prices stored at the time of order confirmation.
  - Tax & Total Calculations: Inspect item line totals, 18% GST calculations, and final invoice values.
  - Customer Records: Review customer billing profiles, registered business entities, and GST numbers.
  - Challan Printing: Print physical challans and delivery notes for tax and audit compliance.
  - Inventory Valuation: Audit the stock movements ledger for inwards and outwards balance tracking.

---

## 3. Core Modules Implemented

### 1. Authentication and Roles
- Role-based authorization across 4 distinct roles: `ADMIN`, `SALES`, `WAREHOUSE`, and `ACCOUNTS`.
- JWT-based authentication using Supabase Auth with cached JWKS signature verification.
- Fast one-click demo login buttons on the login page for effortless testing.
- 4 clear logout mechanisms: Topbar quick button, Topbar profile dropdown, Dashboard header button, and Sidebar footer button.

### 2. Customer CRM Module
- Fields: Customer Name, Mobile Number, Email, Business Name, GST Number (optional), Customer Type (Retail, Wholesale, Distributor), Address, Status (Lead, Active, Inactive), Follow-up Date, Notes.
- Features: Add customer, Edit customer modal, Search customer, Customer detail dossier, and Follow-up interaction log timeline.

### 3. Product & Inventory Module
- Fields: Product Name, SKU code, Category, Unit Price, Current Stock, Minimum Stock alert quantity, Location / Warehouse bay.
- Features: Add product with SKU generator, Edit product modal, Real-time low stock progress bars.
- Stock Movement Log: Append-only ledger recording Product, Quantity changed, Movement type (`IN` or `OUT`), Reason, Created by, and Timestamp.

### 4. Sales Challan Module
- Capabilities:
  - Select customer from searchable list.
  - Add multiple products with dynamic row builder.
  - Auto-generated sequential challan numbers (`CH-YYYYMMDD-XXXX`).
  - Dual action: "Save as Draft" or "Validate & Confirm".
- Business Logic:
  - Row-level lock (`SELECT ... FOR UPDATE`) during confirmation.
  - Atomic stock reduction on confirmation.
  - Prevents negative inventory: rejects orders exceeding available stock with an informative error message.
  - Stores immutable product snapshot data (`product_name_snapshot`, `sku_snapshot`, `unit_price_snapshot`) on each line item.
  - Admin-only cancellation feature that automatically restores physical stock back into inventory.

---

## 4. How to Run Locally

### Prerequisites
- Node.js 18+ and npm
- Python 3.12+ and pip
- Git

### 1. Clone Repository
```bash
git clone https://github.com/jenevanthm/ERM-CRM-system.git
cd ERM-CRM-system
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database schema (already initialized on Supabase, or run database/schema.sql on your PostgreSQL)
# Start the backend server
uvicorn app.main:app --reload --port 8000
```
Backend will be live at: `http://localhost:8000`  
Swagger API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
# In a new terminal tab, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
Frontend will be live at: `http://localhost:5173`

---

## 5. Environment Variables

### Backend (`.env` in `backend/` or root)
```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
PORT=8000
```

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:8000/api
```

---

## 6. Architecture & Concurrency Control

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Axios, and React Router v7. Includes global error boundaries and clean responsive components.
- **Backend**: FastAPI with async connection pooling (`asyncpg`). Clean modular structure separating router, schemas, and SQL repositories.
- **Database**: PostgreSQL 17 on Supabase with foreign keys, constraints, and audit tables.
- **Concurrency & Race Condition Prevention**:
  When a sales challan is confirmed, PostgreSQL acquires an exclusive row lock on the affected product rows:
  ```sql
  SELECT id, name, current_stock, minimum_stock 
  FROM products 
  WHERE id = ANY($1::uuid[]) 
  FOR UPDATE;
  ```
  If any SKU balance is less than the requested quantity, the entire transaction rolls back immediately and returns HTTP 400 with the exact available vs requested amounts.

---

## 7. Known Limitations

- **Image Uploads**: Product images currently use predefined UI category badges; AWS S3 image storage is optional and not connected.
- **Email Dispatch**: CRM follow-up reminders are recorded in database timelines; external SMTP/SES email delivery is not configured.
- **Invoice Export**: Challan printing uses native browser print stylesheets (`window.print()`); server-side headless Chromium PDF generation is not enabled.
