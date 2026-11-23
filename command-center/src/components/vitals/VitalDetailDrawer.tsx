import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Vital, Resident, SleepStatus } from '../../types';
import { Badge, getVitalStatus } from '../common/Badge';
import {
  X,
  Heart,
  Activity,
  Wind,
  Thermometer,
  Moon,
  Battery,
  Clock,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Copy,
  Check,
  User,
  Radio,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface VitalDetailDrawerProps {
  vital: Vital | null;
  resident?: Resident | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenResidentProfile?: (resident: Resident) => void;
}

export const VitalDetailDrawer: React.FC<VitalDetailDrawerProps> = ({
  vital,
  resident,
  isOpen,
  onClose,
  onOpenResidentProfile,
}) => {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !vital) return null;

  const status = getVitalStatus(vital);
  const residentName = resident
    ? `${resident.firstName} ${resident.lastName}`
    : vital.resident
    ? `${vital.resident.firstName} ${vital.resident.lastName}`
    : `Resident #${vital.residentId}`;

  const uhid = resident?.uhid || vital.resident?.uhid || `ID: ${vital.residentId}`;

  // Calculate Mean Arterial Pressure (MAP): (2*Diastolic + Systolic) / 3
  const mapValue =
    vital.systolicBP && vital.diastolicBP
      ? Math.round((2 * vital.diastolicBP + vital.systolicBP) / 3)
      : null;

  const formatFullTimestamp = (isoString?: string) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleString([], {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatMinutes = (mins?: number) => {
    if (!mins && mins !== 0) return '--';
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours === 0) return `${m}m`;
    return `${hours}h ${m}m`;
  };

  const getSleepLabel = (sleepStatus?: SleepStatus) => {
    switch (sleepStatus) {
      case SleepStatus.AWAKE:
        return 'Awake';
      case SleepStatus.LIGHT_SLEEP:
        return 'Light Sleep';
      case SleepStatus.DEEP_SLEEP:
        return 'Deep Sleep';
      default:
        return 'Awake / Active';
    }
  };

  const handleCopyPayload = () => {
    const jsonStr = JSON.stringify(vital.payload || vital, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-auto">
        {/* Slide-over panel */}
        <div className="w-screen max-w-md sm:max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold shadow-xs">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Vital Telemetry Log #{vital.id}
                  </h2>
                  <Badge variant={status.variant} size="sm" pulse={status.variant !== 'normal'}>
                    {status.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {residentName}
                  </span>
                  <span>&bull;</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400">UHID: {uhid}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Vital Detail Drawer"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Timestamp Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Captured Timestamp</span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatFullTimestamp(vital.generatedAt || vital.createdAt)}
              </span>
            </div>

            {/* 1. Cardiovascular Hemodynamics */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                Cardiovascular Hemodynamics
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Heart Rate */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Heart Rate</span>
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                      {vital.heartRate ? Math.round(vital.heartRate) : '--'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">bpm</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    {vital.heartRate > 100
                      ? 'Tachycardia alert'
                      : vital.heartRate < 60
                      ? 'Bradycardia alert'
                      : 'Normocardic'}
                  </span>
                </div>

                {/* HRV */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">HR Variability</span>
                    <Activity className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                      {vital.hrv ? Math.round(vital.hrv) : '--'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ms</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    Autonomic tone stability
                  </span>
                </div>

                {/* Blood Pressure */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Blood Pressure</span>
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                      {vital.systolicBP && vital.diastolicBP
                        ? `${Math.round(vital.systolicBP)}/${Math.round(vital.diastolicBP)}`
                        : '--'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">mmHg</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    Sys: {Math.round(vital.systolicBP || 0)} / Dia: {Math.round(vital.diastolicBP || 0)}
                  </span>
                </div>

                {/* MAP (Mean Arterial Pressure) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Mean Arterial (MAP)</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                      {mapValue !== null ? mapValue : '--'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">mmHg</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    Perfusion pressure (norm: 70-100)
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Respiratory & Thermal Status */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-cyan-500" />
                Oxygenation & Thermal Equilibrium
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* SpO2 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Oxygen Saturation</span>
                    <Wind className="w-3.5 h-3.5 text-cyan-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-bold font-mono ${
                        vital.oxygenSaturation && vital.oxygenSaturation < 95
                          ? 'text-amber-500 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : '--'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    {vital.oxygenSaturation < 90
                      ? 'Severe Hypoxia Warning'
                      : vital.oxygenSaturation < 95
                      ? 'Mild Desaturation'
                      : 'Adequate Oxygenation'}
                  </span>
                </div>

                {/* Body Temperature */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Body Temp</span>
                    <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                      {vital.bodyTemperature ? `${Number(vital.bodyTemperature).toFixed(1)}°C` : '--'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    {vital.skinTemperature
                      ? `Skin: ${Number(vital.skinTemperature).toFixed(1)}°C`
                      : 'Normothermic status'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Sleep & Circadian Architecture */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-500" />
                Sleep & Rest Architecture
              </h3>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Current Circadian State</span>
                  <span className="font-semibold text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {getSleepLabel(vital.sleepStatus)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-200 dark:border-slate-800/80 font-mono">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Deep</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatMinutes(vital.deepSleepTime)}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Light</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatMinutes(vital.lightSleepTime)}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">REM</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatMinutes(vital.remSleepTime)}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Awake</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatMinutes(vital.awakeSleepTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Sensor Telemetry & Device Health */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-500" />
                Sensor Telemetry & Ingestion Metadata
              </h3>

              <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <Battery className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-400">Sensor Battery</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {vital.batteryLevel !== undefined ? `${vital.batteryLevel}%` : '100%'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-400">Sensor Contact</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {vital.wearingIndicator ? 'Attached' : 'Detached'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <Activity className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-400">Kinetic Motion</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {vital.movementDetected ? 'Detected' : 'Resting'}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Raw Telemetry Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPayload(!showPayload)}
                  className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  {showPayload ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>{showPayload ? 'Hide' : 'View'} Raw Telemetry Payload (JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-mono cursor-pointer transition"
                  title="Copy JSON Payload"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              {showPayload && (
                <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-64 border border-slate-800">
                  {JSON.stringify(vital.payload || vital, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>

            {resident && onOpenResidentProfile && (
              <button
                onClick={() => {
                  onClose();
                  onOpenResidentProfile(resident);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>View Resident Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
