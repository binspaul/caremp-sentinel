import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Activity,
  Heart,
  Wind,
  Thermometer,
  AlertOctagon,
  CheckCircle2,
  Zap,
  RotateCcw,
  User,
  Radio,
  Cpu,
  Layers,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import commandCenterService from '../../services/commandCenterService';
import { Resident, Vital } from '../../types';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulated?: (vital: Vital) => void;
  residents?: Resident[];
}

interface ConditionOption {
  type: number;
  name: string;
  badge: string;
  badgeColor: string;
  severity: 'normal' | 'warning' | 'critical';
  description: string;
  metrics: {
    hr: string;
    hrv: string;
    bp: string;
    spo2: string;
    temp: string;
  };
}

const CONDITIONS: ConditionOption[] = [
  {
    type: 1,
    name: 'Normal / Restful Baseline',
    badge: 'Baseline Stable',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    severity: 'normal',
    description: 'Circadian dipping with restful parasympathetic tone and stable reference hemodynamics.',
    metrics: {
      hr: '65 - 75 bpm',
      hrv: '45 - 55 ms',
      bp: '118/78 mmHg',
      spo2: '98 - 99%',
      temp: '36.8°C',
    },
  },
  {
    type: 2,
    name: 'Cardiac Issue / Arrhythmia',
    badge: 'Acute Arrhythmia',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    severity: 'critical',
    description: 'Severe tachycardia with collapsed heart rate variability and marked hypertension.',
    metrics: {
      hr: '~155 bpm',
      hrv: '~10 ms',
      bp: '~182/110 mmHg',
      spo2: '~86%',
      temp: '37.0°C',
    },
  },
  {
    type: 3,
    name: 'Stroke Issue / Hypertensive Crisis',
    badge: 'Hypertensive Emergency',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    severity: 'critical',
    description: 'Critical cerebrovascular pressure spike exceeding auto-regulatory thresholds.',
    metrics: {
      hr: '~97 bpm',
      hrv: '~18 ms',
      bp: '~195/117 mmHg',
      spo2: '~92%',
      temp: '37.1°C',
    },
  },
  {
    type: 4,
    name: 'Hypoxia / Respiratory Distress',
    badge: 'Severe Hypoxia',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    severity: 'warning',
    description: 'Desaturation below critical safety cutoff with compensatory sinus tachycardia.',
    metrics: {
      hr: '~110 bpm',
      hrv: '~25 ms',
      bp: '~138/88 mmHg',
      spo2: '~83%',
      temp: '37.1°C',
    },
  },
  {
    type: 5,
    name: 'Fever / Systemic Infection',
    badge: 'Hyperthermia',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    severity: 'warning',
    description: 'Pyrogenic response indicating acute infectious inflammation and thermal stress.',
    metrics: {
      hr: '~105 bpm',
      hrv: '~22 ms',
      bp: '~126/82 mmHg',
      spo2: '~96%',
      temp: '~39.5°C',
    },
  },
  {
    type: 6,
    name: 'Sepsis Prodrome & Acute Deterioration',
    badge: 'NEWS2 Critical (Score: 12)',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    severity: 'critical',
    description: 'Early decompensation 6-12 hours before septic shock: tachypnea, severe tachycardia, hypoxemia, and vasodilation hypotension.',
    metrics: {
      hr: '~126 bpm',
      hrv: '~14 ms',
      bp: '~88/54 mmHg',
      spo2: '~89%',
      temp: '~39.3°C',
    },
  },
  {
    type: 7,
    name: 'Nocturnal Arrhythmia & Sleep Hypoxia',
    badge: 'Reverse Dipper & Apnea',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    severity: 'warning',
    description: 'Loss of healthy circadian dipping with nocturnal BP spike, sudden sleep tachycardia, and desaturation drops.',
    metrics: {
      hr: '~128 bpm',
      hrv: '~12 ms',
      bp: '~148/92 mmHg',
      spo2: '~85%',
      temp: '36.8°C',
    },
  },
  {
    type: 8,
    name: 'Pharmacogenomics (PGx) Adverse Interaction',
    badge: 'CPIC High Risk Conflict',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    severity: 'warning',
    description: 'Physiological distress triggered by active medication conflicting with patient CYP450/SLCO1B1 metabolizer genotype.',
    metrics: {
      hr: '~104 bpm',
      hrv: '~18 ms',
      bp: '~152/94 mmHg',
      spo2: '~95%',
      temp: '37.4°C',
    },
  },
];

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onSimulated,
  residents: initialResidents,
}) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'hardware'>('scenarios');
  const [residents, setResidents] = useState<Resident[]>(initialResidents || []);
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(null);
  const [selectedConditionType, setSelectedConditionType] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatedResult, setSimulatedResult] = useState<Vital | null>(null);

  // Sync initial residents when prop updates
  useEffect(() => {
    if (initialResidents && initialResidents.length > 0) {
      setResidents(initialResidents);
      setSelectedResidentId((prev) =>
        prev && initialResidents.some((r) => r.id === prev) ? prev : initialResidents[0].id,
      );
    }
  }, [initialResidents]);

  // Load / refresh residents when modal opens
  const fetchResidents = useCallback(async () => {
    setIsLoadingResidents(true);
    try {
      const res = await commandCenterService.getResidents({ skip: 0, limit: 100 });
      if (res.data && res.data.length > 0) {
        setResidents(res.data);
        setSelectedResidentId((prev) =>
          prev && res.data.some((r) => r.id === prev) ? prev : res.data[0].id,
        );
      }
    } catch (err) {
      console.error('Failed to load residents for simulation modal:', err);
    } finally {
      setIsLoadingResidents(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSimulatedResult(null);

      if (initialResidents && initialResidents.length > 0) {
        setResidents(initialResidents);
        setSelectedResidentId((prev) =>
          prev && initialResidents.some((r) => r.id === prev) ? prev : initialResidents[0].id,
        );
      }

      fetchResidents();
    }
  }, [isOpen, initialResidents, fetchResidents]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeCondition = CONDITIONS.find((c) => c.type === selectedConditionType) || CONDITIONS[0];
  const selectedResident = residents.find((r) => r.id === selectedResidentId);

  const handleRunSimulation = async () => {
    if (!selectedResidentId) {
      setError('Please select a resident to simulate telemetry for.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await commandCenterService.simulateVitals(
        selectedResidentId,
        selectedConditionType,
      );
      setSimulatedResult(result);
      if (onSimulated) {
        onSimulated(result);
      }
    } catch (err: any) {
      console.error('Simulation error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to trigger telemetry simulation. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResidentDisplayName = (r: Resident) => {
    const name = `${r.firstName || ''} ${r.middleName ? `${r.middleName} ` : ''}${r.lastName || ''}`.trim();
    return name || `Resident #${r.id}`;
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 transition-all my-8">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 shrink-0">
              {activeTab === 'scenarios' ? <Zap className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {activeTab === 'scenarios' ? 'Simulate Vital Conditions' : 'Affordable Hardware Emulation HUD'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === 'scenarios'
                  ? 'Inject synthetic physiological signals into the digital twin telemetry stream'
                  : 'Contact-free & low-cost multi-modal sensing cluster ($45 BOM vs $15k ICU cart)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60 px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('scenarios')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition cursor-pointer ${
              activeTab === 'scenarios'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Clinical Scenarios (1–8)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition cursor-pointer ${
              activeTab === 'hardware'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Affordable Sensor Cluster ($45 BOM)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
              Pillar 3
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Success Banner */}
          {simulatedResult && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                  Telemetry Successfully Dispatched!
                </p>
                <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Log #{simulatedResult.id} recorded for{' '}
                  <span className="font-semibold">
                    {selectedResident ? getResidentDisplayName(selectedResident) : `Resident #${selectedResidentId}`}
                  </span>{' '}
                  ({activeTab === 'hardware' ? 'Low-Cost Hardware Pod Telemetry' : activeCondition.name}). HR:{' '}
                  {Math.round(simulatedResult.heartRate)} bpm, BP:{' '}
                  {Math.round(simulatedResult.systolicBP)}/{Math.round(simulatedResult.diastolicBP)} mmHg, SpO2:{' '}
                  {simulatedResult.oxygenSaturation}%.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold">Simulation Dispatch Failed</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Target Resident Selector (Shared across both tabs) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                Target Care Recipient
              </label>
              {isLoadingResidents && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  <RotateCcw className="w-2.5 h-2.5 animate-spin" />
                  Loading...
                </span>
              )}
            </div>

            <select
              value={selectedResidentId ?? ''}
              onChange={(e) => setSelectedResidentId(e.target.value ? Number(e.target.value) : null)}
              disabled={isLoadingResidents && residents.length === 0}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-emerald-500 transition cursor-pointer disabled:opacity-50"
            >
              {residents.length === 0 ? (
                <option value="" disabled>
                  {isLoadingResidents ? 'Loading care recipients...' : 'No residents enrolled'}
                </option>
              ) : (
                residents.map((r) => {
                  const fullName = getResidentDisplayName(r);
                  return (
                    <option key={r.id} value={r.id}>
                      {fullName} &bull; UHID: {r.uhid || `ID: ${r.id}`}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* TAB 1: Clinical Scenarios View */}
          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              {/* Condition Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  Condition Pattern
                </label>

                <select
                  value={selectedConditionType}
                  onChange={(e) => setSelectedConditionType(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond.type} value={cond.type}>
                      {cond.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition Context & Description Badge */}
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-600 dark:text-slate-400 line-clamp-1">
                  {activeCondition.description}
                </span>
                <span
                  className={`shrink-0 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${activeCondition.badgeColor}`}
                >
                  {activeCondition.badge}
                </span>
              </div>

              {/* Simulated Hemodynamic Projection Tiles */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold">
                    Simulated Hemodynamic Projections
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    Pattern #{activeCondition.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Heart className="w-3.5 h-3.5 text-rose-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Heart Rate</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {activeCondition.metrics.hr}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Activity className="w-3.5 h-3.5 text-purple-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">HRV (ms)</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {activeCondition.metrics.hrv}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Activity className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Blood Pressure</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {activeCondition.metrics.bp}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Wind className="w-3.5 h-3.5 text-cyan-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Oxygen (SpO2)</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {activeCondition.metrics.spo2}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                    <Thermometer className="w-3.5 h-3.5 text-orange-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Body Temp</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {activeCondition.metrics.temp}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Affordable Hardware Sensor Cluster ($45 BOM) View */}
          {activeTab === 'hardware' && (
            <div className="space-y-4">
              {/* Cost & Healthspan Comparison Callout */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-950/20 border border-emerald-500/30 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    Hardware Democratization (Pillar 3)
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/40">
                    &gt;99.7% Cost Reduction
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-medium">Traditional ICU Cart</div>
                    <div className="text-base font-bold text-rose-500 font-mono mt-0.5">$15,000 / bed</div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                      Heavy 45kg cart, 8 skin electrode leads, $450/mo disposable patches. Restricts mobility.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40">
                    <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                      careMP Sentinel Sensor Pod
                    </div>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      $45.00 BOM
                    </div>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1 leading-tight">
                      Solid-state 120g pod. Contact-free mmWave radar + low-profile optical PPG & IR thermopile.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3-Sensor Cluster Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                  Sensor Cluster Architecture ($45 Total BOM)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Sensor 1 */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        <Radio className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">$25 BOM</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">60-GHz mmWave Radar</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                      Contact-free ballistocardiography (BCG). Respiration (12-24 rpm) & HR through clothes/blankets (&plusmn;0.45mm resolution).
                    </p>
                    <div className="pt-1 text-[9px] font-mono text-indigo-600 dark:text-indigo-400">
                      &bull; 50 Hz FMCW Chirps
                    </div>
                  </div>

                  {/* Sensor 2 */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400">$15 BOM</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Dual-λ Epicutaneous PPG</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                      660nm Red / 940nm IR photoplethysmography. Continuous SpO2 & PTT-derived cuffless blood pressure.
                    </p>
                    <div className="pt-1 text-[9px] font-mono text-cyan-600 dark:text-cyan-400">
                      &bull; 100 Hz Photodiode MAC
                    </div>
                  </div>

                  {/* Sensor 3 */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        <Thermometer className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400">$5 BOM</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">IR Medical Thermopile</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                      Non-contact core-equivalent temperature (36.0&ndash;40.5&deg;C) with auto-ambient gradient correction (&plusmn;0.1&deg;C accuracy).
                    </p>
                    <div className="pt-1 text-[9px] font-mono text-orange-600 dark:text-orange-400">
                      &bull; 1 Hz I2C Bus Telemetry
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Sensor Telemetry Frame Feed (Emulation Stream) */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold border-b border-slate-800/80 pb-1 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE SENSOR BUS STREAM · BLE 5.3 / 802.11ax
                  </span>
                  <span>SQI: 98.4%</span>
                </div>
                <div className="text-slate-400">
                  <span className="text-indigo-400">[RADAR_FMCW]</span> f0=60.5GHz | Δφ=0.31rad | chest_disp=1.8mm &rarr; RR: 16 rpm, HR: 72 bpm
                </div>
                <div className="text-slate-400">
                  <span className="text-cyan-400">[PPG_OPTICAL]</span> λ1=660nm, λ2=940nm | R_ratio=0.62 | PTT=184ms &rarr; SpO2: 98.4%, BP: 118/76
                </div>
                <div className="text-slate-400">
                  <span className="text-orange-400">[IR_THERMAL]</span> v_sense=1.38mV | t_ambient=22.4&deg;C &rarr; Core Temp: 36.7&deg;C
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/70 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={isSubmitting || !selectedResidentId || residents.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : activeTab === 'hardware' ? (
              <>
                <Radio className="w-3.5 h-3.5" />
                <span>Transmit Sensor Frame ($45 BOM)</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Trigger Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
