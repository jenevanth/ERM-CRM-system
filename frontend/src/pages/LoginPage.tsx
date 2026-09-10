import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signIn(email, password);
      navigate('/');
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
            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded text-xs font-semibold tracking-wide transition-opacity"
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
            </form>
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
