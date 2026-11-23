import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  MapPin,
  Building2,
  DoorOpen,
  X,
  RefreshCw,
  Signal,
  Cpu,
  Wifi,
  WifiOff,
  Link2,
  Unlink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Beacon, BeaconCounters, Floor, RoomZone, BeaconStatus } from '../../types';
import commandCenterService from '../../services/commandCenterService';

interface BeaconsViewProps {
  lastUpdated?: Date;
  onNavigateToMap?: () => void;
}

export const BeaconsView: React.FC<BeaconsViewProps> = ({
  lastUpdated,
  onNavigateToMap,
}) => {
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [counters, setCounters] = useState<BeaconCounters | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [assignFilter, setAssignFilter] = useState<string>('all');

  // Pagination state (default 15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBeacon, setEditingBeacon] = useState<Beacon | null>(null);

  // Quick Assign Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetBeacon, setTargetBeacon] = useState<Beacon | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  // Form states
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [model, setModel] = useState('Sentinel BLE Anchor v2');
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [rssi, setRssi] = useState<number>(-59);
  const [batteryLevel, setBatteryLevel] = useState<number>(98.5);
  const [status, setStatus] = useState<BeaconStatus>('active');
  const [txIntervalHz, setTxIntervalHz] = useState<number>(5);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [beaconsRes, countersRes, floorsRes] = await Promise.all([
        commandCenterService.getBeacons(),
        commandCenterService.getBeaconCounters(),
        commandCenterService.getFacilityFloors(),
      ]);
      setBeacons(beaconsRes);
      setCounters(countersRes);
      setFloors(floorsRes);
    } catch (err) {
      console.error('Failed to load beacons:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, lastUpdated]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Flattened rooms list for assignment
  const allRooms = floors.flatMap((f) =>
    (f.zones || []).map((z) => ({
      ...z,
      floorNumber: f.floorNumber,
      floorName: f.name,
      displayName: `[Floor ${f.floorNumber}] Room ${z.roomNumber} - ${z.name}`,
    }))
  );

  const handleOpenRegister = () => {
    setEditingBeacon(null);
    const count = beacons.length + 1;
    const randomHex = Math.floor(Math.random() * 255).toString(16).padStart(2, '0').toUpperCase();
    setSerialNumber(`BCN-FL2-${200 + count}`);
    setMacAddress(`E4:95:6E:02:${randomHex}:01`);
    setModel('Sentinel BLE Anchor v2');
    setZoneId(null);
    setRssi(-59);
    setBatteryLevel(100.0);
    setStatus('active');
    setTxIntervalHz(5);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Beacon) => {
    setEditingBeacon(b);
    setSerialNumber(b.serialNumber);
    setMacAddress(b.macAddress);
    setModel(b.model);
    setZoneId(b.zoneId ?? b.zone?.id ?? null);
    setRssi(b.rssiCalibrated1m ?? -59);
    setBatteryLevel(b.batteryLevel);
    setStatus(b.status);
    setTxIntervalHz(b.txIntervalHz ?? 5);
    setIsModalOpen(true);
  };

  const handleSaveBeacon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBeacon) {
        await commandCenterService.updateBeacon(editingBeacon.id, {
          serialNumber,
          macAddress,
          model,
          zoneId,
          rssiCalibrated1m: rssi,
          batteryLevel,
          status,
          txIntervalHz,
        });
        showNotification(`Beacon "${serialNumber}" configuration saved.`);
      } else {
        await commandCenterService.createBeacon({
          serialNumber,
          macAddress,
          model,
          zoneId,
          rssiCalibrated1m: rssi,
          batteryLevel,
          status,
          txIntervalHz,
        });
        showNotification(`New Beacon "${serialNumber}" registered into fleet.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save beacon', 'error');
    }
  };

  const handleDeleteBeacon = async (b: Beacon) => {
    if (!window.confirm(`Decommission beacon "${b.serialNumber}"?`)) return;
    try {
      await commandCenterService.deleteBeacon(b.id);
      showNotification(`Beacon "${b.serialNumber}" decommissioned.`);
      await loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete beacon', 'error');
    }
  };

  // Quick Assign
  const handleOpenQuickAssign = (b: Beacon) => {
    setTargetBeacon(b);
    setSelectedZoneId(b.zoneId ?? b.zone?.id ?? null);
    setIsAssignModalOpen(true);
  };

  const handleSaveQuickAssign = async () => {
    if (!targetBeacon) return;
    try {
      await commandCenterService.assignBeacon(targetBeacon.id, selectedZoneId);
      showNotification(
        selectedZoneId
          ? `Beacon "${targetBeacon.serialNumber}" paired to room.`
          : `Beacon "${targetBeacon.serialNumber}" moved to unassigned inventory.`
      );
      setIsAssignModalOpen(false);
      await loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to assign beacon', 'error');
    }
  };

  // Filter beacons
  const filteredBeacons = beacons.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;

    const assignedFloorNum = b.zone?.floor?.floorNumber?.toString();
    if (floorFilter !== 'all' && assignedFloorNum !== floorFilter) return false;

    const isAssigned = Boolean(b.zoneId || b.zone);
    if (assignFilter === 'assigned' && !isAssigned) return false;
    if (assignFilter === 'unassigned' && isAssigned) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const zoneName = b.zone ? `${b.zone.roomNumber} ${b.zone.name}`.toLowerCase() : '';
    return (
      b.serialNumber.toLowerCase().includes(q) ||
      b.macAddress.toLowerCase().includes(q) ||
      b.model.toLowerCase().includes(q) ||
      zoneName.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-amber-500" />
            Beacons
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Indoor BLE location beacon anchors, battery telemetry, signal calibration, and spatial room pairing
          </p>
        </div>
        {onNavigateToMap && (
          <button
            onClick={onNavigateToMap}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            <MapPin className="w-4 h-4 text-cyan-500" />
            <span>View Facility Map</span>
          </button>
        )}
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
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total BLE Anchors</p>
            <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
              {counters?.total ?? beacons.length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Signal className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Transmitting</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {counters?.active ?? beacons.filter((b) => b.status === 'active').length}
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
              {counters?.lowBattery ?? beacons.filter((b) => Number(b.batteryLevel) < 20).length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Spare / Unassigned</p>
            <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {counters?.unassigned ?? beacons.filter((b) => !b.zoneId && !b.zone).length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Beacons Fleet Table & Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-500" />
              <span>Beacons</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredBeacons.length}
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
                placeholder="Search serial, MAC, room..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Floor Filter */}
            <select
              value={floorFilter}
              onChange={(e) => {
                setFloorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">All Floors</option>
              {floors.map((f) => (
                <option key={f.id} value={f.floorNumber.toString()}>
                  Floor {f.floorNumber}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Online</option>
              <option value="low_battery">Low Battery</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
            </select>

            {/* Assignment Filter */}
            <select
              value={assignFilter}
              onChange={(e) => {
                setAssignFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">All Pairings</option>
              <option value="assigned">Assigned to Room</option>
              <option value="unassigned">Unassigned / Spare</option>
            </select>

            {/* Register Beacon Button */}
            <button
              onClick={handleOpenRegister}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer ml-auto sm:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Beacon</span>
            </button>
          </div>
        </div>

        {/* Beacons Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Beacon Serial</th>
                  <th className="px-4 py-3">Hardware MAC & Model</th>
                  <th className="px-4 py-3">Assigned Location</th>
                  <th className="px-4 py-3">Battery Health</th>
                  <th className="px-4 py-3">Tx Calibration</th>
                  <th className="px-4 py-3">Operational Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredBeacons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                      No BLE beacons matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredBeacons
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((b) => {
                    const batt = Number(b.batteryLevel);
                    const isLow = batt < 20;
                    const isGood = batt >= 70;

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Serial */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                              <Radio className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {b.serialNumber}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* MAC & Model */}
                        <td className="px-4 py-3">
                          <div className="font-mono text-slate-800 dark:text-slate-200">{b.macAddress}</div>
                          <div className="text-[11px] text-slate-400">{b.model}</div>
                        </td>

                        {/* Location Pairing */}
                        <td className="px-4 py-3">
                          {b.zone ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold">
                                Room {b.zone.roomNumber}
                              </span>
                              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                                {b.zone.name}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                              <Unlink className="w-3 h-3" />
                              Unassigned Stock
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
                              {batt.toFixed(1)}%
                            </span>
                          </div>
                        </td>

                        {/* Calibration */}
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          <div>RSSI: {b.rssiCalibrated1m ?? -59} dBm</div>
                          <div className="text-[10px] text-slate-400">Tx: {b.txIntervalHz ?? 5} Hz</div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {b.status === 'active' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active Online
                            </span>
                          )}
                          {b.status === 'low_battery' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold">
                              <BatteryWarning className="w-3 h-3 text-rose-500" />
                              Low Battery
                            </span>
                          )}
                          {b.status === 'offline' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-[11px]">
                              <WifiOff className="w-3 h-3 text-slate-400" />
                              Offline
                            </span>
                          )}
                          {b.status === 'maintenance' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px]">
                              Maintenance
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenQuickAssign(b)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg transition"
                              title="Pair / Reassign to Room"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(b)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg transition"
                              title="Edit Configuration"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBeacon(b)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                              title="Delete Beacon"
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

          {/* Pagination Footer */}
          <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/30 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 text-xs font-sans text-center">
            {/* Summary & Page Size Selector */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
              <span>
                Showing{' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {filteredBeacons.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {Math.min(currentPage * pageSize, filteredBeacons.length)}
                </strong>{' '}
                of <strong className="text-slate-900 dark:text-white font-mono">{filteredBeacons.length}</strong> records
              </span>

              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-amber-500 cursor-pointer shadow-xs"
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
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-slate-600 dark:text-slate-400 font-mono">
                  Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {Math.max(1, Math.ceil(filteredBeacons.length / pageSize))}
                  </strong>
                </span>
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(Math.max(1, Math.ceil(filteredBeacons.length / pageSize)), p + 1)
                  )
                }
                disabled={currentPage >= Math.ceil(filteredBeacons.length / pageSize)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center gap-1"
                title="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(Math.max(1, Math.ceil(filteredBeacons.length / pageSize)))}
                disabled={currentPage >= Math.ceil(filteredBeacons.length / pageSize)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Register / Edit Beacon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
              <Radio className="w-5 h-5 text-amber-500" />
              <span>{editingBeacon ? 'Configure BLE Anchor' : 'Register BLE Beacon'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter transmitter MAC identifier, room location pair, and RF transmission parameters.
            </p>

            <form onSubmit={handleSaveBeacon} className="space-y-4 text-xs">
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
                    placeholder="BCN-FL2-205"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500 font-mono"
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
                    placeholder="E4:95:6E:02:05:01"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500 font-mono"
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
                  placeholder="Sentinel BLE Anchor v2"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Room / Zone
                </label>
                <select
                  value={zoneId ?? ''}
                  onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="">-- Unassigned (Spare Stock) --</option>
                  {allRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Calibrated RSSI @1m
                  </label>
                  <input
                    type="number"
                    value={rssi}
                    onChange={(e) => setRssi(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tx Interval (Hz)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={txIntervalHz}
                    onChange={(e) => setTxIntervalHz(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Battery (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={batteryLevel}
                    onChange={(e) => setBatteryLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Operational Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BeaconStatus)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="active">Active Online</option>
                  <option value="low_battery">Low Battery</option>
                  <option value="offline">Offline</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md transition active:scale-95 cursor-pointer"
                >
                  {editingBeacon ? 'Save Changes' : 'Register Beacon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Pair / Unassign Room */}
      {isAssignModalOpen && targetBeacon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
              <Link2 className="w-5 h-5 text-indigo-500" />
              <span>Pair Beacon to Room Zone</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono">
              Anchor: {targetBeacon.serialNumber}
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Room Location
                </label>
                <select
                  value={selectedZoneId ?? ''}
                  onChange={(e) => setSelectedZoneId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="">-- Unassign (Return to Spares) --</option>
                  {allRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickAssign}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition active:scale-95 cursor-pointer"
                >
                  Update Pairing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
