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
  Compass,
  Footprints,
  AlertTriangle,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Flame,
  Radio,
  MapPin,
  Clock,
} from 'lucide-react';
import commandCenterService from '../../services/commandCenterService';
import { Resident, Vital, Floor, RoomZone, FallSeverity } from '../../types';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulated?: (vital: Vital) => void;
  onMovementSimulated?: () => void;
  onFallSimulated?: () => void;
  residents?: Resident[];
  floors?: Floor[];
  initialTab?: SimulationTab;
  lockedTab?: SimulationTab;
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
    name: 'Sundowning Agitation Surge & Pre-Delirium',
    badge: 'Sundowning High Risk',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    severity: 'critical',
    description: 'Late-afternoon circadian autonomic surge: marked sympathetic tachycardia, collapsed HRV, and motor micro-hyperactivity preceding overt combative agitation.',
    metrics: {
      hr: '~122 bpm',
      hrv: '~11 ms',
      bp: '~146/92 mmHg',
      spo2: '~97%',
      temp: '37.1°C',
    },
  },
  {
    type: 7,
    name: 'Nocturnal Sleep Restlessness & Wandering Egress',
    badge: 'Safe-Zone Breach',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    severity: 'warning',
    description: '60-GHz contact-free radar detects continuous sleep fragmentation, unassisted bed-exit, and doorway BLE safe-perimeter breach.',
    metrics: {
      hr: '~94 bpm',
      hrv: '~22 ms',
      bp: '~136/86 mmHg',
      spo2: '~96%',
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
  {
    type: 9,
    name: 'Freeze-of-Gait Fall & Post-Impact Immobility',
    badge: '🚨 Cognitive Fall Detected',
    badgeColor: 'bg-red-600/10 text-red-600 dark:text-red-400 border-red-600/30',
    severity: 'critical',
    description: 'High-g impact deceleration (>3.4g) with >80° orientation drop following motor freezing in advanced dementia. 45s immobility triggers immediate emergency dispatch.',
    metrics: {
      hr: '~118 bpm',
      hrv: '~15 ms',
      bp: '~92/58 mmHg',
      spo2: '~96%',
      temp: '36.8°C',
    },
  },
];

interface MovementScenarioOption {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  targetZoneKeyword: string;
  fallbackZoneId: number;
  fallbackZoneName: string;
  isBreach: boolean;
  rssiEstimate: string;
  perimeterType: string;
  anchorType: string;
  description: string;
}

const MOVEMENT_SCENARIOS: MovementScenarioOption[] = [
  {
    id: 'egress-stairwell-breach',
    name: 'Restricted Egress Stairwell Breach',
    badge: '🚨 Perimeter Breach Alert',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    targetZoneKeyword: 'stairwell',
    fallbackZoneId: 214,
    fallbackZoneName: 'Fire Stairwell B (Restricted)',
    isBreach: true,
    rssiEstimate: '-84 dBm (Threshold Exceeded)',
    perimeterType: 'Restricted Perimeter',
    anchorType: 'Stairwell BLE Gateway B',
    description: 'Rapid movement toward perimeter exit stairwell with sustained RSSI breach, triggering immediate wandering security lockdown.',
  },
  {
    id: 'safe-suite-return',
    name: 'Designated Memory Suite Return',
    badge: '✓ Safe Interior Zone',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    targetZoneKeyword: 'suite',
    fallbackZoneId: 204,
    fallbackZoneName: 'Suite 204 (Private Memory Suite)',
    isBreach: false,
    rssiEstimate: '-54 dBm (Stable Optimal)',
    perimeterType: 'Protected Suite',
    anchorType: 'In-Room Ceiling Pod Anchor',
    description: 'Care recipient safely returned to their primary assigned living suite. Normal baseline telemetry and safe perimeter restored.',
  },
  {
    id: 'outdoor-sensory-garden',
    name: 'Supervised Sensory Garden Walk',
    badge: '🌿 Monitored Perimeter',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
    targetZoneKeyword: 'garden',
    fallbackZoneId: 106,
    fallbackZoneName: 'Sensory Garden (Ground Floor)',
    isBreach: false,
    rssiEstimate: '-70 dBm (Monitored Outdoor)',
    perimeterType: 'Monitored Outdoor Zone',
    anchorType: 'Garden Mesh Beacon Array',
    description: 'Outdoor courtyard ambulation within geofenced green space perimeter. Continuous multi-point beacon tracking active.',
  },
  {
    id: 'calming-lounge-session',
    name: 'Snoezelen Calming Lounge Transition',
    badge: '🛋️ Safe Common Area',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    targetZoneKeyword: 'lounge',
    fallbackZoneId: 206,
    fallbackZoneName: 'Snoezelen Calming Lounge',
    isBreach: false,
    rssiEstimate: '-58 dBm (Strong Line of Sight)',
    perimeterType: 'Safe Common Area',
    anchorType: 'Central Hub Anchor #4',
    description: 'Movement to sensory therapeutic relaxation lounge. BLE anchor network verifies low agitation dwell time and safe occupancy.',
  },
];

interface FallScenarioOption {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  severity: FallSeverity;
  location: string;
  impactForceG: number;
  orientationChangeDeg: number;
  motionlessDurationSeconds: number;
  description: string;
}

const FALL_SCENARIOS: FallScenarioOption[] = [
  {
    id: 'fall-critical-bathroom',
    name: 'High-Impact Acute Fall & Immobility',
    badge: '🚨 Critical Fall Alert',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    severity: 'critical',
    location: 'Suite Ensuite Bathroom',
    impactForceG: 3.8,
    orientationChangeDeg: 84,
    motionlessDurationSeconds: 45,
    description: 'Acute 3.8g deceleration with prolonged immobility while transferring in bathroom, triggering immediate emergency dispatch.',
  },
  {
    id: 'fall-moderate-bedside',
    name: 'Bedside Nocturnal Tumble & Disorientation',
    badge: '⚠️ Bedside Incident',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    severity: 'moderate',
    location: 'Bedside Carpet Area',
    impactForceG: 2.3,
    orientationChangeDeg: 62,
    motionlessDurationSeconds: 22,
    description: 'Unassisted nocturnal bed-exit slide to carpet floor with mild disorientation detected by FMCW radar tracking.',
  },
  {
    id: 'fall-severe-ramp',
    name: 'Outdoor Sensory Garden Ramp Slip',
    badge: '⚠️ Severe Slip',
    badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    severity: 'severe',
    location: 'Sensory Garden West Ramp',
    impactForceG: 2.9,
    orientationChangeDeg: 75,
    motionlessDurationSeconds: 30,
    description: 'Wet surface traction loss on garden transition incline. Kinematic sensor registered severe deceleration and sustained horizontal alignment.',
  },
  {
    id: 'fall-cognitive-freezing',
    name: 'Cognitive Freeze-of-Gait Fall',
    badge: '🚨 Freeze-of-Gait',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    severity: 'critical',
    location: 'Memory Care Safe Corridor',
    impactForceG: 3.4,
    orientationChangeDeg: 80,
    motionlessDurationSeconds: 40,
    description: 'Motor blocking episode in advanced dementia resulting in backward balance loss and prolonged post-impact motionless state.',
  },
];

type SimulationTab = 'vitals' | 'movement' | 'falls';

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onSimulated,
  onMovementSimulated,
  onFallSimulated,
  residents: initialResidents,
  floors: initialFloors,
  initialTab,
  lockedTab,
}) => {
  const [activeTab, setActiveTab] = useState<SimulationTab>(lockedTab || initialTab || 'vitals');
  const [residents, setResidents] = useState<Resident[]>(initialResidents || []);
  const [floors, setFloors] = useState<Floor[]>(initialFloors || []);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (lockedTab) {
      setActiveTab(lockedTab);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [lockedTab, initialTab, isOpen]);

  // Vitals State
  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(null);
  const [selectedConditionType, setSelectedConditionType] = useState<number>(2);
  const [isSubmittingVitals, setIsSubmittingVitals] = useState(false);
  const [vitalsResult, setVitalsResult] = useState<Vital | null>(null);
  const [vitalsError, setVitalsError] = useState<string | null>(null);

  // Movement State
  const [movementResidentId, setMovementResidentId] = useState<number | null>(null);
  const [selectedMovementScenarioId, setSelectedMovementScenarioId] = useState<string>(MOVEMENT_SCENARIOS[0].id);
  const [movementZoneId, setMovementZoneId] = useState<number | null>(null);
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);
  const [movementResult, setMovementResult] = useState<{
    success: boolean;
    resident: string;
    newLocation: string;
    isSafePerimeter: boolean;
    alertTriggered: boolean;
    message: string;
  } | null>(null);
  const [movementError, setMovementError] = useState<string | null>(null);

  // Fall State
  const [fallResidentId, setFallResidentId] = useState<number | null>(null);
  const [selectedFallScenarioId, setSelectedFallScenarioId] = useState<string>(FALL_SCENARIOS[0].id);
  const [fallLocation, setFallLocation] = useState<string>(FALL_SCENARIOS[0].location);
  const [isSubmittingFall, setIsSubmittingFall] = useState(false);
  const [fallResult, setFallResult] = useState<string | null>(null);
  const [fallSuccessData, setFallSuccessData] = useState<{
    id?: number;
    residentName: string;
    scenarioName: string;
    location: string;
    severity: string;
    impact: number;
    motionless: number;
  } | null>(null);
  const [fallError, setFallError] = useState<string | null>(null);

  // Load / refresh residents & floors
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [resRes, floorsRes] = await Promise.all([
        commandCenterService.getResidents({ skip: 0, limit: 100 }),
        commandCenterService.getFacilityFloors().catch(() => []),
      ]);

      if (resRes.data && resRes.data.length > 0) {
        setResidents(resRes.data);
        setSelectedResidentId((prev) =>
          prev && resRes.data.some((r) => r.id === prev) ? prev : resRes.data[0].id,
        );
        setMovementResidentId((prev) =>
          prev && resRes.data.some((r) => r.id === prev) ? prev : resRes.data[0].id,
        );
        setFallResidentId((prev) =>
          prev && resRes.data.some((r) => r.id === prev) ? prev : resRes.data[0].id,
        );
      }

      if (floorsRes && floorsRes.length > 0) {
        setFloors(floorsRes);
        const allZ = floorsRes.flatMap((f: Floor) => f.zones || []);
        const matched = allZ.find(
          (z: RoomZone) =>
            z.name.toLowerCase().includes(MOVEMENT_SCENARIOS[0].targetZoneKeyword) ||
            z.roomNumber.toLowerCase().includes(MOVEMENT_SCENARIOS[0].targetZoneKeyword),
        );
        if (matched) {
          setMovementZoneId(matched.id);
        } else if (allZ[0]) {
          setMovementZoneId(allZ[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load simulation data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setVitalsError(null);
      setVitalsResult(null);
      setMovementError(null);
      setMovementResult(null);
      setFallError(null);
      setFallResult(null);
      setFallSuccessData(null);

      if (initialResidents && initialResidents.length > 0) {
        setResidents(initialResidents);
        const firstId = initialResidents[0].id;
        setSelectedResidentId((prev) => prev ?? firstId);
        setMovementResidentId((prev) => prev ?? firstId);
        setFallResidentId((prev) => prev ?? firstId);
      }
      if (initialFloors && initialFloors.length > 0) {
        setFloors(initialFloors);
        const allZ = initialFloors.flatMap((f) => f.zones || []);
        const matched = allZ.find(
          (z) =>
            z.name.toLowerCase().includes(MOVEMENT_SCENARIOS[0].targetZoneKeyword) ||
            z.roomNumber.toLowerCase().includes(MOVEMENT_SCENARIOS[0].targetZoneKeyword),
        );
        if (matched) {
          setMovementZoneId((prev) => prev ?? matched.id);
        } else if (allZ[0]) {
          setMovementZoneId((prev) => prev ?? allZ[0].id);
        }
      }

      fetchData();
    }
  }, [isOpen, initialResidents, initialFloors, fetchData]);

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
  const activeMovementScenario =
    MOVEMENT_SCENARIOS.find((s) => s.id === selectedMovementScenarioId) || MOVEMENT_SCENARIOS[0];
  const selectedMovementResident = residents.find((r) => r.id === movementResidentId);
  const activeFallScenario = FALL_SCENARIOS.find((s) => s.id === selectedFallScenarioId) || FALL_SCENARIOS[0];
  const selectedFallResident = residents.find((r) => r.id === fallResidentId);

  const getHeaderInfo = () => {
    if (lockedTab === 'vitals') {
      return {
        title: 'Vital Telemetry Simulation',
        subtitle: 'Simulate synthetic physiological telemetry and multi-signal vital anomalies',
      };
    }
    if (lockedTab === 'falls') {
      return {
        title: 'Emergency Fall Simulation',
        subtitle: 'Simulate kinematic impact, orientation change, and post-fall immobility telemetry',
      };
    }
    if (lockedTab === 'movement') {
      return {
        title: 'Facility Movement & Geofence Simulation',
        subtitle: 'Simulate resident movement across suites and safe perimeters',
      };
    }
    return {
      title: 'Test & Simulation Center',
      subtitle: 'Trigger synthetic hemodynamics, geofence movements, and emergency fall alerts',
    };
  };

  const headerInfo = getHeaderInfo();

  const getResidentDisplayName = (r: Resident) => {
    const name = `${r.firstName || ''} ${r.middleName ? `${r.middleName} ` : ''}${r.lastName || ''}`.trim();
    return name || `Resident #${r.id}`;
  };

  // Flattened zones across all floors
  const allZones: (RoomZone & { floorName: string; floorNum: number })[] = floors.flatMap((f) =>
    (f.zones || []).map((z) => ({
      ...z,
      floorName: f.name,
      floorNum: f.floorNumber,
    })),
  );

  const targetZone = allZones.find((z) => z.id === movementZoneId);
  const targetZoneDisplayName = targetZone
    ? `${targetZone.floorName} • Room ${targetZone.roomNumber} (${targetZone.name})`
    : activeMovementScenario.fallbackZoneName;
  const isTargetSafe = targetZone ? targetZone.isSafePerimeter : !activeMovementScenario.isBreach;

  // 1. Trigger Vitals Simulation
  const handleRunVitalsSimulation = async () => {
    if (!selectedResidentId) {
      setVitalsError('Please select a resident to simulate telemetry for.');
      return;
    }

    setIsSubmittingVitals(true);
    setVitalsError(null);

    try {
      const result = await commandCenterService.simulateVitals(
        selectedResidentId,
        selectedConditionType,
      );
      setVitalsResult(result);
      if (onSimulated) {
        onSimulated(result);
      }
    } catch (err: any) {
      console.error('Simulation error:', err);
      setVitalsError(
        err.response?.data?.message ||
          err.message ||
          'Failed to trigger telemetry simulation. Please try again.',
      );
    } finally {
      setIsSubmittingVitals(false);
    }
  };

  // 2. Trigger Movement Simulation
  const handleRunMovementSimulation = async (resId?: number, zId?: number) => {
    const rId = resId ?? movementResidentId;
    let targetZ = zId ?? movementZoneId;

    if (!targetZ) {
      const matchedZone = allZones.find(
        (z) =>
          z.name.toLowerCase().includes(activeMovementScenario.targetZoneKeyword) ||
          z.roomNumber.toLowerCase().includes(activeMovementScenario.targetZoneKeyword),
      );
      targetZ = matchedZone ? matchedZone.id : (allZones[0]?.id || activeMovementScenario.fallbackZoneId);
    }

    if (!rId || !targetZ) {
      setMovementError('Please select both a care recipient and a target destination zone.');
      return;
    }

    setIsSubmittingMovement(true);
    setMovementError(null);

    try {
      const res = await commandCenterService.simulateResidentMovement(rId, targetZ);
      setMovementResult(res);
      if (onMovementSimulated) {
        onMovementSimulated();
      }
    } catch (err: any) {
      console.error('Movement simulation error:', err);
      setMovementError(
        err.response?.data?.message ||
          err.message ||
          'Failed to simulate resident movement. Please try again.',
      );
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  // 3. Trigger Fall Simulation
  const handleRunFallSimulation = async () => {
    if (!fallResidentId) {
      setFallError('Please select a care recipient to simulate a fall incident for.');
      return;
    }

    setIsSubmittingFall(true);
    setFallError(null);

    try {
      const loc = fallLocation || activeFallScenario.location;
      const sev = activeFallScenario.severity;
      const impact = activeFallScenario.impactForceG;
      const motionless = activeFallScenario.motionlessDurationSeconds;
      const desc = activeFallScenario.description;

      const recordRes = await commandCenterService.recordFall({
        residentId: fallResidentId,
        location: loc,
        severity: sev,
        impactForceG: impact,
        motionlessDurationSeconds: motionless,
        orientationChangeDeg: activeFallScenario.orientationChangeDeg,
        clinicalDescription: desc,
      });

      const resObj = residents.find((r) => r.id === fallResidentId);
      const name = resObj ? getResidentDisplayName(resObj) : `Resident #${fallResidentId}`;
      setFallSuccessData({
        id: recordRes?.id,
        residentName: name,
        scenarioName: activeFallScenario.name,
        location: loc,
        severity: sev,
        impact,
        motionless,
      });
      setFallResult(
        `🚨 Fall Incident Dispatched! ${sev.toUpperCase()} fall logged for ${name} at ${loc}. Emergency alert broadcast to all floor dashboards.`,
      );

      if (onFallSimulated) {
        onFallSimulated();
      }
    } catch (err: any) {
      console.error('Fall simulation error:', err);
      setFallError(
        err.response?.data?.message ||
          err.message ||
          'Failed to record simulated fall incident.',
      );
    } finally {
      setIsSubmittingFall(false);
    }
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
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {headerInfo.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Simulation Modal"
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Navigation Tabs (Hidden when a specific simulation mode is locked) */}
        {!lockedTab && (
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 pt-3 bg-slate-50/40 dark:bg-slate-950/20 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('vitals')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'vitals'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Vital Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('movement')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'movement'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Footprints className="w-4 h-4" />
              <span>Facility Movement &amp; Geofence</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('falls')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'falls'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Emergency Falls</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* TAB 1: VITALS TELEMETRY */}
          {activeTab === 'vitals' && (
            <div className="space-y-4">
              {/* Success Banner */}
              {vitalsResult && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Telemetry Successfully Dispatched!
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Log #{vitalsResult.id} recorded for{' '}
                      <span className="font-semibold">
                        {selectedResident ? getResidentDisplayName(selectedResident) : `Resident #${selectedResidentId}`}
                      </span>{' '}
                      ({activeCondition.name}). HR: {Math.round(vitalsResult.heartRate)} bpm, BP:{' '}
                      {Math.round(vitalsResult.systolicBP)}/{Math.round(vitalsResult.diastolicBP)} mmHg, SpO2:{' '}
                      {vitalsResult.oxygenSaturation}%.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {vitalsError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold">Simulation Dispatch Failed</p>
                    <p className="mt-0.5 opacity-90">{vitalsError}</p>
                  </div>
                </div>
              )}

              {/* Target Resident Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    Target Care Recipient
                  </label>
                  {isLoadingData && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      <RotateCcw className="w-2.5 h-2.5 animate-spin" />
                      Loading...
                    </span>
                  )}
                </div>

                <select
                  value={selectedResidentId ?? ''}
                  onChange={(e) => setSelectedResidentId(e.target.value ? Number(e.target.value) : null)}
                  disabled={isLoadingData && residents.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:border-emerald-500 transition cursor-pointer disabled:opacity-50"
                >
                  {residents.length === 0 ? (
                    <option value="" disabled>
                      {isLoadingData ? 'Loading care recipients...' : 'No residents enrolled'}
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

              {/* Condition Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  Condition Pattern
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {CONDITIONS.map((cond) => {
                    const isSelected = selectedConditionType === cond.type;
                    return (
                      <button
                        key={cond.type}
                        type="button"
                        onClick={() => setSelectedConditionType(cond.type)}
                        className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/70 shadow-xs ring-1 ring-emerald-500/50'
                            : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-xs font-bold leading-tight ${
                              isSelected
                                ? 'text-emerald-900 dark:text-emerald-300'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {cond.name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block ${cond.badgeColor}`}
                        >
                          {cond.badge}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {cond.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Simulated Hemodynamic Projection Tiles */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-2">
                  Simulated Hemodynamic Projections
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Heart className="w-3.5 h-3.5 text-rose-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Heart Rate</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {activeCondition.metrics.hr}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Activity className="w-3.5 h-3.5 text-purple-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">HRV (SDNN)</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {activeCondition.metrics.hrv}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Zap className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" />
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

          {/* TAB 2: FACILITY MOVEMENT & GEOFENCING */}
          {activeTab === 'movement' && (
            <div className="space-y-4">
              {/* Movement Result Banner */}
              {movementResult && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                    movementResult.alertTriggered
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {movementResult.alertTriggered ? (
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-xs">
                    <p
                      className={`font-semibold ${
                        movementResult.alertTriggered
                          ? 'text-rose-900 dark:text-rose-200'
                          : 'text-emerald-900 dark:text-emerald-200'
                      }`}
                    >
                      {movementResult.alertTriggered
                        ? 'Spatial Egress Alert Triggered!'
                        : 'Movement Successfully Dispatched!'}
                    </p>
                    <p className="mt-0.5 opacity-90">
                      <span className="font-semibold">{movementResult.resident}</span> &rarr;{' '}
                      <span className="font-semibold">{movementResult.newLocation}</span> (
                      {movementResult.isSafePerimeter
                        ? 'Safe Perimeter Restored'
                        : 'Restricted Egress Breach Alert Logged'}
                      ). Beacon coordinates and floor map updated.
                    </p>
                  </div>
                </div>
              )}

              {/* Movement Error Banner */}
              {movementError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold">Movement Simulation Failed</p>
                    <p className="mt-0.5 opacity-90">{movementError}</p>
                  </div>
                </div>
              )}

              {/* Target Resident Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    Target Care Recipient
                  </label>
                  {isLoadingData && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      <RotateCcw className="w-2.5 h-2.5 animate-spin" />
                      Loading...
                    </span>
                  )}
                </div>

                <select
                  value={movementResidentId ?? ''}
                  onChange={(e) => setMovementResidentId(e.target.value ? Number(e.target.value) : null)}
                  disabled={isLoadingData && residents.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:border-emerald-500 transition cursor-pointer disabled:opacity-50"
                >
                  {residents.length === 0 ? (
                    <option value="" disabled>
                      {isLoadingData ? 'Loading care recipients...' : 'No residents enrolled'}
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

              {/* Movement Scenario Pattern Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5 text-emerald-500" />
                  Spatial Movement Pattern
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {MOVEMENT_SCENARIOS.map((scenario) => {
                    const isSelected = selectedMovementScenarioId === scenario.id;
                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => {
                          setSelectedMovementScenarioId(scenario.id);
                          const matchedZone = allZones.find(
                            (z) =>
                              z.name.toLowerCase().includes(scenario.targetZoneKeyword) ||
                              z.roomNumber.toLowerCase().includes(scenario.targetZoneKeyword),
                          );
                          if (matchedZone) {
                            setMovementZoneId(matchedZone.id);
                          }
                        }}
                        className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/70 shadow-xs ring-1 ring-emerald-500/50'
                            : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-xs font-bold leading-tight ${
                              isSelected
                                ? 'text-emerald-900 dark:text-emerald-300'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {scenario.name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block ${scenario.badgeColor}`}
                        >
                          {scenario.badge}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {scenario.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Destination Zone Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-500" />
                    Target Destination Zone
                  </label>
                  {targetZone && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        targetZone.isSafePerimeter
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {targetZone.isSafePerimeter ? '✓ Safe Perimeter' : '🚨 Restricted Egress'}
                    </span>
                  )}
                </div>

                <select
                  value={movementZoneId ?? ''}
                  onChange={(e) => setMovementZoneId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:border-emerald-500 transition cursor-pointer"
                >
                  {allZones.length === 0 ? (
                    <option value={activeMovementScenario.fallbackZoneId}>
                      {activeMovementScenario.fallbackZoneName}
                    </option>
                  ) : (
                    allZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.floorName} &bull; Room {z.roomNumber} ({z.name}) {z.isSafePerimeter ? '✓ Safe' : '🚨 Restricted'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Simulated Spatial Projections */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-2">
                  Simulated Spatial &amp; Geofence Projections
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Target Location</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 truncate" title={targetZoneDisplayName}>
                      {targetZone ? `Room ${targetZone.roomNumber}` : 'Zone 214'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Perimeter Status</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {isTargetSafe ? 'Safe Interior' : 'Restricted Egress'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Radio className="w-3.5 h-3.5 text-purple-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Anchor Signal</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {activeMovementScenario.rssiEstimate.split(' ')[0]} dBm
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <ShieldAlert className={`w-3.5 h-3.5 mx-auto mb-1 ${!isTargetSafe ? 'text-rose-500' : 'text-emerald-500'}`} />
                    <div className="text-[10px] text-slate-400">Alert Escalation</div>
                    <div className={`text-xs font-mono font-bold uppercase ${!isTargetSafe ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {!isTargetSafe ? 'Security Alert' : 'Normal Flow'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMERGENCY FALL INCIDENTS */}
          {activeTab === 'falls' && (
            <div className="space-y-4">
              {/* Success Banner */}
              {fallSuccessData && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Emergency Fall Incident Successfully Dispatched!
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Incident #{fallSuccessData.id ?? 'ALERT'} logged for{' '}
                      <span className="font-semibold">{fallSuccessData.residentName}</span> (
                      {fallSuccessData.scenarioName}) at <span className="font-semibold">{fallSuccessData.location}</span>. Impact: {fallSuccessData.impact}g deceleration, motionless period: {fallSuccessData.motionless}s. High-priority dispatch broadcast to floor dashboards.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {fallError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold">Fall Simulation Failed</p>
                    <p className="mt-0.5 opacity-90">{fallError}</p>
                  </div>
                </div>
              )}

              {/* Target Resident Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    Target Care Recipient
                  </label>
                  {isLoadingData && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      <RotateCcw className="w-2.5 h-2.5 animate-spin" />
                      Loading...
                    </span>
                  )}
                </div>

                <select
                  value={fallResidentId ?? ''}
                  onChange={(e) => setFallResidentId(e.target.value ? Number(e.target.value) : null)}
                  disabled={isLoadingData && residents.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:border-emerald-500 transition cursor-pointer disabled:opacity-50"
                >
                  {residents.length === 0 ? (
                    <option value="" disabled>
                      {isLoadingData ? 'Loading care recipients...' : 'No residents enrolled'}
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

              {/* Fall Scenario Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-emerald-500" />
                  Fall Scenario Pattern
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {FALL_SCENARIOS.map((scenario) => {
                    const isSelected = selectedFallScenarioId === scenario.id;
                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => {
                          setSelectedFallScenarioId(scenario.id);
                          setFallLocation(scenario.location);
                        }}
                        className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/70 shadow-xs ring-1 ring-emerald-500/50'
                            : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-xs font-bold leading-tight ${
                              isSelected
                                ? 'text-emerald-900 dark:text-emerald-300'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {scenario.name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block ${scenario.badgeColor}`}
                        >
                          {scenario.badge}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {scenario.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Simulated Kinematic & Sensor Projections */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-2">
                  Simulated Kinematic &amp; Sensor Projections
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Zap className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Impact Force</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {activeFallScenario.impactForceG} g
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Compass className="w-3.5 h-3.5 text-rose-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Orientation Drop</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {activeFallScenario.orientationChangeDeg}&deg;
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-purple-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Immobility Period</div>
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                      {activeFallScenario.motionlessDurationSeconds} s
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Incident Severity</div>
                    <div className="text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-100">
                      {activeFallScenario.severity}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40">
          <span className="text-[11px] font-mono text-slate-400">
            {activeTab === 'vitals' && 'Mode: Physiological Stream Injection'}
            {activeTab === 'movement' && 'Mode: BLE Anchor Spatial Relocation'}
            {activeTab === 'falls' && 'Mode: High-G Emergency Dispatch'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingVitals || isSubmittingMovement || isSubmittingFall}
              className="px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>

            {activeTab === 'vitals' && (
              <button
                type="button"
                onClick={handleRunVitalsSimulation}
                disabled={isSubmittingVitals || !selectedResidentId || residents.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              >
                {isSubmittingVitals ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Simulating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Trigger Vitals Simulation</span>
                  </>
                )}
              </button>
            )}

            {activeTab === 'movement' && (
              <button
                type="button"
                onClick={() => handleRunMovementSimulation()}
                disabled={isSubmittingMovement || !movementResidentId || !movementZoneId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              >
                {isSubmittingMovement ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Relocating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Trigger Movement Simulation</span>
                  </>
                )}
              </button>
            )}

            {activeTab === 'falls' && (
              <button
                type="button"
                onClick={handleRunFallSimulation}
                disabled={isSubmittingFall || !fallResidentId || residents.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              >
                {isSubmittingFall ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Trigger Fall Simulation</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
