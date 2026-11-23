import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Battery,
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
} from 'lucide-react';
import commandCenterService from '../../services/commandCenterService';
import { Band, BandCounters, Resident } from '../../types';

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
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBandForAssign, setSelectedBandForAssign] = useState<number | null>(null);
  const [targetResidentId, setTargetResidentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
        setSuccessMsg(`Pod #${bandId} returned to available inventory.`);
      } else {
        await commandCenterService.assignBand(bandId, residentId);
        const res = residents.find((r) => r.id === residentId);
        setSuccessMsg(`Pod #${bandId} successfully paired with ${res?.firstName} ${res?.lastName}.`);
      }
      setSelectedBandForAssign(null);
      setTargetResidentId(null);
      await fetchBands();
      onFleetUpdated?.();
    } catch (err) {
      console.error('Failed to assign band:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBands = bands.filter((band) => {
    const matchesFilter = filterStatus === 'all' || band.status === filterStatus;
    if (!matchesFilter) return false;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            ACTIVE · WORN
          </span>
        );
      case 'available':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            AVAILABLE IN DOCK
          </span>
        );
      case 'charging':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            CHARGING
          </span>
        );
      case 'maintenance':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            MAINTENANCE
          </span>
        );
      default:
        return null;
    }
  };

  const getBatteryIcon = (level: number, status: string) => {
    if (status === 'charging') {
      return <BatteryCharging className="w-4 h-4 text-amber-500 animate-pulse" />;
    }
    if (level <= 20) {
      return <BatteryWarning className="w-4 h-4 text-rose-500 animate-bounce" />;
    }
    return <Battery className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
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

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Fleet Summary Cards */}
      {counters && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Fleet Units</span>
            <div className="text-2xl font-bold font-mono mt-1 text-slate-900 dark:text-white">
              {counters.total}
            </div>
            <span className="text-[10px] text-slate-400">Provisioned $45 hardware pods</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Active & Worn</span>
            <div className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
              {counters.active}
            </div>
            <span className="text-[10px] text-emerald-400">Streaming live vitals</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-xs">
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Ready in Station</span>
            <div className="text-2xl font-bold font-mono mt-1 text-blue-600 dark:text-blue-400">
              {counters.available}
            </div>
            <span className="text-[10px] text-blue-400">Sanitized & ready for assignment</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-xs">
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Low Battery (&lt;20%)</span>
            <div className="text-2xl font-bold font-mono mt-1 text-rose-600 dark:text-rose-400">
              {counters.lowBattery}
            </div>
            <span className="text-[10px] text-rose-400">Pending charging dock</span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search serial, MAC, resident..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-hidden focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {['all', 'active', 'available', 'charging', 'maintenance'].map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => setFilterStatus(statusKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition cursor-pointer ${
                filterStatus === statusKey
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {statusKey}
            </button>
          ))}
        </div>
      </div>

      {/* Pod Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBands.map((band) => {
          const isSelectedForAssign = selectedBandForAssign === band.id;

          return (
            <div
              key={band.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                band.status === 'active'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {band.serialNumber}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {band.deviceType.replace('_', ' ')}
                    </span>
                  </div>
                  {getStatusBadge(band.status)}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">{band.model}</p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  MAC: {band.macAddress} · FW: {band.firmwareVersion}
                </p>

                {/* Battery & RSSI Bar */}
                <div className="mt-4 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {getBatteryIcon(band.batteryLevel, band.status)}
                    <span className="font-mono font-semibold">
                      {Number(band.batteryLevel).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                    <Wifi className="w-3.5 h-3.5 text-slate-400" />
                    <span>{band.rssi} dBm</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        band.isWorn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                      title={band.isWorn ? 'Wrist Contact Detected' : 'No Skin Contact'}
                    />
                  </div>
                </div>

                {/* Assigned Resident Pill */}
                <div className="mt-3">
                  {band.assignedResident ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {band.assignedResident.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            {band.assignedResident.firstName} {band.assignedResident.lastName}
                          </p>
                          <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                            {band.assignedResident.uhid}
                          </p>
                        </div>
                      </div>

                      <button
                        disabled={isSubmitting}
                        onClick={() => handleAssign(band.id, null)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Unassign Pod"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
                      <span>Unassigned / Available</span>
                      <button
                        onClick={() => {
                          setSelectedBandForAssign(band.id);
                          setTargetResidentId(residents[0]?.id || null);
                        }}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Pair Resident</span>
                      </button>
                    </div>
                  )}
                </div>

                {band.notes && (
                  <p className="text-[11px] text-slate-400 mt-3 italic line-clamp-2">
                    "{band.notes}"
                  </p>
                )}
              </div>

              {/* In-Card Assignment Selector */}
              {isSelectedForAssign && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 animate-fade-in">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Pair Pod {band.serialNumber} with:
                  </span>
                  <select
                    value={targetResidentId || ''}
                    onChange={(e) => setTargetResidentId(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                  >
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.firstName} {r.lastName} ({r.uhid})
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2 justify-end mt-1">
                    <button
                      onClick={() => setSelectedBandForAssign(null)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isSubmitting || !targetResidentId}
                      onClick={() => handleAssign(band.id, targetResidentId)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      Confirm Pairing
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
