import React from 'react';
import {
  Users,
  HeartPulse,
  Radio,
  ShieldAlert,
  TrendingUp,
  Activity,
  ArrowUpRight,
  AlertOctagon,
} from 'lucide-react';
import { DashboardCounters } from '../../types';

interface OverviewTilesProps {
  counters: DashboardCounters;
  onTileClick?: (tab: 'residents' | 'vitals' | 'falls' | 'bands' | 'users') => void;
}

export const OverviewTiles: React.FC<OverviewTilesProps> = ({ counters, onTileClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Tile 1: Residents */}
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
            Cohort
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
              ({counters.residentsActive} active)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Digital twins synchronized</span>
          </p>
        </div>
      </div>

      {/* Tile 2: AI Deterioration & Sepsis Triage */}
      <div
        onClick={() => onTileClick?.('vitals')}
        className="group relative overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20 p-5 shadow-xs hover:border-rose-500 hover:shadow-rose-500/10 transition-all duration-200 cursor-pointer"
      >
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-rose-500" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30">
            NEWS2 Alert
          </span>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Critical Acuity / Sepsis
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tracking-tight text-rose-500 font-mono">
              1 Active
            </span>
            <span className="text-xs text-rose-400 font-mono">
              Score: 12
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-rose-500" />
            <span>Tachycardia + SpO2 desaturation</span>
          </p>
        </div>
      </div>

      {/* Tile 3: Hardware Sensor Bands & Pod Fleet */}
      <div
        onClick={() => onTileClick?.('bands')}
        className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-900/50 p-5 shadow-xs hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer"
      >
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Hardware Fleet
          </span>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sensor Pods &amp; Bands
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              6 Units
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
              4 Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Radar &bull; PPG &bull; Thermopile</span>
          </p>
        </div>
      </div>

      {/* Tile 4: Continuous Telemetry Streams */}
      <div
        onClick={() => onTileClick?.('vitals')}
        className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-900/50 p-5 shadow-xs hover:border-cyan-500/50 hover:shadow-cyan-500/10 transition-all duration-200 cursor-pointer"
      >
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            Streams
          </span>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Telemetry Readings
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {counters.vitalsTotal.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              logged
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
            <span>PPG, BP, SpO2, Temp, Sleep</span>
          </p>
        </div>
      </div>
    </div>
  );
};
