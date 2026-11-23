import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Activity,
  Compass,
  Clock,
  Radio,
  CheckCircle2,
  ShieldAlert,
  PhoneCall,
  Search,
  Filter,
  Video,
} from 'lucide-react';
import { FallIncident, FallCounters } from '../../types';
import commandCenterService from '../../services/commandCenterService';

interface FallsViewProps {
  onLaunchTelemedicine?: (residentId: number) => void;
  lastUpdated?: Date;
}

export const FallsView: React.FC<FallsViewProps> = ({
  onLaunchTelemedicine,
  lastUpdated,
}) => {
  const [incidents, setIncidents] = useState<FallIncident[]>([]);
  const [counters, setCounters] = useState<FallCounters | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fallsRes, countersRes] = await Promise.all([
        commandCenterService.getFalls({
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        commandCenterService.getFallCounters(),
      ]);
      setIncidents(fallsRes.data);
      setCounters(countersRes);
    } catch (err) {
      console.error('Failed to load falls telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, lastUpdated]);

  const handleResolve = async (
    id: number,
    status: 'resolved_assisted' | 'resolved_false_alarm' | 'emergency_dispatched',
    notes: string
  ) => {
    setResolvingId(id);
    try {
      await commandCenterService.resolveFall(id, {
        status,
        resolvedBy: 'Dr. Sarah Jenkins (Command Center)',
        resolutionNotes: notes,
      });
      loadData();
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const rName = inc.resident
      ? `${inc.resident.firstName} ${inc.resident.lastName} ${inc.resident.uhid}`.toLowerCase()
      : '';
    const loc = (inc.location || '').toLowerCase();
    const band = inc.band?.serialNumber.toLowerCase() || '';
    return rName.includes(q) || loc.includes(q) || band.includes(q);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unresolved':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
            UNRESOLVED
          </span>
        );
      case 'emergency_dispatched':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            EMS DISPATCHED
          </span>
        );
      case 'resolved_assisted':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            ASSISTED & RESOLVED
          </span>
        );
      case 'resolved_false_alarm':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            FALSE ALARM
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
            Falls
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kinematic impact telemetry, post-fall immobility verification, and emergency dispatch logs
          </p>
        </div>
      </div>

      {/* Counter Summary Cards */}
      {counters && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Fall Incidents</span>
            <div className="text-2xl font-bold font-mono mt-1 text-slate-900 dark:text-white">
              {counters.total}
            </div>
            <span className="text-[10px] text-slate-400">Lifetime logged telemetry</span>
          </div>

          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 shadow-xs">
            <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Active Unresolved</span>
            <div className="text-2xl font-bold font-mono mt-1 text-red-600 dark:text-red-400">
              {counters.unresolved}
            </div>
            <span className="text-[10px] text-red-400">Immediate clinical attention</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-xs">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">EMS Dispatched</span>
            <div className="text-2xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400">
              {counters.emergencyDispatched}
            </div>
            <span className="text-[10px] text-amber-400">First responders mobilized</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Assisted & Cleared</span>
            <div className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
              {counters.resolvedAssisted}
            </div>
            <span className="text-[10px] text-emerald-400">Floor team on-site care</span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resident, room, pod serial..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-hidden focus:border-rose-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {['all', 'unresolved', 'emergency_dispatched', 'resolved_assisted', 'resolved_false_alarm'].map(
            (statusKey) => (
              <button
                key={statusKey}
                onClick={() => setStatusFilter(statusKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition cursor-pointer ${
                  statusFilter === statusKey
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {statusKey.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Incidents Stream */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No fall incidents found matching filter.
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const residentName = incident.resident
              ? `${incident.resident.firstName} ${incident.resident.lastName}`
              : `Resident #${incident.residentId}`;

            return (
              <div
                key={incident.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col gap-3 ${
                  incident.status === 'unresolved'
                    ? 'bg-red-500/5 dark:bg-red-950/20 border-red-500/40 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        incident.status === 'unresolved'
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {incident.resident?.firstName?.charAt(0) || 'R'}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {residentName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ({incident.resident?.uhid || 'RES-UHID'})
                        </span>
                        {getStatusBadge(incident.status)}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>📍 {incident.location}</span>
                        <span>•</span>
                        <span>
                          🕒 {new Date(incident.detectedAt).toLocaleString()}
                        </span>
                        {incident.band && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                              📡 {incident.band.serialNumber} ({incident.band.deviceType})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kinematic Telemetry Badges */}
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <div className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      ⚡ <span className="font-semibold text-rose-500">{incident.impactForceG}g</span> impact
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      🧭 <span className="font-semibold text-blue-500">{incident.orientationChangeDeg}°</span> tilt
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      ⏱️ <span className="font-semibold text-amber-500">{incident.motionlessDurationSeconds}s</span> motionless
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {incident.clinicalDescription}
                </p>

                {incident.resolutionNotes && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono mb-1">
                      <span>Resolution by {incident.resolvedBy || 'Clinical Staff'}</span>
                      <span>
                        {incident.resolvedAt
                          ? new Date(incident.resolvedAt).toLocaleTimeString()
                          : ''}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      {incident.resolutionNotes}
                    </p>
                  </div>
                )}

                {/* Quick Action Row */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  {onLaunchTelemedicine && (
                    <button
                      onClick={() => onLaunchTelemedicine(incident.residentId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs shadow-xs cursor-pointer active:scale-95"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Launch Telemedicine Call</span>
                    </button>
                  )}

                  {incident.status === 'unresolved' && (
                    <>
                      <button
                        disabled={resolvingId === incident.id}
                        onClick={() =>
                          handleResolve(
                            incident.id,
                            'resolved_assisted',
                            'Nursing floor staff arrived on-scene. Patient helped up, vitals stable.'
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Assisted & Clear</span>
                      </button>

                      <button
                        disabled={resolvingId === incident.id}
                        onClick={() =>
                          handleResolve(
                            incident.id,
                            'emergency_dispatched',
                            'EMS / Emergency floor response team mobilized.'
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Dispatch EMS</span>
                      </button>

                      <button
                        disabled={resolvingId === incident.id}
                        onClick={() =>
                          handleResolve(
                            incident.id,
                            'resolved_false_alarm',
                            'Resident confirms accidental drop of band; no injury.'
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>False Alarm</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
