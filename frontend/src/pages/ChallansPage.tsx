import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { Challan, Paginated } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function ChallansPage() {
  const [data, setData] = useState<Paginated<Challan>>({ data: [], items: [], total: 0, page: 1, limit: 15, page_size: 15, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const fetchChallans = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: 15 };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get<Paginated<Challan>>('/challans', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load challans:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-xs">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Sales Challans & Dispatch
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-high text-secondary font-data-mono text-[10px] font-semibold uppercase tracking-wider">
              {data.total} Records
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Manage dispatch documentation, issue outward goods notes, and track customer delivery challans.
          </p>
        </div>

        <div className="flex items-center gap-space-sm shrink-0">
          <Link
            to="/challans/new"
            className="h-8 px-space-md rounded bg-primary text-on-primary hover:bg-inverse-surface font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Create Sales Challan</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-space-md bg-surface-container-lowest rounded shadow-sm border border-outline-variant/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md">
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-space-sm items-stretch sm:items-center">
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
              placeholder="Search challan number, customer name, notes..."
              className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm transition-all"
            />
          </div>

          <div className="inline-flex bg-surface-container-low rounded p-0.5 gap-0.5 border border-outline-variant/20">
            {(['ALL', 'CONFIRMED', 'DRAFT', 'CANCELLED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${
                  statusFilter === status
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {status === 'ALL' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-space-xs shrink-0 font-body-sm text-body-sm text-on-surface-variant">
          <span>Page {page} of {data.pages || 1}</span>
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
            disabled={page >= (data.pages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
            className="p-1 rounded hover:bg-surface-container-low text-on-surface disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-surface-container-lowest rounded shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead>
              <tr className="bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider h-9">
                <th className="px-space-md py-2 font-semibold">Challan Ref</th>
                <th className="px-space-md py-2 font-semibold">Customer Account</th>
                <th className="px-space-md py-2 font-semibold">Line Items</th>
                <th className="px-space-md py-2 font-semibold text-right">Total Units</th>
                <th className="px-space-md py-2 font-semibold text-right">Value (Incl. GST)</th>
                <th className="px-space-md py-2 font-semibold">Date Stamped</th>
                <th className="px-space-md py-2 font-semibold text-center">Status</th>
                <th className="px-space-md py-2 font-semibold text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-outline">
                    Loading sales challans...
                  </td>
                </tr>
              ) : (data.data || data.items || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-outline">
                    No challans found. Click "Create Sales Challan" above.
                  </td>
                </tr>
              ) : (
                (data.data || data.items || []).map((challan) => {
                  const subtotal = challan.items.reduce(
                    (acc, it) => acc + (it.total_price ?? it.quantity * (it.unit_price ?? it.unit_price_snapshot ?? 0)),
                    0
                  );
                  const totalWithGst = subtotal * 1.18;
                  const totalUnits = challan.items.reduce((acc, it) => acc + it.quantity, 0);

                  return (
                    <tr key={challan.id} className="hover:bg-surface-container-low/60 transition-colors h-12">
                      <td className="px-space-md py-2">
                        <Link
                          to={`/challans/${challan.id}`}
                          className="font-data-mono font-semibold text-secondary hover:underline"
                        >
                          {challan.challan_number}
                        </Link>
                      </td>
                      <td className="px-space-md py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
                            {challan.customer_name || 'Customer'}
                          </span>
                          <span className="font-body-sm text-xs text-outline truncate">
                            {challan.customer_company || 'Wholesale Account'}
                          </span>
                        </div>
                      </td>
                      <td className="px-space-md py-2">
                        <span className="px-2 py-0.5 rounded bg-surface-container font-data-mono text-xs text-on-surface-variant">
                          {challan.items.length} SKUs
                        </span>
                      </td>
                      <td className="px-space-md py-2 text-right font-data-mono font-medium text-on-surface">
                        {totalUnits} pcs
                      </td>
                      <td className="px-space-md py-2 text-right font-data-mono font-semibold text-on-surface">
                        ${totalWithGst.toFixed(2)}
                      </td>
                      <td className="px-space-md py-2 font-data-mono text-xs text-on-surface-variant">
                        {new Date(challan.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-space-md py-2 text-center">
                        <StatusBadge status={challan.status} />
                      </td>
                      <td className="px-space-md py-2 text-center">
                        <Link
                          to={`/challans/${challan.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors"
                        >
                          <span>View</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
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
  );
}
