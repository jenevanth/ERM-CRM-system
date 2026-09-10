# Case Study Submission: Mini ERP + CRM Operations Portal

## 1. GitHub Repository Link
- https://github.com/jenevanth/ERM-CRM-system

## 2. Live Frontend URL
- https://erm-crm-system.vercel.app

## 3. Live Backend API URL
- Backend Base URL: `http://localhost:8000` (Local / Hosted API)
- Interactive API Docs (Swagger): `http://localhost:8000/docs`
- Alternative Docs (ReDoc): `http://localhost:8000/redoc`

---

## 4. Test Login Credentials & Role Permissions

You can log in with any of the following credentials or use the 1-click demo buttons on the login page:

| Role | Email | Password | What this role can do |
|---|---|---|---|
| **Admin** | `admin@apex.in` | `Admin@123` | Has full access to everything: Add/edit customers, add/edit products, create and confirm challans, make inventory adjustments, view reports, and log out. |
| **Sales** | `sales@apex.in` | `Sales@123` | Manages customers, adds follow-up notes, checks product stock levels, and creates/confirms delivery challans. Cannot edit core product master data. |
| **Warehouse** | `warehouse@apex.in` | `Warehouse@123` | Adds and edits products, assigns aisle/shelf locations, records stock IN/OUT movements with reasons, and monitors low stock alerts. |
| **Accounts** | `accounts@apex.in` | `Accounts@123` | Views customer details, verifies delivery challans, checks price snapshots, and prints delivery notes. Cannot alter stock directly. |

---

## 5. Page-by-Page Feature Breakdown

Here is what is built and what exists on every page of the application:

### 1. Login Page (`/login`)
- Email and password login form with JWT authentication.
- Quick 1-click demo buttons for **Admin**, **Sales**, **Warehouse**, and **Accounts** to test each role instantly.
- Error alerts for invalid credentials.

### 2. Dashboard (`/` or `/dashboard`)
- Summary cards showing: Total Active Customers, Total Products, Total Stock Units, Low Stock Alert Items, and Total Challans.
- Quick action buttons to jump straight to Add Customer or New Challan.
- Recent Challans table showing status badges (Draft, Confirmed, Cancelled).
- Low Stock warning table highlighting items that have fallen below their minimum stock threshold.
- User status pill and quick Sign Out button in the header.

### 3. Customers CRM (`/customers`)
- Search bar to search customers by Name, Business Name, Mobile, or Email.
- Filter by Customer Type (`Retail`, `Wholesale`, `Distributor`) and Status (`Lead`, `Active`, `Inactive`).
- **Add Customer Modal** with all required fields:
  - Customer Name
  - Mobile Number
  - Email Address
  - Business Name
  - GST Number (optional)
  - Customer Type dropdown
  - Full Address
  - Status dropdown
  - Follow-up Date picker
  - Initial Notes
- Table listing all customers with phone, business, customer type badge, status badge, and next follow-up date.
- Click any customer row to open their full detail page.

### 4. Customer Detail & Follow-ups (`/customers/:id`)
- Complete customer profile card with contact info, GST, and address.
- **Edit Customer** button to update customer information in place.
- **Follow-up Notes Section**:
  - Input box to write and post new interaction notes.
  - Timeline of all previous notes with timestamp and the user who added it.
  - Quick date picker to update the next scheduled follow-up date.
- **Challan History**: List of all challans generated for this specific customer.

### 5. Products Catalog (`/products`)
- Search bar to filter products by name or SKU.
- Category filter dropdown.
- **Add Product Modal**:
  - Product Name
  - SKU / Code
  - Category
  - Unit Price
  - Starting Current Stock
  - Minimum Stock Alert Quantity
  - Location / Warehouse (e.g. Aisle 3, Shelf B)
- **Edit Product Modal**: Allows changing name, category, price, minimum alert level, and warehouse location.
- Stock level color indicators (Green for normal, Amber/Red for low stock).

### 6. Inventory & Stock Movements (`/inventory`)
- Current stock table showing SKU, category, on-hand quantity, minimum quantity, and aisle location.
- Low stock warning banner showing count of critical items.
- **Stock Movement Log Table** tracking every inventory change:
  - Product Name and SKU
  - Quantity Changed (e.g., `+50` or `-10`)
  - Movement Type (`IN` for inwards/purchases, `OUT` for dispatch/damages)
  - Reason (e.g., "Supplier Purchase", "Damage Write-off", "Challan CH-xxx confirmed")
  - Created By (user email/name)
  - Exact Timestamp
- **Manual Stock Adjustment Modal** (for Warehouse/Admin): Add or remove stock with a mandatory reason note.

### 7. Sales Challans List (`/challans`)
- Search bar to search by Challan number or Customer name.
- Filter tabs: All, Draft, Confirmed, Cancelled.
- Table columns: Challan #, Customer Name, Date, Total Items, Total Quantity, Total Value, and Status badge.
- Click any row to view the full challan details or print.

### 8. Create Sales Challan (`/challans/new`)
- Customer selector dropdown (loads active customers).
- Multi-product line item builder:
  - Select product from dropdown (shows current available stock in real time).
  - Quantity input (with check against available stock).
  - Unit price is auto-filled from product master.
  - Line total calculates automatically.
  - Add more products or remove line items.
- Live summary calculating Total Items, Total Units, and Grand Total.
- Two action buttons:
  - **Save as Draft**: Saves the challan without deducting stock so it can be reviewed later.
  - **Confirm & Dispatch**: Deducts product stock immediately, records stock movement logs, and marks status as Confirmed.
- Safety check: If any selected product does not have enough stock, the system prevents confirmation and shows an error message.

### 9. Challan Detail View (`/challans/:id`)
- Clean layout showing Challan Header, Date, Customer Details, and Status Badge.
- Line items table showing the exact product snapshot data (SKU, Name, Unit Price at the time of creation, Quantity, and Subtotal).
- Action buttons:
  - **Confirm Challan**: If still Draft, allows confirming and deducting stock.
  - **Cancel Challan**: If Confirmed, cancels the challan and automatically restores stock back to inventory.
  - **Print Challan**: Clean, print-ready delivery note layout for warehouse packaging and dispatch.

### 10. Navigation & Logout
- Left sidebar with navigation links to all modules, role badge, and logout button.
- Topbar header with user avatar, role label, and user dropdown menu with Logout.
- Dashboard header with quick Sign Out button.

---

## 6. Postman Collection & API Documentation

- **Postman Collection File**: [`Apex_Wholesale_ERP.postman_collection.json`](./Apex_Wholesale_ERP.postman_collection.json) located in the repository root.
- Import this file into Postman to test all endpoints:
  - `/auth/login` (Admin, Sales, Warehouse, Accounts)
  - `/customers` (GET list, POST create, GET by ID, PUT update, POST follow-ups)
  - `/products` (GET list, POST create, PUT update)
  - `/inventory/movements` (GET logs, POST manual adjustment)
  - `/challans` (GET list, POST create draft/confirmed, GET by ID, POST confirm, POST cancel)
  - `/dashboard` (GET summary statistics and low stock alerts)

---

## 7. How to Run Locally

### Requirements
- Python 3.10+
- Node.js 18+
- PostgreSQL database (Supabase is already connected by default)

### Step 1: Start Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend will start on `http://localhost:8000`. Test docs at `http://localhost:8000/docs`.

### Step 2: Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`. Open in browser to view the app.

---

## 8. Deployment Setup

### Frontend Deployment (Vercel)
- The frontend is built with Vite + React and deployed on Vercel.
- **Root Directory**: `frontend`
- **Framework**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- Config file: `frontend/vercel.json` handles Single Page App (SPA) rewrites to `/index.html`.

### Database Setup
- Hosted on Supabase (PostgreSQL 17).
- Foreign keys link customers, products, challans, challan items, and stock movements.
- Row Level Security (RLS) enabled.

### Stock Concurrency & Deductions
- When a challan is confirmed, the backend opens a database transaction and locks the rows using:
  ```sql
  SELECT id, name, current_stock FROM products WHERE id = ANY(...) FOR UPDATE;
  ```
- If `current_stock < requested_quantity`, it immediately cancels the transaction and returns a `400 Bad Request` with the exact shortage.
- If sufficient, stock is deducted and an audit record is inserted into `stock_movements`.
- Stored snapshots: Line items store product name, SKU, and unit price at the time of creation so future price changes do not distort historical challans.

---

## 9. Known Limitations / Assumptions

1. **Product Images**: Product cards use category visual badges instead of AWS S3 image uploads.
2. **Email Alerts**: Customer follow-up dates and notes are tracked inside the CRM database. External SMTP automated emails are not hooked up.
3. **Challan PDF**: Printing uses the browser's native print engine (`window.print()`) with a custom print stylesheet, rather than generating binary PDFs on the server.
4. **Backend Hosting**: The backend is designed for standard container/Linux hosting (e.g. Render/Railway/EC2). When running on serverless Lambda, `asyncpg` requires Supabase's transaction pooler IPv4 endpoint.
