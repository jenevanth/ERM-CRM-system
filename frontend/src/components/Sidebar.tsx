import { NavLink, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
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
          {navItems.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User footer */}
      <div className="p-3" style={{
        borderTop: '1px solid rgba(198,198,205,0.3)',
        background: 'var(--color-surface-bright)',
      }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-semibold shrink-0"
              style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-label-md truncate leading-tight"
                style={{ color: 'var(--color-on-surface)' }}>
                {user?.full_name ?? 'Staff User'}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-label-sm w-fit mt-0.5"
                style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}>
                {user?.role ?? '—'}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded transition-colors"
            title="Sign Out"
            style={{ color: 'var(--color-on-surface-variant)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-container)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
