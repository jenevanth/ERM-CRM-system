import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import type { Product, Paginated } from '../types';

interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  movement_type: string;
  quantity_delta: number;
  source_bay?: string;
  destination_bay?: string;
  created_at: string;
  reference_type?: string;
  reference_id?: string;
  performed_by_name?: string;
}

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'ledger' ? 'ledger' : 'stock';
  const [activeTab, setActiveTab] = useState<'stock' | 'ledger'>(initialTab);

  // Products / Stock levels state
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Movements state
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');

  // Modal states
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'INWARD_GRN' | 'ADJUSTMENT' | 'DAMAGE'>('INWARD_GRN');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter === 'low') params.low_stock = true;

      const res = await api.get<Paginated<Product>>('/products', { params });
      let items: Product[] = res.data.data || res.data.items || [];

      if (statusFilter === 'healthy') {
        items = items.filter((p) => p.current_stock > (p.minimum_stock ?? p.min_stock_level ?? 0));
      } else if (statusFilter === 'out') {
        items = items.filter((p) => p.current_stock === 0);
      }

      setProducts(items);
      setTotalProducts(res.data.total);
    } catch (err) {
      console.error('Failed to load inventory stock:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchMovements = useCallback(async () => {
    try {
      const res = await api.get<Paginated<StockMovement>>('/inventory/movements', {
        params: {
          page: 1,
          limit: 50,
          movement_type: movementTypeFilter === 'ALL' ? undefined : movementTypeFilter,
        },
      });
      const list = res.data.data || res.data.items || [];
      setMovements(list);
    } catch (err) {
      console.error('Failed to load stock movements:', err);
    }
  }, [movementTypeFilter]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchMovements();
    }
  }, [activeTab, fetchMovements]);

  // Derived stats
  const totalValuation = products.reduce((acc, p) => acc + p.unit_price * p.current_stock, 0);
  const lowStockCount = products.filter((p) => p.current_stock > 0 && p.current_stock <= (p.minimum_stock ?? p.min_stock_level ?? 0)).length;
  const stockoutCount = products.filter((p) => p.current_stock === 0).length;
  const healthyCount = products.filter((p) => p.current_stock > (p.minimum_stock ?? p.min_stock_level ?? 0)).length;

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setAdjustLoading(true);
    setAdjustError(null);

    try {
      await api.post('/inventory/movements', {
        product_id: selectedProduct.id,
        quantity: Math.max(1, Math.abs(adjustQty)),
        movement_type: adjustType === 'INWARD_GRN' ? 'IN' : 'OUT',
        reason: adjustReason || 'Manual inventory update via portal',
      });
      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
      setAdjustQty(0);
      setAdjustReason('');
      fetchStock();
      if (activeTab === 'ledger') fetchMovements();
    } catch (err: any) {
      setAdjustError(err?.response?.data?.detail || 'Failed to update stock');
    } finally {
      setAdjustLoading(false);
    }
  };

  const openAdjustModal = (product: Product, defaultType: 'INWARD_GRN' | 'ADJUSTMENT' = 'ADJUSTMENT') => {
    setSelectedProduct(product);
    setAdjustType(defaultType);
    setAdjustQty(defaultType === 'INWARD_GRN' ? 50 : 0);
    setAdjustReason('');
    setAdjustError(null);
    setIsAdjustModalOpen(true);
  };

  const exportCSV = () => {
    const headers = 'SKU,Name,Category,Unit Price,Current Stock,Min Stock,Status\n';
    const rows = products.map((p) => {
      const minStock = p.minimum_stock ?? p.min_stock_level ?? 0;
      return `"${p.sku}","${p.name}","${p.category || ''}",${p.unit_price},${p.current_stock},${minStock},"${p.current_stock === 0 ? 'STOCKOUT' : p.current_stock <= minStock ? 'LOW' : 'IN_STOCK'}"`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Apex_Inventory_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-xs">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Inventory & Stock Movements
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-high text-secondary font-data-mono text-[10px] font-semibold uppercase tracking-wider">
              Bay Sync: OK
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Real-time warehouse SKU balance, reorder limits, and comprehensive stock transfer/movement audit log.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-space-sm shrink-0">
          <button
            onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
            className={`h-8 px-space-md rounded border font-label-md text-label-md shadow-sm transition-colors flex items-center gap-1.5 ${
              statusFilter === 'low'
                ? 'bg-secondary text-on-secondary border-secondary'
                : 'bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-container-low'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Safety Stock Rules</span>
          </button>

          <button
            onClick={exportCSV}
            className="h-8 px-space-md rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:bg-surface-container-low font-label-md text-label-md shadow-sm transition-colors flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">file_download</span>
            <span>Export Ledger (CSV)</span>
          </button>

          <button
            onClick={() => {
              if (products.length > 0) openAdjustModal(products[0], 'INWARD_GRN');
            }}
            className="h-8 px-space-md rounded bg-primary text-on-primary hover:bg-inverse-surface font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-sm"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Record Stock Inward (GRN)</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <div className="p-space-md bg-surface-container-lowest rounded shadow-sm flex items-center justify-between border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Gross Stock Valuation
            </span>
            <span className="font-data-mono text-headline-md text-headline-md text-on-surface font-bold mt-1">
              ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="font-data-mono text-label-sm text-label-sm text-outline mt-0.5">
              Cost avg weighted base
            </span>
          </div>
          <div className="w-10 h-10 rounded bg-surface-container-low flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary text-[22px]">account_balance_wallet</span>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-lowest rounded shadow-sm flex items-center justify-between border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              In-Stock Operational SKUs
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-data-mono text-headline-md text-headline-md text-on-surface font-bold">
                {healthyCount}
              </span>
              <span className="font-data-mono text-label-sm text-label-sm text-on-surface-variant">
                / {totalProducts || products.length} active
              </span>
            </div>
            <div className="w-28 h-1.5 rounded-full bg-surface-container-high mt-1.5 overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full"
                style={{
                  width: `${totalProducts > 0 ? (healthyCount / totalProducts) * 100 : 98}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="w-10 h-10 rounded bg-surface-container-low flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[22px]">inventory_2</span>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-lowest rounded shadow-sm flex items-center justify-between border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-data-mono text-headline-md text-headline-md text-secondary font-bold">
                {lowStockCount}
              </span>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-tight">Need PO</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              &lt; Min Threshold buffer
            </span>
          </div>
          <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary text-[22px]">production_quantity_limits</span>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-lowest rounded shadow-sm flex items-center justify-between border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Critical Stockouts
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-data-mono text-headline-md text-headline-md text-error font-bold">
                {stockoutCount}
              </span>
              <span className="font-label-sm text-label-sm text-error uppercase font-semibold">Immediate Halt</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Zero physical count</span>
          </div>
          <div className="w-10 h-10 rounded bg-error-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-error text-[22px]">fmd_bad</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-sm rounded shadow-sm border border-outline-variant/20">
        <div className="inline-flex p-0.5 bg-surface-container-low rounded gap-0.5" role="tablist">
          <button
            onClick={() => {
              setActiveTab('stock');
              setSearchParams({});
            }}
            className={`px-space-md py-1.5 rounded font-label-md text-label-md transition-all flex items-center gap-1.5 ${
              activeTab === 'stock'
                ? 'text-on-primary bg-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">view_list</span>
            <span>Current Stock Levels (Active)</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded font-data-mono text-[10px] ${
                activeTab === 'stock' ? 'bg-surface-container-lowest/20' : 'bg-surface-container'
              }`}
            >
              {totalProducts || products.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ledger');
              setSearchParams({ tab: 'ledger' });
            }}
            className={`px-space-md py-1.5 rounded font-label-md text-label-md transition-all flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'text-on-primary bg-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
            <span>Stock Movement Audit Ledger</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded font-data-mono text-[10px] ${
                activeTab === 'ledger' ? 'bg-surface-container-lowest/20' : 'bg-surface-container'
              }`}
            >
              Live
            </span>
          </button>
        </div>

        <div className="flex items-center gap-space-xs font-data-mono text-label-sm text-outline px-space-xs">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          <span>Ledger snapshot: Realtime</span>
        </div>
      </div>

      {/* Tab 1: Current Stock Levels */}
      {activeTab === 'stock' && (
        <div className="flex flex-col gap-space-sm">
          {/* Controls Bar */}
          <div className="p-space-md bg-surface-container-lowest rounded shadow-sm border border-outline-variant/20 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
            <div className="flex-1 min-w-0 flex flex-col md:flex-row gap-space-sm items-stretch md:items-center">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-outline pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search SKU code, product title, barcode, shelf..."
                  className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm transition-all"
                />
              </div>

              <div className="flex items-center gap-space-sm shrink-0 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 px-space-sm pr-7 rounded bg-surface-container-low font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer shadow-sm border-0"
                >
                  <option value="all">Status: All SKUs</option>
                  <option value="healthy">In Stock (Normal)</option>
                  <option value="low">Low Stock Alert (&lt; Min)</option>
                  <option value="out">Critical Stockout (0)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-space-xs shrink-0 font-body-sm text-body-sm text-on-surface-variant">
              <span>Showing:</span>
              <span className="font-data-mono font-semibold text-on-surface">
                {products.length} of {totalProducts}
              </span>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-surface-container-low text-on-surface disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                type="button"
                disabled={products.length < 15}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded hover:bg-surface-container-low text-on-surface disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-surface-container-lowest rounded shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider h-9">
                    <th className="px-space-md py-2 font-semibold">SKU & Product Details</th>
                    <th className="px-space-md py-2 font-semibold">Category</th>
                    <th className="px-space-md py-2 font-semibold">Warehouse Bay</th>
                    <th className="px-space-md py-2 font-semibold text-right">Unit Price</th>
                    <th className="px-space-md py-2 font-semibold text-right">Physical Count</th>
                    <th className="px-space-md py-2 font-semibold text-right">Min Buffer</th>
                    <th className="px-space-md py-2 font-semibold text-center">Health Indicator</th>
                    <th className="px-space-md py-2 font-semibold text-center w-28">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-outline">
                        Loading inventory records...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-outline">
                        No products match your criteria.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const minStock = product.minimum_stock ?? product.min_stock_level ?? 0;
                      const isStockout = product.current_stock === 0;
                      const isLow = product.current_stock <= minStock;

                      return (
                        <tr
                          key={product.id}
                          className={`hover:bg-surface-container-low/60 transition-colors h-11 ${
                            isStockout
                              ? 'bg-error-container/20'
                              : isLow
                              ? 'bg-surface-container-low/30'
                              : ''
                          }`}
                        >
                          <td className="px-space-md py-2">
                            <div className="flex flex-col min-w-0">
                              <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
                                {product.name}
                              </span>
                              <span className="font-data-mono text-[11px] text-outline truncate">
                                {product.sku} {product.description ? `· ${product.description}` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="px-space-md py-2">
                            <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                              {product.category || 'General'}
                            </span>
                          </td>
                          <td className="px-space-md py-2">
                            <span className="font-data-mono text-on-surface text-body-sm font-medium">
                              NH-B3 / RACK-04
                            </span>
                          </td>
                          <td className="px-space-md py-2 text-right font-data-mono text-on-surface">
                            ₹{Number(product.unit_price || 0).toFixed(2)}
                          </td>
                          <td className="px-space-md py-2 text-right">
                            <span
                              className={`font-data-mono font-bold text-body-md ${
                                isStockout ? 'text-error' : isLow ? 'text-secondary' : 'text-on-surface'
                              }`}
                            >
                              {product.current_stock.toLocaleString()}
                            </span>
                            <span className="font-data-mono text-[10px] text-outline ml-1">pcs</span>
                          </td>
                          <td className="px-space-md py-2 text-right font-data-mono text-on-surface-variant">
                            {minStock.toLocaleString()} pcs
                          </td>
                          <td className="px-space-md py-2 text-center">
                            {isStockout ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-error font-label-sm text-label-sm font-semibold uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                Stockout (0)
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                Low Stock ({product.current_stock}/{minStock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm font-semibold uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="px-space-md py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openAdjustModal(product, 'INWARD_GRN')}
                                className="p-1 rounded text-secondary hover:bg-surface-container-high transition-colors"
                                title="Record Inward GRN"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">add_box</span>
                              </button>
                              <button
                                onClick={() => openAdjustModal(product, 'ADJUSTMENT')}
                                className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                                title="Stock Audit / Manual Adjust"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-space-sm bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-outline-variant/20">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Active SKU Thresholds strictly enforced per North Hub QA Protocol v2.4
              </span>
              <div className="flex items-center gap-space-xs font-label-md text-label-md">
                <span className="text-on-surface-variant">Page {page}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Movement Audit Ledger */}
      {activeTab === 'ledger' && (
        <div className="flex flex-col gap-space-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-secondary text-[20px]">history</span>
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                Recent Stock Movement Ledger
              </h2>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm font-semibold uppercase">
                Real-Time Audit Trail
              </span>
            </div>

            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Type Filter:
              </span>
              <div className="inline-flex bg-surface-container-lowest rounded shadow-sm p-0.5 gap-0.5 border border-outline-variant/20">
                {(['ALL', 'INWARD_GRN', 'DISPATCH', 'ADJUSTMENT'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMovementTypeFilter(type)}
                    className={`px-2.5 py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${
                      movementTypeFilter === type
                        ? 'bg-surface-container text-on-surface'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {type === 'ALL' ? 'All Movements' : type === 'INWARD_GRN' ? 'Inward (GRN)' : type === 'DISPATCH' ? 'Outward (Challan)' : 'Audits (ADJ)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider h-9">
                    <th className="px-space-md py-2 font-semibold">Timestamp</th>
                    <th className="px-space-md py-2 font-semibold">Product & SKU</th>
                    <th className="px-space-md py-2 font-semibold">Movement Type</th>
                    <th className="px-space-md py-2 font-semibold text-right">Quantity Delta</th>
                    <th className="px-space-md py-2 font-semibold">Source → Destination Bay</th>
                    <th className="px-space-md py-2 font-semibold">Handler / Terminal</th>
                    <th className="px-space-md py-2 font-semibold text-right">Reference Doc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low font-body-sm">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-outline">
                        No stock movements recorded yet.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => {
                      const isOutward = m.quantity_delta < 0;
                      const d = new Date(m.created_at);
                      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const dateStr = d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

                      return (
                        <tr key={m.id} className="hover:bg-surface-container-low/60 transition-colors h-11">
                          <td className="px-space-md py-2 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-data-mono text-on-surface font-semibold text-label-md">
                                {timeStr}
                              </span>
                              <span className="font-data-mono text-[10px] text-outline">{dateStr}</span>
                            </div>
                          </td>
                          <td className="px-space-md py-2">
                            <div className="flex flex-col min-w-0 max-w-xs">
                              <span className="font-label-md text-label-md text-on-surface truncate">
                                {m.product_name || 'Product Item'}
                              </span>
                              <span className="font-data-mono text-[11px] text-outline truncate">
                                {m.product_sku || m.product_id}
                              </span>
                            </div>
                          </td>
                          <td className="px-space-md py-2 whitespace-nowrap">
                            {isOutward ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-error font-label-sm text-label-sm font-semibold uppercase">
                                <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                                OUT - {m.movement_type}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ecfdf5] text-[#047857] font-label-sm text-label-sm font-semibold uppercase">
                                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                                IN - {m.movement_type}
                              </span>
                            )}
                          </td>
                          <td className="px-space-md py-2 text-right whitespace-nowrap">
                            <span
                              className={`font-data-mono font-bold text-body-md ${
                                isOutward ? 'text-error' : 'text-[#047857]'
                              }`}
                            >
                              {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                            </span>
                            <span className="font-data-mono text-[11px] text-outline ml-0.5">pcs</span>
                          </td>
                          <td className="px-space-md py-2 font-data-mono text-body-sm text-on-surface truncate max-w-xs">
                            <span>{m.source_bay || 'RACK-04-B'}</span>
                            <span className="text-secondary mx-1">→</span>
                            <span className="font-semibold text-on-surface">
                              {m.destination_bay || (isOutward ? 'Dispatch Dock D-02' : 'Storage NH-B3')}
                            </span>
                          </td>
                          <td className="px-space-md py-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded bg-surface-container-high text-secondary flex items-center justify-center font-data-mono text-[9px] font-bold">
                                {(m.performed_by_name || 'RK').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col leading-none">
                                <span className="font-label-md text-label-md text-on-surface">
                                  {m.performed_by_name || 'System Operator'}
                                </span>
                                <span className="font-data-mono text-[10px] text-outline">Terminal #1</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-space-md py-2 text-right whitespace-nowrap">
                            {m.reference_id ? (
                              <Link
                                to={`/challans/${m.reference_id}`}
                                className="inline-flex items-center gap-1 text-secondary hover:underline font-data-mono text-label-md font-semibold"
                              >
                                <span>#{m.reference_id.slice(0, 10)}</span>
                                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                              </Link>
                            ) : (
                              <span className="font-data-mono text-outline text-xs">#ADJ-AUTO</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock / Inward Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">
                  {adjustType === 'INWARD_GRN' ? 'add_box' : 'edit_note'}
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  {adjustType === 'INWARD_GRN' ? 'Record Stock Inward (GRN)' : 'Manual Stock Adjustment'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-surface-container-low p-3 rounded text-body-sm space-y-1">
              <div className="font-semibold text-on-surface">{selectedProduct.name}</div>
              <div className="font-data-mono text-xs text-outline">SKU: {selectedProduct.sku}</div>
              <div className="flex justify-between pt-1 border-t border-outline-variant/20 text-xs">
                <span>Current Stock: <strong className="text-on-surface">{selectedProduct.current_stock} pcs</strong></span>
                <span>Buffer Min: <strong className="text-outline">{selectedProduct.min_stock_level} pcs</strong></span>
              </div>
            </div>

            {adjustError && (
              <div className="p-2.5 rounded bg-error-container text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span>{adjustError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-1">
                  Movement Type
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full h-8 px-2 rounded bg-surface-container-low font-body-sm text-on-surface focus:outline-none"
                >
                  <option value="INWARD_GRN">Stock Inward (GRN - Goods Received Note)</option>
                  <option value="ADJUSTMENT">Audit Count Adjustment (+ / -)</option>
                  <option value="DAMAGE">Damaged / Scrapped Stock (-)</option>
                </select>
              </div>

              <div>
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-1">
                  Quantity Delta ({adjustType === 'DAMAGE' ? 'Must be negative or positive deduction' : 'Units'})
                </label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  placeholder="e.g. +50 or -10"
                  required
                  className="w-full h-8 px-3 rounded bg-surface-container-low font-data-mono text-body-sm text-on-surface focus:outline-none"
                />
                <span className="text-[11px] text-outline block mt-0.5">
                  Resulting Stock:{' '}
                  <strong className="text-on-surface font-data-mono">
                    {Math.max(0, selectedProduct.current_stock + adjustQty)} pcs
                  </strong>
                </span>
              </div>

              <div>
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-1">
                  Reason / Notes / PO Ref
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. PO-8821 consignment arrival or physical cycle count audit"
                  className="w-full h-8 px-3 rounded bg-surface-container-low font-body-sm text-on-surface focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="h-8 px-space-md rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading || adjustQty === 0}
                  className="h-8 px-space-md rounded bg-primary text-on-primary hover:bg-inverse-surface disabled:opacity-50 font-label-md text-label-md font-semibold flex items-center gap-1 shadow-sm"
                >
                  <span>{adjustLoading ? 'Updating...' : 'Commit Ledger Movement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
