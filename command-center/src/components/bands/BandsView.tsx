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
  Cpu,
  Signal,
} from 'lucide-react';
import commandCenterService from '../../services/commandCenterService';
import { Band, BandCounters, Resident, BandDeviceType, BandStatus } from '../../types';

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
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('all');
  const [assignFilter, setAssignFilter] = useState<string>('all');

  // Modal: Quick Pair
  const [selectedBandForAssign, setSelectedBandForAssign] = useState<number | null>(null);
  const [targetResidentId, setTargetResidentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal: Register / Edit Pod
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingBand, setEditingBand] = useState<Band | null>(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [model, setModel] = useState('Sentinel Low-Cost Bio-Pod v1');
  const [deviceType, setDeviceType] = useState<BandDeviceType>('wristband');
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
      if (residentId === null) {
        await commandCenterService.unassignBand(bandId);
        showNotification(`Pod #${bandId} returned to station inventory.`);
      } else {
        await commandCenterService.assignBand(bandId, residentId);
        const res = residents.find((r) => r.id === residentId);
        showNotification(`Pod #${bandId} successfully paired with ${res?.firstName} ${res?.lastName}.`);
      }
      setSelectedBandForAssign(null);
      setTargetResidentId(null);
      await fetchBands();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to assign band', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRegister = () => {
    setEditingBand(null);
    const count = bands.length + 1;
    const randomHex = Math.floor(Math.random() * 255).toString(16).padStart(2, '0').toUpperCase();
    setSerialNumber(`POD-BIO-${100 + count}`);
    setMacAddress(`A4:C1:38:9B:${randomHex}:02`);
    setModel('Sentinel Low-Cost Bio-Pod v1');
    setDeviceType('wristband');
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
    setDeviceType(b.deviceType);
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
          deviceType,
          firmwareVersion,
          batteryLevel,
          status,
        });
        showNotification(`Pod "${serialNumber}" configuration saved.`);
      } else {
        await commandCenterService.createBand({
          serialNumber,
          macAddress,
          model,
          deviceType,
          firmwareVersion,
          batteryLevel,
          status,
        });
        showNotification(`New Pod "${serialNumber}" registered into fleet.`);
      }
      setIsRegisterModalOpen(false);
      await fetchBands();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save pod', 'error');
    }
  };

  const handleDeleteBand = async (b: Band) => {
    if (!window.confirm(`Decommission hardware pod "${b.serialNumber}"?`)) return;
    try {
      await commandCenterService.deleteBand(b.id);
      showNotification(`Pod "${b.serialNumber}" decommissioned.`);
      await fetchBands();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete pod', 'error');
    }
  };

  // Filter bands
  const filteredBands = bands.filter((band) => {
    if (filterStatus !== 'all' && band.status !== filterStatus) return false;
    if (deviceTypeFilter !== 'all' && band.deviceType !== deviceTypeFilter) return false;

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
      band.deviceType.toLowerCase().includes(q) ||
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
      {/* Page Title & Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-emerald-500" />
            Bands
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hardware sensor pod fleet inventory, battery telemetry, sanitization dock status, and resident pairing
          </p>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold shadow-lg transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
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
          <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Telemetry Summary Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Sensor Pods</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {counters?.total ?? bands.length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Signal className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active & Worn</p>
            <p className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
              {counters?.active ?? bands.filter((b) => b.status === 'active').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <BatteryWarning className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Low Battery (&lt;20%)</p>
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {counters?.lowBattery ?? bands.filter((b) => Number(b.batteryLevel) < 20).length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ready in Station</p>
            <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {counters?.available ?? bands.filter((b) => b.status === 'available').length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Bands Fleet Table & Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-500" />
              <span>Bands</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredBands.length}
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
                placeholder="Search serial, MAC, resident..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Device Type Filter */}
            <select
              value={deviceTypeFilter}
              onChange={(e) => {
                setDeviceTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Device Types</option>
              <option value="wristband">Wristbands</option>
              <option value="radar_pod">Radar Pods</option>
              <option value="chest_patch">Chest Patches</option>
            </select>

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
              <option value="active">Active & Worn</option>
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
              <option value="all">All Pairings</option>
              <option value="assigned">Assigned to Resident</option>
              <option value="unassigned">Unassigned / In Station</option>
            </select>

            {/* Provision Pod Button */}
            <button
              onClick={handleOpenRegister}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer ml-auto sm:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision Pod</span>
            </button>
          </div>
        </div>

        {/* Bands Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Pod Serial</th>
                  <th className="px-4 py-3">Hardware MAC & Model</th>
                  <th className="px-4 py-3">Device Type / Rev</th>
                  <th className="px-4 py-3">Assigned Resident</th>
                  <th className="px-4 py-3">Battery Health</th>
                  <th className="px-4 py-3">Operational Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3 text-right"><div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredBands.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                      <Radio className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No hardware pods found</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {searchQuery ? `No pods match "${searchQuery}".` : 'No sensor pods currently provisioned in fleet.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedBands.map((band) => {
                    const batt = Number(band.batteryLevel);
                    const isLow = batt < 20;
                    const isGood = batt >= 70;

                    return (
                      <tr
                        key={band.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Serial */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                              <Radio className="w-3.5 h-3.5" />
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

                        {/* Device Type / HW Rev */}
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {band.deviceType.replace('_', ' ')}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            Rev v2.1 • FW {band.firmwareVersion}
                          </div>
                        </td>

                        {/* Assigned Resident */}
                        <td className="px-4 py-3">
                          {band.assignedResident ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold">
                                {band.assignedResident.uhid}
                              </span>
                              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                                {band.assignedResident.firstName} {band.assignedResident.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                              <Unlink className="w-3 h-3" />
                              Station Stock
                            </span>
                          )}
                        </td>

                        {/* Battery Health */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isGood
                                    ? 'bg-emerald-500'
                                    : isLow
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, batt))}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-semibold">
                              {batt.toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 mt-1">
                            <Wifi className="w-3 h-3 text-slate-400" />
                            <span>{band.rssi} dBm</span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                band.isWorn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                              title={band.isWorn ? 'Wrist Contact Detected' : 'No Skin Contact'}
                            />
                          </div>
                        </td>

                        {/* Operational Status */}
                        <td className="px-4 py-3">
                          {band.status === 'active' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active & Worn
                            </span>
                          )}
                          {band.status === 'available' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Ready in Station
                            </span>
                          )}
                          {band.status === 'charging' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold">
                              <BatteryCharging className="w-3 h-3 text-amber-500" />
                              Dock Charging
                            </span>
                          )}
                          {band.status === 'maintenance' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              Maintenance
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {band.assignedResident ? (
                              <button
                                disabled={isSubmitting}
                                onClick={() => handleAssign(band.id, null)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 rounded-lg transition cursor-pointer"
                                title="Unpair Pod from Resident"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedBandForAssign(band.id);
                                  setTargetResidentId(residents[0]?.id || null);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg transition cursor-pointer"
                                title="Pair with Resident"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEdit(band)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg transition cursor-pointer"
                              title="Edit Pod Configuration"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBand(band)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              title="Decommission Pod"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/30 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 text-xs font-sans text-center">
          {/* Summary & Page Size Selector */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
            <span>
              Showing{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {filteredBands.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {Math.min(currentPage * pageSize, filteredBands.length)}
              </strong>{' '}
              of <strong className="text-slate-900 dark:text-white font-mono">{filteredBands.length}</strong> records
            </span>

            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer shadow-xs"
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
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
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
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Register / Edit Pod */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
              <Radio className="w-5 h-5 text-emerald-500" />
              <span>{editingBand ? 'Configure Sensor Pod' : 'Provision Hardware Pod'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter hardware pod serial identifier, MAC address, form factor, and operational state.
            </p>

            <form onSubmit={handleSaveBand} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Serial Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="POD-BIO-105"
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
                    placeholder="A4:C1:38:9B:05:02"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Device Form Factor
                  </label>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value as BandDeviceType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="wristband">Wristband</option>
                    <option value="radar_pod">Radar Pod</option>
                    <option value="chest_patch">Chest Patch</option>
                  </select>
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

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hardware Model
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Sentinel Low-Cost Bio-Pod v1"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Battery Level (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={batteryLevel}
                    onChange={(e) => setBatteryLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fleet Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BandStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="available">Ready in Station</option>
                    <option value="active">Active & Worn</option>
                    <option value="charging">Dock Charging</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition active:scale-95 cursor-pointer"
                >
                  {editingBand ? 'Save Changes' : 'Provision Pod'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Pair Pod to Resident */}
      {selectedBandForAssign !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedBandForAssign(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
              <Link2 className="w-5 h-5 text-indigo-500" />
              <span>Pair Pod to Resident</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono">
              Pod: {bands.find((b) => b.id === selectedBandForAssign)?.serialNumber}
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Care Recipient
                </label>
                <select
                  value={targetResidentId || ''}
                  onChange={(e) => setTargetResidentId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                >
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.firstName} {r.lastName} ({r.uhid})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedBandForAssign(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !targetResidentId}
                  onClick={() => handleAssign(selectedBandForAssign, targetResidentId)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer disabled:opacity-50 transition active:scale-95 shadow-md"
                >
                  Confirm Pairing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
