import React, { useState, useEffect, useCallback } from 'react';
import { Vital, Resident } from '../../types';
import commandCenterService from '../../services/commandCenterService';
import { Badge, getVitalStatus } from '../common/Badge';
import { VitalDetailDrawer } from './VitalDetailDrawer';
import { ResidentProfileDrawer } from '../residents/ResidentProfileDrawer';
import {
  HeartPulse,
  Heart,
  Activity,
  Wind,
  Thermometer,
  Battery,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  Users,
  Search,
  X,
} from 'lucide-react';

interface VitalsViewProps {
  initialResidentId?: number | null;
  onClearResidentFilter?: () => void;
  lastUpdated?: Date;
}

export const VitalsView: React.FC<VitalsViewProps> = ({
  initialResidentId,
  onClearResidentFilter,
  lastUpdated,
}) => {
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<number | undefined>(
    initialResidentId || undefined,
  );
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination State (Default limit: 15)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'abnormal'>('all');

  // Sliding Drawer State for Vital Details
  const [selectedVitalForDrawer, setSelectedVitalForDrawer] = useState<Vital | null>(null);
  const [isVitalDrawerOpen, setIsVitalDrawerOpen] = useState(false);

  // Sliding Drawer State for Resident Profile
  const [selectedResidentForProfile, setSelectedResidentForProfile] = useState<Resident | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  // Sync prop changes into state
  useEffect(() => {
    if (initialResidentId !== undefined) {
      setSelectedResidentId(initialResidentId || undefined);
      setCurrentPage(1);
    }
  }, [initialResidentId]);

  const loadResidents = async () => {
    try {
      const res = await commandCenterService.getResidents({ skip: 0, limit: 100 });
      setResidents(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadVitals = useCallback(async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * pageSize;
      const res = await commandCenterService.getVitals({
        skip,
        limit: pageSize,
        residentId: selectedResidentId,
        sortBy: 'generatedAt',
        sortOrder: -1,
      });
      setVitals(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error('Failed to load vitals', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, selectedResidentId]);

  useEffect(() => {
    loadResidents();
  }, []);

  useEffect(() => {
    loadVitals();
  }, [loadVitals, lastUpdated]);

  const handleResidentChange = (residentId?: number) => {
    setSelectedResidentId(residentId);
    setCurrentPage(1);
    if (!residentId && onClearResidentFilter) {
      onClearResidentFilter();
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const residentsMap = residents.reduce((acc, r) => {
    acc[r.id] = r;
    return acc;
  }, {} as Record<number, Resident>);

  const handleOpenVitalDrawer = (vital: Vital) => {
    setSelectedVitalForDrawer(vital);
    setIsVitalDrawerOpen(true);
  };

  const handleCloseVitalDrawer = () => {
    setIsVitalDrawerOpen(false);
  };

  const handleOpenResidentProfile = (resident: Resident) => {
    setSelectedResidentForProfile(resident);
    setIsProfileDrawerOpen(true);
  };

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

  const normalCount = vitals.filter((v) => getVitalStatus(v).variant === 'normal').length;
  const alertCount = vitals.filter((v) => ['warning', 'critical'].includes(getVitalStatus(v).variant)).length;

  const filteredVitals = vitals.filter((v) => {
    if (statusFilter === 'normal' && getVitalStatus(v).variant !== 'normal') return false;
    if (statusFilter === 'abnormal' && !['warning', 'critical'].includes(getVitalStatus(v).variant)) return false;

    if (!search) return true;
    const query = search.toLowerCase();
    const resident = residentsMap[v.residentId];
    const residentName = resident ? `${resident.firstName} ${resident.lastName}`.toLowerCase() : '';
    const uhid = resident?.uhid?.toLowerCase() || '';
    const logId = String(v.id);
    return residentName.includes(query) || uhid.includes(query) || logId.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Tagline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <HeartPulse className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
            Vitals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            High-frequency physiological telemetry stream, vitals baselines, hemodynamic thresholds, and clinical anomaly detection
          </p>
        </div>
      </div>

      {/* Top Telemetry Summary Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Records */}
        <div
          onClick={() => {
            setStatusFilter('all');
            handleResidentChange(undefined);
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'all' && !selectedResidentId
              ? 'border-cyan-500 ring-1 ring-cyan-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Telemetry</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {total}
            </p>
          </div>
        </div>

        {/* Normal Baselines */}
        <div
          onClick={() => {
            setStatusFilter('normal');
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'normal'
              ? 'border-emerald-500 ring-1 ring-emerald-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Normal Baselines</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {normalCount}
            </p>
          </div>
        </div>

        {/* Clinical Alerts */}
        <div
          onClick={() => {
            setStatusFilter('abnormal');
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            statusFilter === 'abnormal'
              ? 'border-rose-500 ring-1 ring-rose-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clinical Alerts</p>
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {alertCount}
            </p>
          </div>
        </div>

        {/* Monitored Residents */}
        <div
          onClick={() => {
            handleResidentChange(undefined);
            setStatusFilter('all');
          }}
          className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3 ${
            Boolean(selectedResidentId)
              ? 'border-indigo-500 ring-1 ring-indigo-500/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Monitored Residents</p>
            <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {residents.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Vitals Table & Controls Container */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-cyan-500" />
              <span>Telemetry Stream</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredVitals.length}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-44 flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resident, log ID..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {/* Resident Selector */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedResidentId || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  handleResidentChange(val);
                }}
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-cyan-500 cursor-pointer max-w-48"
              >
                <option value="">All Residents</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.firstName} {r.lastName} ({r.uhid})
                  </option>
                ))}
              </select>

              {selectedResidentId && (
                <button
                  onClick={() => handleResidentChange(undefined)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs cursor-pointer transition border border-slate-200 dark:border-slate-700"
                  title="Clear Resident Filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">All Readings</option>
              <option value="normal">Normal Baselines</option>
              <option value="abnormal">Elevated / Clinical Alerts</option>
            </select>
          </div>
        </div>

        {/* Vitals Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Log ID & Resident</th>
                  <th className="py-3 px-4 font-semibold">Heart Rate</th>
                  <th className="py-3 px-4 font-semibold">Blood Pressure</th>
                  <th className="py-3 px-4 font-semibold">SpO2</th>
                  <th className="py-3 px-4 font-semibold">Body Temp</th>
                  <th className="py-3 px-4 font-semibold">Battery / Device</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold text-right">Generated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-mono">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-14 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-14 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" /></td>
                      <td className="py-3.5 px-4 text-right"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredVitals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 px-4 text-center text-slate-400 dark:text-slate-500 font-sans">
                      <HeartPulse className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No vitals records found</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {selectedResidentId
                          ? `No telemetry logs found for selected resident (ID: ${selectedResidentId}).`
                          : 'No telemetry logs currently match the selected criteria.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredVitals.map((v) => {
                    const resident = residentsMap[v.residentId];
                    const residentName = resident
                      ? `${resident.firstName} ${resident.lastName}`
                      : `Resident #${v.residentId}`;
                    const status = getVitalStatus(v);

                    return (
                      <tr
                        key={v.id}
                        onClick={() => handleOpenVitalDrawer(v)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group cursor-pointer"
                      >
                        {/* Log ID & Resident */}
                        <td className="py-3 px-4 font-sans">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                            <span>{residentName}</span>
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500" />
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            Log #{v.id} &bull; Resident ID: {v.residentId}
                          </div>
                        </td>

                        {/* Heart Rate */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <Heart className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                            <span className="font-semibold">{v.heartRate ? Math.round(v.heartRate) : '--'}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">bpm</span>
                          </div>
                          {v.hrv ? (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">HRV: {Math.round(v.hrv)} ms</div>
                          ) : null}
                        </td>

                        {/* Blood Pressure */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <Activity className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span className="font-semibold">
                              {v.systolicBP && v.diastolicBP
                                ? `${Math.round(v.systolicBP)}/${Math.round(v.diastolicBP)}`
                                : '--'}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">mmHg</span>
                          </div>
                        </td>

                        {/* SpO2 */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <Wind className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                            <span
                              className={`font-semibold ${
                                v.oxygenSaturation && v.oxygenSaturation < 95
                                  ? 'text-amber-500 dark:text-amber-400'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {v.oxygenSaturation ? `${v.oxygenSaturation}%` : '--'}
                            </span>
                          </div>
                        </td>

                        {/* Body Temp */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <Thermometer className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 shrink-0" />
                            <span className="font-semibold">
                              {v.bodyTemperature ? `${Number(v.bodyTemperature).toFixed(1)}°C` : '--'}
                            </span>
                          </div>
                        </td>

                        {/* Battery / Device */}
                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                            <Battery className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                            <span>{v.batteryLevel ? `${v.batteryLevel}%` : '100%'}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {v.wearingIndicator ? 'Attached' : 'Detached'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 font-sans">
                          <Badge variant={status.variant} size="sm">
                            {status.label}
                          </Badge>
                        </td>

                        {/* Generated Timestamp */}
                        <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 text-[11px]">
                          {formatTimestamp(v.generatedAt || v.createdAt)}
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
                {total === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {Math.min(currentPage * pageSize, total)}
              </strong>{' '}
              of <strong className="text-slate-900 dark:text-white font-mono">{total}</strong> records
            </span>

            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-xs"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
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
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sliding Vital Detail Drawer */}
      <VitalDetailDrawer
        vital={selectedVitalForDrawer}
        resident={selectedVitalForDrawer ? residentsMap[selectedVitalForDrawer.residentId] : null}
        isOpen={isVitalDrawerOpen}
        onClose={handleCloseVitalDrawer}
        onOpenResidentProfile={handleOpenResidentProfile}
      />

      {/* Sliding Resident Profile Drawer (accessible from vital details) */}
      <ResidentProfileDrawer
        resident={selectedResidentForProfile}
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        onViewVitals={(id) => {
          setIsProfileDrawerOpen(false);
          handleResidentChange(id);
        }}
      />
    </div>
  );
};
