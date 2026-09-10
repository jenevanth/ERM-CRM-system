import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Product, Paginated } from '../types';

export default function ProductsPage() {
  const [data, setData] = useState<Paginated<Product> | null>(null);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (lowStock) params.set('low_stock', 'true');
    api.get<Paginated<Product>>(`/products?${params}`).then((r) => {
      setData(r.data);
      setLoading(false);
    });
  }, [search, lowStock, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg">Products</h1>
            <span className="badge badge-active font-mono">{data?.total ?? '…'} SKUs</span>
          </div>
          <p className="text-body-md mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
            Manage product catalog, pricing, and stock thresholds.
          </p>
        </div>
        <button className="btn-primary self-start" onClick={() => navigate('/products/new')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg p-3 shadow-sm" style={{ background: 'var(--color-surface-container-lowest)' }}>
        <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ fontSize: 16, color: 'var(--color-outline)' }}>search</span>
            <input type="text" className="form-input pl-8"
              placeholder="Search by product name or SKU…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-label-lg">
            <input type="checkbox" checked={lowStock}
              onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
              className="w-3.5 h-3.5 rounded" />
            <span>Low stock only</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="rounded shadow-sm overflow-hidden" style={{ background: 'var(--color-surface-container-lowest)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-label-md uppercase tracking-wider h-9"
                style={{ background: 'rgba(239,244,255,0.6)', color: 'var(--color-on-surface-variant)' }}>
                <th className="px-3 py-2 font-semibold">SKU</th>
                <th className="px-3 py-2 font-semibold">Product</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold text-right">Unit Price</th>
                <th className="px-3 py-2 font-semibold text-right">Stock</th>
                <th className="px-3 py-2 font-semibold text-center">Stock Level</th>
                <th className="px-3 py-2 font-semibold text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-body-sm"
                  style={{ color: 'var(--color-outline)' }}>Loading…</td></tr>
              )}
              {!loading && data?.data.map((p) => {
                const pct = p.minimum_stock > 0
                  ? Math.min(100, Math.round((p.current_stock / p.minimum_stock) * 100))
                  : 100;
                return (
                  <tr key={p.id}
                    className="h-10 transition-colors"
                    style={{ borderBottom: '1px solid var(--color-surface-container-low)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-bright)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <td className="px-3 py-1 text-data-mono font-medium">{p.sku}</td>
                    <td className="px-3 py-1 font-medium text-body-sm">{p.name}</td>
                    <td className="px-3 py-1 text-body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{p.category}</td>
                    <td className="px-3 py-1 text-right text-data-mono font-semibold">₹{Number(p.unit_price).toFixed(2)}</td>
                    <td className="px-3 py-1 text-right text-data-mono font-semibold"
                      style={{ color: p.is_low_stock ? 'var(--color-error)' : 'var(--color-on-surface)' }}>
                      {p.current_stock}
                    </td>
                    <td className="px-3 py-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-full overflow-hidden h-1.5"
                          style={{ background: 'var(--color-surface-container-high)', minWidth: 60 }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: p.is_low_stock ? 'var(--color-error)' : 'var(--color-secondary)',
                            }} />
                        </div>
                        <span className="text-data-mono text-[10px] shrink-0"
                          style={{ color: 'var(--color-on-surface-variant)' }}>
                          min {p.minimum_stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-1 text-center">
                      <button
                        onClick={() => navigate(`/products/${p.id}`)}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--color-on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && data?.data.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-body-sm"
                  style={{ color: 'var(--color-outline)' }}>No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data && data.total > 20 && (
          <div className="px-3 py-2 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--color-surface-container-low)' }}>
            <span className="text-body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary" style={{ height: 28 }}>Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary" style={{ height: 28 }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
