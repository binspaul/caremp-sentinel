import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  AlertTriangle,
  HeartPulse,
  MapPin,
  Radio,
  Cpu,
  CheckCheck,
  Check,
  X,
  Search,
  Filter,
  ArrowUpRight,
  Video,
  Activity,
  Layers,
  Sparkles,
  ShieldAlert,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Notification, NotificationCounters, Resident } from '../../types';
import commandCenterService from '../../services/commandCenterService';

interface NotificationsViewProps {
  residentsMap: Record<number, Resident>;
  onNavigateToMap?: (roomNumber?: string) => void;
  onNavigateToVitals?: (residentId?: number) => void;
  onLaunchTelemedicine?: (residentId: number) => void;
  onNotificationsUpdated?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  residentsMap,
  onNavigateToMap,
  onNavigateToVitals,
  onLaunchTelemedicine,
  onNotificationsUpdated,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counters, setCounters] = useState<NotificationCounters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'critical' | 'fall' | 'vital_breach' | 'geofence' | 'device' | 'system'>('all');

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, countersRes] = await Promise.all([
        commandCenterService.getNotifications({
          skip: 0,
          limit: 100,
          type: ['fall', 'vital_breach', 'geofence', 'device', 'system'].includes(activeFilter)
            ? activeFilter
            : undefined,
          priority: activeFilter === 'critical' ? 'critical' : undefined,
          isRead: activeFilter === 'unread' ? false : undefined,
          search: searchTerm.trim() || undefined,
        }),
        commandCenterService.getNotificationCounters(),
      ]);

      setNotifications(listRes.data);
      setCounters(countersRes);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchTerm]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await commandCenterService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
      );
      if (counters) {
        setCounters({
          ...counters,
          unread: Math.max(0, counters.unread - 1),
        });
      }
      onNotificationsUpdated?.();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await commandCenterService.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      if (counters) {
        setCounters({
          ...counters,
          unread: 0,
          criticalUnread: 0,
        });
      }
      onNotificationsUpdated?.();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await commandCenterService.dismissNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (counters) {
        setCounters({
          ...counters,
          total: Math.max(0, counters.total - 1),
        });
      }
      onNotificationsUpdated?.();
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${Math.max(1, diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fall':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'vital_breach':
        return <HeartPulse className="w-4 h-4 text-amber-500" />;
      case 'geofence':
        return <MapPin className="w-4 h-4 text-purple-500" />;
      case 'device':
        return <Radio className="w-4 h-4 text-cyan-500" />;
      case 'system':
        return <Cpu className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Notice
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            <span>Notifications</span>
            {counters && counters.unread > 0 && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                {counters.unread} unread
              </span>
            )}
          </h2>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadNotifications}
            title="Refresh notifications"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {counters && counters.unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs hover:shadow-md transition cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Logged</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {counters?.total ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unread Alerts</p>
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {counters?.unread ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Critical Priority</p>
            <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {counters?.criticalUnread ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Triage Status</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {(counters?.unread ?? 0) === 0 ? 'All Clear' : 'Active Triage'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Filter & Notification Feed Container */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'critical', label: 'Critical' },
              { id: 'fall', label: 'Falls' },
              { id: 'vital_breach', label: 'Vitals' },
              { id: 'geofence', label: 'Geofence' },
              { id: 'device', label: 'Device & Battery' },
              { id: 'system', label: 'System' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeFilter === tab.id
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 pt-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20 animate-pulse flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-sans">
              <CheckCheck className="w-10 h-10 mx-auto mb-2 text-emerald-500/50" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No notifications found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm
                  ? `No alerts match "${searchTerm}".`
                  : 'All notifications triaged. The facility is operating smoothly.'}
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const resident = n.residentId ? residentsMap[n.residentId] : null;

              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    !n.isRead
                      ? 'bg-white dark:bg-slate-900 border-emerald-500/30 dark:border-emerald-500/30 shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 opacity-90'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Icon Container */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        n.priority === 'critical'
                          ? 'bg-rose-500/15 border border-rose-500/30'
                          : n.priority === 'high'
                          ? 'bg-amber-500/15 border border-amber-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {getTypeIcon(n.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Priority, Type, and Time */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {getPriorityBadge(n.priority)}
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                          {n.type.replace('_', ' ')}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(n.createdAt)}</span>
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-auto sm:ml-0" />
                        )}
                      </div>

                      {/* Title & Message */}
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {n.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {n.message}
                      </p>

                      {/* Associated Resident or Location Tag */}
                      <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px]">
                        {resident && (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                            <span>Resident:</span>
                            <span>{resident.firstName} {resident.lastName}</span>
                            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                              ({resident.uhid})
                            </span>
                          </div>
                        )}

                        {n.data?.roomNumber && (
                          <div className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>Room {n.data.roomNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Shortcuts */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      {n.residentId && onLaunchTelemedicine && (
                        <button
                          type="button"
                          onClick={() => onLaunchTelemedicine(n.residentId!)}
                          title="Launch Emergency Tele-consult"
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {n.data?.roomNumber && onNavigateToMap && (
                        <button
                          type="button"
                          onClick={() => onNavigateToMap(n.data?.roomNumber)}
                          title="Locate Room on Facility Map"
                          className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {n.residentId && onNavigateToVitals && (
                        <button
                          type="button"
                          onClick={() => onNavigateToVitals(n.residentId!)}
                          title="Jump to Telemetry Stream"
                          className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 transition cursor-pointer"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(n.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Read</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDismiss(n.id)}
                        title="Dismiss notification"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
