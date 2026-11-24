import React from 'react';
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  UserCheck,
  Radio,
  AlertTriangle,
  MapPin,
  Building2,
  Signal,
  DoorOpen,
  Scan,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'vitals'
  | 'falls'
  | 'residents'
  | 'bands'
  | 'beacons'
  | 'chest-patches'
  | 'radar-pods'
  | 'floors'
  | 'rooms'
  | 'map'
  | 'users';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unresolvedFallCount?: number;
}

type NavItem =
  | {
      type: 'single';
      id: NavTab;
      label: string;
      description: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: number;
    }
  | {
      type: 'group';
      id: 'devices' | 'facility';
      label: string;
      description: string;
      icon: React.ComponentType<{ className?: string }>;
      defaultTab: NavTab;
      subItems: Array<{
        id: NavTab;
        label: string;
        description: string;
        icon: React.ComponentType<{ className?: string }>;
      }>;
    };

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  unresolvedFallCount = 0,
}) => {
  const { user } = useAuth();

  const navItems: NavItem[] = [
    {
      type: 'single',
      id: 'dashboard',
      label: 'Command Dashboard',
      description: 'Overview & telemetry',
      icon: LayoutDashboard,
    },
    {
      type: 'single',
      id: 'vitals',
      label: 'Vitals',
      description: 'Continuous telemetry stream',
      icon: HeartPulse,
    },
    {
      type: 'single',
      id: 'falls',
      label: 'Falls',
      description: 'Fall detection & emergency dispatch',
      icon: AlertTriangle,
      badge: unresolvedFallCount > 0 ? unresolvedFallCount : undefined,
    },
    {
      type: 'single',
      id: 'residents',
      label: 'Residents',
      description: 'Care recipient profiles',
      icon: Users,
    },
    {
      type: 'group',
      id: 'devices',
      label: 'Devices',
      description: 'Sensors & wearable hardware',
      icon: Cpu,
      defaultTab: 'bands',
      subItems: [
        {
          id: 'bands',
          label: 'Bands',
          description: 'Wearable bio-bands fleet',
          icon: Radio,
        },
        {
          id: 'beacons',
          label: 'Beacons',
          description: 'Indoor BLE beacon anchors',
          icon: Signal,
        },
        {
          id: 'chest-patches',
          label: 'Chest Patches',
          description: 'Continuous ECG hydrogel patches',
          icon: ShieldCheck,
        },
        {
          id: 'radar-pods',
          label: 'Radar Pods',
          description: '60GHz contact-free radar fleet',
          icon: Scan,
        },
      ],
    },
    {
      type: 'group',
      id: 'facility',
      label: 'Facility',
      description: 'Levels, rooms & indoor maps',
      icon: Building2,
      defaultTab: 'floors',
      subItems: [
        {
          id: 'floors',
          label: 'Floors',
          description: 'Architectural levels & wings',
          icon: Building2,
        },
        {
          id: 'rooms',
          label: 'Rooms',
          description: 'Suites, zones & perimeters',
          icon: DoorOpen,
        },
        {
          id: 'map',
          label: 'Facility Map',
          description: 'Indoor BLE beacon tracking',
          icon: MapPin,
        },
      ],
    },
    {
      type: 'single',
      id: 'users',
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

          if (item.type === 'single') {
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
          }

          // Group Menu Item (Devices or Facility)
          const isGroupActive = item.subItems.some((sub) => sub.id === activeTab);

          return (
            <div key={item.id} className="relative group w-full flex justify-center">
              <button
                onClick={() => {
                  if (!isGroupActive) {
                    onTabChange(item.defaultTab);
                  }
                }}
                aria-label={item.label}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer relative ${
                  isGroupActive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Active Indicator Pip */}
                {isGroupActive && (
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-500 rounded-r-full shadow-sm" />
                )}
                <Icon className={`w-5 h-5 ${isGroupActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              </button>

              {/* Flyout Submenu Popover with Bridge */}
              <div className="absolute left-14 top-1/2 -translate-y-1/2 pl-3 z-50 hidden group-hover:block pointer-events-auto">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 w-60 space-y-1 ring-1 ring-slate-900/5">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                  {item.subItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTabChange(sub.id);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                          isSubActive
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <SubIcon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{sub.label}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                            {sub.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Avatar */}
      <div className="w-full flex flex-col items-center pt-4 border-t border-slate-200 dark:border-slate-800/80">
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