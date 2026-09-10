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
  mobile: string;
  email?: string;
  gstin?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LEAD';
  follow_up_date?: string;
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
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
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
  quantity: number;
  movement_type: 'IN' | 'OUT';
  reason?: string;
  created_by?: string;
  created_at: string;
}

// ── Challans ──────────────────────────────────────────────────────────────────
export interface ChallanItem {
  id: string;
  challan_id: string;
  product_id?: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
}

export interface Challan {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name?: string;
  total_quantity: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  created_by?: string;
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
  total: number;
  page: number;
  limit: number;
}
