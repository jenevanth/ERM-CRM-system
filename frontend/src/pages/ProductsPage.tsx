import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/api';
import type { Product, Paginated } from '../types';

export default function ProductsPage() {
  const [data, setData] = useState<Paginated<Product> | null>(null);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal State
  const location = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Hardware',
    unit_price: '',
    current_stock: '0',
    minimum_stock: '10',
    warehouse: 'Main WH-01',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Open modal if URL is /products/new or ?new=true
  useEffect(() => {
    if (location.pathname === '/products/new' || location.search.includes('new=true')) {
      setIsCreateOpen(true);
    }
  }, [location.pathname, location.search]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (lowStock) params.set('low_stock', 'true');
    api.get<Paginated<Product>>(`/products?${params}`).then((r) => {
      setData(r.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [search, lowStock, page]);

  useEffect(() => { load(); }, [load]);

  const handleOpenCreate = () => {
    setFormError(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Electronics',
      unit_price: '499.00',
      current_stock: '25',
      minimum_stock: '10',
      warehouse: 'North Central Bay',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormError(null);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit_price: String(product.unit_price),
      current_stock: String(product.current_stock),
      minimum_stock: String(product.minimum_stock ?? (product as any).min_stock_level ?? 0),
      warehouse: product.warehouse || 'Main WH-01',
    });
    setIsEditOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      setFormError('Product Name and SKU are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (isEditOpen && selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, {
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          category: formData.category.trim(),
          unit_price: parseFloat(formData.unit_price) || 0,
          minimum_stock: parseInt(formData.minimum_stock, 10) || 0,
          warehouse: formData.warehouse.trim(),
        });
        setIsEditOpen(false);
      } else {
        await api.post('/products', {
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          category: formData.category.trim(),
          unit_price: parseFloat(formData.unit_price) || 0,
          current_stock: parseInt(formData.current_stock, 10) || 0,
          minimum_stock: parseInt(formData.minimum_stock, 10) || 0,
          warehouse: formData.warehouse.trim(),
        });
        setIsCreateOpen(false);
      }
      load();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string') {
        setFormError(detail);
      } else if (Array.isArray(detail)) {
        setFormError(detail.map((d: any) => d.msg || `${d.loc?.join('.')}: invalid`).join(', '));
      } else {
        setFormError('Failed to save product. Please check your inputs.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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
        <button className="btn-primary self-start" onClick={handleOpenCreate}>
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
                  style={{ color: 'var(--color-outline)' }}>Loading catalog…</td></tr>
              )}
              {!loading && data?.data.map((p) => {
                const min = p.minimum_stock ?? (p as any).min_stock_level ?? 0;
                const pct = min > 0 ? Math.min(100, Math.round((p.current_stock / min) * 100)) : 100;
                const isLow = p.is_low_stock || p.current_stock <= min;
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
                      style={{ color: isLow ? 'var(--color-error)' : 'var(--color-on-surface)' }}>
                      {p.current_stock}
                    </td>
                    <td className="px-3 py-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-full overflow-hidden h-1.5"
                          style={{ background: 'var(--color-surface-container-high)', minWidth: 60 }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: isLow ? 'var(--color-error)' : 'var(--color-secondary)',
                            }} />
                        </div>
                        <span className="text-data-mono text-[10px] shrink-0"
                          style={{ color: 'var(--color-on-surface-variant)' }}>
                          min {min}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-1 text-center">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 rounded transition-colors text-primary hover:bg-surface-container"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Edit Product"
                      >
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

      {/* Modal: Create or Edit Product */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 border border-outline-variant/30" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <div className="flex items-center justify-between border-b pb-3 border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  {isEditOpen ? 'edit' : 'add_box'}
                </span>
                <h3 className="text-title-lg font-bold text-on-surface">
                  {isEditOpen ? 'Edit Product Catalog Item' : 'Add New Product'}
                </h3>
              </div>
              <button
                onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
                className="p-1 rounded hover:bg-surface-container text-outline"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-body-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mechanical Keyboard Pro"
                    className="form-input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    SKU Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KB-PRO-RGB"
                    className="form-input w-full font-mono uppercase"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Peripherals / Electronics"
                    className="form-input w-full"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="2499.00"
                    className="form-input w-full font-mono"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!isEditOpen && (
                  <div>
                    <label className="text-xs font-semibold text-on-surface block mb-1">
                      Initial Physical Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input w-full font-mono"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    />
                  </div>
                )}
                <div className={isEditOpen ? 'sm:col-span-2' : ''}>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Minimum Reorder Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input w-full font-mono"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Warehouse Location / Bay
                </label>
                <input
                  type="text"
                  placeholder="North Warehouse Bay A-12"
                  className="form-input w-full"
                  value={formData.warehouse}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                />
              </div>

              {formError && (
                <div className="p-2.5 rounded bg-error/10 border border-error/20 text-xs text-error font-medium">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : isEditOpen ? 'Update Product' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
