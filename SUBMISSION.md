# Case Study Submission — Mini ERP + CRM Operations Portal

## 1. GitHub Repository Link
- [https://github.com/jenevanthm/ERM-CRM-system](https://github.com/jenevanthm/ERM-CRM-system)

## 2. Live Frontend URL
- [https://erm-crm-system.vercel.app](https://erm-crm-system.vercel.app) *(or `http://localhost:5173` locally)*

## 3. Live Backend API URL
- Live Base URL: `http://localhost:8000`
- Interactive Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Alternative ReDoc Documentation: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 4. Test Login Credentials for All Roles

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@apex.in` | `Admin@123` | Full administrative control: Customer CRM, Product Cataloging, Stock Adjustments, Challan creation, confirmation & cancellation, User management. |
| **Sales** | `sales@apex.in` | `Sales@123` | Customer CRM, interaction & follow-up notes, product stock availability check, Sales Challan drafting & confirmation. |
| **Warehouse** | `warehouse@apex.in` | `Warehouse@123` | Product cataloging, physical aisle/bay management, Inward Goods Receipt Notes (GRN), inventory audit adjustments, stock movement audit trail. |
| **Accounts** | `accounts@apex.in` | `Accounts@123` | Delivery challan verification, immutable line-item snapshot pricing audit, GST and tax calculations, printable delivery notes, customer billing profiles. |

*Tip: The login page at `/login` also features 1-click fast demo login buttons for each of these 4 roles.*

## 5. Postman Collection & API Documentation
- Postman Collection JSON file: [`Apex_Wholesale_ERP.postman_collection.json`](./Apex_Wholesale_ERP.postman_collection.json) (included in the root of the GitHub repository).
- Live Swagger UI Documentation: `http://localhost:8000/docs`
- All endpoints include input validation, JWT bearer authentication, structured error messages, search filters, and pagination.

## 6. Setup and Deployment Instructions
- Detailed instructions for setting up the backend (FastAPI + asyncpg) and frontend (React + Vite + Tailwind CSS) are documented in [`README.md`](./README.md).
- To run locally:
  1. Backend: `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`
  2. Frontend: `cd frontend && npm install && npm run dev`
  3. Open `http://localhost:5173`

## 7. Short Explanation of Architecture
- **Frontend**: React 19 with TypeScript, Vite, Tailwind CSS, Axios, and React Router v7. Includes global error boundaries, responsive tables, real-time stock indicators, and a clean admin-style UI.
- **Backend**: FastAPI with async connection pooling (`asyncpg`). Modular clean architecture with separated router, Pydantic v2 schemas, and PostgreSQL repositories.
- **Database**: PostgreSQL 17 on Supabase with relational schemas, foreign keys, triggers, and audit tables.
- **Transactional Stock Concurrency**:
  When confirming a challan, the system locks the affected product rows within a database transaction:
  ```sql
  SELECT id, name, current_stock, minimum_stock 
  FROM products 
  WHERE id = ANY($1::uuid[]) 
  FOR UPDATE;
  ```
  If any SKU has insufficient stock, the transaction immediately rolls back and returns HTTP 400 with a detailed shortage breakdown, preventing negative inventory or race conditions.

## 8. Known Limitations or Incomplete Parts
- **Product Images**: Uses UI category badges; AWS S3 image upload is optional and not connected.
- **External Email Notifications**: Follow-up reminders are recorded in database CRM timelines; automated external email delivery is not configured.
- **PDF Generation**: Printable challans use browser-native print layout (`window.print()`); server-side headless Chromium PDF generation is not enabled.
