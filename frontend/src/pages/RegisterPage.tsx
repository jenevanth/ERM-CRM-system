import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'SALES' | 'WAREHOUSE' | 'ADMIN'>('SALES');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName, role);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F9FA] text-[#0F172A] antialiased min-h-screen flex flex-col justify-between selection:bg-slate-200">
      {/* Top Enterprise Security Banner */}
      <header className="w-full border-b border-slate-200 bg-white px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-semibold text-sm">
              <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">Apex Wholesale</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center space-x-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="19" y1="12" x2="5" y2="12" strokeWidth="2"></line>
                <polyline points="12 19 5 12 12 5" strokeWidth="2"></polyline>
              </svg>
              <span>Existing Staff Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[540px]">
          {/* Primary Card */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden p-6 sm:p-8">
            <div className="mb-6 text-center sm:text-left">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Create Staff Account</h1>
              <p className="text-xs text-slate-500 mt-1">Register your credentials to access the Apex Wholesale portal.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">check_circle</span>
                <span>Account created successfully! Redirecting...</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="fullname" className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  id="fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  required
                  className="block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <div>
                <label htmlFor="workemail" className="block text-xs font-semibold text-slate-700 mb-1.5">Work Email</label>
                <input
                  type="email"
                  id="workemail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@apexwholesale.in"
                  required
                  className="block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-medium"
                >
                  <option value="SALES">Sales & CRM</option>
                  <option value="WAREHOUSE">Warehouse Operations</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new_pass" className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    id="new_pass"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="confirm_pass" className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    id="confirm_pass"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="block w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-2.5 px-4 rounded text-xs font-semibold tracking-wide transition-colors shadow-sm"
                >
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Context Switcher */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-slate-900 font-semibold hover:underline ml-0.5">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Portal Footer */}
      <footer className="w-full border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div>© 2024 Apex Wholesale. All rights reserved.</div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-600 cursor-pointer">Help Desk</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
