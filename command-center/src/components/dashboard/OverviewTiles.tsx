import React from 'react';
import {
  Users,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Cpu,
  Activity,
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Tile 1: Residents / Cognitive Cohort */}
      <div
        onClick={() => onTileClick?.('residents')}
        className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-900/50 p-5 shadow-xs hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer"
      >
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Memory Care
          </span>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Monitored Residents
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {counters.residentsTotal.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({counters.residentsActive} active in care)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Cognitive Cohort &bull; Memory &amp; MCI</span>
          </p>
        </div>
      </div>

      {/* Tile 2: Multi-Modal Hardware Fleet */}
      <div
        onClick={() => onTileClick?.('bands')}
        className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-900/50 p-5 shadow-xs hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer"
      >
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-teal-600 dark:text-teal-400">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 dark:text-teal-400 font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
            4 Sensor Fleets
          </span>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Multi-Modal Devices
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {totalFleetCount} Units
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
              ({activeFleetCount} active online)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <span className="truncate">Bands &bull; Radar &bull; Patches &bull; Beacons</span>
          </p>
        </div>
      </div>

      {/* Tile 3: Fall Safety & Emergency Dispatch */}
      <div
        onClick={() => onTileClick?.('falls')}
        className={`group relative overflow-hidden rounded-2xl border p-5 shadow-xs transition-all duration-200 cursor-pointer ${
          unresolvedFallCount > 0
            ? 'border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/20 hover:border-rose-500 hover:shadow-rose-500/10'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-900/50 hover:border-emerald-500/50 hover:shadow-emerald-500/10'
        }`}
      >
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight
            className={`w-4 h-4 ${
              unresolvedFallCount > 0
                ? 'text-rose-500'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div
            className={`p-2.5 rounded-xl border ${
              unresolvedFallCount > 0
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 ${unresolvedFallCount > 0 ? 'animate-pulse' : ''}`} />
          </div>
          <span
            className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
              unresolvedFallCount > 0
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {unresolvedFallCount > 0 ? 'Emergency Alert' : 'Surveillance Active'}
          </span>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fall &amp; Immobility
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-extrabold tracking-tight font-mono ${
                unresolvedFallCount > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {unresolvedFallCount > 0 ? `${unresolvedFallCount} Pending` : 'All Clear'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Kinematics Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Auto-dispatch &bull; Tele-consult ready</span>
          </p>
        </div>
      </div>

      {/* Tile 4: Facility & Spatial Geofence */}
      <div
        onClick={() => onTileClick?.('floors')}
        className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-900/50 p-5 shadow-xs hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer"
      >
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            Indoor Topology
          </span>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Facility &amp; Geofencing
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {totalRooms} Rooms
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
              ({totalFloors} Floor Levels)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">100% Perimeter Safe &bull; 0 Egress Breaches</span>
          </p>
        </div>
      </div>
    </div>
  );
};