import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
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
  RefreshCw,
  Video,
} from 'lucide-react';
import { FallIncident, FallCounters, Resident } from '../../types';
import commandCenterService from '../../services/commandCenterService';

interface FallsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchTelemedicine?: (residentId: number) => void;
}

export const FallsHistoryModal: React.FC<FallsHistoryModalProps> = ({
  isOpen,
  onClose,
  onLaunchTelemedicine,
}) => {
  const [incidents, setIncidents] = useState<FallIncident[]>([]);
  const [counters, setCounters] = useState<FallCounters | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      console.error('Failed to load falls history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, statusFilter]);

  if (!isOpen) return null;

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
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
            UNRESOLVED
          </span>
        );
      case 'emergency_dispatched':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            EMS DISPATCHED
          </span>
        );
      case 'resolved_assisted':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            ASSISTED & RESOLVED
          </span>
        );
      case 'resolved_false_alarm':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            FALSE ALARM
          </span>
        );
      default:
        return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Fall Detection & Emergency Dispatch Log</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Continuous kinematic deceleration and post-fall immobility safety records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              title="Refresh Fall History"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Counter Summary Pills */}
        {counters && (
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-slate-500">Total Incidents</span>
              <span className="font-bold font-mono text-sm">{counters.total}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-between text-red-600 dark:text-red-400">
              <span>Unresolved</span>
              <span className="font-bold font-mono text-sm">{counters.unresolved}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span>EMS Dispatched</span>
              <span className="font-bold font-mono text-sm">{counters.emergencyDispatched}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span>Assisted & Cleared</span>
              <span className="font-bold font-mono text-sm">{counters.resolvedAssisted}</span>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resident, room, pod..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {['all', 'unresolved', 'resolved_assisted', 'resolved_false_alarm'].map((statusKey) => (
              <button
                key={statusKey}
                onClick={() => setStatusFilter(statusKey)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                  statusFilter === statusKey
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {statusKey.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Incidents List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No fall incidents matching filter.
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const residentName = incident.resident
                ? `${incident.resident.firstName} ${incident.resident.lastName}`
                : `Resident #${incident.residentId}`;

              return (
                <div
                  key={incident.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-red-500/30 transition flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {incident.resident?.firstName?.charAt(0) || 'R'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{residentName}</span>
                          <span className="text-xs text-slate-400 font-mono">
                            ({incident.resident?.uhid})
                          </span>
                          {getStatusBadge(incident.status)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{incident.location}</span>
                          <span>•</span>
                          <span>{new Date(incident.detectedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Kinematic Badges */}
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        ⚡ {incident.impactForceG}g
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        🧭 {incident.orientationChangeDeg}°
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        ⏱️ {incident.motionlessDurationSeconds}s immobility
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {incident.clinicalDescription}
                  </p>

                  {incident.resolutionNotes && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono mb-1">
                        <span>Resolution by {incident.resolvedBy || 'Clinician'}</span>
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

                  {incident.status === 'unresolved' && onLaunchTelemedicine && (
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          onLaunchTelemedicine(incident.residentId);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-xs cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Launch Telemedicine Call</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
