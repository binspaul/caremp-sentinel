import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
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
  Bed,
  Scan,
  Zap,
} from 'lucide-react';
import commandCenterService from '../../services/commandCenterService';
import {
  RadarPod,
  RadarPodCounters,
  RadarPodStatus,
  RadarInstallationType,
  Resident,
} from '../../types';

interface RadarPodsViewProps {
  residents: Resident[];
  onFleetUpdated?: () => void;
  lastUpdated?: Date;
}

export const RadarPodsView: React.FC<RadarPodsViewProps> = ({
  residents,
  onFleetUpdated,
  lastUpdated,
}) => {
  const [pods, setPods] = useState<RadarPod[]>([]);
  const [counters, setCounters] = useState<RadarPodCounters | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterInstallation, setFilterInstallation] = useState<string>('all');

  // Modal: Quick Pair
  const [selectedPodForAssign, setSelectedPodForAssign] = useState<number | null>(null);
  const [targetResidentId, setTargetResidentId] = useState<number | null>(null);
  const [targetRoomNumber, setTargetRoomNumber] = useState<string>('Suite 204');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal: Register / Edit Pod
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingPod, setEditingPod] = useState<RadarPod | null>(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [model, setModel] = useState('Sentinel 60GHz FMCW Radar Pod v2');
  const [frequencyBand, setFrequencyBand] = useState('60 GHz FMCW');
  const [installationType, setInstallationType] = useState<RadarInstallationType>('bedhead');
  const [detectionRangeMeters, setDetectionRangeMeters] = useState<number>(5.0);
  const [firmwareVersion, setFirmwareVersion] = useState('v2.1.4');
  const [powerSource, setPowerSource] = useState('ac_line_battery_backup');
  const [status, setStatus] = useState<RadarPodStatus>('standby');
  const [roomNumber, setRoomNumber] = useState('Suite 204');

  // Feedback notifications
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Pagination state (default 15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const fetchPods = useCallback(async () => {
    setIsLoading(true);
    try {
      const [podsRes, countersRes] = await Promise.all([
        commandCenterService.getRadarPods({ skip: 0, limit: 100 }),
        commandCenterService.getRadarPodCounters(),
      ]);
      setPods(podsRes.data);
      setCounters(countersRes);
    } catch (err) {
      console.error('Failed to load radar pods fleet:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPods();
  }, [fetchPods, lastUpdated]);

  const handleAssign = async (podId: number, residentId: number | null) => {
    setIsSubmitting(true);
    try {
      if (residentId) {
        await commandCenterService.assignRadarPod(podId, residentId, targetRoomNumber);
        showNotification(`Radar pod paired to resident #${residentId} in ${targetRoomNumber}.`);
      } else {
        await commandCenterService.unassignRadarPod(podId);
        showNotification('Radar pod unassigned and returned to standby.');
      }
      setSelectedPodForAssign(null);
      setTargetResidentId(null);
      await fetchPods();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update assignment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRegister = () => {
    setEditingPod(null);
    const count = pods.length + 1;
    const randomHex = Math.floor(Math.random() * 255).toString(16).padStart(2, '0').toUpperCase();
    setSerialNumber(`RDR-00${count}`);
    setMacAddress(`D4:8A:FC:21:${randomHex}:01`);
    setModel('Sentinel 60GHz FMCW Radar Pod v2');
    setFrequencyBand('60 GHz FMCW');
    setInstallationType('bedhead');
    setDetectionRangeMeters(5.0);
    setFirmwareVersion('v2.1.4');
    setPowerSource('ac_line_battery_backup');
    setStatus('standby');
    setRoomNumber('Suite 204');
    setIsRegisterModalOpen(true);
  };

  const handleOpenEdit = (p: RadarPod) => {
    setEditingPod(p);
    setSerialNumber(p.serialNumber);
    setMacAddress(p.macAddress);
    setModel(p.model);
    setFrequencyBand(p.frequencyBand);
    setInstallationType(p.installationType);
    setDetectionRangeMeters(Number(p.detectionRangeMeters));
    setFirmwareVersion(p.firmwareVersion);
    setPowerSource(p.powerSource);
    setStatus(p.status);
    setRoomNumber(p.roomNumber || 'Suite 204');
    setIsRegisterModalOpen(true);
  };

  const handleSavePod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPod) {
        await commandCenterService.updateRadarPod(editingPod.id, {
          serialNumber,
          macAddress,
          model,
          frequencyBand,
          installationType,
          detectionRangeMeters,
          firmwareVersion,
          powerSource,
          status,
          roomNumber,
        });
        showNotification(`Radar Pod "${serialNumber}" configuration saved.`);
      } else {
        await commandCenterService.createRadarPod({
          serialNumber,
          macAddress,
          model,
          frequencyBand,
          installationType,
          detectionRangeMeters,
          firmwareVersion,
          powerSource,
          status,
          roomNumber,
        });
        showNotification(`New Radar Pod "${serialNumber}" provisioned.`);
      }
      setIsRegisterModalOpen(false);
      await fetchPods();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save radar pod', 'error');
    }
  };

  const handleDeletePod = async (p: RadarPod) => {
    if (!window.confirm(`Decommission Radar Pod "${p.serialNumber}"?`)) return;
    try {
      await commandCenterService.deleteRadarPod(p.id);
      showNotification(`Radar Pod "${p.serialNumber}" decommissioned.`);
      await fetchPods();
      onFleetUpdated?.();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete pod', 'error');
    }
  };

  // Filter pods
  const filteredPods = pods.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterInstallation !== 'all' && p.installationType !== filterInstallation) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const assignedName = p.assignedResident
      ? `${p.assignedResident.firstName} ${p.assignedResident.lastName} ${p.assignedResident.uhid}`.toLowerCase()
      : '';
    return (
      p.serialNumber.toLowerCase().includes(q) ||
      p.macAddress.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      (p.roomNumber && p.roomNumber.toLowerCase().includes(q)) ||
      assignedName.includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredPods.length / pageSize));
  const paginatedPods = filteredPods.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header & Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Scan className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            <span>Radar Pods</span>
          </h2>
        </div>

        <button
          onClick={handleOpenRegister}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Radar Pod</span>
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
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Radar Pods</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {counters?.total ?? pods.length}
            </p>
          </div>
        </div>

        {/* Active Monitored */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Monitored</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {counters?.active ?? pods.filter((p) => p.status === 'active').length}
            </p>
          </div>
        </div>

        {/* Bed Occupancy Live */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bed Occupied Live</p>
            <p className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {counters?.bedOccupied ?? pods.filter((p) => p.bedOccupancy).length}
            </p>
          </div>
        </div>

        {/* Standby / Offline */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Standby Ready</p>
            <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {counters?.standby ?? pods.filter((p) => p.status === 'standby').length}
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
              <Scan className="w-5 h-5 text-indigo-500" />
              <span>Radar Pod Fleet Inventory</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredPods.length} {filteredPods.length === 1 ? 'unit' : 'units'}
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
                placeholder="Search serial, room, resident..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Installation Filter */}
            <select
              value={filterInstallation}
              onChange={(e) => {
                setFilterInstallation(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Mount Types</option>
              <option value="bedhead">Bedhead Mount</option>
              <option value="wall_mount">Wall Mount</option>
              <option value="ceiling">Ceiling Overhead</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Monitoring</option>
              <option value="standby">Standby Ready</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
            </select>

            {/* Page Size Dropdown */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Radar Pods Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Radar Pod Serial</th>
                <th className="px-4 py-3">MAC &amp; Model</th>
                <th className="px-4 py-3">Mount &amp; Frequency</th>
                <th className="px-4 py-3">Assigned Location</th>
                <th className="px-4 py-3">Ballistocardiography &amp; Bed Telemetry</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Loading radar pods fleet...
                  </td>
                </tr>
              ) : paginatedPods.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No radar pods match the current search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedPods.map((pod) => {
                  return (
                    <tr
                      key={pod.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Pod Serial */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            <Scan className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {pod.serialNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* MAC & Model */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-slate-800 dark:text-slate-200">{pod.macAddress}</div>
                        <div className="text-[11px] text-slate-400">{pod.model}</div>
                      </td>

                      {/* Mount & Frequency */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold uppercase">
                          {pod.installationType.replace('_', ' ')}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {pod.frequencyBand} &bull; {pod.detectionRangeMeters}m range
                        </div>
                      </td>

                      {/* Room & Assigned Resident */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {pod.roomNumber || 'Unassigned Suite'}
                        </div>
                        {pod.assignedResident ? (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                            <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold">
                              {pod.assignedResident.uhid}
                            </span>
                            <span>
                              {pod.assignedResident.firstName} {pod.assignedResident.lastName}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">No resident paired</div>
                        )}
                      </td>

                      {/* Live Telemetry */}
                      <td className="px-4 py-3">
                        {pod.status === 'active' ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                🫁 {pod.respirationRateBpm ?? 16.5} rpm
                              </span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                💓 {pod.heartRateBpm ?? 68.0} bpm
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  pod.bedOccupancy
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {pod.bedOccupancy ? '🛏️ Bed Occupied' : 'Vacant'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                FW {pod.firmwareVersion}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            Standby &bull; Sensor calibrated
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {pod.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Monitored
                          </span>
                        )}
                        {pod.status === 'standby' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Standby Ready
                          </span>
                        )}
                        {pod.status === 'offline' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <WifiOff className="w-3 h-3" />
                            Offline
                          </span>
                        )}
                        {pod.status === 'maintenance' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Maintenance
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {pod.assignedResidentId ? (
                            <button
                              onClick={() => handleAssign(pod.id, null)}
                              title="Unpair Radar Pod"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedPodForAssign(pod.id);
                                setTargetResidentId(residents[0]?.id || null);
                                setTargetRoomNumber(pod.roomNumber || 'Suite 204');
                              }}
                              title="Pair to Resident / Bed"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                            >
                              <Link2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(pod)}
                            title="Edit Radar Pod"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePod(pod)}
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
              {filteredPods.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(currentPage * pageSize, filteredPods.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredPods.length}
            </span>{' '}
            radar pods
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

      {/* Modal: Quick Pair Pod to Resident / Suite */}
      {selectedPodForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-500" />
                <span>Pair Radar Pod to Bed</span>
              </h3>
              <button
                onClick={() => setSelectedPodForAssign(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assign Radar Pod{' '}
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {pods.find((p) => p.id === selectedPodForAssign)?.serialNumber}
              </span>{' '}
              to a resident bedhead for contact-free continuous respiration and micro-motion monitoring.
            </p>

            <div className="space-y-3">
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Room Suite Number
                </label>
                <input
                  type="text"
                  value={targetRoomNumber}
                  onChange={(e) => setTargetRoomNumber(e.target.value)}
                  placeholder="Suite 204"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPodForAssign(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !targetResidentId}
                onClick={() => handleAssign(selectedPodForAssign, targetResidentId)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                Confirm Pairing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register / Edit Radar Pod */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Scan className="w-5 h-5 text-emerald-500" />
                <span>{editingPod ? 'Configure Radar Pod' : 'Register New Radar Pod'}</span>
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePod} className="space-y-4 text-xs">
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
                    placeholder="RDR-007"
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
                    placeholder="D4:8A:FC:21:01:07"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Radar Hardware Model
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Sentinel 60GHz FMCW Radar Pod v2"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Frequency Band
                  </label>
                  <input
                    type="text"
                    required
                    value={frequencyBand}
                    onChange={(e) => setFrequencyBand(e.target.value)}
                    placeholder="60 GHz FMCW"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mounting Configuration
                  </label>
                  <select
                    value={installationType}
                    onChange={(e) => setInstallationType(e.target.value as RadarInstallationType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="bedhead">Bedhead Mount</option>
                    <option value="wall_mount">Wall Mount</option>
                    <option value="ceiling">Ceiling Overhead</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Range (Meters)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="15"
                    required
                    value={detectionRangeMeters}
                    onChange={(e) => setDetectionRangeMeters(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Room Suite Assignment
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="Suite 204"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Operational Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RadarPodStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="standby">Standby Ready</option>
                    <option value="active">Active Monitored</option>
                    <option value="offline">Offline</option>
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
                  {editingPod ? 'Save Configuration' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
