import React, { useState, useEffect } from 'react';
import { Sun, Moon, Activity, LogOut, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  lastUpdated: Date;
  secondsRemaining: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSimulation?: () => void;
  onOpenTelemedicine?: () => void;
  onOpenCopilot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  subtitle,
  lastUpdated,
  secondsRemaining,
  isRefreshing,
  onRefresh,
  onOpenSimulation,
  onOpenTelemedicine,
  onOpenCopilot,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [formattedTime, setFormattedTime] = useState<string>('');

  useEffect(() => {
    setFormattedTime(
      lastUpdated.toLocaleTimeString([], {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
  }, [lastUpdated]);

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 60) * 100));

  return (
    <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <span>careMP Sentinel | </span>
          <span className="text-[10px] font-mono tracking-wider font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Build 2036 | Healthspan
          </span>
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Last sync timestamp (Single row) */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400 mr-1">
          <span className="text-slate-400 dark:text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
            Last sync:
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {formattedTime || '--:--:--'}
          </span>
        </div>

        {/* Progress Wheel & Timer (Auto-refresh indicator) */}
        <div
          onClick={onRefresh}
          role="button"
          tabIndex={0}
          title="Telemetry auto-refreshes every 60s. Click to refresh now."
          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/80 hover:border-emerald-500/40 transition cursor-pointer shadow-xs flex items-center justify-center group"
        >
          <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 -rotate-90 origin-center" viewBox="0 0 36 36">
              {/* Background Track Circle */}
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Progress Arc */}
              <path
                className={`text-emerald-500 transition-all duration-1000 ease-linear ${
                  isRefreshing ? 'animate-spin origin-center' : ''
                }`}
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            {/* Seconds Countdown at Center */}
            <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-[9px] text-slate-700 dark:text-slate-200">
              {secondsRemaining}
            </span>
          </div>
        </div>

        {/* Care Coach Copilot Trigger */}
        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            aria-label="Care Coach Copilot"
            title="Open Dementia Care Coach Copilot (Gemini 3.8 Flash)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Care Coach</span>
          </button>
        )}

        {/* Simulate Vitals Trigger (Icon Only) */}
        {onOpenSimulation && (
          <button
            onClick={onOpenSimulation}
            aria-label="Simulate Vitals"
            title="Simulate Vital Conditions"
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center"
          >
            <Activity className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle (Dark / Light) */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition cursor-pointer shadow-xs"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Logout Button (Last Item) */}
        <button
          onClick={() => logout()}
          aria-label="Sign Out"
          title="Sign Out"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition cursor-pointer shadow-xs flex items-center justify-center"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
