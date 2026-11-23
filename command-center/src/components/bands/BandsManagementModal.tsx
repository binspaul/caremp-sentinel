import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Radio,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Wifi,
  WifiOff,
  UserCheck,
  UserX,
  Layers,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Search,
  ShieldCheck,
  DollarSign,
  Activity,
} from 'lucide-react';
import commandCenterService from '../../services/commandCenterService';
import { Band, BandCounters, Resident } from '../../types';

interface BandsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  onFleetUpdated?: () => void;
}

export const BandsManagementModal: React.FC<BandsManagementModalProps> = ({
  isOpen,
  onClose,
  residents,
  onFleetUpdated,
}) => {
  const [bands, setBands] = useState<Band[]>([]);
  const [counters, setCounters] = useState<BandCounters | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBandForAssign, setSelectedBandForAssign] = useState<number | null>(null);
  const [targetResidentId, setTargetResidentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New band form state
  const [newSerial, setNewSerial] = useState('');
  const [newMac, setNewMac] = useState('');
  const [newType, setNewType] = useState<'wristband' | 'radar_pod'>('wristband');

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
    if (isOpen) {
      setSuccessMsg(null);
      setErrorMsg(null);
      fetchBands();
    }
  }, [isOpen, fetchBands]);

  // Handle Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAssign = async (bandId: number) => {
    if (!targetResidentId) {
      setErrorMsg('Please select a resident to pair this device with.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await commandCenterService.assignBand(bandId, targetResidentId);
      setSuccessMsg(`Device successfully paired with Resident #${targetResidentId}`);
      setSelectedBandForAssign(null);
      setTargetResidentId(null);
      await fetchBands();
      if (onFleetUpdated) onFleetUpdated();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to assign band.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async (bandId: number) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await commandCenterService.unassignBand(bandId);
      setSuccessMsg(`Device unassigned and returned to charging pool.`);
      await fetchBands();
      if (onFleetUpdated) onFleetUpdated();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to unassign band.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerial.trim() || !newMac.trim()) {
      setErrorMsg('Serial number and MAC address are required.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await commandCenterService.createBand({
        serialNumber: newSerial.trim().toUpperCase(),
        macAddress: newMac.trim().toUpperCase(),
        deviceType: newType,
        model: newType === 'radar_pod' ? 'Sentinel 60GHz FMCW Radar Pod' : 'Sentinel Low-Cost Bio-Pod v1',
        batteryLevel: 100,
        isWorn: false,
        status: 'available',
        rssi: -50,
      });
      setSuccessMsg(`Device #${newSerial.toUpperCase()} provisioned into fleet.`);
      setNewSerial('');
      setNewMac('');
      setShowAddForm(false);
      await fetchBands();
      if (onFleetUpdated) onFleetUpdated();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to register device.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered bands
  const filteredBands = bands.filter((b) => {
    if (filterStatus === 'active' && b.status !== 'active') return false;
    if (filterStatus === 'available' && b.status !== 'available') return false;
    if (filterStatus === 'charging' && b.status !== 'charging') return false;
    if (filterStatus === 'lowBattery' && Number(b.batteryLevel) > 20) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const s = b.serialNumber.toLowerCase();
      const m = b.macAddress.toLowerCase();
      const r = b.assignedResident
        ? `${b.assignedResident.firstName} ${b.assignedResident.lastName}`.toLowerCase()
        : '';
      return s.includes(q) || m.includes(q) || r.includes(q);
    }
    return true;
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Hardware Pod & Band Fleet Management
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                  $45 BOM / Pod
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage low-cost multi-modal wearable bands, 60-GHz radar pods, and patient dynamic pairing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision Pod</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fleet Metrics Top Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/30 shrink-0">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Total Fleet</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {counters?.total ?? bands.length} <span className="text-xs font-normal text-slate-500">Pods</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Active Monitored</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {counters?.active ?? bands.filter((b) => b.status === 'active').length} <span className="text-xs font-normal text-slate-500">Beds</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Charging Dock</div>
              <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                {counters?.charging ?? bands.filter((b) => b.status === 'charging').length} <span className="text-xs font-normal text-slate-500">Ready</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <BatteryCharging className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Low Battery (&lt;20%)</div>
              <div className="text-lg font-bold text-rose-500 font-mono mt-0.5">
                {counters?.lowBattery ?? bands.filter((b) => Number(b.batteryLevel) <= 20).length} <span className="text-xs font-normal text-slate-500">Alert</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <BatteryWarning className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Provisioning New Pod Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateBand}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                  Register New $45 Hardware Pod
                </span>
                <span className="text-[10px] font-mono text-slate-400">BLE 5.3 Auto-Discovery</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    placeholder="e.g. BND-007"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">BLE MAC Address</label>
                  <input
                    type="text"
                    value={newMac}
                    onChange={(e) => setNewMac(e.target.value)}
                    placeholder="e.g. C4:7D:4F:12:9A:07"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Sensor Form Factor</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="wristband">Wristband (Dual-λ PPG)</option>
                    <option value="radar_pod">Radar Pod (60-GHz mmWave)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          )}

          {/* Search & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Pods' },
                { id: 'active', label: 'Active Monitored' },
                { id: 'available', label: 'Available / Dock' },
                { id: 'charging', label: 'Charging' },
                { id: 'lowBattery', label: 'Low Battery' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    filterStatus === tab.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Serial, MAC, Resident..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Bands Inventory List */}
          <div className="space-y-2.5">
            {filteredBands.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                No sensor bands found matching the selected filter.
              </div>
            ) : (
              filteredBands.map((band) => {
                const batt = Number(band.batteryLevel);
                const isLow = batt <= 20;
                const isAssigned = !!band.assignedResidentId;
                const residentName = band.assignedResident
                  ? `${band.assignedResident.firstName} ${band.assignedResident.lastName}`
                  : null;

                return (
                  <div
                    key={band.id}
                    className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 ${
                      isLow
                        ? 'bg-rose-500/5 border-rose-500/30'
                        : isAssigned
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        : 'bg-slate-50/70 dark:bg-slate-950/40 border-dashed border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    {/* Device Identifier & Specs */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          band.deviceType === 'radar_pod'
                            ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                            : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                        }`}
                      >
                        {band.deviceType === 'radar_pod' ? <Radio className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {band.serialNumber}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {band.macAddress}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {band.firmwareVersion}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{band.model}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Wifi className="w-3 h-3 text-emerald-500" />
                            {band.rssi} dBm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Telemetry: Battery & Lead-Worn Status */}
                    <div className="flex items-center gap-4 text-xs">
                      {/* Battery Level */}
                      <div className="flex items-center gap-1.5">
                        {band.status === 'charging' ? (
                          <BatteryCharging className="w-4 h-4 text-cyan-500" />
                        ) : isLow ? (
                          <BatteryWarning className="w-4 h-4 text-rose-500 animate-pulse" />
                        ) : (
                          <Battery className="w-4 h-4 text-emerald-500" />
                        )}
                        <span className={`font-mono text-xs font-semibold ${isLow ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {batt}%
                        </span>
                      </div>

                      {/* Wear Status / Lead-Off */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            band.isWorn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                          }`}
                        />
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                          {band.isWorn ? 'Lead On' : 'Lead Off (Dock)'}
                        </span>
                      </div>
                    </div>

                    {/* Resident Association & Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {isAssigned ? (
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Monitored Resident</span>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              {residentName || `Resident #${band.assignedResidentId}`}
                            </span>
                          </div>

                          <button
                            onClick={() => handleUnassign(band.id)}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Unassign and return to dock"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : selectedBandForAssign === band.id ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={targetResidentId ?? ''}
                            onChange={(e) => setTargetResidentId(e.target.value ? Number(e.target.value) : null)}
                            className="px-2 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium cursor-pointer"
                          >
                            <option value="">Select Care Recipient...</option>
                            {residents.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.firstName} {r.lastName} ({r.uhid})
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleAssign(band.id)}
                            disabled={isSubmitting || !targetResidentId}
                            className="px-2.5 py-1 text-xs rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:opacity-50"
                          >
                            Pair
                          </button>

                          <button
                            onClick={() => setSelectedBandForAssign(null)}
                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedBandForAssign(band.id);
                            setTargetResidentId(null);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Assign Pod</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40 shrink-0">
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Full hardware chain of custody compliant (FDA / CE MDR SaMD)</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
