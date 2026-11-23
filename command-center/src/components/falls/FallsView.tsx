import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  PhoneCall,
  Search,
  Video,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Radio,
  MapPin,
  Clock,
} from 'lucide-react';
import { FallIncident, FallCounters } from '../../types';
import commandCenterService from '../../services/commandCenterService';
import { Badge } from '../common/Badge';
import { FallDetailDrawer } from './FallDetailDrawer';

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
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state (default 15 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Sliding Drawer state
  const [selectedIncidentForDrawer, setSelectedIncidentForDrawer] = useState<FallIncident | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    try {
      await commandCenterService.resolveFall(id, {
        status,
        resolvedBy: 'Dr. Sarah Jenkins (Command Center)',
        resolutionNotes: notes,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    }
  };

  const handleOpenDrawer = (incident: FallIncident) => {
    setSelectedIncidentForDrawer(incident);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const filteredIncidents = incidents.filter((inc) => {
    // Severity filter
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;

    // Search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const rName = inc.resident
      ? `${inc.resident.firstName} ${inc.resident.lastName} ${inc.resident.uhid}`.toLowerCase()
      : '';
    const loc = (inc.location || '').toLowerCase();
    const band = inc.band?.serialNumber.toLowerCase() || '';
    const incId = `inc-${inc.id}`.toLowerCase();
    return rName.includes(q) || loc.includes(q) || band.includes(q) || incId.includes(q);
  });

  const totalFiltered = filteredIncidents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unresolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            UNRESOLVED
          </span>
        );
      case 'emergency_dispatched':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            EMS DISPATCHED
          </span>
        );
      case 'resolved_assisted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            ASSISTED
          </span>
        );
      case 'resolved_false_alarm':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            FALSE ALARM
          </span>
        );
      default:
        return null;
    }
  };

  const getSeverityVariant = (sev: string): 'critical' | 'warning' | 'info' => {
    if (sev === 'critical') return 'critical';
    if (sev === 'severe') return 'warning';
    return 'info';
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Tagline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
            Falls
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cognitive freeze-of-gait falls, nocturnal wandering bed exits, kinematic impact telemetry, and emergency dispatch logs
          </p>
        </div>
      </div>

      {/* Top Telemetry Summary Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Fall Incidents */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'all'
              ? 'border-rose-500 ring-1 ring-rose-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Incidents</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {counters?.total ?? incidents.length}
            </p>
          </div>
        </div>

        {/* Active Unresolved */}
        <div
          onClick={() => {
            setStatusFilter('unresolved');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'unresolved'
              ? 'border-red-500 ring-1 ring-red-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Unresolved</p>
            <p className="text-xl font-bold font-mono text-red-600 dark:text-red-400">
              {counters?.unresolved ?? incidents.filter((i) => i.status === 'unresolved').length}
            </p>
          </div>
        </div>

        {/* EMS Dispatched */}
        <div
          onClick={() => {
            setStatusFilter('emergency_dispatched');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'emergency_dispatched'
              ? 'border-amber-500 ring-1 ring-amber-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">EMS Dispatched</p>
            <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {counters?.emergencyDispatched ?? incidents.filter((i) => i.status === 'emergency_dispatched').length}
            </p>
          </div>
        </div>

        {/* Assisted & Cleared */}
        <div
          onClick={() => {
            setStatusFilter('resolved_assisted');
            setCurrentPage(1);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'resolved_assisted'
              ? 'border-emerald-500 ring-1 ring-emerald-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Assisted & Cleared</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {counters?.resolvedAssisted ?? incidents.filter((i) => i.status === 'resolved_assisted').length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Falls Table & Controls Container */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Fall Incidents</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {totalFiltered}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-48 flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search resident, room, pod serial..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-rose-500"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-rose-500 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="severe">Severe</option>
              <option value="moderate">Moderate</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-rose-500 cursor-pointer"
            >
              <option value="all">All Incidents</option>
              <option value="unresolved">Active Unresolved</option>
              <option value="emergency_dispatched">EMS Dispatched</option>
              <option value="resolved_assisted">Assisted & Cleared</option>
              <option value="resolved_false_alarm">False Alarm</option>
            </select>
          </div>
        </div>

        {/* Falls List View Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Incident & Resident</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Kinematics</th>
                  <th className="py-3 px-4 font-semibold">Sensor Pod</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Detected At</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-36 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" /></td>
                      <td className="py-3.5 px-4"><div className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4 text-right"><div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 px-4 text-center text-slate-400 dark:text-slate-500">
                      <AlertTriangle className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No fall incidents found</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {searchQuery
                          ? `No incident records match "${searchQuery}".`
                          : 'No fall incidents recorded under the selected filter.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedIncidents.map((incident) => {
                    const residentName = incident.resident
                      ? `${incident.resident.firstName} ${incident.resident.lastName}`
                      : `Resident #${incident.residentId}`;

                    return (
                      <tr
                        key={incident.id}
                        onClick={() => handleOpenDrawer(incident)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group cursor-pointer ${
                          incident.status === 'unresolved'
                            ? 'bg-red-500/5 dark:bg-red-950/10'
                            : ''
                        }`}
                      >
                        {/* Incident & Resident */}
                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                incident.status === 'unresolved'
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {incident.resident?.firstName?.charAt(0) || 'R'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors flex items-center gap-1.5">
                                <span>{residentName}</span>
                                <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500" />
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                #INC-{incident.id} &bull; {incident.resident?.uhid || 'UHID'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                            <span className="font-medium truncate max-w-40" title={incident.location}>
                              {incident.location}
                            </span>
                          </div>
                        </td>

                        {/* Kinematics */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded font-semibold ${
                                incident.impactForceG >= 3.0
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                              title="Peak Impact Force"
                            >
                              ⚡{incident.impactForceG}g
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                              title="Orientation Tilt Change"
                            >
                              🧭{incident.orientationChangeDeg}°
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                              title="Motionless Post-Fall Duration"
                            >
                              ⏱️{incident.motionlessDurationSeconds}s
                            </span>
                          </div>
                        </td>

                        {/* Sensor Pod */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {incident.band ? (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <Radio className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-semibold">{incident.band.serialNumber}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-4">
                          <Badge
                            variant={getSeverityVariant(incident.severity)}
                            size="sm"
                            pulse={incident.severity === 'critical'}
                          >
                            {incident.severity.toUpperCase()}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {getStatusBadge(incident.status)}
                        </td>

                        {/* Detected At */}
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                          {formatTimestamp(incident.detectedAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {onLaunchTelemedicine && (
                              <button
                                onClick={() => onLaunchTelemedicine(incident.residentId)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition cursor-pointer"
                                title="Launch Telemedicine Call"
                              >
                                <Video className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenDrawer(incident)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                              title="View Incident Telemetry"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Centered Pagination Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/30 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 text-xs font-sans text-center rounded-xl">
          {/* Summary & Page Size Selector */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
            <span>
              Showing{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {Math.min(currentPage * pageSize, totalFiltered)}
              </strong>{' '}
              of <strong className="text-slate-900 dark:text-white font-mono">{totalFiltered}</strong> records
            </span>

            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer shadow-xs"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1 px-2">
              <span className="text-slate-600 dark:text-slate-400 font-mono">
                Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
              </span>
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sliding Fall Detail Drawer */}
      <FallDetailDrawer
        incident={selectedIncidentForDrawer}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onLaunchTelemedicine={onLaunchTelemedicine}
        onResolve={handleResolve}
      />
    </div>
  );
};
