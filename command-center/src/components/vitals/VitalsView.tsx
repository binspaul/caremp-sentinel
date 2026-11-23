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
  Moon,
  Clock,
  Filter,
  RefreshCw,
  X,
  Battery,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface VitalsViewProps {
  initialResidentId?: number | null;
  onClearResidentFilter?: () => void;
}

export const VitalsView: React.FC<VitalsViewProps> = ({
  initialResidentId,
  onClearResidentFilter,
}) => {
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<number | undefined>(
    initialResidentId || undefined,
  );
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State (Default limit: 20)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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
  }, [loadVitals]);

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

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <HeartPulse className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
            Vitals Telemetry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete high-frequency physiological telemetry log. Total: {total} readings
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          {/* Resident selector */}
          <div className="relative min-w-56">
            <select
              value={selectedResidentId || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                handleResidentChange(val);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500/60 shadow-sm dark:shadow-none cursor-pointer"
            >
              <option value="">All Residents</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.firstName} {r.lastName} ({r.uhid})
                </option>
              ))}
            </select>
          </div>

          {selectedResidentId && (
            <button
              onClick={() => handleResidentChange(undefined)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs cursor-pointer transition"
              title="Clear Resident Filter"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          )}

          <button
            onClick={loadVitals}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 shadow-sm dark:shadow-none transition cursor-pointer"
            title="Refresh Vitals"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Vitals Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm dark:shadow-xl backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-6 font-semibold">Log ID & Resident</th>
                <th className="py-3.5 px-4 font-semibold">Heart Rate</th>
                <th className="py-3.5 px-4 font-semibold">Blood Pressure</th>
                <th className="py-3.5 px-4 font-semibold">SpO2</th>
                <th className="py-3.5 px-4 font-semibold">Body Temp</th>
                <th className="py-3.5 px-4 font-semibold">Battery / Device</th>
                <th className="py-3.5 px-4 font-semibold">Severity</th>
                <th className="py-3.5 px-6 font-semibold text-right">Generated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs font-mono">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-14 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-14 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" /></td>
                    <td className="py-4 px-6 text-right"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : vitals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-6 text-center text-slate-400 dark:text-slate-500 font-sans">
                    <HeartPulse className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No vitals records found</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {selectedResidentId
                        ? `No telemetry logs found for selected resident (ID: ${selectedResidentId}).`
                        : 'No telemetry has been logged in the system yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                vitals.map((v) => {
                  const resident = residentsMap[v.residentId];
                  const residentName = resident
                    ? `${resident.firstName} ${resident.lastName}`
                    : `Resident #${v.residentId}`;
                  const status = getVitalStatus(v);

                  return (
                    <tr
                      key={v.id}
                      onClick={() => handleOpenVitalDrawer(v)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    >
                      {/* Log ID & Resident (Clickable to open vital detail drawer) */}
                      <td className="py-4 px-6 font-sans">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                          <span>{residentName}</span>
                          <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500" />
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          Log #{v.id} &bull; Resident ID: {v.residentId}
                        </div>
                      </td>

                      {/* Heart Rate */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <Heart className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                          <span className="font-semibold">{v.heartRate ? Math.round(v.heartRate) : '--'}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">bpm</span>
                        </div>
                        {v.hrv ? (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">HRV: {Math.round(v.hrv)} ms</div>
                        ) : null}
                      </td>

                      {/* Blood Pressure */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <Activity className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span className="font-semibold">
                            {v.systolicBP && v.diastolicBP
                              ? `${Math.round(v.systolicBP)}/${Math.round(v.diastolicBP)}`
                              : '--'}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">mmHg</span>
                        </div>
                      </td>

                      {/* SpO2 */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <Wind className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
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
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <Thermometer className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                          <span className="font-semibold">
                            {v.bodyTemperature ? `${Number(v.bodyTemperature).toFixed(1)}°C` : '--'}
                          </span>
                        </div>
                      </td>

                      {/* Battery / Device */}
                      <td className="py-4 px-4 font-sans">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                          <Battery className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                          <span>{v.batteryLevel ? `${v.batteryLevel}%` : '100%'}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {v.wearingIndicator ? 'Attached' : 'Detached'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 font-sans">
                        <Badge variant={status.variant} size="sm">
                          {status.label}
                        </Badge>
                      </td>

                      {/* Generated Timestamp */}
                      <td className="py-4 px-6 text-right text-slate-500 dark:text-slate-400 text-[11px]">
                        {formatTimestamp(v.generatedAt || v.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans">
          {/* Summary & Page Size Selector */}
          <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400">
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
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page Indicator */}
            <div className="flex items-center gap-1 px-2">
              <span className="text-slate-600 dark:text-slate-400 font-mono">
                Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
              </span>
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
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
