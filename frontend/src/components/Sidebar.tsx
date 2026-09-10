import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/customers', label: 'Customers', icon: 'groups' },
  { path: '/products', label: 'Products', icon: 'inventory_2' },
  { path: '/inventory', label: 'Inventory', icon: 'warehouse' },
  { path: '/inventory?tab=ledger', label: 'Stock Movements', icon: 'swap_horiz' },
  { path: '/challans', label: 'Sales Challans', icon: 'receipt_long' },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isItemActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    if (path.includes('?tab=ledger')) return location.pathname === '/inventory' && location.search.includes('tab=ledger');
    if (path === '/inventory') return location.pathname === '/inventory' && !location.search.includes('tab=ledger');
    return location.pathname.startsWith(path);
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col justify-between select-none z-50"
      style={{ background: 'var(--color-surface-container-lowest)', borderRight: '1px solid rgba(198,198,205,0.3)' }}>
      <div className="flex flex-col">
        {/* Brand */}
        <div className="h-14 px-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid rgba(198,198,205,0.3)' }}>
          <div className="w-8 h-8 rounded flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>grid_view</span>
          </div>
          <div className="flex flex-col min-w-0 leading-none">
            <span className="text-headline-sm truncate" style={{ color: 'var(--color-on-surface)' }}>
              Apex Wholesale
            </span>
            <span className="text-label-sm uppercase tracking-wider mt-0.5"
              style={{ color: 'var(--color-on-surface-variant)' }}>
              ERP / CRM Core
            </span>
          </div>
        </div>

        {/* Section label */}
        <div className="px-3 py-2">
          <div className="px-2 py-1 text-label-sm uppercase tracking-wider"
            style={{ color: 'var(--color-outline)' }}>
            Operational Domains
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col px-2 gap-0.5">
          {navItems.map(({ path, label, icon }) => {
            const active = isItemActive(path);
            return (
              <NavLink
                key={path}
                to={path}
                className={`nav-item ${active ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-semibold shrink-0"
              style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate leading-tight">
                {user?.full_name ?? 'Staff User'}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold w-fit mt-0.5 bg-slate-100 text-slate-600">
                {user?.role ?? '—'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="p-2 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Sign Out of Portal"
            aria-label="Sign Out"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
