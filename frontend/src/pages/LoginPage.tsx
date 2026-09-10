import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { user, signIn, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signIn(email, password);
      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError('');
    try {
      await signIn(quickEmail, quickPass);
      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between"
      style={{ background: '#F8F9FA', color: 'var(--color-on-surface)' }}
    >
      {/* Header */}
      <header
        className="w-full px-6 py-3 flex items-center"
        style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center"
              style={{ background: '#0f172a' }}>
              <span className="material-symbols-outlined text-slate-300" style={{ fontSize: 18 }}>grid_view</span>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight" style={{ color: '#0f172a' }}>Apex Wholesale</span>
              <span className="block text-[11px]" style={{ color: '#64748b' }}>Staff Portal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[460px]">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden"
            style={{ border: '1px solid #e2e8f0' }}>

            {/* Card header */}
            <div className="p-6 pb-4 text-center" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: '#0f172a' }}>Sign In</h1>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                Enter your work email and password to access your dashboard
              </p>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {user && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-xs">
                    <p className="font-semibold text-blue-950">Currently signed in as:</p>
                    <p className="text-blue-800 font-mono text-[11px]">{user.full_name} ({user.role})</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                    >
                      Console
                    </button>
                    <button
                      type="button"
                      onClick={async () => { await signOut(); window.location.reload(); }}
                      className="px-2.5 py-1 rounded bg-white text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-50 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="px-3 py-2 rounded text-xs"
                  style={{ background: 'var(--color-error-container)', color: 'var(--color-error)' }}>
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold mb-1.5" style={{ color: '#334155' }}>
                  Corporate Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    style={{ color: '#94a3b8' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail</span>
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@apexwholesale.in"
                    className="block w-full pl-9 pr-3 py-2 rounded text-xs focus:outline-none font-mono"
                    style={{
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      background: '#fff',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-xs font-semibold" style={{ color: '#334155' }}>
                    Password
                  </label>
                  <a href="#" className="text-xs" style={{ color: '#64748b' }}>Forgot password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    style={{ color: '#94a3b8' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
                  </div>
                  <input
                    type={showPw ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="block w-full pl-9 pr-10 py-2 rounded text-xs focus:outline-none font-mono tracking-wider"
                    style={{
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      background: '#fff',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    style={{ color: '#94a3b8' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {showPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded text-xs font-semibold tracking-wide transition-opacity cursor-pointer"
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    border: 'none',
                  }}
                >
                  <span>{loading ? 'Signing In…' : 'Sign In'}</span>
                  {!loading && (
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                  )}
                </button>
              </div>

              {/* Quick Role Logins Section */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-2.5">
                  Fast Demo Logins (Click to Sign In)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin('admin@apex.in', 'Admin@123')}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    <span>Admin</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin('sales@apex.in', 'Sales@123')}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Sales Lead</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin('warehouse@apex.in', 'Warehouse@123')}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span>Warehouse</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin('accounts@apex.in', 'Accounts@123')}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-colors cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>Accounts</span>
                  </button>
                </div>
              </div>

              {/* Registration Link */}
              <div className="pt-2 text-center text-xs text-slate-600">
                Need a staff account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="font-semibold text-slate-900 hover:underline cursor-pointer"
                >
                  Register Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>

      {/* Footer */}
      <footer className="w-full px-6 py-3 text-center text-xs"
        style={{ background: '#fff', borderTop: '1px solid #e2e8f0', color: '#94a3b8' }}>
        © 2024 Apex Wholesale Private Ltd. All rights reserved.
      </footer>
    </div>
  );
}
