import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';
import { Footer } from '../components/common/Footer';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 selection:bg-red-500 selection:text-white">
      <div className="max-w-md w-full">
        {/* Dealership Branding */}
        <div className="text-center mb-6">
          <div className="inline-block p-1.5 rounded-2xl bg-black border border-slate-800 shadow-2xl shadow-black/80 mb-3">
            <img src="/logo.png" alt="SR Automobiles" className="w-20 h-20 object-contain mx-auto rounded-xl" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white uppercase font-mono">
            SR AUTOMOBILES
          </h1>
          <p className="text-xs uppercase tracking-widest text-red-400 font-semibold mt-1">
            Vehicle Sales & GST Billing System
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Authorized Dealership Internal Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-800 animate-scale-in">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign in to Dealership</h2>
            <p className="text-xs text-slate-500 mt-1">
              Authorized personnel only. Sessions are logged for audit compliance.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="name@srautomobiles.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-red-900/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'LOGIN'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 text-center">
              Quick Test Credentials:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('owner@srautomobiles.in', 'admin123')}
                className="p-2 text-center rounded-lg border border-slate-200 hover:border-red-500 hover:bg-red-50/50 transition-colors text-left"
              >
                <div className="flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-red-600" />
                  <span className="text-[10px] font-bold text-slate-900">OWNER</span>
                </div>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">Venkata Ramana Reddy Umma</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@srautomobiles.in', 'admin123')}
                className="p-2 text-center rounded-lg border border-slate-200 hover:border-red-500 hover:bg-red-50/50 transition-colors text-left"
              >
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="text-[10px] font-bold text-slate-900">ADMIN</span>
                </div>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">Suresh Varma</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('billing@srautomobiles.in', 'staff123')}
                className="p-2 text-center rounded-lg border border-slate-200 hover:border-red-500 hover:bg-red-50/50 transition-colors text-left"
              >
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span className="text-[10px] font-bold text-slate-900">STAFF</span>
                </div>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">Billing Desk</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          SR AUTOMOBILES &copy; {new Date().getFullYear()} &bull; Vehicle Sales & GST Billing System
        </p>
        <Footer className="mt-2 bg-transparent border-0" />
      </div>
    </div>
  );
};
