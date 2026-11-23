import React from 'react';
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  UserCheck,
  Radio,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'vitals'
  | 'falls'
  | 'bands'
  | 'residents'
  | 'users';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unresolvedFallCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  unresolvedFallCount = 0,
}) => {
  const { user } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Command Dashboard',
      description: 'Overview & telemetry',
      icon: LayoutDashboard,
    },
    {
      id: 'vitals' as NavTab,
      label: 'Vitals',
      description: 'Continuous telemetry stream',
      icon: HeartPulse,
    },
    {
      id: 'falls' as NavTab,
      label: 'Falls',
      description: 'Fall detection & emergency dispatch',
      icon: AlertTriangle,
      badge: unresolvedFallCount > 0 ? unresolvedFallCount : undefined,
    },
    {
      id: 'bands' as NavTab,
      label: 'Bands',
      description: 'Hardware sensor pod fleet',
      icon: Radio,
    },
    {
      id: 'residents' as NavTab,
      label: 'Residents',
      description: 'Care recipient profiles',
      icon: Users,
    },
    {
      id: 'users' as NavTab,
      label: 'Users',
      description: 'User access & roles',
      icon: UserCheck,
    },
  ];

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || 'U'}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <aside className="w-18 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-5 h-screen sticky top-0 z-30 transition-colors shadow-xs dark:shadow-none">
      {/* Brand Icon */}
      <div className="relative group mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/30 cursor-pointer">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        {/* Tooltip */}
        <div className="absolute left-16 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 border border-slate-700">
          careMP Sentinel Command Center
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-800 border-l border-b border-slate-700 rotate-45" />
        </div>
      </div>

      {/* Navigation Icons Rail */}
      <nav className="flex-1 flex flex-col items-center gap-2.5 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative group w-full flex justify-center">
              <button
                onClick={() => onTabChange(item.id)}
                aria-label={item.label}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer relative ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Active Indicator Pip */}
                {isActive && (
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-500 rounded-r-full shadow-sm" />
                )}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-600 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                    {item.badge}
                  </span>
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              </button>

              {/* Floating Tooltip */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 whitespace-nowrap z-50 border border-slate-800 dark:border-slate-700">
                <p className="font-semibold text-slate-100">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.description}</p>
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-800 border-l border-b border-slate-800 dark:border-slate-700 rotate-45" />
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Avatar */}
      <div className="w-full flex flex-col items-center pt-4 border-t border-slate-200 dark:border-slate-800/80">
        {/* User Avatar with Info Tooltip */}
        <div className="relative group">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer shadow-xs">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          {/* Tooltip */}
          <div className="absolute left-16 bottom-1 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 border border-slate-800 dark:border-slate-700">
            <p className="font-semibold text-slate-100">
              {user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Operator'}
            </p>
            <p className="text-[10px] font-mono uppercase text-emerald-400 mt-0.5">
              {user?.roleName || 'ADMIN'}
            </p>
            <p className="text-[10px] text-slate-400">{user?.emailAddress}</p>
            <div className="absolute -left-1 bottom-3 w-2 h-2 bg-slate-900 dark:bg-slate-800 border-l border-b border-slate-800 dark:border-slate-700 rotate-45" />
          </div>
        </div>
      </div>
    </aside>
  );
};
