import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const navigate = useNavigate();

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
        <button
          onClick={() => navigate('/challans/new')}
          className="hidden md:inline-flex items-center gap-1 h-8 px-3 rounded btn-secondary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          <span>New Challan</span>
        </button>

        {/* Divider */}
        <div className="h-4 w-px" style={{ background: 'rgba(198,198,205,0.4)' }}></div>

        {/* User avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-primary)' }}
        >
          <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>person</span>
        </div>
      </div>
    </header>
  );
}
