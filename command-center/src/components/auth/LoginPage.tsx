import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Radio, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, KeyRound, Sun, Moon } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [emailAddress, setEmailAddress] = useState('sadmin@caremp.ai');
  const [password, setPassword] = useState('sadmin@123#');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailAddress.trim() || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(emailAddress.trim(), password);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Authentication failed. Please verify your email and password.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDoctorCredentials = () => {
    setEmailAddress('doctor@caremp.ai');
    setPassword('doctor@123#');
    setError(null);
  };

  const fillSeededCredentials = () => {
    setEmailAddress('sadmin@caremp.ai');
    setPassword('sadmin@123#');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors">
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xl shadow-emerald-500/20 ring-1 ring-emerald-400/30 mb-4">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
           carMP Sentinel Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Mission control for continuous telemetry & resident digital twins
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-colors">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Operator Sign In</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enter your credentials to access telemetry</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SECURE</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="name@caremp.ai"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono shadow-sm dark:shadow-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono shadow-sm dark:shadow-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-2 py-3 px-4 rounded-xl text-xs font-semibold tracking-wide text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/25 border border-emerald-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'
              }`}
            >
              <span>{isSubmitting ? 'Authenticating Operator...' : 'Sign In to Command Center'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Seed credentials shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Doctor / Clinician (Admin):</span>
                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  doctor@caremp.ai &bull; doctor@123#
                </p>
              </div>
              <button
                type="button"
                onClick={fillDoctorCredentials}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-mono text-[11px] font-medium transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Fill Doctor</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/40">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Super Administrator:</span>
                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  sadmin@caremp.ai &bull; sadmin@123#
                </p>
              </div>
              <button
                type="button"
                onClick={fillSeededCredentials}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-mono text-[11px] font-medium transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Fill SuperAdmin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6 font-mono">
          careMP Sentinel | Build 2036 | Healthspan
        </p>
      </div>
    </div>
  );
};
