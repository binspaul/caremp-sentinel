import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
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
  RefreshCw,
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
import commandCenterService from '../../services/commandCenterService';

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
  lastUpdated,
  onNavigate,
}) => {
  const [metricMode, setMetricMode] = useState<'hr_spo2' | 'bp'>('hr_spo2');
  const [selectedResidentId, setSelectedResidentId] = useState<number | 'all'>('all');
  const [streamVitals, setStreamVitals] = useState<Vital[]>(vitals || []);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [lastStreamFetchedAt, setLastStreamFetchedAt] = useState<Date | null>(null);

  // Fetch telemetry vitals directly via API
  const fetchStreamVitals = useCallback(async (resId: number | 'all') => {
    setIsStreamLoading(true);
    try {
      const targetResidentId = resId === 'all' ? undefined : resId;
      const limit = resId === 'all' ? 60 : 30;
      const res = await commandCenterService.getVitals({
        skip: 0,
        limit,
        residentId: targetResidentId,
        sortBy: 'generatedAt',
        sortOrder: -1,
      });
      if (res.data && res.data.length > 0) {
        setStreamVitals(res.data);
      } else if (resId === 'all' && vitals && vitals.length > 0) {
        setStreamVitals(vitals);
      } else {
        setStreamVitals([]);
      }
      setLastStreamFetchedAt(new Date());
    } catch (err: any) {
      console.error('Failed to fetch telemetry vitals from API:', err);
      if (vitals && vitals.length > 0 && streamVitals.length === 0) {
        setStreamVitals(vitals);
      }
    } finally {
      setIsStreamLoading(false);
    }
  }, [vitals, streamVitals.length]);

  // Initial fetch and when selectedResidentId or lastUpdated changes
  useEffect(() => {
    fetchStreamVitals(selectedResidentId);
  }, [selectedResidentId, lastUpdated, fetchStreamVitals]);

  // Keep in sync if parent passes fresh vitals prop on initial load
  useEffect(() => {
    if (vitals && vitals.length > 0 && streamVitals.length === 0) {
      setStreamVitals(vitals);
    }
  }, [vitals, streamVitals.length]);

  // Format telemetry stream data for Recharts (chronological order)
  const telemetryData = useMemo(() => {
    if (!streamVitals || streamVitals.length === 0) {
      return [];
    }

    if (selectedResidentId === 'all') {
      // Group by minute / timestamp to produce smooth time-series with average values
      const groups: Record<
        string,
        { count: number; hrSum: number; o2Sum: number; sysSum: number; diaSum: number; time: string; fullTime: number }
      > = {};

      streamVitals.forEach((v) => {
        const d = v.generatedAt ? new Date(v.generatedAt) : new Date();
        const timeKey = !isNaN(d.getTime())
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '--:--';
        const fullTime = !isNaN(d.getTime()) ? d.getTime() : 0;

        const hr = Number(v.heartRate);
        const o2 = Number(v.oxygenSaturation);
        const sys = Number(v.systolicBP);
        const dia = Number(v.diastolicBP);

        if (!groups[timeKey]) {
          groups[timeKey] = { count: 0, hrSum: 0, o2Sum: 0, sysSum: 0, diaSum: 0, time: timeKey, fullTime };
        }
        groups[timeKey].count++;
        groups[timeKey].hrSum += !isNaN(hr) && hr > 0 ? hr : 72;
        groups[timeKey].o2Sum += !isNaN(o2) && o2 > 0 ? o2 : 98;
        groups[timeKey].sysSum += !isNaN(sys) && sys > 0 ? sys : 120;
        groups[timeKey].diaSum += !isNaN(dia) && dia > 0 ? dia : 80;
      });

      const result = Object.values(groups)
        .sort((a, b) => a.fullTime - b.fullTime)
        .map((g) => ({
          time: g.time,
          heartRate: Math.round(g.hrSum / Math.max(1, g.count)),
          oxygenSaturation: Math.round(g.o2Sum / Math.max(1, g.count)),
          systolicBP: Math.round(g.sysSum / Math.max(1, g.count)),
          diastolicBP: Math.round(g.diaSum / Math.max(1, g.count)),
          resident: `Cohort (${g.count} readings)`,
        }));

      return result;
    }

    // Specific resident: order chronologically (oldest to newest)
    const sorted = [...streamVitals].sort((a, b) => {
      const tA = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
      const tB = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
      return tA - tB;
    });

    const minuteKeys = sorted.map((v) => {
      const d = v.generatedAt ? new Date(v.generatedAt) : new Date();
      return !isNaN(d.getTime())
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';
    });
    const hasMinuteDuplicates = new Set(minuteKeys).size !== minuteKeys.length;

    return sorted.map((v) => {
      const date = v.generatedAt ? new Date(v.generatedAt) : new Date();
      const timeStr = !isNaN(date.getTime())
        ? hasMinuteDuplicates
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--:--';
      const res = residentsMap[v.residentId];
      const resName = res ? `${res.firstName} ${res.lastName}` : `Resident #${v.residentId}`;

      const hr = Number(v.heartRate);
      const o2 = Number(v.oxygenSaturation);
      const sys = Number(v.systolicBP);
      const dia = Number(v.diastolicBP);

      return {
        time: timeStr,
        heartRate: Math.round(!isNaN(hr) && hr > 0 ? hr : 72),
        oxygenSaturation: Math.round(!isNaN(o2) && o2 > 0 ? o2 : 98),
        systolicBP: Math.round(!isNaN(sys) && sys > 0 ? sys : 120),
        diastolicBP: Math.round(!isNaN(dia) && dia > 0 ? dia : 80),
        temperature: v.bodyTemperature ? Number(v.bodyTemperature).toFixed(1) : '36.8',
        resident: resName,
      };
    });
  }, [streamVitals, residentsMap, selectedResidentId]);

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

  // Calculate live telemetry averages safely (guaranteed non-NaN)
  const latestAverages = useMemo(() => {
    if (!streamVitals || streamVitals.length === 0) {
      return { avgHR: 72, avgSpO2: 98, avgBP: '120/80', count: 0 };
    }

    const validHR = streamVitals
      .map((v) => Number(v.heartRate))
      .filter((n) => !isNaN(n) && n > 0);
    const validO2 = streamVitals
      .map((v) => Number(v.oxygenSaturation))
      .filter((n) => !isNaN(n) && n > 0);
    const validSys = streamVitals
      .map((v) => Number(v.systolicBP))
      .filter((n) => !isNaN(n) && n > 0);
    const validDia = streamVitals
      .map((v) => Number(v.diastolicBP))
      .filter((n) => !isNaN(n) && n > 0);

    const avgHR = validHR.length
      ? Math.round(validHR.reduce((a, b) => a + b, 0) / validHR.length)
      : 72;
    const avgSpO2 = validO2.length
      ? Math.round(validO2.reduce((a, b) => a + b, 0) / validO2.length)
      : 98;
    const avgSys = validSys.length
      ? Math.round(validSys.reduce((a, b) => a + b, 0) / validSys.length)
      : 120;
    const avgDia = validDia.length
      ? Math.round(validDia.reduce((a, b) => a + b, 0) / validDia.length)
      : 80;

    return { avgHR, avgSpO2, avgBP: `${avgSys}/${avgDia}`, count: streamVitals.length };
  }, [streamVitals]);

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
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Physiological Telemetry Stream</span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                      <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isStreamLoading ? 'animate-ping' : 'animate-pulse'}`} />
                      {isStreamLoading ? 'Syncing API...' : `API Feed (${streamVitals.length})`}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time vitals retrieved via <span className="font-mono text-emerald-600 dark:text-emerald-400">/vitals</span> API
                  </p>
                </div>
              </div>
            </div>

            {/* Metric Mode & Resident Filter */}
            <div className="flex flex-wrap items-center gap-2">
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

              {/* Metric Toggle */}
              <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMetricMode('hr_spo2')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    metricMode === 'hr_spo2'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Heart className="w-3 h-3 text-rose-500" />
                  <span>HR &amp; SpO2</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetricMode('bp')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    metricMode === 'bp'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3 h-3 text-amber-500" />
                  <span>Blood Pressure</span>
                </button>
              </div>

              {/* Refresh from API Button */}
              <button
                type="button"
                onClick={() => fetchStreamVitals(selectedResidentId)}
                disabled={isStreamLoading}
                title="Fetch latest vitals from API"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isStreamLoading ? 'animate-spin text-emerald-500' : ''}`} />
              </button>

              {/* Navigate to Vitals Tab Button */}
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('vitals')}
                  title="View full vitals log"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-100 dark:border-slate-800/60 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-400 font-medium">{selectedResidentId === 'all' ? 'Avg HR:' : 'HR:'}</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                {latestAverages.avgHR} bpm
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="text-xs text-slate-400 font-medium">{selectedResidentId === 'all' ? 'Avg SpO2:' : 'SpO2:'}</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                {latestAverages.avgSpO2}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-slate-400 font-medium">{selectedResidentId === 'all' ? 'Avg BP:' : 'BP:'}</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                {latestAverages.avgBP} mmHg
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs text-slate-400 font-medium">Readings:</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                {latestAverages.count} via API
              </span>
            </div>
          </div>

          {/* Recharts Area Graph or Empty State */}
          {telemetryData.length === 0 ? (
            <div className="h-[260px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Telemetry Data Available
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {selectedResidentId === 'all'
                  ? 'No recent vitals recorded across the facility. Run a simulation to generate real-time vitals.'
                  : 'No vitals recorded yet for this resident via the API. Trigger a simulation or select another resident.'}
              </p>
            </div>
          ) : (
            <div className="w-full pt-2" style={{ height: 260, minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={telemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800/80" />

                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={metricMode === 'hr_spo2' ? [40, 110] : [50, 160]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />

                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700/80 text-xs">
                            <p className="font-semibold text-slate-200 flex items-center justify-between gap-4">
                              <span>{data.resident}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{label}</span>
                            </p>
                            <div className="mt-2 space-y-1 font-mono text-[11px]">
                              {metricMode === 'hr_spo2' ? (
                                <>
                                  <p className="text-emerald-400 flex items-center justify-between gap-3">
                                    <span>Heart Rate:</span>
                                    <span className="font-bold">{data.heartRate} bpm</span>
                                  </p>
                                  <p className="text-cyan-400 flex items-center justify-between gap-3">
                                    <span>SpO2:</span>
                                    <span className="font-bold">{data.oxygenSaturation}%</span>
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-amber-400 flex items-center justify-between gap-3">
                                    <span>Systolic BP:</span>
                                    <span className="font-bold">{data.systolicBP} mmHg</span>
                                  </p>
                                  <p className="text-purple-400 flex items-center justify-between gap-3">
                                    <span>Diastolic BP:</span>
                                    <span className="font-bold">{data.diastolicBP} mmHg</span>
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {metricMode === 'hr_spo2' ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="heartRate"
                        name="Heart Rate"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#emeraldGradient)"
                        dot={{ r: 3, fill: '#10b981', strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="oxygenSaturation"
                        name="SpO2"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#cyanGradient)"
                        dot={{ r: 3, fill: '#06b6d4', strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                      />
                    </>
                  ) : (
                    <>
                      <Area
                        type="monotone"
                        dataKey="systolicBP"
                        name="Systolic BP"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#amberGradient)"
                        dot={{ r: 3, fill: '#f59e0b', strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="diastolicBP"
                        name="Diastolic BP"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#purpleGradient)"
                        dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
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
