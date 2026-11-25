import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  BatteryCharging,
  BatteryWarning,
  Wifi,
  WifiOff,
  UserCheck,
  UserX,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Link2,
  Unlink,
  Edit2,
  Trash2,
  Activity,
  HeartPulse,
} from 'lucide-react';
import commandCenterService from '../../services/commandCenterService';
import { Band, BandCounters, Resident, BandStatus } from '../../types';

interface BandsViewProps {
  residents: Resident[];
  onFleetUpdated?: () => void;
  lastUpdated?: Date;
}

export const BandsView: React.FC<BandsViewProps> = ({
  residents,
  onFleetUpdated,
  lastUpdated,
}) => {
  const [bands, setBands] = useState<Band[]>([]);
  const [counters, setCounters] = useState<BandCounters | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [assignFilter, setAssignFilter] = useState<string>('all');

  // Modal: Quick Pair
  const [selectedBandForAssign, setSelectedBandForAssign] = useState<number | null>(null);
  const [targetResidentId, setTargetResidentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal: Register / Edit Band
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingBand, setEditingBand] = useState<Band | null>(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [model, setModel] = useState('Sentinel Bio-Band Pulse v2');
  const [firmwareVersion, setFirmwareVersion] = useState('v1.2.0');
  const [batteryLevel, setBatteryLevel] = useState<number>(100.0);
  const [status, setStatus] = useState<BandStatus>('available');

  // Feedback notifications
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Pagination state (default 15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const fetchBands = useCallback(async () => {
    setIsLoading(true);
    try {
      const [bandsRes, countersRes] = await Promise.all([
        commandCenterService.getBands({ skip: 0, limit: 100 }),
        commandCenterService.getBandCounters(),
      ]);
      setBands(bandsRes.data);
      setCounters(countersRes);
    } catch (err) {
      console.error('Failed to load bands fleet:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBands();
  }, [fetchBands, lastUpdated]);

  const handleAssign = async (bandId: number, residentId: number | null) => {
    setIsSubmitting(true);
    try {
      if (residentId) {
        await commandCenterService.assignBand(bandId, residentId);
        showNotification(`Band paired to resident #${residentId} successfully.`);
      } else {
        await commandCenterService.unassignBand(bandId);
        showNotification('Band unassigned and returned to charging pool.');
      }
      setSelectedBandForAssign(null);
      setTargetResidentId(null);
      await fetchBands();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update assignment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRegister = () => {
    setEditingBand(null);
    const count = bands.length + 1;
    const randomHex = Math.floor(Math.random() * 255).toString(16).padStart(2, '0').toUpperCase();
    setSerialNumber(`BND-${100 + count}`);
    setMacAddress(`C4:7D:4F:12:${randomHex}:01`);
    setModel('Sentinel Bio-Band Pulse v2');
    setFirmwareVersion('v1.2.0');
    setBatteryLevel(100.0);
    setStatus('available');
    setIsRegisterModalOpen(true);
  };

  const handleOpenEdit = (b: Band) => {
    setEditingBand(b);
    setSerialNumber(b.serialNumber);
    setMacAddress(b.macAddress);
    setModel(b.model);
    setFirmwareVersion(b.firmwareVersion);
    setBatteryLevel(Number(b.batteryLevel));
    setStatus(b.status);
    setIsRegisterModalOpen(true);
  };

  const handleSaveBand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBand) {
        await commandCenterService.updateBand(editingBand.id, {
          serialNumber,
          macAddress,
          model,
          firmwareVersion,
          batteryLevel,
          status,
        });
        showNotification(`Band "${serialNumber}" configuration saved.`);
      } else {
        await commandCenterService.createBand({
          serialNumber,
          macAddress,
          model,
          firmwareVersion,
          batteryLevel,
          status,
        });
        showNotification(`New Band "${serialNumber}" registered into fleet.`);
      }
      setIsRegisterModalOpen(false);
      await fetchBands();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save band', 'error');
    }
  };

  const handleDeleteBand = async (b: Band) => {
    if (!window.confirm(`Decommission hardware band "${b.serialNumber}"?`)) return;
    try {
      await commandCenterService.deleteBand(b.id);
      showNotification(`Band "${b.serialNumber}" decommissioned.`);
      await fetchBands();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete band', 'error');
    }
  };

  // Filter bands
  const filteredBands = bands.filter((band) => {
    if (filterStatus !== 'all' && band.status !== filterStatus) return false;

    const isAssigned = Boolean(band.assignedResidentId || band.assignedResident);
    if (assignFilter === 'assigned' && !isAssigned) return false;
    if (assignFilter === 'unassigned' && isAssigned) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const assignedName = band.assignedResident
      ? `${band.assignedResident.firstName} ${band.assignedResident.lastName} ${band.assignedResident.uhid}`.toLowerCase()
      : '';
    return (
      band.serialNumber.toLowerCase().includes(q) ||
      band.macAddress.toLowerCase().includes(q) ||
      band.model.toLowerCase().includes(q) ||
      assignedName.includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredBands.length / pageSize));
  const paginatedBands = filteredBands.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header & Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            <span>Bands</span>
          </h2>
        </div>

        <button
          onClick={handleOpenRegister}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Band</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium shadow-xs transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Top Telemetry Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Fleet */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Bands</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {counters?.total ?? bands.length}
            </p>
          </div>
        </div>

        {/* Active & Worn */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active &amp; Worn</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {counters?.active ?? bands.filter((b) => b.status === 'active').length}
            </p>
          </div>
        </div>

        {/* Low Battery Alert */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <BatteryWarning className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Low Battery Alert</p>
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {counters?.lowBattery ?? bands.filter((b) => Number(b.batteryLevel) < 20).length}
            </p>
          </div>
        </div>

        {/* Docked / Available */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Available in Dock</p>
            <p className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {counters?.available ?? bands.filter((b) => b.status === 'available').length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-500" />
              <span>Bio-Band Fleet Inventory</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredBands.length} {filteredBands.length === 1 ? 'unit' : 'units'}
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search serial, MAC, resident..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active &amp; Worn</option>
              <option value="available">Ready in Station</option>
              <option value="charging">Dock Charging</option>
              <option value="maintenance">Maintenance</option>
            </select>

            {/* Assignment Filter */}
            <select
              value={assignFilter}
              onChange={(e) => {
                setAssignFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Bands</option>
              <option value="assigned">Assigned to Resident</option>
              <option value="unassigned">Unassigned (Available)</option>
            </select>

            {/* Page Size Dropdown */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Bands Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Band Serial</th>
                <th className="px-4 py-3">MAC &amp; Model</th>
                <th className="px-4 py-3">Optical Sensor &amp; HW</th>
                <th className="px-4 py-3">Assigned Resident</th>
                <th className="px-4 py-3">Battery &amp; BLE Signal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Loading bio-bands inventory...
                  </td>
                </tr>
              ) : paginatedBands.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No wearable bands match the current search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedBands.map((band) => {
                  const batt = Number(band.batteryLevel);
                  const isLow = batt <= 20;

                  return (
                    <tr
                      key={band.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Serial Number */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <Radio className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {band.serialNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* MAC & Model */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-slate-800 dark:text-slate-200">{band.macAddress}</div>
                        <div className="text-[11px] text-slate-400">{band.model}</div>
                      </td>

                      {/* Optical Sensor & Firmware */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                          Dual PPG (660/940nm)
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Rev v2.1 &bull; FW {band.firmwareVersion}
                        </div>
                      </td>

                      {/* Assigned Resident */}
                      <td className="px-4 py-3">
                        {band.assignedResident ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold">
                              {band.assignedResident.uhid}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {band.assignedResident.firstName} {band.assignedResident.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px] flex items-center gap-1">
                            <UserX className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Battery & Signal */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isLow
                                  ? 'bg-rose-500'
                                  : batt < 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${batt}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono text-xs font-bold ${
                              isLow ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {batt.toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-emerald-500" />
                          <span>{band.rssi} dBm &bull; BLE 5.2</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {band.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active &amp; Worn
                          </span>
                        )}
                        {band.status === 'available' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                            Available in Station
                          </span>
                        )}
                        {band.status === 'charging' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <BatteryCharging className="w-3 h-3" />
                            Dock Charging
                          </span>
                        )}
                        {band.status === 'maintenance' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Maintenance
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {band.assignedResidentId ? (
                            <button
                              onClick={() => handleAssign(band.id, null)}
                              title="Unpair Band"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedBandForAssign(band.id);
                                setTargetResidentId(residents[0]?.id || null);
                              }}
                              title="Pair to Resident"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                            >
                              <Link2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(band)}
                            title="Edit Band"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBand(band)}
                            title="Decommission"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Center-Aligned Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredBands.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(currentPage * pageSize, filteredBands.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredBands.length}
            </span>{' '}
            bands
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Quick Pair Band to Resident */}
      {selectedBandForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-500" />
                <span>Pair Band to Resident</span>
              </h3>
              <button
                onClick={() => setSelectedBandForAssign(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select the resident to pair with Band{' '}
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {bands.find((b) => b.id === selectedBandForAssign)?.serialNumber}
              </span>
              . Once assigned, vital signs telemetry will immediately map to this resident profile.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Care Recipient
              </label>
              <select
                value={targetResidentId ?? ''}
                onChange={(e) => setTargetResidentId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.firstName} {r.lastName} ({r.uhid}) - Room {r.roomNumber || '204'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBandForAssign(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !targetResidentId}
                onClick={() => handleAssign(selectedBandForAssign, targetResidentId)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                Confirm Pairing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register / Edit Band */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-500" />
                <span>{editingBand ? 'Configure Wearable Band' : 'Register New Band'}</span>
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBand} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    required
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="BND-007"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    MAC Address
                  </label>
                  <input
                    type="text"
                    required
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    placeholder="C4:7D:4F:12:9A:07"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Hardware Model
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Sentinel Bio-Band Pulse v2"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Firmware Version
                  </label>
                  <input
                    type="text"
                    required
                    value={firmwareVersion}
                    onChange={(e) => setFirmwareVersion(e.target.value)}
                    placeholder="v1.2.0"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Battery Level (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={batteryLevel}
                    onChange={(e) => setBatteryLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Deployment Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BandStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="available">Ready in Station</option>
                    <option value="active">Active &amp; Worn</option>
                    <option value="charging">Dock Charging</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
                >
                  {editingBand ? 'Save Configuration' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
