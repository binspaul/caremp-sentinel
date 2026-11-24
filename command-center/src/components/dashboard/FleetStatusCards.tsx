import React from 'react';
import {
  Radio,
  Scan,
  ShieldCheck,
  Signal,
  ArrowRight,
  Battery,
  Activity,
  HeartPulse,
  Compass,
} from 'lucide-react';
import {
  BandCounters,
  RadarPodCounters,
  ChestPatchCounters,
  BeaconCounters,
} from '../../types';
import { NavTab } from '../common/Sidebar';

interface FleetStatusCardsProps {
  bandCounters?: BandCounters | null;
  radarCounters?: RadarPodCounters | null;
  patchCounters?: ChestPatchCounters | null;
  beaconCounters?: BeaconCounters | null;
  onNavigate: (tab: NavTab) => void;
}

export const FleetStatusCards: React.FC<FleetStatusCardsProps> = ({
  bandCounters,
  radarCounters,
  patchCounters,
  beaconCounters,
  onNavigate,
}) => {
  // Bands Metrics
  const bandsTotal = bandCounters?.total ?? 6;
  const bandsActive = bandCounters?.active ?? 4;
  const bandsAvailable = bandCounters?.available ?? 1;
  const bandsCharging = bandCounters?.charging ?? 1;

  // Radar Pods Metrics
  const radarTotal = radarCounters?.total ?? 6;
  const radarActive = radarCounters?.active ?? 5;
  const radarOccupied = radarCounters?.bedOccupied ?? 4;

  // Chest Patches Metrics
  const patchesTotal = patchCounters?.total ?? 6;
  const patchesActive = patchCounters?.active ?? 4;
  const patchesAvailable = patchCounters?.available ?? 2;

  // Beacons Metrics
  const beaconsTotal = beaconCounters?.total ?? 6;
  const beaconsActive = beaconCounters?.active ?? 5;
  const beaconsUnassigned = beaconCounters?.unassigned ?? 1;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Multi-Modal Device Fleets</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Active Telemetry
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time operational status across wearable bio-bands, contact-free mmWave radar, ECG patches, and BLE positioning anchors
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fleet Card 1: Bands */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4.5 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Wearable Bio-Bands</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Continuous Wrist Sensor</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {bandsActive}/{bandsTotal} Active
              </span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <HeartPulse className="w-3 h-3 text-emerald-500" />
                  Sensors:
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-200">PPG Pulse &bull; SpO2 &bull; Accel</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Battery className="w-3 h-3 text-emerald-500" />
                  Dock Station:
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  {bandsCharging} Charging &bull; {bandsAvailable} Ready
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  Fall Triggers:
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  3-Axis Kinematics Live
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('bands')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center justify-between cursor-pointer group"
          >
            <span>Manage Bands Fleet</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Fleet Card 2: Radar Pods */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4.5 shadow-xs flex flex-col justify-between hover:border-indigo-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Radar Pods</h4>
                  <p className="text-[10px] text-slate-400 font-mono">60GHz FMCW mmWave</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {radarActive}/{radarTotal} Online
              </span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-indigo-500" />
                  Bedhead Occupancy:
                </span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                  {radarOccupied} Occupied
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <HeartPulse className="w-3 h-3 text-indigo-500" />
                  Micro-Motion:
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-200">Ballistocardiography</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-indigo-500" />
                  Nocturnal Apnea:
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Continuous Respiration
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('radar-pods')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center justify-between cursor-pointer group"
          >
            <span>Manage Radar Pods</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Fleet Card 3: Chest Patches */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4.5 shadow-xs flex flex-col justify-between hover:border-rose-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Chest Patches</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Hydrogel Bio-Patch</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                {patchesActive}/{patchesTotal} Active
              </span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <HeartPulse className="w-3 h-3 text-rose-500" />
                  Cardiac Telemetry:
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-200">Single-Lead ECG Live</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-rose-500" />
                  Wear Adhesion:
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  {patchesActive} Secure &bull; {patchesAvailable} Stock
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-rose-500" />
                  Arrhythmia:
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Sinus Rhythm 100%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('chest-patches')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-500 flex items-center justify-between cursor-pointer group"
          >
            <span>Manage Chest Patches</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Fleet Card 4: Indoor Beacons */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4.5 shadow-xs flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Signal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Indoor Beacons</h4>
                  <p className="text-[10px] text-slate-400 font-mono">BLE Location Anchors</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {beaconsActive}/{beaconsTotal} Calibrated
              </span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-amber-500" />
                  RF Spatial Anchors:
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-200">Room Triangulation</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Battery className="w-3 h-3 text-amber-500" />
                  Battery Status:
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  92% Avg &bull; 0 Low Battery
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Signal className="w-3 h-3 text-amber-500" />
                  Pairings:
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {beaconsActive} Paired &bull; {beaconsUnassigned} Spares
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('beacons')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center justify-between cursor-pointer group"
          >
            <span>Manage Beacons</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};