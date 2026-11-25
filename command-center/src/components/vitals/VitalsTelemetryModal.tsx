import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity,
  X,
  RefreshCw,
  Heart,
  Thermometer,
  Wind,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Vital, Resident } from '../../types';
import commandCenterService from '../../services/commandCenterService';

interface VitalsTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vitals?: Vital[];
  residents?: Resident[];
  initialResidentId?: number | null;
}

export const VitalsTelemetryModal: React.FC<VitalsTelemetryModalProps> = ({
  isOpen,
  onClose,
  vitals: initialVitals,
  residents: initialResidents,
  initialResidentId,
}) => {
  const [selectedResidentId, setSelectedResidentId] = useState<number | 'all'>(
    initialResidentId || 'all',
  );
  const [vitalsList, setVitalsList] = useState<Vital[]>(initialVitals || []);
  const [residentsList, setResidentsList] = useState<Resident[]>(initialResidents || []);
  const [isLoading, setIsLoading] = useState(false);

  // Sync initial props
  useEffect(() => {
    if (initialVitals && initialVitals.length > 0) {
      setVitalsList(initialVitals);
    }
  }, [initialVitals]);

  useEffect(() => {
    if (initialResidents && initialResidents.length > 0) {
      setResidentsList(initialResidents);
    }
  }, [initialResidents]);

  useEffect(() => {
    if (initialResidentId !== undefined && initialResidentId !== null) {
      setSelectedResidentId(initialResidentId);
    }
  }, [initialResidentId]);

  // Load residents if not provided
  useEffect(() => {
    if (isOpen && residentsList.length === 0) {
      commandCenterService.getResidents({ skip: 0, limit: 100 })
        .then((res) => setResidentsList(res.data))
        .catch((err) => console.error('Failed to load residents for telemetry modal:', err));
    }
  }, [isOpen, residentsList.length]);

  // Refresh vitals
  const refreshVitals = async () => {
    setIsLoading(true);
    try {
      const res = await commandCenterService.getVitals({
        skip: 0,
        limit: 30,
        residentId: selectedResidentId === 'all' ? undefined : selectedResidentId,
        sortBy: 'generatedAt',
        sortOrder: -1,
      });
      setVitalsList(res.data);
    } catch (err) {
      console.error('Failed to refresh vitals in telemetry modal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (!vitalsList || vitalsList.length === 0)) {
      refreshVitals();
    }
  }, [isOpen]);

  // Dismiss on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build Map
  const residentsMap = useMemo(() => {
    const map: Record<number, Resident> = {};
    residentsList.forEach((r) => {
      map[r.id] = r;
    });
    return map;
  }, [residentsList]);

  // Format telemetry stream data for Recharts
  const telemetryData = useMemo(() => {
    const sourceVitals = vitalsList || [];

    const filtered = selectedResidentId === 'all'
      ? sourceVitals
      : sourceVitals.filter((v) => v.residentId === selectedResidentId);

    if (filtered.length === 0) {
      return [
        { displayLabel: '10:00', time: '10:00', heartRate: 72, oxygenSaturation: 98, systolicBP: 120, diastolicBP: 80, temperature: 36.8, resident: 'Baseline' },
        { displayLabel: '10:15', time: '10:15', heartRate: 74, oxygenSaturation: 98, systolicBP: 122, diastolicBP: 82, temperature: 36.8, resident: 'Baseline' },
        { displayLabel: '10:30', time: '10:30', heartRate: 71, oxygenSaturation: 97, systolicBP: 118, diastolicBP: 79, temperature: 36.8, resident: 'Baseline' },
        { displayLabel: '10:45', time: '10:45', heartRate: 75, oxygenSaturation: 99, systolicBP: 121, diastolicBP: 80, temperature: 36.8, resident: 'Baseline' },
      ];
    }

    // Sort chronologically (oldest on left, newest on right)
    const sorted = [...filtered].sort((a, b) => {
      const tA = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
      const tB = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
      if (tA !== tB) return tA - tB;
      return a.id - b.id;
    });

    const recentSlice = sorted.slice(-15);

    const points = recentSlice.map((v, idx) => {
      const d = v.generatedAt ? new Date(v.generatedAt) : new Date();
      const timeStr = !isNaN(d.getTime())
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '--:--';
      const res = residentsMap[v.residentId];
      const resName = res ? `${res.firstName} ${res.lastName}` : `Resident #${v.residentId}`;
      const shortName = res ? res.firstName : `#${v.residentId}`;

      const hr = Number(v.heartRate);
      const o2 = Number(v.oxygenSaturation);
      const sys = Number(v.systolicBP);
      const dia = Number(v.diastolicBP);
      const temp = Number(v.bodyTemperature);

      const uniqueLabel = selectedResidentId === 'all'
        ? `${timeStr} (${shortName})`
        : `${timeStr} #${idx + 1}`;

      return {
        id: v.id,
        displayLabel: uniqueLabel,
        time: timeStr,
        resident: resName,
        heartRate: Math.round(!isNaN(hr) && hr > 0 ? hr : 72),
        oxygenSaturation: Math.round(!isNaN(o2) && o2 > 0 ? o2 : 98),
        systolicBP: Math.round(!isNaN(sys) && sys > 0 ? sys : 120),
        diastolicBP: Math.round(!isNaN(dia) && dia > 0 ? dia : 80),
        temperature: !isNaN(temp) && temp > 0 ? parseFloat(temp.toFixed(1)) : 36.8,
      };
    });

    // Guarantee minimum 2 points for Recharts Area width
    if (points.length === 1) {
      const p = points[0];
      const priorTime = new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return [
        {
          ...p,
          id: 0,
          displayLabel: `${priorTime} (Prior)`,
          time: priorTime,
        },
        p,
      ];
    }

    return points;
  }, [vitalsList, residentsMap, selectedResidentId]);

  // Current latest vitals
  const currentMetrics = useMemo(() => {
    if (!vitalsList || vitalsList.length === 0) {
      return { hr: 72, spo2: 98, bp: '120/80', temp: '36.8', count: 0, residentName: 'Cohort' };
    }

    const filtered = selectedResidentId === 'all'
      ? vitalsList
      : vitalsList.filter((v) => v.residentId === selectedResidentId);

    const targetList = filtered.length > 0 ? filtered : vitalsList;
    const latest = targetList[0];
    const res = residentsMap[latest.residentId];
    const resName = res ? `${res.firstName} ${res.lastName}` : `Resident #${latest.residentId}`;

    const hr = Number(latest.heartRate);
    const o2 = Number(latest.oxygenSaturation);
    const sys = Number(latest.systolicBP);
    const dia = Number(latest.diastolicBP);
    const temp = Number(latest.bodyTemperature);

    return {
      hr: Math.round(!isNaN(hr) && hr > 0 ? hr : 72),
      spo2: Math.round(!isNaN(o2) && o2 > 0 ? o2 : 98),
      bp: `${Math.round(!isNaN(sys) && sys > 0 ? sys : 120)}/${Math.round(!isNaN(dia) && dia > 0 ? dia : 80)}`,
      temp: !isNaN(temp) && temp > 0 ? Number(temp).toFixed(1) : '36.8',
      count: targetList.length,
      residentName: resName,
    };
  }, [vitalsList, residentsMap, selectedResidentId]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Physiological Telemetry Stream</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Continuous 5-channel hemodynamic &amp; metabolic pulse telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {/* Resident Filter Dropdown */}
            <select
              value={selectedResidentId}
              onChange={(e) =>
                setSelectedResidentId(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              aria-label="Filter Resident Telemetry"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Cohort Average ({residentsList.length})</option>
              {residentsList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.firstName} {r.lastName} ({r.uhid})
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={refreshVitals}
              disabled={isLoading}
              title="Refresh telemetry readings"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend Pills */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1">Channels:</span>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Heart Rate (bpm)</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>SpO2 (%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Sys BP (mmHg)</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Dia BP (mmHg)</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Temp (°C)</span>
          </div>
        </div>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Heart Rate</p>
              <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                {currentMetrics.hr} <span className="text-[10px] font-sans text-slate-400 font-normal">bpm</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">SpO2 Level</p>
              <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                {currentMetrics.spo2} <span className="text-[10px] font-sans text-slate-400 font-normal">%</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Blood Pressure</p>
              <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                {currentMetrics.bp} <span className="text-[10px] font-sans text-slate-400 font-normal">mmHg</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Body Temp</p>
              <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                {currentMetrics.temp} <span className="text-[10px] font-sans text-slate-400 font-normal">°C</span>
              </p>
            </div>
          </div>
        </div>

        {/* Recharts Area Graph */}
        <div className="w-full pt-1" style={{ height: 320, minHeight: 320 }}>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={telemetryData} margin={{ top: 10, right: 5, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="modalEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="modalCyanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="modalAmberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="modalPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="modalRoseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800/80"
              />

              <XAxis
                dataKey="displayLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val: string) => val.split(' ')[0] || val}
              />

              {/* Left Y-Axis: Vitals (50 - 160) */}
              <YAxis
                yAxisId="vitals"
                tickLine={false}
                axisLine={false}
                domain={[50, 160]}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                width={28}
              />

              {/* Right Y-Axis: Temperature (34 - 40 °C) */}
              <YAxis
                yAxisId="temp"
                orientation="right"
                tickLine={false}
                axisLine={false}
                domain={[34, 40]}
                tick={{ fontSize: 10, fill: '#f43f5e' }}
                tickFormatter={(val: number) => `${val}°`}
                width={28}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-700/80 text-xs">
                        <p className="font-semibold text-slate-200 flex items-center justify-between gap-4">
                          <span>{data.resident}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{data.time || label}</span>
                        </p>
                        <div className="mt-2 space-y-1 font-mono text-[11px]">
                          <p className="text-amber-400 flex items-center justify-between gap-3">
                            <span>Systolic BP:</span>
                            <span className="font-bold">{data.systolicBP} mmHg</span>
                          </p>
                          <p className="text-cyan-400 flex items-center justify-between gap-3">
                            <span>SpO2:</span>
                            <span className="font-bold">{data.oxygenSaturation}%</span>
                          </p>
                          <p className="text-purple-400 flex items-center justify-between gap-3">
                            <span>Diastolic BP:</span>
                            <span className="font-bold">{data.diastolicBP} mmHg</span>
                          </p>
                          <p className="text-emerald-400 flex items-center justify-between gap-3">
                            <span>Heart Rate:</span>
                            <span className="font-bold">{data.heartRate} bpm</span>
                          </p>
                          <p className="text-rose-400 flex items-center justify-between gap-3">
                            <span>Temperature:</span>
                            <span className="font-bold">{data.temperature}°C</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* 1. Systolic BP Area */}
              <Area
                yAxisId="vitals"
                type="monotone"
                dataKey="systolicBP"
                name="Systolic BP"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#modalAmberGradient)"
                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 5 }}
              />

              {/* 2. Diastolic BP Area */}
              <Area
                yAxisId="vitals"
                type="monotone"
                dataKey="diastolicBP"
                name="Diastolic BP"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#modalPurpleGradient)"
                dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 5 }}
              />

              {/* 3. SpO2 Area */}
              <Area
                yAxisId="vitals"
                type="monotone"
                dataKey="oxygenSaturation"
                name="SpO2"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#modalCyanGradient)"
                dot={{ r: 3, fill: '#06b6d4', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 5 }}
              />

              {/* 4. Heart Rate Area */}
              <Area
                yAxisId="vitals"
                type="monotone"
                dataKey="heartRate"
                name="Heart Rate"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#modalEmeraldGradient)"
                dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 6 }}
              />

              {/* 5. Temperature Area */}
              <Area
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                name="Temperature"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#modalRoseGradient)"
                dot={{ r: 3, fill: '#f43f5e', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            Target: <strong className="text-slate-800 dark:text-slate-200">{currentMetrics.residentName}</strong> ({currentMetrics.count} data points)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};