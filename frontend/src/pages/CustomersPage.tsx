import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import type { Customer, Paginated } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function CustomersPage() {
  const [data, setData] = useState<Paginated<Customer> | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal State
  const location = useLocation();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    mobile: '',
    email: '',
    gst_number: '',
    customer_type: 'WHOLESALE',
    status: 'ACTIVE',
    address: '',
    follow_up_date: '',
    notes: '',
  });

  // Open modal if route is /customers/new or query param ?new=true
  useEffect(() => {
    if (location.pathname === '/customers/new' || location.search.includes('new=true')) {
      setIsCreateOpen(true);
    }
  }, [location.pathname, location.search]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    api.get<Paginated<Customer>>(`/customers?${params}`).then((r) => {
      setData(r.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const handleOpenCreate = () => {
    setFormError(null);
    setFormData({
      name: '',
      business_name: '',
      mobile: '',
      email: '',
      gst_number: '',
      customer_type: 'WHOLESALE',
      status: 'ACTIVE',
      address: '',
      follow_up_date: '',
      notes: '',
    });
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    if (location.pathname === '/customers/new') {
      navigate('/customers', { replace: true });
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      setFormError('Customer Name and Mobile Number are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload: Record<string, any> = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        customer_type: formData.customer_type,
        status: formData.status,
      };

      if (formData.business_name.trim()) {
        payload.business_name = formData.business_name.trim();
        payload.company = formData.business_name.trim();
      }
      if (formData.email.trim()) payload.email = formData.email.trim();
      if (formData.gst_number.trim()) {
        payload.gst_number = formData.gst_number.trim();
        payload.gstin = formData.gst_number.trim();
      }
      if (formData.address.trim()) payload.address = formData.address.trim();
      if (formData.follow_up_date) {
        payload.follow_up_date = new Date(formData.follow_up_date).toISOString();
      }
      if (formData.notes.trim()) payload.notes = formData.notes.trim();

      const res = await api.post('/customers', payload);
      handleCloseCreate();
      load();

      // Optional navigate to newly created customer
      if (res.data?.id) {
        navigate(`/customers/${res.data.id}`);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string') {
        setFormError(detail);
      } else if (Array.isArray(detail)) {
        setFormError(detail.map((d: any) => d.msg || `${d.loc?.join('.')}: invalid`).join(', '));
      } else if (detail?.error) {
        setFormError(detail.error);
      } else {
        setFormError('Failed to create customer. Please verify the details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg">Customers</h1>
            <span className="badge badge-active font-mono">{data?.total ?? '…'} Registered</span>
          </div>
          <p className="text-body-md mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
            Manage wholesale buyer accounts, credit terms, GST profiles, and sales follow-up schedules.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-primary" onClick={handleOpenCreate}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-lg p-3 shadow-sm" style={{ background: 'var(--color-surface-container-lowest)' }}>
        <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ fontSize: 16, color: 'var(--color-outline)' }}>search</span>
            <input
              type="text"
              className="form-input pl-8"
              placeholder="Search by customer name, business entity, GSTIN, phone…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="relative">
            <select
              className="form-input pr-7 appearance-none"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">Status: All</option>
              <option value="ACTIVE">Active</option>
              <option value="LEAD">Lead</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ fontSize: 14, color: 'var(--color-outline)' }}>expand_more</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded shadow-sm overflow-hidden" style={{ background: 'var(--color-surface-container-lowest)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-label-md uppercase tracking-wider h-9"
                style={{ background: 'rgba(239,244,255,0.6)', color: 'var(--color-on-surface-variant)' }}>
                <th className="px-3 py-2 font-semibold">Customer</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Mobile</th>
                <th className="px-3 py-2 font-semibold">GSTIN</th>
                <th className="px-3 py-2 font-semibold text-center">Status</th>
                <th className="px-3 py-2 font-semibold">Follow-up</th>
                <th className="px-3 py-2 font-semibold text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-body-sm"
                  style={{ color: 'var(--color-outline)' }}>Loading records…</td></tr>
              )}
              {!loading && data?.data.map((c) => {
                const bName = (c as any).business_name || c.company || c.name;
                const gst = (c as any).gst_number || c.gstin;
                const type = (c as any).customer_type || 'WHOLESALE';
                return (
                  <tr key={c.id}
                    className="h-10 transition-colors"
                    style={{ borderBottom: '1px solid var(--color-surface-container-low)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-bright)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <td className="px-3 py-1">
                      <div className="font-medium text-body-sm">{c.name}</div>
                      <div className="text-[11px]" style={{ color: 'var(--color-outline)' }}>{bName !== c.name ? bName : 'Direct Customer'}</div>
                    </td>
                    <td className="px-3 py-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-container text-secondary">
                        {type}
                      </span>
                    </td>
                    <td className="px-3 py-1 text-data-mono">{c.mobile}</td>
                    <td className="px-3 py-1 text-data-mono text-[11px]">{gst ?? '—'}</td>
                    <td className="px-3 py-1 text-center"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-1 text-data-mono text-[11px]">
                      {c.follow_up_date
                        ? new Date(c.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                        : '—'}
                    </td>
                    <td className="px-3 py-1 text-center">
                      <button
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="p-1 rounded transition-colors text-primary hover:bg-surface-container"
                        style={{ border: 'none', cursor: 'pointer' }}
                        title="View Customer Dossier"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && data?.data.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-body-sm"
                  style={{ color: 'var(--color-outline)' }}>No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Add New Customer Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="rounded-xl w-full max-w-xl p-6 shadow-2xl space-y-4 border border-outline-variant/30" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <div className="flex items-center justify-between border-b pb-3 border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">person_add</span>
                <h3 className="text-title-lg font-bold text-on-surface">Add New Customer</h3>
              </div>
              <button
                onClick={handleCloseCreate}
                className="p-1 rounded hover:bg-surface-container text-outline"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-body-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Customer / Contact Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    className="form-input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Business / Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kumar Traders Pvt Ltd"
                    className="form-input w-full"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Mobile Number <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    className="form-input w-full font-mono"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="rajesh@kumartraders.com"
                    className="form-input w-full"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="27ABCDE1234F1Z5"
                    className="form-input w-full font-mono uppercase"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Customer Classification
                  </label>
                  <select
                    className="form-input w-full"
                    value={formData.customer_type}
                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                  >
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="RETAIL">Retail</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Initial Status
                  </label>
                  <select
                    className="form-input w-full"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active Account</option>
                    <option value="LEAD">Prospect / Lead</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    First CRM Follow-up Date
                  </label>
                  <input
                    type="date"
                    className="form-input w-full text-xs"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Billing / Dispatch Address
                </label>
                <input
                  type="text"
                  placeholder="Plot 45, MIDC Industrial Area, Mumbai 400093"
                  className="form-input w-full"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Initial Notes / Requirements
                </label>
                <textarea
                  rows={2}
                  placeholder="Payment terms, special discounts, credit limit or buyer background..."
                  className="form-input w-full"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  onClick={handleCloseCreate}
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
                  {submitting ? 'Registering Customer...' : 'Save & Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
