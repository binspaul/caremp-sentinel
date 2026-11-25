import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  Heart,
  Wind,
  ShieldCheck,
  Radio,
  Cpu,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  ExternalLink,
} from 'lucide-react';
import {
  Vital,
  Resident,
  BandCounters,
  RadarPodCounters,
  ChestPatchCounters,
  BeaconCounters,
} from '../../types';
import { NavTab } from '../common/Sidebar';

interface DashboardChartsProps {
  vitals?: Vital[];
  residents: Resident[];
  residentsMap: Record<number, Resident>;
  bandCounters?: BandCounters | null;
  radarCounters?: RadarPodCounters | null;
  patchCounters?: ChestPatchCounters | null;
  beaconCounters?: BeaconCounters | null;
  lastUpdated?: Date;
  onNavigate?: (tab: NavTab) => void;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  vitals,
  residents,
  residentsMap,
  bandCounters,
  radarCounters,
  patchCounters,
  beaconCounters,
  onNavigate,
}) => {
  const [selectedResidentId, setSelectedResidentId] = useState<number | 'all'>('all');

  // Format telemetry stream data for Recharts (chronological order)
  const telemetryData = useMemo(() => {
    const sourceVitals = vitals || [];

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

    // Sort chronologically (oldest on the left, newest on the right)
    const sorted = [...filtered].sort((a, b) => {
      const tA = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
      const tB = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
      if (tA !== tB) return tA - tB;
      return a.id - b.id;
    });

    // Take up to the last 15 readings
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

    // Guarantee at least 2 points so Recharts Area always has width to render
    if (points.length === 1) {
      const p = points[0];
      const priorTime = new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
  }, [vitals, residentsMap, selectedResidentId]);

  // Current latest vitals values directly matching the Recent Vitals table
  const currentMetrics = useMemo(() => {
    if (!vitals || vitals.length === 0) {
      return { hr: 72, spo2: 98, bp: '120/80', temp: '36.8', count: 0, residentName: 'Cohort' };
    }

    const filtered = selectedResidentId === 'all'
      ? vitals
      : vitals.filter((v) => v.residentId === selectedResidentId);

    const targetList = filtered.length > 0 ? filtered : vitals;
    const latest = targetList[0]; // Exactly matches the top row of the Recent Vitals table
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
  }, [vitals, residentsMap, selectedResidentId]);

  // Aggregate resident health scores
  const healthDistribution = useMemo(() => {
    let optimal = 0;
    let moderate = 0;
    let critical = 0;

    residents.forEach((r) => {
      const score = r.healthScore ?? 85;
      if (score >= 80) optimal++;
      else if (score >= 60) moderate++;
      else critical++;
    });

    const total = residents.length || 1;
    const avgScore = Math.round(
      residents.reduce((sum, r) => sum + (r.healthScore ?? 85), 0) / total,
    );

    return {
      optimal,
      moderate,
      critical,
      total: residents.length,
      avgScore,
      chartData: [
        { name: 'Optimal (80-100)', count: optimal, color: '#10b981' },
        { name: 'Moderate (60-79)', count: moderate, color: '#f59e0b' },
        { name: 'Critical (<60)', count: critical, color: '#f43f5e' },
      ],
    };
  }, [residents]);

  // Hardware Fleet Aggregation
  const fleetData = useMemo(() => {
    return [
      {
        id: 'bands' as NavTab,
        name: 'Wearable Bands',
        active: bandCounters?.active ?? 4,
        total: bandCounters?.total ?? 6,
        color: '#10b981',
      },
      {
        id: 'radar-pods' as NavTab,
        name: 'Radar Pods',
        active: radarCounters?.active ?? 5,
        total: radarCounters?.total ?? 6,
        color: '#06b6d4',
      },
      {
        id: 'chest-patches' as NavTab,
        name: 'ECG Patches',
        active: patchCounters?.active ?? 4,
        total: patchCounters?.total ?? 6,
        color: '#8b5cf6',
      },
      {
        id: 'beacons' as NavTab,
        name: 'BLE Beacons',
        active: beaconCounters?.active ?? 5,
        total: beaconCounters?.total ?? 6,
        color: '#3b82f6',
      },
    ];
  }, [bandCounters, radarCounters, patchCounters, beaconCounters]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart 1: Real-Time Physiological Telemetry Stream (Spans 2 Columns on desktop) */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
        <div>
          {/* Card Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Physiological Telemetry Stream
                  </h3>
                </div>
              </div>
            </div>

            {/* Resident Filter & Chart Legend */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Legend (All 5 Vitals) */}
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>HR</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>SpO2</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Sys BP</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Dia BP</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Temp (°C)</span>
                </div>
              </div>

              {/* Resident Filter Dropdown */}
              <select
                value={selectedResidentId}
                onChange={(e) =>
                  setSelectedResidentId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                aria-label="Filter Resident Telemetry"
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Cohort Average ({residents.length})</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.firstName} {r.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics Strip (Values strictly match the Recent Vitals table) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-100 dark:border-slate-800/60 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-400 font-medium">Heart Rate:</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                {currentMetrics.hr} bpm
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="text-xs text-slate-400 font-medium">SpO2:</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                {currentMetrics.spo2}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-slate-400 font-medium">Blood Pressure:</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                {currentMetrics.bp} mmHg
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs text-slate-400 font-medium">Temperature:</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                {currentMetrics.temp}°C
              </span>
            </div>
          </div>

          {/* Recharts Area Graph */}
          <div className="w-full pt-2" style={{ height: 260, minHeight: 260 }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={telemetryData} margin={{ top: 10, right: 0, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800/80" />

                <XAxis
                  dataKey="displayLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(val: string) => val.split(' ')[0] || val}
                />

                {/* Left Y-Axis: Hemodynamic & Oxygenation Vitals (50 - 160) */}
                <YAxis
                  yAxisId="vitals"
                  tickLine={false}
                  axisLine={false}
                  domain={[50, 160]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  width={28}
                />

                {/* Right Y-Axis: Body Temperature (34 - 40 °C) */}
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
                        <div className="p-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700/80 text-xs">
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
                  fill="url(#amberGradient)"
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
                  fill="url(#purpleGradient)"
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
                  fill="url(#cyanGradient)"
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
                  fill="url(#emeraldGradient)"
                  dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                />

                {/* 5. Temperature Area (Mapped to Right Axis in °C) */}
                <Area
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#roseGradient)"
                  dot={{ r: 3, fill: '#f43f5e', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 2: Resident Health Score & Fleet Distribution (Right Column) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-5">
        {/* Health Score Index Overview */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Resident Health Index</h3>
                <p className="text-[11px] text-slate-400">Cohort cognitive &amp; vital distribution</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {healthDistribution.avgScore}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">/100</span>
            </div>
          </div>

          {/* Visual Health Distribution Segmented Bar */}
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Cohort Health Breakdown</span>
              <span className="font-mono text-[11px] text-slate-400">{healthDistribution.total} Enrolled</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div
                style={{ width: `${(healthDistribution.optimal / Math.max(1, healthDistribution.total)) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Optimal: ${healthDistribution.optimal}`}
              />
              <div
                style={{ width: `${(healthDistribution.moderate / Math.max(1, healthDistribution.total)) * 100}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Moderate: ${healthDistribution.moderate}`}
              />
              <div
                style={{ width: `${(healthDistribution.critical / Math.max(1, healthDistribution.total)) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Critical: ${healthDistribution.critical}`}
              />
            </div>

            {/* Legend Chips */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Optimal</span>
                </div>
                <p className="text-xs font-mono font-bold mt-1 text-slate-800 dark:text-slate-200">
                  {healthDistribution.optimal}
                </p>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Moderate</span>
                </div>
                <p className="text-xs font-mono font-bold mt-1 text-slate-800 dark:text-slate-200">
                  {healthDistribution.moderate}
                </p>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Critical</span>
                </div>
                <p className="text-xs font-mono font-bold mt-1 text-slate-800 dark:text-slate-200">
                  {healthDistribution.critical}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Modal Fleet Telemetry Connectivity */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Sensor Fleets Connectivity</h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              Live Health
            </span>
          </div>

          <div className="space-y-2 mt-3">
            {fleetData.map((fleet) => {
              const pct = Math.round((fleet.active / Math.max(1, fleet.total)) * 100);
              return (
                <div
                  key={fleet.name}
                  onClick={() => onNavigate?.(fleet.id)}
                  className="group p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex-1 mr-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {fleet.name}
                      </span>
                      <span className="font-mono text-slate-400">
                        {fleet.active}/{fleet.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%`, backgroundColor: fleet.color }}
                        className="h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
