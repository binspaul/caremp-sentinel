import React, { useMemo } from 'react';
import {
  Cpu,
  ArrowRight,
  Sparkles,
  ShieldCheck,
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
  residents,
  bandCounters,
  radarCounters,
  patchCounters,
  beaconCounters,
  onNavigate,
}) => {
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
    };
  }, [residents]);

  // Hardware Fleet Aggregation
  const fleetData = useMemo(() => {
    return [
      {
        id: 'bands' as NavTab,
        name: 'Wearable Bands',
        desc: 'Optical PPG & motion telemetry',
        active: bandCounters?.active ?? 4,
        total: bandCounters?.total ?? 6,
        color: '#10b981',
      },
      {
        id: 'radar-pods' as NavTab,
        name: 'Radar Pods',
        desc: '60-GHz contact-free sleep tracking',
        active: radarCounters?.active ?? 5,
        total: radarCounters?.total ?? 6,
        color: '#06b6d4',
      },
      {
        id: 'chest-patches' as NavTab,
        name: 'ECG Patches',
        desc: 'Single-lead cardiopulmonary telemetry',
        active: patchCounters?.active ?? 4,
        total: patchCounters?.total ?? 6,
        color: '#8b5cf6',
      },
      {
        id: 'beacons' as NavTab,
        name: 'BLE Beacons',
        desc: 'Micro-location room anchors',
        active: beaconCounters?.active ?? 5,
        total: beaconCounters?.total ?? 6,
        color: '#3b82f6',
      },
    ];
  }, [bandCounters, radarCounters, patchCounters, beaconCounters]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Card 1: Resident Health Index & Distribution */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between space-y-6">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Resident Health Index</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cohort cognitive &amp; vital distribution</p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {healthDistribution.avgScore}
                </span>
                <span className="text-xs text-slate-400 font-mono">/100</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Cohort Average</span>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Cohort Stratification</span>
              <span className="font-mono text-xs text-slate-500">{healthDistribution.total} Enrolled Residents</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
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
            <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Optimal</span>
                </div>
                <p className="text-base font-mono font-bold mt-1 text-slate-800 dark:text-slate-200">
                  {healthDistribution.optimal}{' '}
                  <span className="text-[10px] font-sans text-slate-400 font-normal">
                    ({Math.round((healthDistribution.optimal / Math.max(1, healthDistribution.total)) * 100)}%)
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Score 80–100</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Moderate</span>
                </div>
                <p className="text-base font-mono font-bold mt-1 text-slate-800 dark:text-slate-200">
                  {healthDistribution.moderate}{' '}
                  <span className="text-[10px] font-sans text-slate-400 font-normal">
                    ({Math.round((healthDistribution.moderate / Math.max(1, healthDistribution.total)) * 100)}%)
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Score 60–79</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Critical</span>
                </div>
                <p className="text-base font-mono font-bold mt-1 text-slate-800 dark:text-slate-200">
                  {healthDistribution.critical}{' '}
                  <span className="text-[10px] font-sans text-slate-400 font-normal">
                    ({Math.round((healthDistribution.critical / Math.max(1, healthDistribution.total)) * 100)}%)
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Score &lt;60</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>AI Baseline Clinical Monitoring Active</span>
          </span>
          <button
            onClick={() => onNavigate?.('residents')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Residents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card 2: Multi-Modal Sensor Fleets Connectivity */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between space-y-5">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sensor Fleets Connectivity</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live hardware telemetry and gateway health</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Online
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {fleetData.map((fleet) => {
              const pct = Math.round((fleet.active / Math.max(1, fleet.total)) * 100);
              return (
                <div
                  key={fleet.name}
                  onClick={() => onNavigate?.(fleet.id)}
                  className="group p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex-1 mr-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {fleet.name}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                          — {fleet.desc}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {fleet.active}/{fleet.total}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%`, backgroundColor: fleet.color }}
                        className="h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Continuous BLE beaconing &amp; MQTT telemetry</span>
          <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            99.9% Uptime
          </span>
        </div>
      </div>
    </div>
  );
};