import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse,
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
  Thermometer,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import commandCenterService from '../../services/commandCenterService';
import {
  ChestPatch,
  ChestPatchCounters,
  ChestPatchStatus,
  ChestPatchType,
  AdhesionStatus,
  Resident,
} from '../../types';

interface ChestPatchesViewProps {
  residents: Resident[];
  onFleetUpdated?: () => void;
  lastUpdated?: Date;
}

export const ChestPatchesView: React.FC<ChestPatchesViewProps> = ({
  residents,
  onFleetUpdated,
  lastUpdated,
}) => {
  const [patches, setPatches] = useState<ChestPatch[]>([]);
  const [counters, setCounters] = useState<ChestPatchCounters | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPatchType, setFilterPatchType] = useState<string>('all');
  const [filterAdhesion, setFilterAdhesion] = useState<string>('all');

  // Modal: Quick Pair
  const [selectedPatchForAssign, setSelectedPatchForAssign] = useState<number | null>(null);
  const [targetResidentId, setTargetResidentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal: Register / Edit Patch
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingPatch, setEditingPatch] = useState<ChestPatch | null>(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [model, setModel] = useState('Sentinel Bio-Patch Hydrogel ECG v3');
  const [patchType, setPatchType] = useState<ChestPatchType>('single_lead_ecg');
  const [batteryLevel, setBatteryLevel] = useState<number>(100.0);
  const [adhesionStatus, setAdhesionStatus] = useState<AdhesionStatus>('adhered');
  const [wearDurationDays, setWearDurationDays] = useState<number>(0.0);
  const [maxWearDays, setMaxWearDays] = useState<number>(7.0);
  const [skinTempCelsius, setSkinTempCelsius] = useState<number>(36.8);
  const [status, setStatus] = useState<ChestPatchStatus>('available');
  const [firmwareVersion, setFirmwareVersion] = useState('v3.0.2');

  // Feedback notifications
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Pagination state (default 15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const fetchPatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const [patchesRes, countersRes] = await Promise.all([
        commandCenterService.getChestPatches({ skip: 0, limit: 100 }),
        commandCenterService.getChestPatchCounters(),
      ]);
      setPatches(patchesRes.data);
      setCounters(countersRes);
    } catch (err) {
      console.error('Failed to load chest patches fleet:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatches();
  }, [fetchPatches, lastUpdated]);

  const handleAssign = async (patchId: number, residentId: number | null) => {
    setIsSubmitting(true);
    try {
      if (residentId) {
        await commandCenterService.assignChestPatch(patchId, residentId);
        showNotification(`Chest patch paired to resident #${residentId} successfully.`);
      } else {
        await commandCenterService.unassignChestPatch(patchId);
        showNotification('Chest patch unassigned and returned to available inventory.');
      }
      setSelectedPatchForAssign(null);
      setTargetResidentId(null);
      await fetchPatches();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update assignment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRegister = () => {
    setEditingPatch(null);
    const count = patches.length + 1;
    const randomHex = Math.floor(Math.random() * 255).toString(16).padStart(2, '0').toUpperCase();
    setSerialNumber(`CP-00${count}`);
    setMacAddress(`E2:15:B8:33:${randomHex}:01`);
    setModel('Sentinel Bio-Patch Hydrogel ECG v3');
    setPatchType('single_lead_ecg');
    setBatteryLevel(100.0);
    setAdhesionStatus('adhered');
    setWearDurationDays(0.0);
    setMaxWearDays(7.0);
    setSkinTempCelsius(36.8);
    setStatus('available');
    setFirmwareVersion('v3.0.2');
    setIsRegisterModalOpen(true);
  };

  const handleOpenEdit = (p: ChestPatch) => {
    setEditingPatch(p);
    setSerialNumber(p.serialNumber);
    setMacAddress(p.macAddress);
    setModel(p.model);
    setPatchType(p.patchType);
    setBatteryLevel(Number(p.batteryLevel));
    setAdhesionStatus(p.adhesionStatus);
    setWearDurationDays(Number(p.wearDurationDays));
    setMaxWearDays(Number(p.maxWearDays));
    setSkinTempCelsius(p.skinTempCelsius ? Number(p.skinTempCelsius) : 36.8);
    setStatus(p.status);
    setFirmwareVersion(p.firmwareVersion);
    setIsRegisterModalOpen(true);
  };

  const handleSavePatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPatch) {
        await commandCenterService.updateChestPatch(editingPatch.id, {
          serialNumber,
          macAddress,
          model,
          patchType,
          batteryLevel,
          adhesionStatus,
          wearDurationDays,
          maxWearDays,
          skinTempCelsius,
          status,
          firmwareVersion,
        });
        showNotification(`Chest Patch "${serialNumber}" configuration saved.`);
      } else {
        await commandCenterService.createChestPatch({
          serialNumber,
          macAddress,
          model,
          patchType,
          batteryLevel,
          adhesionStatus,
          wearDurationDays,
          maxWearDays,
          skinTempCelsius,
          status,
          firmwareVersion,
        });
        showNotification(`New Chest Patch "${serialNumber}" registered into fleet.`);
      }
      setIsRegisterModalOpen(false);
      await fetchPatches();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save chest patch', 'error');
    }
  };

  const handleDeletePatch = async (p: ChestPatch) => {
    if (!window.confirm(`Decommission Chest Patch "${p.serialNumber}"?`)) return;
    try {
      await commandCenterService.deleteChestPatch(p.id);
      showNotification(`Chest Patch "${p.serialNumber}" decommissioned.`);
      await fetchPatches();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete patch', 'error');
    }
  };

  // Filter patches
  const filteredPatches = patches.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterPatchType !== 'all' && p.patchType !== filterPatchType) return false;
    if (filterAdhesion !== 'all' && p.adhesionStatus !== filterAdhesion) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const assignedName = p.assignedResident
      ? `${p.assignedResident.firstName} ${p.assignedResident.lastName} ${p.assignedResident.uhid}`.toLowerCase()
      : '';
    return (
      p.serialNumber.toLowerCase().includes(q) ||
      p.macAddress.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.patchType.toLowerCase().includes(q) ||
      assignedName.includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredPatches.length / pageSize));
  const paginatedPatches = filteredPatches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header & Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <HeartPulse className="w-6 h-6 text-rose-500 dark:text-rose-400" />
            <span>Chest Patches</span>
          </h2>
        </div>

        <button
          onClick={handleOpenRegister}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Chest Patch</span>
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
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Patches</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {counters?.total ?? patches.length}
            </p>
          </div>
        </div>

        {/* Active Monitored */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Wearers</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {counters?.active ?? patches.filter((p) => p.status === 'active').length}
            </p>
          </div>
        </div>

        {/* Secure Adhesion */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hydrogel Adhesion OK</p>
            <p className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
              {patches.filter((p) => p.adhesionStatus === 'adhered').length}
            </p>
          </div>
        </div>

        {/* Replacement Due / Low Battery */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Replacement Alerts</p>
            <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {counters?.looseAdhesion ?? patches.filter((p) => p.adhesionStatus !== 'adhered').length}
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
              <HeartPulse className="w-5 h-5 text-rose-500" />
              <span>Chest Patch Fleet Inventory</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredPatches.length} {filteredPatches.length === 1 ? 'unit' : 'units'}
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
                placeholder="Search serial, resident..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-rose-500"
              />
            </div>

            {/* Patch Type Filter */}
            <select
              value={filterPatchType}
              onChange={(e) => {
                setFilterPatchType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-rose-500"
            >
              <option value="all">All Patch Types</option>
              <option value="single_lead_ecg">Single-Lead ECG</option>
              <option value="cardiopulmonary">Cardiopulmonary</option>
              <option value="temp_respiration">Temp &amp; Respiration</option>
            </select>

            {/* Adhesion Status Filter */}
            <select
              value={filterAdhesion}
              onChange={(e) => {
                setFilterAdhesion(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-rose-500"
            >
              <option value="all">All Adhesion</option>
              <option value="adhered">Securely Adhered</option>
              <option value="loose">Loose Margin</option>
              <option value="replacement_due">Replacement Due</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-rose-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active &amp; Worn</option>
              <option value="available">Ready in Stock</option>
              <option value="charging">Dock Charging</option>
              <option value="depleted">Depleted</option>
              <option value="maintenance">Maintenance</option>
            </select>

            {/* Page Size Dropdown */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2 py-1.5 text-xs focus:outline-hidden focus:border-rose-500 cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Chest Patches Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Patch Serial</th>
                <th className="px-4 py-3">MAC &amp; Model</th>
                <th className="px-4 py-3">Patch Type &amp; Skin Temp</th>
                <th className="px-4 py-3">Adhesion &amp; Wear Cycle</th>
                <th className="px-4 py-3">Assigned Resident</th>
                <th className="px-4 py-3">Battery &amp; Signal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Loading chest patches fleet...
                  </td>
                </tr>
              ) : paginatedPatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No chest patches match the current search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedPatches.map((patch) => {
                  const batt = Number(patch.batteryLevel);
                  const isLow = batt <= 20;
                  const wearPct = Math.min(100, (Number(patch.wearDurationDays) / Number(patch.maxWearDays)) * 100);

                  return (
                    <tr
                      key={patch.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Patch Serial */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <HeartPulse className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {patch.serialNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* MAC & Model */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-slate-800 dark:text-slate-200">{patch.macAddress}</div>
                        <div className="text-[11px] text-slate-400">{patch.model}</div>
                      </td>

                      {/* Patch Type & Temp */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold">
                          {patch.patchType.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-amber-500" />
                          <span>{patch.skinTempCelsius ? `${patch.skinTempCelsius}°C skin` : 'Ambient Standby'}</span>
                        </div>
                      </td>

                      {/* Adhesion & Wear Cycle */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              patch.adhesionStatus === 'adhered'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : patch.adhesionStatus === 'loose'
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {patch.adhesionStatus === 'adhered'
                              ? '✓ Secure Adhesion'
                              : patch.adhesionStatus === 'loose'
                              ? '⚠️ Loose Margin'
                              : '🚨 Replace Due'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                wearPct > 80 ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${wearPct}%` }}
                            />
                          </div>
                          <span>
                            Day {patch.wearDurationDays} / {patch.maxWearDays}d
                          </span>
                        </div>
                      </td>

                      {/* Assigned Resident */}
                      <td className="px-4 py-3">
                        {patch.assignedResident ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold">
                              {patch.assignedResident.uhid}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {patch.assignedResident.firstName} {patch.assignedResident.lastName}
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
                          <span>{patch.rssi} dBm &bull; BLE 5.3</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {patch.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Worn
                          </span>
                        )}
                        {patch.status === 'available' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                            Ready in Stock
                          </span>
                        )}
                        {patch.status === 'charging' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <BatteryCharging className="w-3 h-3" />
                            Charging
                          </span>
                        )}
                        {patch.status === 'depleted' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            Depleted
                          </span>
                        )}
                        {patch.status === 'maintenance' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Maintenance
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {patch.assignedResidentId ? (
                            <button
                              onClick={() => handleAssign(patch.id, null)}
                              title="Unpair Chest Patch"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedPatchForAssign(patch.id);
                                setTargetResidentId(residents[0]?.id || null);
                              }}
                              title="Pair to Resident"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            >
                              <Link2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(patch)}
                            title="Edit Patch"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePatch(patch)}
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
              {filteredPatches.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(currentPage * pageSize, filteredPatches.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredPatches.length}
            </span>{' '}
            patches
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

      {/* Modal: Quick Pair Patch to Resident */}
      {selectedPatchForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-500" />
                <span>Pair Chest Patch to Resident</span>
              </h3>
              <button
                onClick={() => setSelectedPatchForAssign(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assign Chest Patch{' '}
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {patches.find((p) => p.id === selectedPatchForAssign)?.serialNumber}
              </span>{' '}
              to a resident profile. Continuous single-lead ECG and cardiopulmonary telemetry will begin streaming.
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
                    {r.firstName} {r.lastName} ({r.uhid}) - Suite {r.roomNumber || '204'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPatchForAssign(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !targetResidentId}
                onClick={() => handleAssign(selectedPatchForAssign, targetResidentId)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                Confirm Pairing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register / Edit Chest Patch */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-emerald-500" />
                <span>{editingPatch ? 'Configure Chest Patch' : 'Register New Chest Patch'}</span>
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePatch} className="space-y-4 text-xs">
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
                    placeholder="CP-007"
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
                    placeholder="E2:15:B8:33:02:07"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Patch Sensor Type
                  </label>
                  <select
                    value={patchType}
                    onChange={(e) => setPatchType(e.target.value as ChestPatchType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="single_lead_ecg">Single-Lead ECG</option>
                    <option value="cardiopulmonary">Cardiopulmonary Acoustic</option>
                    <option value="temp_respiration">Temp &amp; Respiration</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Adhesion Status
                  </label>
                  <select
                    value={adhesionStatus}
                    onChange={(e) => setAdhesionStatus(e.target.value as AdhesionStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="adhered">Securely Adhered</option>
                    <option value="loose">Loose Margin</option>
                    <option value="replacement_due">Replacement Due</option>
                    <option value="detached">Detached</option>
                  </select>
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
                    Operational Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ChestPatchStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="available">Ready in Stock</option>
                    <option value="active">Active &amp; Worn</option>
                    <option value="charging">Charging</option>
                    <option value="depleted">Depleted</option>
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
                  {editingPatch ? 'Save Configuration' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
