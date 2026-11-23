import React, { useState } from 'react';
import { Vital, Resident, SleepStatus } from '../../types';
import { Badge, getVitalStatus } from '../common/Badge';
import { ResidentProfileDrawer } from '../residents/ResidentProfileDrawer';
import {
  Heart,
  Activity,
  Wind,
  Thermometer,
  Moon,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Eye,
} from 'lucide-react';

interface RecentVitalsTableProps {
  vitals: Vital[];
  residentsMap: Record<number, Resident>;
  isLoading: boolean;
  onSelectResident?: (residentId: number) => void;
  onLaunchTelemedicine?: (residentId: number) => void;
}

export const RecentVitalsTable: React.FC<RecentVitalsTableProps> = ({
  vitals,
  residentsMap,
  isLoading,
  onSelectResident,
  onLaunchTelemedicine,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Resident Profile Slide Drawer (matches "Residents" listing style)
  const [selectedResidentForProfile, setSelectedResidentForProfile] = useState<Resident | null>(null);
  const [selectedVitalForProfile, setSelectedVitalForProfile] = useState<Vital | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

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

  const getSleepLabel = (status?: SleepStatus) => {
    switch (status) {
      case SleepStatus.AWAKE:
        return 'Awake';
      case SleepStatus.LIGHT_SLEEP:
        return 'Light Sleep';
      case SleepStatus.DEEP_SLEEP:
        return 'Deep Sleep';
      default:
        return 'Active';
    }
  };

  const filteredVitals = vitals
    .filter((v) => {
      const resident = residentsMap[v.residentId];
      const name = resident ? `${resident.firstName} ${resident.lastName}`.toLowerCase() : '';
      const uhid = resident?.uhid?.toLowerCase() || '';
      const id = String(v.residentId);
      const search = searchTerm.toLowerCase();
      return name.includes(search) || uhid.includes(search) || id.includes(search);
    })
    .slice(0, 10);

  const handleRowClick = (vital: Vital) => {
    const resident = residentsMap[vital.residentId] || (vital.resident as Resident);
    if (resident) {
      setSelectedResidentForProfile(resident);
      setSelectedVitalForProfile(vital);
      setIsProfileDrawerOpen(true);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm dark:shadow-xl backdrop-blur transition-colors">
      {/* Table Header / Action Bar */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Recent Resident Vitals
            </h2>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {filteredVitals.length} records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric feed streamed from connected continuous telemetry sensors. Auto-refreshes every 1 min.
          </p>
        </div>

        {/* Local Search input */}
        <div className="relative min-w-64">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resident by name, UHID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition shadow-2xs"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-6 font-semibold">Resident</th>
              <th className="py-3.5 px-4 font-semibold">Heart Rate</th>
              <th className="py-3.5 px-4 font-semibold">Blood Pressure</th>
              <th className="py-3.5 px-4 font-semibold">SpO2</th>
              <th className="py-3.5 px-4 font-semibold">Body Temp</th>
              <th className="py-3.5 px-4 font-semibold">Sleep & State</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-6 font-semibold text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
            {isLoading && vitals.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-6">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
                    <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                  <td className="py-4 px-6 text-right"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : filteredVitals.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 px-6 text-center text-slate-500">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No vital records found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {searchTerm
                        ? `No vitals match search "${searchTerm}".`
                        : 'No telemetry has been recorded yet. Sensor data will populate automatically.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredVitals.map((vital) => {
                const resident = residentsMap[vital.residentId];
                const status = getVitalStatus(vital);
                const residentName = resident
                  ? `${resident.firstName} ${resident.lastName}`
                  : `Resident #${vital.residentId}`;

                return (
                  <tr
                    key={vital.id}
                    onClick={() => handleRowClick(vital)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  >
                    {/* Resident Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors"
                        >
                          {resident?.firstName?.[0] || 'R'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            <span>{residentName}</span>
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {resident?.uhid ? `UHID: ${resident.uhid}` : `ID: ${vital.residentId}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Heart Rate */}
                    <td className="py-4 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {vital.heartRate ? Math.round(vital.heartRate) : '--'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">bpm</span>
                      </div>
                    </td>

                    {/* Blood Pressure */}
                    <td className="py-4 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {vital.systolicBP && vital.diastolicBP
                            ? `${Math.round(vital.systolicBP)}/${Math.round(vital.diastolicBP)}`
                            : '--'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">mmHg</span>
                      </div>
                    </td>

                    {/* SpO2 */}
                    <td className="py-4 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-cyan-500" />
                        <span
                          className={`font-semibold ${
                            vital.oxygenSaturation && vital.oxygenSaturation < 95
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : '--'}
                        </span>
                      </div>
                    </td>

                    {/* Body Temperature */}
                    <td className="py-4 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {vital.bodyTemperature ? `${Number(vital.bodyTemperature).toFixed(1)}°C` : '--'}
                        </span>
                      </div>
                    </td>

                    {/* Sleep Status */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>{getSleepLabel(vital.sleepStatus)}</span>
                      </div>
                      {vital.wearingIndicator !== undefined && (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {vital.wearingIndicator ? 'Sensor worn' : 'Sensor removed'}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <Badge variant={status.variant} size="sm" pulse={status.variant !== 'normal'}>
                        {status.variant === 'normal' && <CheckCircle2 className="w-3 h-3" />}
                        {status.variant === 'warning' && <AlertTriangle className="w-3 h-3" />}
                        {status.variant === 'critical' && <AlertOctagon className="w-3 h-3" />}
                        {status.label}
                      </Badge>
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-6 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center justify-end gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{formatTimestamp(vital.generatedAt || vital.createdAt)}</span>
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

    {/* Sliding Resident Profile Drawer (matches "Residents" listing style) */}
    <ResidentProfileDrawer
      resident={selectedResidentForProfile}
      vital={selectedVitalForProfile}
      isOpen={isProfileDrawerOpen}
      onClose={() => {
        setIsProfileDrawerOpen(false);
        setSelectedVitalForProfile(null);
      }}
      onLaunchTelemedicine={(id) => {
        setIsProfileDrawerOpen(false);
        if (onLaunchTelemedicine) onLaunchTelemedicine(id);
      }}
      onViewVitals={(id) => {
        setIsProfileDrawerOpen(false);
        setSelectedVitalForProfile(null);
        if (onSelectResident) onSelectResident(id);
      }}
    />
  </>
);
};
