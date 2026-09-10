Yes. I went through the entire 5-page case study. 

The most important thing to understand is that **this is not asking you to build a full ERP like SAP or a full CRM like Salesforce**. They want a **small, realistic internal business operations portal** that demonstrates that you can take a business workflow, design the database and APIs, build the React frontend, implement the important business rules, and deploy it. 

# 1. What exactly is the product?

The product is called:

> **Mini ERP + CRM Operations Portal**

It is meant for a **wholesale/distribution company**.

Think of a company that buys products, stores them in a warehouse, sells them to customers, and needs employees to manage customers, stock, sales documents, and follow-ups.

The document specifically mentions these business areas:

**Customers → Products → Inventory → Sales Challans → Invoices → CRM follow-ups**

and says the system will be used internally by:

**Sales + Warehouse + Accounts + Admin**. 

So essentially, you're building an **internal dashboard application** where employees log in and perform their respective work.

---

# 2. Think about the product with a real-world example

Imagine a company called **ABC Distributors**.

They have:

* 500 products
* 3 warehouses
* hundreds of customers
* sales employees
* warehouse employees
* accounts employees

A customer calls the sales team and says:

> "I need 20 units of Product A and 10 units of Product B."

The sales employee should be able to:

1. Find the customer.
2. Create a sales challan.
3. Add those products and quantities.
4. Confirm the challan.
5. System checks whether sufficient stock exists.
6. If stock exists, stock is automatically reduced.
7. The transaction is recorded.
8. Warehouse/accounts can see the transaction.
9. The customer record can contain follow-up information.

That is the kind of **business flow** they're testing.

---

# 3. The four types of users

The application needs **role-based access**. 

There are four roles:

| Role      | What they represent                |
| --------- | ---------------------------------- |
| Admin     | Controls the system                |
| Sales     | Handles customers and sales        |
| Warehouse | Handles products and stock         |
| Accounts  | Handles financial/business records |

The case study does **not explicitly specify every permission for every role**, so you have some freedom to decide the detailed permissions.

For example, a sensible implementation would be:

**Admin**

* Manage everything
* Manage users
* View all modules

**Sales**

* View/add/edit customers
* Create challans
* View sales information

**Warehouse**

* View products
* View stock
* View stock movements
* Possibly manage stock

**Accounts**

* View customers
* View challans
* Handle invoice-related information if you implement it

The important part is that users **cannot simply access everything regardless of role**.

Authentication can use **JWT**; the document explicitly says simple JWT authentication is acceptable. 

---

# 4. The application should have these major modules

There are essentially **four core things you definitely need to build**:

### 1. Authentication & Roles

### 2. Customer CRM

### 3. Product & Inventory

### 4. Sales Challan

These are the heart of the assignment.    

---

# 5. Module 1 — Authentication & Roles

You need a login page.

Something like:

```text
--------------------------------
       MINI ERP PORTAL
--------------------------------

Email / Username
[                    ]

Password
[                    ]

        [ Login ]

--------------------------------
```

When the employee logs in:

```text
React Frontend
      ↓
POST /auth/login
      ↓
Node.js Backend
      ↓
Validate credentials
      ↓
Generate JWT
      ↓
React stores token
      ↓
User enters dashboard
```

The backend should know:

```text
User
 ├── id
 ├── name
 ├── email
 ├── password
 └── role
       ├── ADMIN
       ├── SALES
       ├── WAREHOUSE
       └── ACCOUNTS
```

Then APIs can check:

```text
Is the user authenticated?
        ↓
What role does the user have?
        ↓
Is this role allowed to perform this operation?
```

---

# 6. Module 2 — Customer CRM

This is a relatively small CRM system.

Each customer needs these fields:

* Customer name
* Mobile number
* Email
* Business name
* GST number — optional
* Customer type

  * Retail
  * Wholesale
  * Distributor
* Address
* Status

  * Lead
  * Active
  * Inactive
* Follow-up date
* Notes 

So your database might conceptually contain:

```text
customers

id
customer_name
mobile
email
business_name
gst_number
customer_type
address
status
follow_up_date
notes
created_at
updated_at
```

### What the user must be able to do

The document explicitly requires:

**Add customer**

```text
POST /customers
```

**Edit customer**

```text
PUT /customers/:id
```

**Search customer**

```text
GET /customers?search=...
```

**View customer details**

```text
GET /customers/:id
```

**Add follow-up notes**

You could implement this either by updating the customer notes or, better, using a separate follow-up table.

For example:

```text
Customer
   |
   ├── Follow-up 1
   ├── Follow-up 2
   └── Follow-up 3
```

The case study specifically calls out "add follow-up notes", so don't make the CRM simply a basic customer CRUD screen. 

---

# 7. What the Customer UI could look like

You could have:

```text
Customers

[ Search customer................ ] [ + Add Customer ]

----------------------------------------------------------
Name          Business       Type         Status
----------------------------------------------------------
Raj Kumar     Raj Traders    Wholesale    Active
Arun         Arun Stores     Retail       Lead
Suresh        Suresh Dis.     Distributor  Active
----------------------------------------------------------
```

Clicking a customer:

```text
Customer Details

Raj Kumar
Raj Traders
9876543210
raj@example.com

Type: Wholesale
Status: Active
GST: XXXXXXXX

Address:
...

Next Follow-up:
15 September 2026

Notes:
Customer interested in Product A.

[ Add Follow-up ]
[ Edit Customer ]
```

That would demonstrate the CRM requirement very clearly.

---

# 8. Module 3 — Product & Inventory

This is another major part.

Each product needs:

* Product name
* SKU/code
* Category
* Unit price
* Current stock
* Minimum stock alert quantity
* Location/warehouse 

So conceptually:

```text
products

id
name
sku
category
unit_price
current_stock
minimum_stock
warehouse_location
created_at
updated_at
```

For example:

```text
Product:
Samsung Monitor 24"

SKU:
MON-24-001

Category:
Monitors

Unit Price:
₹12,000

Current Stock:
35

Minimum Stock:
10

Warehouse:
Chennai Warehouse
```

---

# 9. Low-stock alert

Notice this field:

> **Minimum stock alert quantity**. 

This strongly suggests your UI should make it obvious when stock is low.

Example:

```text
Product              Stock       Minimum

Keyboard             40          10
Mouse                 5          10   ⚠ Low Stock
Monitor               3          10   ⚠ Low Stock
Laptop                25           5
```

The document doesn't explicitly demand a sophisticated notification system, so you don't need to over-engineer it.

A simple dashboard indicator is enough.

---

# 10. Stock movement log

This is **very important**.

They don't want you to only store:

```text
Product → Current Stock = 50
```

They want a history of how stock changed.

The stock movement log must track:

* Product
* Quantity changed
* Movement type: `IN` or `OUT`
* Reason
* Created by
* Timestamp 

For example:

```text
Stock Movement

Product       Qty    Type    Reason             User       Time
-------------------------------------------------------------------
Keyboard      100    IN      Purchase            Admin      10:20
Keyboard       20    OUT     Sales Challan       Ravi       11:45
Keyboard       10    OUT     Sales Challan       Ravi       14:10
Keyboard       50    IN      Purchase            Admin      16:30
```

So you have:

```text
Product
   ↓
Stock = 120

and separately

Stock Movement History
   ↓
IN 100
OUT 20
OUT 10
IN 50
```

That gives you an **audit trail**.

---

# 11. Module 4 — Sales Challan

This is probably the **most important business flow in the assignment**.

The Sales user must be able to:

1. Select a customer
2. Add multiple products
3. Enter quantity for each
4. Automatically generate challan number
5. Save as Draft or Confirmed 

Imagine:

```text
Create Sales Challan

Customer:
[ Raj Traders ▼ ]

Products

Product              Qty       Unit Price
---------------------------------------------
Keyboard              10         ₹500
Mouse                  5         ₹300
Monitor                2        ₹12,000

[ + Add Product ]

Total Quantity: 17

Status:
( Draft / Confirmed )

[ Save Challan ]
```

---

# 12. Draft vs Confirmed is VERY important

The system must distinguish:

### Draft

The challan has been created but **does not affect stock**.

Example:

```text
Draft Challan
CH-000123

Mouse × 10
Keyboard × 20

Stock unchanged
```

### Confirmed

Once confirmed:

```text
Challan confirmed
       ↓
Check stock
       ↓
Enough stock?
   ↙           ↘
 YES            NO
 ↓               ↓
Reduce stock    Error
 ↓
Create OUT movement
```

The document explicitly states that **stock must be reduced when a challan is confirmed**. 

This is one of the places where they're testing whether you understand **business logic**, rather than just building CRUD APIs.

---

# 13. Stock must NEVER become negative

This is another critical requirement.

Suppose:

```text
Current stock = 5
```

User creates:

```text
Sales Challan
Quantity = 8
```

Your backend must reject it.

It should **not** become:

```text
Stock = -3
```

Instead:

```text
HTTP 400

Insufficient stock for product XYZ.
Available: 5
Requested: 8
```

The case study explicitly requires the API to return an appropriate error when stock is insufficient. 

---

# 14. The most important technical rule: stock logic belongs in the backend

Do **not** rely on React to check stock.

For example, React might show:

```text
Stock available: 10
```

But the actual validation must happen in the backend.

Why?

Because two users could submit orders at nearly the same time.

Your backend should perform something conceptually like:

```text
BEGIN TRANSACTION

Check current stock

IF requested quantity > stock
    ROLLBACK
    return error

Reduce stock

Create challan

Create stock movement

COMMIT
```

This is probably one of the strongest places where you can show good backend/database understanding.

---

# 15. Another VERY important requirement: product snapshot data

The document says:

> Challan should store product snapshot data, not only product ID. 

This is an important database design requirement.

Suppose today:

```text
Product:
Keyboard

Price:
₹500
```

You create a challan:

```text
CH-123

Keyboard
Quantity: 10
Unit Price: ₹500
```

Next month, the product price changes:

```text
Keyboard
₹650
```

If your challan only stores:

```text
product_id = 25
```

and later reads the product table, you may incorrectly display:

```text
₹650
```

on an old challan.

Instead, the challan should store a **snapshot**:

```text
challan_items

id
challan_id
product_id
product_name
sku
unit_price
quantity
```

So the old challan retains:

```text
Keyboard
SKU: KEY-001
Price: ₹500
Quantity: 10
```

even if the product later changes.

This requirement tells me they will likely pay attention to your **database design**, not just whether the UI works.

---

# 16. Challan fields

The challan itself must contain:

* Challan number
* Customer
* Products
* Total quantity
* Status

  * Draft
  * Confirmed
  * Cancelled
* Created by
* Created date 

Your structure would therefore look roughly like:

```text
challans
-----------------
id
challan_number
customer_id
total_quantity
status
created_by
created_at
```

and:

```text
challan_items
-----------------
id
challan_id
product_id
product_name
sku
unit_price
quantity
```

That separation is much cleaner than putting everything into one table.

---

# 17. Cancelled status

The required statuses are:

```text
DRAFT
CONFIRMED
CANCELLED
```

The document doesn't fully define the cancellation workflow.

Therefore, **this is one area where you need to make an assumption and document it**, because the submission explicitly asks you to state any assumptions made. 

A sensible implementation would be:

```text
DRAFT → CONFIRMED → CANCELLED
```

and if you cancel a confirmed challan, you would probably return the stock:

```text
OUT movement when confirmed
        ↓
Cancellation
        ↓
IN movement to restore stock
```

But note: **the PDF does not explicitly require this exact cancellation behavior**, so treat it as your design decision and document it.

---

# 18. The whole business flow

This is probably the easiest way to understand the entire assignment.

```text
                    LOGIN
                      │
                      ▼
              Authentication
                      │
                      ▼
                  DASHBOARD
                      │
         ┌────────────┼─────────────┐
         ▼            ▼             ▼
     Customers     Products      Challans
         │            │             │
         │            ▼             │
         │       Inventory          │
         │            │             │
         │            ▼             │
         │     Stock Movements       │
         │                          │
         └────────────┐             │
                      ▼             ▼
                   Customer    Create Challan
                                  │
                                  ▼
                            Select Products
                                  │
                                  ▼
                              Enter Qty
                                  │
                                  ▼
                              Save Draft
                                  │
                                  ▼
                              Confirm
                                  │
                                  ▼
                         Check Stock
                           /       \
                         YES        NO
                          │          │
                          ▼          ▼
                    Reduce Stock    Error
                          │
                          ▼
                   Stock Movement
                       = OUT
```

That is essentially the product.

---

# 19. What should the frontend contain?

The document simply says:

> Create a clean admin-style UI. 

So I would build something like:

```text
┌───────────────────────────────────────────────────┐
│ Mini ERP                         User: Admin      │
├──────────────┬────────────────────────────────────┤
│ Dashboard    │                                    │
│ Customers    │          MAIN CONTENT              │
│ Products     │                                    │
│ Inventory    │                                    │
│ Challans     │                                    │
│ Stock Log    │                                    │
│              │                                    │
│ Logout       │                                    │
└──────────────┴────────────────────────────────────┘
```

### Dashboard

Show useful business information:

```text
Customers        Products        Low Stock        Challans

   245              120               8              56
```

Then perhaps:

```text
Recent Challans
Low Stock Products
Upcoming Follow-ups
Recent Stock Movements
```

The dashboard isn't explicitly specified, but it makes the application feel like an actual ERP rather than a collection of CRUD pages.

---

# 20. Suggested pages

A practical frontend would be:

```text
/login

/dashboard

/customers
/customers/new
/customers/:id
/customers/:id/edit

/products
/products/new
/products/:id/edit

/inventory
/inventory/movements

/challans
/challans/new
/challans/:id
```

You don't necessarily need all these exact URLs; this is a suggested organization.

---

# 21. Backend technology requirements

The backend must use:

**Node.js**

**TypeScript**

**Express.js OR NestJS**

**PostgreSQL OR MySQL**

**REST APIs**

and should have:

**Validation**

**Proper error handling**. 

So one good stack would be:

```text
React + TypeScript
        │
        │ REST
        ▼
Node.js + Express + TypeScript
        │
        ▼
PostgreSQL
```

You don't need both Express and NestJS.

Choose one.

For a 48-hour assignment, **Express + TypeScript** is probably simpler unless you're already much more comfortable with NestJS.

---

# 22. REST API expectations

They explicitly give examples:

```http
POST /auth/login

GET /customers
```

and expect:

* Input validation
* Correct HTTP status codes
* Good error messages
* Pagination where needed
* Search/filter where needed 

So don't create terrible APIs like:

```text
POST /doCustomerStuff
```

Use normal REST conventions.

For example:

```http
GET    /customers
GET    /customers/:id
POST   /customers
PUT    /customers/:id
DELETE /customers/:id
```

Products:

```http
GET    /products
GET    /products/:id
POST   /products
PUT    /products/:id
```

Challans:

```http
GET    /challans
GET    /challans/:id
POST   /challans
PUT    /challans/:id
POST   /challans/:id/confirm
POST   /challans/:id/cancel
```

Stock:

```http
GET /inventory
GET /inventory/movements
POST /inventory/movements
```

The exact endpoint names aren't dictated by the document, so you're free to design them.

---

# 23. Validation

This is explicitly required. 

Examples:

```text
Customer name → required
Mobile → valid format
Email → valid email
Customer type → only Retail/Wholesale/Distributor
Status → only Lead/Active/Inactive
Quantity → > 0
Unit price → >= 0
SKU → required
```

For a challan:

```text
Customer required
At least one product required
Quantity must be > 0
Product must exist
Stock must be sufficient
```

This validation should happen on the **backend**, not only in React.

Frontend validation improves user experience; backend validation protects the actual system.

---

# 24. HTTP status codes

They're expecting proper HTTP behavior.

For example:

```text
200 OK
GET successful

201 Created
POST successfully created something

400 Bad Request
Invalid input / insufficient stock

401 Unauthorized
Not logged in / invalid token

403 Forbidden
Logged in but role not allowed

404 Not Found
Customer/product/challan doesn't exist

500 Internal Server Error
Unexpected server problem
```

That makes your API look like a professional backend rather than a school project.

---

# 25. Pagination and search

The document explicitly mentions:

> Pagination where needed
> Search/filter where needed. 

For customers:

```http
GET /customers?page=1&limit=20&search=raj
```

For products:

```http
GET /products?page=1&limit=20&search=keyboard
```

For challans:

```http
GET /challans?page=1&status=CONFIRMED
```

You don't need some massive filtering engine. Basic useful filtering is enough.

---

# 26. Database structure I would recommend

A reasonable schema could be:

```text
users
 ├── id
 ├── name
 ├── email
 ├── password_hash
 └── role

customers
 ├── id
 ├── name
 ├── mobile
 ├── email
 ├── business_name
 ├── gst_number
 ├── customer_type
 ├── address
 ├── status
 ├── follow_up_date
 ├── notes
 ├── created_at
 └── updated_at

products
 ├── id
 ├── name
 ├── sku
 ├── category
 ├── unit_price
 ├── current_stock
 ├── minimum_stock
 ├── warehouse
 ├── created_at
 └── updated_at

stock_movements
 ├── id
 ├── product_id
 ├── quantity
 ├── type
 ├── reason
 ├── created_by
 └── created_at

challans
 ├── id
 ├── challan_number
 ├── customer_id
 ├── total_quantity
 ├── status
 ├── created_by
 └── created_at

challan_items
 ├── id
 ├── challan_id
 ├── product_id
 ├── product_name
 ├── sku
 ├── unit_price
 └── quantity
```

And optionally:

```text
customer_followups
 ├── id
 ├── customer_id
 ├── note
 ├── follow_up_date
 ├── created_by
 └── created_at
```

That last table is my recommendation rather than something explicitly mandated by the PDF.

---

# 27. How everything connects technically

The complete architecture could be:

```text
                    USER
                     │
                     ▼
              React Frontend
                     │
                HTTP / REST
                     │
                     ▼
          Node.js + Express API
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
      Auth       Business Logic   Validation
        │            │
        └────────────┼────────────┘
                     │
                     ▼
                PostgreSQL
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
     Users       Customers      Products
                                   │
                                   ▼
                             Stock Movements
                                   │
                                   ▼
                                Challans
```

---

# 28. Deployment

The assignment initially says AWS is preferred, but later makes an important clarification:

> AWS deployment is optional and is treated as a bonus. 

They also explicitly say you **don't need to spend money**. 

They suggest free hosting options:

### Frontend

```text
Vercel
Netlify
Render Static Site
```

### Backend

```text
Render
Railway
Fly.io
```

### Database

```text
Supabase
Neon
Render Postgres
```



So you could deploy something like:

```text
React
  ↓
Vercel

Express API
  ↓
Render

PostgreSQL
  ↓
Neon / Supabase
```

That would satisfy the assignment without needing AWS.

---

# 29. Environment variables

They specifically require environment variables and documentation of how they are managed.  

Your backend might have:

```env
PORT=5000
DATABASE_URL=...
JWT_SECRET=...
```

And **do not commit secrets into GitHub**.

You should provide something like:

```text
.env.example
```

containing:

```env
PORT=
DATABASE_URL=
JWT_SECRET=
```

but without actual credentials.

---

# 30. GitHub is part of the evaluation

They want:

> GitHub repository with proper commits. 

This means don't make:

```text
Initial commit
```

and then dump the entire project.

A better history is:

```text
Initial project setup
Add Express server
Add PostgreSQL schema
Implement authentication
Add customer CRM APIs
Add customer UI
Add inventory module
Implement challan creation
Implement stock validation
Add role-based authorization
Deploy backend
Deploy frontend
Update README
```

This makes it obvious that you actually developed the project.

---

# 31. README is important

Your README needs to explain:

* How server was set up
* Environment variables
* How to run locally
* How to deploy
* Assumptions made 

I'd structure it:

```text
# Mini ERP + CRM

## Overview

## Features

## Architecture

## Tech Stack

## Database Schema

## API Documentation

## Environment Variables

## Local Setup

## Running Backend

## Running Frontend

## Deployment

## Test Credentials

## Assumptions

## Known Limitations
```

---

# 32. What happens if you DON'T deploy?

The document gives you a fallback.

You can submit a working local project, but then you need to provide:

* Working local setup
* Screen recording showing the complete flow
* Postman collection
* Clear README instructions 

But since deployment is free, **I would deploy it**. A live URL makes the submission substantially stronger.

---

# 33. Bonus features

These are **not mandatory**. 

They list:

### Docker

Provide:

```text
Dockerfile
docker-compose.yml
```

Potentially:

```text
React
+
Express
+
PostgreSQL
```

### GitHub Actions

Automated CI/CD.

For example:

```text
git push
   ↓
GitHub Actions
   ↓
Build / Test
   ↓
Deploy
```

### Export invoice as PDF

Interesting point here:

The business context mentions invoices, but **invoice creation is not listed as one of the mandatory core modules**. PDF invoice export appears under the bonuses.  

So I would **not let an invoice module delay the mandatory functionality**.

### Product image upload to AWS S3

Also optional.

---

# 34. What you actually need to submit

The final submission needs:

1. **GitHub repository link**
2. **Live frontend URL**
3. **Live backend API URL**
4. **Test login credentials for all roles**
5. **Postman collection or API documentation**
6. **README with setup/deployment instructions**
7. **Short architecture explanation**
8. **Known limitations/incomplete parts** 

Notice something important:

They specifically want **test credentials for all roles**.

So you should create demo accounts such as:

```text
Admin
admin@example.com

Sales
sales@example.com

Warehouse
warehouse@example.com

Accounts
accounts@example.com
```

with appropriate passwords.

---

# 35. What I think they are actually evaluating

Reading the assignment as a technical interviewer, I don't think they're primarily asking:

> "Can you make a beautiful website?"

They're evaluating whether you understand this chain:

```text
Business Requirement
       ↓
Database Design
       ↓
Backend API
       ↓
Business Logic
       ↓
Frontend
       ↓
Authentication / Authorization
       ↓
Deployment
       ↓
Documentation
```

And the **challan → stock reduction** flow is probably the most important proof that you understand real application logic.

A candidate who makes beautiful CRUD screens but allows:

```text
Stock = -500
```

has missed the point.

A candidate with a fairly simple UI but correct:

```text
JWT
+
Role authorization
+
Validation
+
Transactions
+
Stock checking
+
Stock movement history
+
Product snapshots
```

will look much stronger.

---

# 36. The minimum viable product you should build

Because the deadline is only **48 hours** from when the assignment is shared, you should be careful about scope. 

Your absolute core should be:

```text
LOGIN
  ↓
ROLE-BASED ACCESS
  ↓
DASHBOARD
  ↓
CUSTOMERS
  ├── Add
  ├── Edit
  ├── Search
  ├── Details
  └── Follow-up notes

PRODUCTS
  ├── Add
  ├── Edit
  ├── Stock
  └── Low-stock indication

INVENTORY
  └── Stock movement history

SALES CHALLANS
  ├── Select customer
  ├── Add multiple products
  ├── Quantity
  ├── Auto challan number
  ├── Draft
  ├── Confirm
  ├── Cancel
  └── Stock validation

BACKEND
  ├── REST APIs
  ├── Validation
  ├── Authorization
  ├── Error handling
  └── Pagination/search

DEPLOYMENT
  ├── Frontend
  ├── Backend
  └── Database

DOCUMENTATION
  ├── README
  ├── API/Postman
  ├── Architecture
  └── Assumptions
```

That is the assignment.

---

# 37. The parts I would pay special attention to

There are five things in this document that are easy to overlook but could differentiate your submission:

### **1. Stock cannot go negative**

This must be enforced by the backend. 

### **2. Confirming a challan changes inventory**

Creating a draft should not automatically consume stock; confirmation should. 

### **3. Stock movement history**

Don't simply update `current_stock`; maintain the IN/OUT history. 

### **4. Product snapshot on challans**

Don't depend entirely on the current product table when displaying an old challan. 

### **5. Role-based access**

The four types of users should not all have unrestricted access. 

---

# 38. In one sentence: what are you building?

You are building a **web-based internal operations system for a wholesale company where employees log in according to their role, manage customers and products, track inventory, create sales challans, and automatically update stock when those challans are confirmed**. 

And technically:

```text
React
   ↓
Node.js + TypeScript + Express/NestJS
   ↓
REST APIs
   ↓
PostgreSQL/MySQL
   ↓
Deployment
```

with JWT authentication, validation, error handling, role-based authorization, search/pagination, and the required stock/challan business rules.  

## My recommendation for tackling it

Don't start coding immediately.

The best next step is to turn this case study into a **complete implementation blueprint**: database ER diagram, exact tables/relationships, backend folder structure, every REST endpoint with request/response examples, role permissions, React page structure, and the exact end-to-end flow for **creating and confirming a challan**. That gives you a clear build plan before you write the first line of code.
