import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar />
      <div className="pl-60 min-h-screen flex flex-col">
        <Topbar />
        <main className="pt-14 flex-1 px-6 py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
