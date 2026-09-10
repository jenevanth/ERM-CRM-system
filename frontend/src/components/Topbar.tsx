import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      window.location.href = '/login';
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header
      className="fixed top-0 left-60 right-0 h-14 z-40 px-6 flex items-center justify-between"
      style={{
        background: 'var(--color-surface-container-lowest)',
        borderBottom: '1px solid rgba(198,198,205,0.3)',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-label-md" style={{ color: 'var(--color-on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>domain</span>
          <span>Apex Operations</span>
          <span style={{ color: 'var(--color-outline-variant)' }}>/</span>
          <span style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>Console</span>
        </div>
        <span
          className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded tracking-wider"
          style={{
            background: 'var(--color-surface-container-low)',
            color: 'var(--color-secondary)',
            border: '1px solid rgba(198,198,205,0.3)',
          }}
        >
          PROD-NORTH HUB
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sync status */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: 'var(--color-surface-container-low)', border: '1px solid rgba(198,198,205,0.3)' }}
        >
          <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
          <span className="text-label-sm uppercase tracking-wider" style={{ color: 'var(--color-on-surface-variant)' }}>
            Sync: Realtime
          </span>
        </div>

        {/* New Challan CTA */}
        {user?.role !== 'WAREHOUSE' && user?.role !== 'ACCOUNTS' && (
          <button
            onClick={() => navigate('/challans/new')}
            className="hidden md:inline-flex items-center gap-1 h-8 px-3 rounded btn-secondary cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            <span>New Challan</span>
          </button>
        )}

        {/* Divider */}
        <div className="h-5 w-px" style={{ background: 'rgba(198,198,205,0.4)' }}></div>

        {/* User profile dropdown container */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            style={{ border: '1px solid rgba(198,198,205,0.4)' }}
            title="User Profile & Menu"
            aria-label="User Profile"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold text-white shrink-0"
              style={{ background: 'var(--color-primary)' }}
            >
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                {user?.full_name || 'Staff User'}
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                {user?.role || '—'}
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>
              {dropdownOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* User Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              style={{ border: '1px solid #e2e8f0' }}
            >
              {/* User Details Header */}
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || 'Staff User'}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email || 'user@apexwholesale.in'}</p>
                <div className="mt-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    Role: {user?.role || '—'}
                  </span>
                </div>
              </div>

              {/* Navigation links inside dropdown */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => { setDropdownOpen(false); navigate('/'); }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>dashboard</span>
                  <span>Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setDropdownOpen(false); navigate('/customers'); }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 16 }}>groups</span>
                  <span>Customer Directory</span>
                </button>
              </div>

              {/* Prominent Sign Out Button */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-red-500" style={{ fontSize: 18 }}>logout</span>
                  <span>Sign Out of Portal</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Topbar Quick Logout Button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
          title="Sign Out of Portal"
          aria-label="Logout"
        >
          <span className="material-symbols-outlined text-red-600" style={{ fontSize: 16 }}>logout</span>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
