import React, { useState, useEffect } from 'react';
import { Sun, Moon, Zap, LogOut, Bell } from 'lucide-react';
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
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  subtitle,
  lastUpdated,
  secondsRemaining,
  isRefreshing,
  onRefresh,
  onOpenSimulation,
  onOpenTelemedicine,
  onOpenNotifications,
  unreadNotificationCount = 0,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [formattedTime, setFormattedTime] = useState<string>('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

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
          <span>careMP Sentinel</span>
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

        {/* Simulation & Testing Center Trigger (Icon Only) */}
        {onOpenSimulation && (
          <button
            onClick={onOpenSimulation}
            aria-label="Simulation & Testing Center"
            title="Open Simulation & Testing Center (Vitals, Facility Movement, Geofence, Falls)"
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center"
          >
            <Zap className="w-4 h-4" />
          </button>
        )}

        {/* Notifications Trigger */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            aria-label="Notifications Center"
            title="Open Notifications Center"
            className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition cursor-pointer shadow-xs flex items-center justify-center"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
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
          onClick={() => setShowSignOutConfirm(true)}
          aria-label="Sign Out"
          title="Sign Out"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition cursor-pointer shadow-xs flex items-center justify-center"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Sign Out</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Are you sure you want to sign out of the Sentinel Command Center?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
