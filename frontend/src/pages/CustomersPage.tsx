import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Customer, Paginated } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function CustomersPage() {
  const [data, setData] = useState<Paginated<Customer> | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    api.get<Paginated<Customer>>(`/customers?${params}`).then((r) => {
      setData(r.data);
      setLoading(false);
    });
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg">Customers</h1>
            <span className="badge badge-active font-mono">{data?.total ?? '…'} Verified</span>
          </div>
          <p className="text-body-md mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
            Manage wholesale buyer accounts, credit terms, GST profiles, and sales follow-up schedules.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-primary" onClick={() => navigate('/customers/new')}>
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
              placeholder="Search by name, company, GSTIN, phone…"
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
                <th className="px-3 py-2 font-semibold">Mobile</th>
                <th className="px-3 py-2 font-semibold">GSTIN</th>
                <th className="px-3 py-2 font-semibold text-center">Status</th>
                <th className="px-3 py-2 font-semibold">Follow-up</th>
                <th className="px-3 py-2 font-semibold text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-body-sm"
                  style={{ color: 'var(--color-outline)' }}>Loading…</td></tr>
              )}
              {!loading && data?.data.map((c) => (
                <tr key={c.id}
                  className="h-10 transition-colors"
                  style={{ borderBottom: '1px solid var(--color-surface-container-low)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-bright)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                  <td className="px-3 py-1">
                    <div className="font-medium text-body-sm">{c.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--color-outline)' }}>{c.company}</div>
                  </td>
                  <td className="px-3 py-1 text-data-mono">{c.mobile}</td>
                  <td className="px-3 py-1 text-data-mono text-[11px]">{c.gstin ?? '—'}</td>
                  <td className="px-3 py-1 text-center"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-1 text-data-mono text-[11px]">
                    {c.follow_up_date
                      ? new Date(c.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-3 py-1 text-center">
                    <button
                      onClick={() => navigate(`/customers/${c.id}`)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--color-on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && data?.data.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-body-sm"
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
    </div>
  );
}
