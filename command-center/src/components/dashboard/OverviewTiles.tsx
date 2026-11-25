import React from 'react';
import {
  Users,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import {
  DashboardCounters,
  BandCounters,
  RadarPodCounters,
  ChestPatchCounters,
  BeaconCounters,
} from '../../types';
import { NavTab } from '../common/Sidebar';

interface OverviewTilesProps {
  counters: DashboardCounters;
  bandCounters?: BandCounters | null;
  radarCounters?: RadarPodCounters | null;
  patchCounters?: ChestPatchCounters | null;
  beaconCounters?: BeaconCounters | null;
  unresolvedFallCount?: number;
  totalFloors?: number;
  totalRooms?: number;
  onTileClick?: (tab: NavTab) => void;
}

export const OverviewTiles: React.FC<OverviewTilesProps> = ({
  counters,
  bandCounters,
  radarCounters,
  patchCounters,
  beaconCounters,
  unresolvedFallCount = 0,
  totalFloors = 3,
  totalRooms = 18,
  onTileClick,
}) => {
  // Aggregate total active devices across all 4 hardware fleets
  const totalFleetCount =
    (bandCounters?.total ?? 6) +
    (radarCounters?.total ?? 6) +
    (patchCounters?.total ?? 6) +
    (beaconCounters?.total ?? 6);

  const activeFleetCount =
    (bandCounters?.active ?? 4) +
    (radarCounters?.active ?? 5) +
    (patchCounters?.active ?? 4) +
    (beaconCounters?.active ?? 5);

  const fleetOnlinePct = Math.round((activeFleetCount / Math.max(1, totalFleetCount)) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Tile 1: Residents */}
      <div
        onClick={() => onTileClick?.('residents')}
        className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-emerald-500/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">View</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Monitored Residents
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {counters.residentsTotal.toLocaleString()}
            </span>

            {/* Mini SVG Sparkline */}
            <svg className="w-16 h-7 text-emerald-500" viewBox="0 0 64 24" fill="none">
              <path
                d="M 2 20 Q 16 18, 24 14 T 44 8 T 62 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 2 20 Q 16 18, 24 14 T 44 8 T 62 4 L 62 24 L 2 24 Z"
                fill="currentColor"
                opacity="0.1"
              />
            </svg>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{counters.residentsActive} Active in Care</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              100% Monitored
            </span>
          </div>
        </div>
      </div>

      {/* Tile 2: Multi-Modal Hardware Fleet */}
      <div
        onClick={() => onTileClick?.('bands')}
        className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-cyan-500/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400">View</span>
            <ArrowUpRight className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Sensor Fleet
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {activeFleetCount}
              <span className="text-base text-slate-400 font-normal ml-1">/ {totalFleetCount}</span>
            </span>

            {/* Mini SVG Sparkline */}
            <svg className="w-16 h-7 text-cyan-500" viewBox="0 0 64 24" fill="none">
              <path
                d="M 2 16 Q 18 10, 32 12 T 62 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 2 16 Q 18 10, 32 12 T 62 6 L 62 24 L 2 24 Z"
                fill="currentColor"
                opacity="0.1"
              />
            </svg>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span>4 Hardware Fleets</span>
            </span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {fleetOnlinePct}% Online
            </span>
          </div>
        </div>
      </div>

      {/* Tile 3: Fall Safety & Emergency Dispatch */}
      <div
        onClick={() => onTileClick?.('falls')}
        className={`group relative overflow-hidden rounded-2xl border p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
          unresolvedFallCount > 0
            ? 'border-rose-500/40 bg-rose-50/10 dark:bg-rose-950/20 hover:border-rose-500'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              unresolvedFallCount > 0
                ? 'bg-rose-500/15 text-rose-500'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {unresolvedFallCount > 0 ? (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <div className="flex items-center gap-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <span
              className={`text-[11px] font-medium ${
                unresolvedFallCount > 0
                  ? 'text-rose-500'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              View
            </span>
            <ArrowUpRight
              className={`w-4 h-4 ${
                unresolvedFallCount > 0
                  ? 'text-rose-500'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Fall &amp; Safety Alerts
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className={`text-3xl font-extrabold tracking-tight font-mono ${
                unresolvedFallCount > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {unresolvedFallCount > 0 ? `${unresolvedFallCount} Pending` : '0 Active'}
            </span>

            {/* Mini SVG Sparkline */}
            <svg
              className={`w-16 h-7 ${
                unresolvedFallCount > 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}
              viewBox="0 0 64 24"
              fill="none"
            >
              {unresolvedFallCount > 0 ? (
                <path
                  d="M 2 20 L 24 20 L 32 4 L 40 20 L 62 20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M 2 12 Q 32 10, 62 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span
              className={`inline-flex items-center gap-1.5 font-medium ${
                unresolvedFallCount > 0
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  unresolvedFallCount > 0
                    ? 'bg-rose-500 animate-ping'
                    : 'bg-emerald-500'
                }`}
              />
              <span>{unresolvedFallCount > 0 ? 'Action Required' : 'All Clear'}</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Live Radar &amp; Accelerometer
            </span>
          </div>
        </div>
      </div>

      {/* Tile 4: Facility & Spatial Geofence */}
      <div
        onClick={() => onTileClick?.('floors')}
        className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-indigo-500/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">View</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Facility Infrastructure
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {totalRooms}
              <span className="text-base text-slate-400 font-normal ml-1">Suites</span>
            </span>

            {/* Mini SVG Sparkline */}
            <svg className="w-16 h-7 text-indigo-500" viewBox="0 0 64 24" fill="none">
              <path
                d="M 2 18 Q 24 16, 40 10 T 62 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 2 18 Q 24 16, 40 10 T 62 6 L 62 24 L 2 24 Z"
                fill="currentColor"
                opacity="0.1"
              />
            </svg>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>{totalFloors} Building Levels</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              BLE Geofenced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
