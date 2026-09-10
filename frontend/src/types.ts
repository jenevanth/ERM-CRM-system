// Shared TypeScript types across the app

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'SALES' | 'WAREHOUSE';
}

// ── Customers ────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  company: string;
  company_name?: string;
  mobile: string;
  email?: string;
  gstin?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LEAD';
  follow_up_date?: string;
  outstanding_balance?: number;
  created_at: string;
  updated_at: string;
}

export interface Followup {
  id: string;
  customer_id: string;
  note: string;
  follow_up_date?: string;
  created_by?: string;
  created_at: string;
}

// ── Products ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  min_stock_level: number;
  warehouse?: string;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  quantity_delta: number;
  movement_type: string;
  reason?: string;
  notes?: string;
  source_bay?: string;
  destination_bay?: string;
  created_by?: string;
  performed_by_name?: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

// ── Challans ──────────────────────────────────────────────────────────────────
export interface ChallanItem {
  id: string;
  challan_id: string;
  product_id?: string;
  product_name_snapshot: string;
  product_name?: string;
  sku_snapshot: string;
  product_sku?: string;
  unit_price_snapshot: number;
  unit_price: number;
  total_price: number;
  quantity: number;
}

export interface Challan {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name?: string;
  customer_company?: string;
  total_quantity: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  items: ChallanItem[];
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_customers: number;
  total_products: number;
  low_stock_count: number;
  today_challans: number;
  recent_challans: Array<{
    id: string;
    challan_number: string;
    customer_name?: string;
    total_quantity: number;
    status: string;
    created_at: string;
  }>;
  upcoming_followups: Array<{
    id: string;
    name: string;
    follow_up_date: string;
    mobile: string;
  }>;
  low_stock_products: Array<{
    id: string;
    name: string;
    sku: string;
    current_stock: number;
    minimum_stock: number;
  }>;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface Paginated<T> {
  data: T[];
  items?: T[];
  total: number;
  page: number;
  limit: number;
  page_size?: number;
  pages?: number;
}
