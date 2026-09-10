-- ==============================================================================
-- Apex Wholesale ERP / CRM Database Schema (PostgreSQL / Supabase)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (Linked to Supabase auth.users or standalone)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'SALES' CHECK (role IN ('ADMIN', 'SALES', 'WAREHOUSE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT,
    mobile TEXT NOT NULL,
    email TEXT,
    gstin TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LEAD')),
    follow_up_date TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Customer Follow-ups Table
CREATE TABLE IF NOT EXISTS followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    follow_up_date TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Products & Stock Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock INT NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    warehouse TEXT DEFAULT 'North Hub Bay 3',
    is_low_stock BOOLEAN GENERATED ALWAYS AS (current_stock <= minimum_stock) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Sales Challans Table
CREATE TABLE IF NOT EXISTS challans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challan_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    total_quantity INT NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Challan Line Items Table
CREATE TABLE IF NOT EXISTS challan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challan_id UUID NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    sku_snapshot TEXT NOT NULL,
    unit_price_snapshot NUMERIC(12, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- 7. Stock Movements Audit Ledger Table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
    reason TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR FAST QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_followup ON customers(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(current_stock, minimum_stock);
CREATE INDEX IF NOT EXISTS idx_challans_customer ON challans(customer_id);
CREATE INDEX IF NOT EXISTS idx_challans_status ON challans(status);
CREATE INDEX IF NOT EXISTS idx_challans_created_at ON challans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challan_items_challan ON challan_items(challan_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);

-- ==============================================================================
-- SEED DATA (Demo data from Stitch wholesale ERP designs)
-- ==============================================================================
INSERT INTO products (name, sku, category, unit_price, current_stock, minimum_stock, warehouse)
VALUES
    ('High-Tensile Steel Hex Bolt M12 x 50mm', 'SKU-BOLT-M12-50-ZINC', 'Fasteners', 1.45, 1840, 300, 'NH-B3 / RACK-04-B'),
    ('Industrial Safety Limit Switch LS-300', 'SKU-ELEC-SW-LS300', 'Electrical', 34.80, 14, 50, 'NH-B3 / SEC-A-01'),
    ('Reinforced Corrugated Box 450x300x250mm', 'SKU-PKG-BX-4530', 'Packaging', 1.12, 4620, 1200, 'NH-B3 / BULK-ZONE-4'),
    ('Cast Iron Pillow Block Bearing UCP207-20', 'SKU-BRG-UCP207', 'Hardware', 18.90, 0, 25, 'NH-B3 / RACK-02-A'),
    ('Polypropylene Strapping Roll 12mm x 1500m', 'SKU-PKG-STRP-12PP', 'Packaging', 22.40, 4, 12, 'NH-B3 / BULK-ZONE-1'),
    ('Heavy Duty Impact Wrench 1/2" Pro', 'IW-HD-500', 'Hardware', 45.00, 150, 40, 'NH-B3 / TOOLS-01'),
    ('Stainless Steel Flange 4" ANSI 150', 'SS-FL-400', 'Hardware', 45.00, 4, 20, 'NH-B3 / BAY-2-BULK')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO customers (name, company, mobile, email, gstin, address, status)
VALUES
    ('Rajesh Sharma', 'Apex Hardware & Tools Ltd.', '+919820144521', 'rajesh@apexhardware.in', '27AAACA1234A1Z5', 'Plot 42-B, Industrial Area Phase II, Turbhe, Navi Mumbai, MH - 400705', 'ACTIVE'),
    ('Amit Verma', 'Verma Industrial Spares', '+919811223344', 'amit@vermaspares.com', '07BBBCB5678B1Z2', 'Shop 14, Ring Road Industrial Area, Delhi', 'ACTIVE'),
    ('Kavita Patel', 'Patel Engineering & Logistics', '+919722334455', 'kavita@pateleng.co.in', '24CCCC1234C1Z9', 'GIDC Estate, Vatva, Ahmedabad, GJ', 'LEAD')
ON CONFLICT DO NOTHING;
