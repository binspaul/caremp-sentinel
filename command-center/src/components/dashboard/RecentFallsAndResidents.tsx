import React from 'react';
import {
  AlertTriangle,
  Users,
  ChevronRight,
  Activity,
  Video,
  Clock,
  Compass,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { FallIncident, Resident } from '../../types';

interface RecentFallsAndResidentsProps {
  recentFalls: FallIncident[];
  recentResidents: Resident[];
  onNavigateToFalls: () => void;
  onNavigateToResidents: () => void;
  onSelectResident: (residentId: number) => void;
  onLaunchTelemedicine?: (residentId: number) => void;
}

export const RecentFallsAndResidents: React.FC<RecentFallsAndResidentsProps> = ({
  recentFalls,
  recentResidents,
  onNavigateToFalls,
  onNavigateToResidents,
  onSelectResident,
  onLaunchTelemedicine,
}) => {
  // Enforce restriction to recent 5 records
  const fallsList = recentFalls.slice(0, 5);
  const residentsList = recentResidents.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unresolved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse">
            UNRESOLVED
          </span>
        );
      case 'emergency_dispatched':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            DISPATCHED
          </span>
        );
      case 'resolved_assisted':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            ASSISTED
          </span>
        );
      case 'resolved_false_alarm':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            FALSE ALARM
          </span>
        );
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Column 1: Recent Falls Card (Recent 5) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col justify-between shadow-xs backdrop-blur">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Recent Falls</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {fallsList.length} recent
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Kinematic triggers & post-impact immobility</p>
              </div>
            </div>

            <button
              onClick={onNavigateToFalls}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* List of recent falls */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
            {fallsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent fall incidents detected. All residents active & safe.
              </div>
            ) : (
              fallsList.map((incident) => {
                const residentName = incident.resident
                  ? `${incident.resident.firstName} ${incident.resident.lastName}`
                  : `Resident #${incident.residentId}`;

                return (
                  <div
                    key={incident.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          incident.status === 'unresolved'
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {incident.resident?.firstName?.charAt(0) || 'R'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {residentName}
                          </span>
                          {getStatusBadge(incident.status)}
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 mt-0.5">
                          <span>⚡ {incident.impactForceG}g</span>
                          <span>•</span>
                          <span>⏱️ {incident.motionlessDurationSeconds}s</span>
                          <span>•</span>
                          <span className="text-rose-600/90 dark:text-rose-400/90 font-sans font-medium">
                            {incident.clinicalDescription?.includes('Freeze') || incident.clinicalDescription?.includes('apraxia')
                              ? 'Freeze-of-Gait Fall'
                              : incident.clinicalDescription?.includes('Wander')
                              ? 'Bed-Exit Wandering Fall'
                              : incident.location || 'Memory Ward 4B'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                        {formatTimeAgo(incident.detectedAt)}
                      </span>

                      {incident.status === 'unresolved' && onLaunchTelemedicine && (
                        <button
                          onClick={() => onLaunchTelemedicine(incident.residentId)}
                          title="Launch Emergency Tele-Consult"
                          className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer active:scale-95 transition"
                        >
                          <Video className="w-3.5 h-3.5 animate-pulse" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex justify-end">
          <button
            onClick={onNavigateToFalls}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Falls Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Column 2: Recent Residents Card (Recent 5) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col justify-between shadow-xs backdrop-blur">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Recent Residents</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {residentsList.length} recent
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Care recipients & physiological baseline</p>
              </div>
            </div>

            <button
              onClick={onNavigateToResidents}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* List of recent residents */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
            {residentsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No residents registered yet.
              </div>
            ) : (
              residentsList.map((resident) => {
                return (
                  <div
                    key={resident.id}
                    onClick={() => onSelectResident(resident.id)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {resident.firstName.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {resident.firstName} {resident.lastName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {resident.uhid}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 mt-0.5">
                          <span>{resident.age} yrs</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                            {resident.uhid === 'RES-002'
                              ? "Alzheimer's (FAST 4)"
                              : resident.uhid === 'RES-003'
                              ? 'Lewy Body Dementia'
                              : resident.uhid === 'RES-001'
                              ? 'Mild Cognitive Impairment'
                              : 'Memory Ward Resident'}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500 font-sans">
                            {resident.uhid === 'RES-002'
                              ? 'Sundowning Risk'
                              : resident.uhid === 'RES-003'
                              ? 'Freezing Gait Risk'
                              : 'Suite 4B Safe-Zone'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                          (resident.healthScore ?? 85) >= 80
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : (resident.healthScore ?? 85) >= 60
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}
                      >
                        Score {resident.healthScore ?? 85}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex justify-end">
          <button
            onClick={onNavigateToResidents}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <span>Manage All Residents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
