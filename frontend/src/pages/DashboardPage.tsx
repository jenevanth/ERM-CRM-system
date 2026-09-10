import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { DashboardStats } from '../types';
import StatusBadge from '../components/StatusBadge';

const StatCard = ({
  label,
  value,
  icon,
  sub,
  subColor,
}: {
  label: string;
  value: string | number;
  icon: string;
  sub?: string;
  subColor?: string;
}) => (
  <div
    className="rounded p-3 flex flex-col justify-between shadow-sm"
    style={{ background: 'var(--color-surface-container-lowest)' }}
  >
    <div className="flex items-start justify-between">
      <span className="text-label-sm uppercase tracking-wider font-semibold"
        style={{ color: 'var(--color-on-surface-variant)' }}>
        {label}
      </span>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-outline)' }}>
        {icon}
      </span>
    </div>
    <div className="mt-3">
      <span className="text-display-sm font-mono" style={{ color: 'var(--color-on-surface)' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      {sub && (
        <div className="mt-1 text-body-sm" style={{ color: subColor ?? 'var(--color-on-surface-variant)' }}>
          {sub}
        </div>
      )}
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<DashboardStats>('/dashboard').then((r) => {
      setStats(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-label-md" style={{ color: 'var(--color-outline)' }}>
      Loading…
    </div>
  );

  if (!stats) return null;

  const lowStockPct = (item: { current_stock: number; minimum_stock: number }) =>
    item.minimum_stock > 0
      ? Math.min(100, Math.round((item.current_stock / item.minimum_stock) * 100))
      : 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg">Operations Overview</h1>
            <span className="badge badge-active">Live Node</span>
          </div>
          <p className="text-body-sm mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
            Real-time dispatch, inventory alerts, and customer activity across North Hub.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active Customers"
          value={stats.total_customers}
          icon="groups"
          sub={`${stats.upcoming_followups.length} upcoming follow-ups`}
        />
        <StatCard
          label="Total Catalog SKUs"
          value={stats.total_products}
          icon="inventory_2"
          sub="Active lines"
        />
        <StatCard
          label="Low Stock Items"
          value={stats.low_stock_count}
          icon="warning"
          sub={stats.low_stock_count > 0 ? 'SKUs critical' : 'All stock healthy'}
          subColor={stats.low_stock_count > 0 ? 'var(--color-error)' : 'var(--color-secondary)'}
        />
        <StatCard
          label="Today's Challans"
          value={stats.today_challans}
          icon="local_shipping"
          sub="Dispatched today"
        />
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left col — 7/12 */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* Recent Challans */}
          <div className="rounded shadow-sm overflow-hidden" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <div className="h-10 px-3 flex items-center justify-between"
              style={{ background: 'var(--color-surface-bright)' }}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-outline)' }}>receipt_long</span>
                <span className="text-headline-sm">Recent Sales Challans</span>
              </div>
              <button onClick={() => navigate('/challans')}
                className="text-label-md flex items-center gap-0.5 transition-colors"
                style={{ color: 'var(--color-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <span>View Register</span>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="text-label-md uppercase tracking-wider h-8"
                    style={{ background: 'rgba(239,244,255,0.6)', color: 'var(--color-on-surface-variant)' }}>
                    <th className="px-3 py-1 font-semibold">Challan #</th>
                    <th className="px-3 py-1 font-semibold">Customer</th>
                    <th className="px-3 py-1 font-semibold text-right">Qty</th>
                    <th className="px-3 py-1 font-semibold text-center">Status</th>
                    <th className="px-3 py-1 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: '1px solid var(--color-surface-container-low)' }}>
                  {stats.recent_challans.map((c) => (
                    <tr key={c.id}
                      className="h-9 transition-colors"
                      style={{ borderBottom: '1px solid var(--color-surface-container-low)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-bright)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                      <td className="px-3 py-1 text-data-mono font-semibold">{c.challan_number}</td>
                      <td className="px-3 py-1 font-medium">{c.customer_name ?? '—'}</td>
                      <td className="px-3 py-1 text-right text-data-mono">{c.total_quantity}u</td>
                      <td className="px-3 py-1 text-center">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-3 py-1 text-center">
                        <button onClick={() => navigate(`/challans/${c.id}`)}
                          className="p-1 rounded transition-colors"
                          style={{ color: 'var(--color-on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {stats.recent_challans.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-body-sm"
                      style={{ color: 'var(--color-outline)' }}>No challans today</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right col — 5/12 */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* Low stock alerts */}
          <div className="rounded shadow-sm overflow-hidden" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <div className="h-10 px-3 flex items-center justify-between"
              style={{ background: 'var(--color-surface-bright)' }}>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-error)' }}>notification_important</span>
                <span className="text-headline-sm">Immediate Action: Low Stock</span>
              </div>
              <span className="badge badge-low-stock">{stats.low_stock_count} Urgent</span>
            </div>
            <div className="p-3 flex flex-col gap-3">
              {stats.low_stock_products.map((p) => {
                const pct = lowStockPct(p);
                return (
                  <div key={p.id} className="flex flex-col gap-1 pb-3"
                    style={{ borderBottom: '1px solid var(--color-surface-container-low)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-data-mono font-semibold">{p.sku}</span>
                        <div className="text-body-md font-medium mt-0.5">{p.name}</div>
                      </div>
                      <button onClick={() => navigate('/inventory')} className="btn-primary" style={{ height: 24, fontSize: 10 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>add_shopping_cart</span>
                        <span>Stock In</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 rounded-full overflow-hidden h-1.5"
                        style={{ background: 'var(--color-surface-container-high)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: pct < 50 ? 'var(--color-error)' : 'var(--color-secondary)',
                          }} />
                      </div>
                      <span className="text-data-mono text-[11px] font-semibold shrink-0"
                        style={{ color: 'var(--color-error)' }}>
                        {p.current_stock} left
                        <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 400 }}> / min {p.minimum_stock}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
              {stats.low_stock_products.length === 0 && (
                <div className="text-center py-4 text-body-sm" style={{ color: 'var(--color-outline)' }}>
                  All stock levels healthy ✓
                </div>
              )}
            </div>
          </div>

          {/* Upcoming follow-ups */}
          <div className="rounded shadow-sm overflow-hidden" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <div className="h-10 px-3 flex items-center justify-between"
              style={{ background: 'var(--color-surface-bright)' }}>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-outline)' }}>call</span>
                <span className="text-headline-sm">Customer Follow-ups</span>
              </div>
              <span className="text-data-mono text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                Pending ({stats.upcoming_followups.length})
              </span>
            </div>
            <div style={{ borderTop: '1px solid var(--color-surface-container-low)' }}>
              {stats.upcoming_followups.map((f) => (
                <div key={f.id} className="p-3 flex items-center justify-between transition-colors"
                  style={{ borderBottom: '1px solid var(--color-surface-container-low)' }}>
                  <div>
                    <div className="font-semibold text-body-md">{f.name}</div>
                    <div className="text-data-mono text-[11px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
                      {new Date(f.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <a href={`tel:${f.mobile}`} className="btn-secondary" style={{ height: 24, fontSize: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>call</span>
                    <span>Call</span>
                  </a>
                </div>
              ))}
              {stats.upcoming_followups.length === 0 && (
                <div className="text-center py-4 text-body-sm" style={{ color: 'var(--color-outline)' }}>
                  No follow-ups this week
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
