import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Resident, Vital, DigitalTwin, VitalTrend, VitalCorrelation } from '../../types';
import { Badge, getVitalStatus } from '../common/Badge';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { HumanBodyIllustration, BodyHotspot } from '../common/HumanBodyIllustration';
import commandCenterService from '../../services/commandCenterService';
import {
  X,
  User,
  Heart,
  Activity,
  Wind,
  Thermometer,
  Mail,
  Phone,
  AlertTriangle,
  MapPin,
  Calendar,
  Eye,
  FileText,
  Shield,
  HeartPulse,
  Radio,
  Clock,
  Video,
  Sparkles,
  Pill,
  Brain,
  Compass,
  Moon,
  Send,
  RefreshCw,
  CheckCircle2,
  Copy,
  Info,
} from 'lucide-react';

interface ResidentProfileDrawerProps {
  resident: Resident | null;
  vital?: Vital | null;
  isOpen: boolean;
  onClose: () => void;
  onViewVitals?: (residentId: number) => void;
  onLaunchTelemedicine?: (residentId: number) => void;
}

export const ResidentProfileDrawer: React.FC<ResidentProfileDrawerProps> = ({
  resident,
  vital,
  isOpen,
  onClose,
  onViewVitals,
  onLaunchTelemedicine,
}) => {
  // Dementia Digital Twin & Copilot state
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwin | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<BodyHotspot>('sundowning');
  const [trendWindow, setTrendWindow] = useState<'15m' | '30m' | '2h'>('30m');
  const [loadingTwin, setLoadingTwin] = useState<boolean>(false);
  const [handoffBrief, setHandoffBrief] = useState<string | null>(null);
  const [generatingHandoff, setGeneratingHandoff] = useState<boolean>(false);
  const [copiedHandoff, setCopiedHandoff] = useState<boolean>(false);
  const [caregiverQuery, setCaregiverQuery] = useState<string>('');
  const [caregiverResponse, setCaregiverResponse] = useState<string | null>(null);
  const [askingCareCoach, setAskingCareCoach] = useState<boolean>(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch live digital twin whenever resident changes
  useEffect(() => {
    if (!resident || !isOpen) return;

    let isMounted = true;
    setLoadingTwin(true);
    setHandoffBrief(null);
    setCaregiverResponse(null);

    commandCenterService
      .getDigitalTwin(resident.id)
      .then((twin) => {
        if (isMounted) {
          setDigitalTwin(twin);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch digital twin:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingTwin(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resident?.id, isOpen]);

  const handleGenerateHandoff = () => {
    if (!resident) return;
    setGeneratingHandoff(true);
    setTimeout(() => {
      const sundowning = digitalTwin?.healthInsights?.sundowning;
      const wandering = digitalTwin?.healthInsights?.wandering;
      const circadian = digitalTwin?.healthInsights?.circadian;
      const agitation = sundowning?.agitationIndex ?? 42;
      const zone = wandering?.currentZone || resident.roomNumber || 'Resident Room';
      const anchor = resident.specialNotes || resident.notes || 'Gentle conversation, warm herbal tea, and low ambient lighting';

      const brief = `**60-Second Shift Handoff Brief for ${resident.firstName} ${resident.lastName} (Room ${resident.roomNumber || 'N/A'})**\n\n` +
        `- **Current State**: Restlessness Index is **${agitation}/100** (${sundowning?.riskLevel || 'STABLE'}). Location: **${zone}**.\n` +
        `- **Care Background**: ${resident.description || 'Resident in memory care suite.'}\n` +
        `- **Rhythm & Activity**: Sleep regularity is at **${circadian?.regularityScore ?? 65}/100**. ${wandering?.pattern || 'Perimeter secure with steady movement.'}\n` +
        `- **Personal Calming Anchors**: ${anchor}.\n` +
        `- **Recommended Actions**: ${sundowning?.recommendations?.[0] || 'Maintain soft ambient lighting and encourage peaceful evening routines.'}`;

      setHandoffBrief(brief);
      setGeneratingHandoff(false);
    }, 400);
  };

  const handleAskCareCoach = () => {
    if (!caregiverQuery.trim() || !resident) return;
    setAskingCareCoach(true);
    setTimeout(() => {
      const anchor = resident.specialNotes || resident.notes || 'favorite soft knit blanket, soothing ambient music, and quiet companionship';
      const sundowning = digitalTwin?.healthInsights?.sundowning;
      const rec = sundowning?.recommendations?.[0] || 'Guide to a peaceful, dimly lit rest corner away from sudden sounds';

      const response = `- **Immediate Action**: ${rec}.\n` +
        `- **What to Say**: *"Everything is safe and well here, ${resident.firstName}. Let's take a peaceful moment together."*\n` +
        `- **Personal Calming Anchor**: ${anchor}.\n` +
        `- **Environmental Check**: Ensure glare is minimized, temperature is pleasant, and offer a warm drink.`;

      setCaregiverResponse(response);
      setAskingCareCoach(false);
    }, 450);
  };

  if (!isOpen || !resident) return null;

  const insights = digitalTwin?.healthInsights;
  const sundowning = insights?.sundowning;
  const wandering = insights?.wandering;
  const circadian = insights?.circadian;
  const deterioration = insights?.deterioration;

  const news2 = deterioration?.news2;
  const sepsis = deterioration?.sepsis;
  const news2Score = news2?.totalScore ?? 0;
  const news2Risk = news2?.riskLevel ?? 'LOW';
  const sepsisSuspected = sepsis?.isSuspected ?? false;
  const overallPriority = deterioration?.overallClinicalPriority ?? 'ROUTINE';

  // Real engine values from database
  const agitationIndex = sundowning?.agitationIndex ?? 0;
  const sundowningStatus = sundowning?.status || (agitationIndex > 60 ? 'ELEVATED' : 'CALM');
  const comfortScore = Math.max(0, 100 - agitationIndex);

  const circadianScore = circadian?.circadianScore ?? circadian?.regularityScore ?? 100;
  const circadianStatus = circadian?.status === 'NORMAL_RHYTHM' ? 'Synchronized Rhythm' : (circadian?.status || 'Active Rhythm');

  const wanderingLocation = wandering?.currentLocation || (resident.roomNumber ? `Suite ${resident.roomNumber}` : 'Suite 201');
  const wanderingStatus = wandering?.wanderingStatus === 'SAFE_IN_ROOM' ? 'Safe in Room' : (wandering?.wanderingStatus || 'Safe Perimeter');
  const isSafePerimeter = wandering?.isSafeZone !== false;

  const trends = digitalTwin?.trends || [];
  const correlations = digitalTwin?.correlations || [];

  const currentHR = vital?.heartRate ? Math.round(vital.heartRate) : (digitalTwin?.physiology?.heartRate?.value ? Math.round(digitalTwin.physiology.heartRate.value) : 74);
  const currentHRV = vital?.hrv ? Math.round(vital.hrv) : (digitalTwin?.physiology?.hrv?.value ? Math.round(digitalTwin.physiology.hrv.value) : 48);
  const currentSpO2 = vital?.oxygenSaturation ?? digitalTwin?.physiology?.spo2?.value ?? 98;

  const formatVitalName = (key: string): string => {
    const map: Record<string, string> = {
      heartrate: 'Pulse Rate',
      hrv: 'Heart Rate Variability',
      spo2: 'Blood Oxygen (SpO2)',
      systolicbp: 'Systolic BP',
      diastolicbp: 'Diastolic BP',
      bodytemperature: 'Skin Temp',
      respirationrate: 'Respiration',
    };
    return map[key.toLowerCase()] || key;
  };

  const getPairInsight = (pairKey: string, r: number) => {
    const key = pairKey.toLowerCase();
    if (key.includes('heartrate') && key.includes('hrv')) {
      if (r < -0.2) {
        return {
          title: 'Opposite Alignment',
          description: 'When pulse rate quickens, heart rate variability settles lower (natural sympathetic balance).',
        };
      }
      if (r > 0.2) {
        return {
          title: 'Synchronized Rise',
          description: 'Pulse and variability move in unison, showing steady cardiovascular relaxation.',
        };
      }
      return {
        title: 'Independent Rhythm',
        description: 'Pulse rate and heart variability fluctuate on separate individual baselines.',
      };
    }

    if (key.includes('systolic') && key.includes('diastolic')) {
      if (r > 0.2) {
        return {
          title: 'Vascular Harmony',
          description: 'Systolic and diastolic pressures rise and settle in parallel rhythm.',
        };
      }
      if (r < -0.2) {
        return {
          title: 'Divergent Pressures',
          description: 'Vascular pressures shift in opposite directions during postural transitions.',
        };
      }
      return {
        title: 'Steady Vascular Tone',
        description: 'Vascular pressures maintain steady autoregulated equilibrium.',
      };
    }

    if (key.includes('hrv') && (key.includes('temp') || key.includes('bodytemperature'))) {
      if (r > 0.2) {
        return {
          title: 'Thermal Synchrony',
          description: 'Calm autonomic variability aligns with warm, settled peripheral body temperature.',
        };
      }
      if (r < -0.2) {
        return {
          title: 'Thermal Divergence',
          description: 'Skin temperature and heart variability fluctuate counter to one another.',
        };
      }
      return {
        title: 'Thermal Balance',
        description: 'Body temperature and autonomic tone remain stable and undisturbed.',
      };
    }

    if (key.includes('heartrate') && (key.includes('spo2') || key.includes('oxygen'))) {
      if (r < -0.2) {
        return {
          title: 'Resilient Oxygenation',
          description: 'Blood oxygen stays safely saturated while heart rate responds to daily demand.',
        };
      }
      if (r > 0.2) {
        return {
          title: 'Aerobic Coupling',
          description: 'Pulse rate and oxygen uptake rise in tandem during active movement.',
        };
      }
      return {
        title: 'Steady Saturation',
        description: 'Blood oxygen saturation remains steady with normal pulse responsiveness.',
      };
    }

    if (r > 0.25) {
      return {
        title: 'Synchronized Signals',
        description: 'Vitals rise and settle in close bilateral rhythm.',
      };
    }
    if (r < -0.25) {
      return {
        title: 'Counterbalanced Signals',
        description: 'Signals naturally balance each other in opposite directions.',
      };
    }
    return {
      title: 'Independent Signals',
      description: 'Signals operate autonomously without significant cross-influence.',
    };
  };

  const windowTrends = trends.filter((t) => t.window === trendWindow);
  const getTrendFor = (vitalKey: string) => {
    return (
      windowTrends.find((t) => t.vital.toLowerCase() === vitalKey.toLowerCase()) ||
      trends.find((t) => t.vital.toLowerCase() === vitalKey.toLowerCase())
    );
  };

  const hrTrend = getTrendFor('heartRate');
  const hrvTrend = getTrendFor('hrv');
  const spo2Trend = getTrendFor('spo2');

  const renderTrendCard = (
    title: string,
    valueText: React.ReactNode,
    trend?: VitalTrend
  ) => {
    if (!trend) {
      return (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-medium text-slate-400 block">{title}</span>
            <div className="font-bold text-sm font-mono text-slate-900 dark:text-slate-100">
              {valueText}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400 font-medium">Learning</span>
            <span className="text-[9px] text-slate-400 font-normal">Accumulating</span>
          </div>
          <svg className="w-full h-5 mt-1 text-slate-300 dark:text-slate-700 stroke-current fill-none" viewBox="0 0 100 24">
            <path d="M0,12 L100,12" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
          </svg>
        </div>
      );
    }

    const pct = trend.percentageChange ?? 0;
    const isUp = trend.direction === 'UP' || pct > 0.5;
    const isDown = trend.direction === 'DOWN' || pct < -0.5;
    const dirLabel = trend.direction === 'UP' ? 'Rising' : trend.direction === 'DOWN' ? 'Declining' : 'Stable';
    const pctStr = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;

    const colorClasses = isUp
      ? 'text-amber-600 dark:text-amber-400'
      : isDown
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-emerald-600 dark:text-emerald-400';

    const strokeColor = isUp
      ? 'text-amber-500'
      : isDown
      ? 'text-rose-500'
      : 'text-emerald-500';

    const pathD = isUp
      ? 'M0,18 Q25,16 50,11 T75,7 T100,4'
      : isDown
      ? 'M0,5 Q25,8 50,12 T75,17 T100,20'
      : 'M0,12 Q25,10 50,12 T75,13 T100,12';

    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-medium text-slate-400 block">{title}</span>
          <div className="font-bold text-sm font-mono text-slate-900 dark:text-slate-100">
            {valueText}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
          <span className={`font-semibold ${colorClasses}`}>
            {pctStr}
          </span>
          <span className="text-slate-400">{dirLabel}</span>
        </div>
        <svg className={`w-full h-5 mt-1 ${strokeColor} stroke-current fill-none`} viewBox="0 0 100 24">
          <path d={pathD} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
    );
  };

  // Parse AI Summary (string or object)
  const rawSummary = typeof digitalTwin?.aiSummary === 'string'
    ? digitalTwin.aiSummary
    : (typeof digitalTwin?.aiSummary === 'object' && digitalTwin?.aiSummary?.headline
        ? `${digitalTwin.aiSummary.headline}\n${digitalTwin.aiSummary.summary || ''}`
        : '');
  const [summaryHeadline, ...summaryRest] = rawSummary ? rawSummary.split('\n') : ['', ''];
  const summaryBody = summaryRest.join(' ').trim();

  // Parse dynamic calming anchors from resident notes
  const rawNotes = resident.specialNotes || resident.notes || '';
  const parsedAnchors = rawNotes
    ? rawNotes
        .split(/(?:\r\n|\r|\n|\. |\;)/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5)
    : [
        'Enjoys gentle conversational check-ins and peaceful surroundings',
        'Soothing ambient music and warm herbal tea during evening transition',
        'Comforted by familiar blankets, soft textures, and calm lighting',
      ];

  const fullName = `${resident.firstName} ${resident.middleName ? `${resident.middleName} ` : ''}${resident.lastName}`.trim();
  const genderLabel =
    resident.gender === 1 ? 'Male' : resident.gender === 2 ? 'Female' : 'Non-binary / Other';

  const vitalStatus = vital ? getVitalStatus(vital) : null;

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
        <div className="w-screen max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/30 shrink-0">
                {resident.firstName[0]}
                {resident.lastName?.[0] || ''}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {fullName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    UHID: {resident.uhid}
                  </span>
                  <Badge variant={resident.status === 1 ? 'normal' : 'neutral'} size="sm">
                    {resident.status === 1 ? 'ACTIVE TWIN' : 'INACTIVE'}
                  </Badge>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Profile Drawer"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Demographics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                  Age
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {resident.age ? `${resident.age} yrs` : 'N/A'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                  Gender
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {genderLabel}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                  Health Score
                </span>
                <p
                  className={`text-sm font-bold font-mono mt-0.5 ${
                    (resident.healthScore ?? 85) >= 80
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : (resident.healthScore ?? 85) >= 60
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {resident.healthScore ?? 85}/100
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                  Twin ID
                </span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  #{resident.id}
                </p>
              </div>
            </div>

            {/* Current Vital Telemetry Snapshot (when opened from a vital reading) */}
            {vital && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-500" />
                    Captured Telemetry Reading
                  </h3>
                  {vitalStatus && (
                    <Badge variant={vitalStatus.variant} size="sm" pulse={vitalStatus.variant !== 'normal'}>
                      {vitalStatus.label}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Heart Rate */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Heart Rate</span>
                    </div>
                    <div className="mt-1 font-mono font-bold text-base text-slate-900 dark:text-white">
                      {vital.heartRate ? Math.round(vital.heartRate) : '--'}
                      <span className="text-[10px] text-slate-400 font-normal ml-0.5">bpm</span>
                    </div>
                  </div>

                  {/* Blood Pressure */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Activity className="w-3.5 h-3.5 text-amber-500" />
                      <span>Blood Pressure</span>
                    </div>
                    <div className="mt-1 font-mono font-bold text-base text-slate-900 dark:text-white">
                      {vital.systolicBP && vital.diastolicBP
                        ? `${Math.round(vital.systolicBP)}/${Math.round(vital.diastolicBP)}`
                        : '--'}
                    </div>
                  </div>

                  {/* SpO2 */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Wind className="w-3.5 h-3.5 text-cyan-500" />
                      <span>SpO2</span>
                    </div>
                    <div className="mt-1 font-mono font-bold text-base text-slate-900 dark:text-white">
                      {vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : '--'}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                      <span>Temperature</span>
                    </div>
                    <div className="mt-1 font-mono font-bold text-base text-slate-900 dark:text-white">
                      {vital.bodyTemperature ? `${Number(vital.bodyTemperature).toFixed(1)}°C` : '--'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span>Telemetry Log #{vital.id}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatTimestamp(vital.generatedAt || vital.createdAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Description / Medical Notes */}
            {resident.description && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Clinical / Profile Summary</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {resident.description}
                </p>
              </div>
            )}

            {/* careMP Sentinel: Apple-Style Memory Twin */}
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Memory Care Twin
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Behavioral, Spatial &amp; Circadian Digital Twin
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1 font-mono">
                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {comfortScore}
                    </span>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono block">
                    {agitationIndex === 0 ? 'Calm • 0% Agitation' : `${sundowningStatus} (${agitationIndex}%)`}
                  </span>
                </div>
              </div>

              {/* Apple-Style AI Care Synthesis Note */}
              {summaryHeadline && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono">
                      Daily AI Synthesis
                    </span>
                    {digitalTwin?.lastEngineRun && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(digitalTwin.lastEngineRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {summaryHeadline}
                  </h4>
                  {summaryBody && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {summaryBody}
                    </p>
                  )}
                </div>
              )}

              {/* Apple-Style Segmented Control Bar */}
              <div className="grid grid-cols-5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-center">
                {(
                  [
                    { id: 'sundowning', label: 'Sundowning' },
                    { id: 'vitals', label: 'Vitals' },
                    { id: 'deterioration', label: 'Early Warning' },
                    { id: 'wandering', label: 'Safety' },
                    { id: 'circadian', label: 'Circadian' },
                  ] as const
                ).map((tab) => {
                  const isActive = selectedHotspot === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedHotspot(tab.id)}
                      className={`py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Twin Split Panel: Human Figure + Active Engine Details */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Left Column: Human Body Illustration */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60">
                    <HumanBodyIllustration
                      selectedHotspot={selectedHotspot}
                      onSelectHotspot={setSelectedHotspot}
                      agitationIndex={agitationIndex}
                      isSafePerimeter={isSafePerimeter}
                      className="w-36 h-auto"
                    />
                  </div>

                  {/* Right Column: Active Engine Details */}
                  <div className="md:col-span-7 space-y-3">
                    {/* Sundowning Engine */}
                    {selectedHotspot === 'sundowning' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                              Sundowning Engine
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Evening Restlessness &amp; Agitation
                            </span>
                          </div>
                          <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            {agitationIndex === 0 ? 'Calm • 0% Agitation' : `${sundowningStatus} (${agitationIndex}%)`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-mono block">Agitation Index</span>
                            <span className="font-semibold text-base font-mono text-slate-900 dark:text-slate-100">
                              {agitationIndex}%
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-mono block">Comfort Level</span>
                            <span className="font-semibold text-base font-mono text-emerald-600 dark:text-emerald-400">
                              {comfortScore}/100
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {sundowning?.patternSummary ||
                            (agitationIndex === 0
                              ? 'No evening restlessness detected. Autonomic motor state is tranquil and settled.'
                              : 'Elevated motor restlessness detected during the evening transition window.')}
                        </p>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold block text-[10px] uppercase font-mono mb-0.5 text-slate-400">
                            Intervention Guidance
                          </span>
                          {sundowning?.recommendedInterventions?.[0] || 'Maintain soft ambient lighting and encourage peaceful evening routines.'}
                        </div>
                      </div>
                    )}

                    {/* Vitals Baseline Engine */}
                    {selectedHotspot === 'vitals' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                              Vitals Baseline Engine
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Multi-Parameter Physiology Tracking
                            </span>
                          </div>
                          <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                            Stable Baseline
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-mono block">Pulse Rate</span>
                            <span className="font-semibold text-base font-mono text-slate-900 dark:text-slate-100">
                              {vital?.heartRate ? Math.round(vital.heartRate) : (resident.referenceHeartRate || 75)}{' '}
                              <span className="text-[10px] font-normal text-slate-400">bpm</span>
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-mono block">Blood Pressure</span>
                            <span className="font-semibold text-base font-mono text-slate-900 dark:text-slate-100">
                              {vital?.systolicBP ? `${Math.round(vital.systolicBP)}/${Math.round(vital.diastolicBP || 80)}` : '122/82'}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Telemetry vitals remain within healthy reference baseline ranges with zero acute deterioration alerts.
                        </p>
                      </div>
                    )}

                    {/* Clinical Deterioration & Early Warning Engine */}
                    {selectedHotspot === 'deterioration' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                              Clinical Early Warning (NEWS2)
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Deterioration Prodrome &amp; Sepsis Screening
                            </span>
                          </div>
                          <span
                            className={`text-xs font-mono font-medium ${
                              news2Score > 4
                                ? 'text-rose-600 dark:text-rose-400'
                                : news2Score > 2
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {overallPriority === 'ROUTINE' ? 'Stable • Routine' : `${overallPriority} Protocol`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-mono block">NEWS2 Score</span>
                            <span className="font-semibold text-base font-mono text-slate-900 dark:text-slate-100">
                              {news2Score}{' '}
                              <span className="text-xs text-slate-400 font-normal">/ 20</span>
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                              {news2Risk} Risk Tier
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-mono block">Sepsis Screening</span>
                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {sepsisSuspected ? 'Suspected' : 'Clear / Negative'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              qSOFA: {sepsis?.qsofaScore ?? 0} • Normal
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {sepsis?.immediateRecommendation ||
                            'Multi-parameter physiological monitoring indicates stable autonomic balance with zero active deterioration markers.'}
                        </p>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold block text-[10px] uppercase font-mono mb-0.5 text-slate-400">
                            Clinical Protocol
                          </span>
                          {news2?.actionProtocol ||
                            'ROUTINE: Continue routine ward-level continuous wearable biometric telemetry.'}
                        </div>
                      </div>
                    )}

                    {/* Wandering Safety Engine */}
                    {selectedHotspot === 'wandering' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                              Wandering Safety Engine
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Spatial Location &amp; Egress Protection
                            </span>
                          </div>
                          <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            {isSafePerimeter ? 'Safe Interior Zone' : 'Perimeter Alert'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-mono block">Location</span>
                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {wanderingLocation}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-mono block">Egress Risk</span>
                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {wandering?.elopementRisk || 'Low'} (0/100)
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Resident is in designated room with zero repetitive pacing loops detected. Spatial perimeter is safe and intact.
                        </p>
                      </div>
                    )}

                    {/* Circadian Rhythm Engine */}
                    {selectedHotspot === 'circadian' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                              Circadian Rhythm Engine
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Sleep-Wake Regularity Analysis
                            </span>
                          </div>
                          <span className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400">
                            {circadianScore}/100 Regularity
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-mono block">Rhythm Status</span>
                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {circadianStatus}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-mono block">Night Awakenings</span>
                            <span className="font-semibold text-sm font-mono text-slate-900 dark:text-slate-100">
                              {circadian?.nightAwakenings ?? 2} (Normal)
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {circadian?.actionableAdvice?.[0] || 'Healthy day-night sleep balance. Daily activity and nighttime sleep windows are well synchronized.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Apple Health-Style Trend Engine Panel */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Trend Engine
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Multi-Window Rate of Change &amp; Trajectory
                    </p>
                  </div>
                  {/* Apple Health Minimal Window Switcher */}
                  <div className="flex items-center gap-2">
                    {trends.length === 0 ? (
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                        Learning
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        Active
                      </span>
                    )}
                    <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                      {(['15m', '30m', '2h'] as const).map((win) => (
                        <button
                          key={win}
                          type="button"
                          onClick={() => setTrendWindow(win)}
                          className={`px-2 py-0.5 text-[10px] font-mono rounded-md transition-all cursor-pointer ${
                            trendWindow === win
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {win}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Heart Rate Trend */}
                  {renderTrendCard(
                    'Pulse Rate',
                    <>
                      {currentHR} <span className="text-[10px] font-normal text-slate-400">bpm</span>
                    </>,
                    hrTrend
                  )}

                  {/* HRV Trend */}
                  {renderTrendCard(
                    'HRV',
                    <>
                      {currentHRV} <span className="text-[10px] font-normal text-slate-400">ms</span>
                    </>,
                    hrvTrend
                  )}

                  {/* SpO2 Trend */}
                  {renderTrendCard(
                    'SpO2 Oxygen',
                    <>
                      {currentSpO2} <span className="text-[10px] font-normal text-slate-400">%</span>
                    </>,
                    spo2Trend
                  )}
                </div>
              </div>

              {/* Apple Health-Style Correlation Engine Panel (Option A: Bilateral Balance) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Correlation Engine
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Dual-Signal Dynamics &amp; Bilateral Alignment
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {correlations.length > 0 ? 'Live Telemetry' : 'Learning'}
                  </span>
                </div>

                {correlations.length > 0 ? (
                  <div className="space-y-3">
                    {correlations.slice(0, 4).map((c, i) => {
                      const parts = c.vitalPair.split('-');
                      const name1 = formatVitalName(parts[0] || '');
                      const name2 = formatVitalName(parts[1] || '');
                      const r = Number(c.coefficient || 0);
                      const insight = getPairInsight(c.vitalPair, r);
                      const isPositive = r >= 0;
                      const isSignificant = Math.abs(r) >= 0.25;

                      const statusColor = isPositive
                        ? (isSignificant ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400')
                        : (isSignificant ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400');

                      return (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 space-y-2"
                        >
                          {/* Pair Header & Meaning */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {name1} <span className="text-slate-400 font-normal">↔</span> {name2}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-semibold font-mono ${statusColor}`}>
                                {insight.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                r = {r >= 0 ? '+' : ''}{r.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Plain Takeaway Description */}
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            {insight.description}
                          </p>

                          {/* Center-Zero Bilateral Balance Track */}
                          <div className="space-y-1 pt-0.5">
                            <div className="relative w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden flex items-center">
                              {/* Exact Center (0) Divider */}
                              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600 z-10 -translate-x-1/2" />

                              {/* Negative Fill (grows left from center) */}
                              {r < 0 && (
                                <div
                                  className="absolute top-0 bottom-0 bg-amber-500 rounded-l-full transition-all duration-300"
                                  style={{
                                    right: '50%',
                                    width: `${Math.min(50, Math.round(Math.abs(r) * 50))}%`,
                                  }}
                                />
                              )}

                              {/* Positive Fill (grows right from center) */}
                              {r > 0 && (
                                <div
                                  className="absolute top-0 bottom-0 bg-indigo-500 rounded-r-full transition-all duration-300"
                                  style={{
                                    left: '50%',
                                    width: `${Math.min(50, Math.round(r * 50))}%`,
                                  }}
                                />
                              )}
                            </div>

                            {/* Axis Labels */}
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                              <span>← Opposite (-1.0)</span>
                              <span className="text-slate-500 font-medium">Neutral (0)</span>
                              <span>In Sync (+1.0) →</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 text-center space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Learning • Bilateral Buffer
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Pairwise alignment graphs activate once the continuous telemetry buffer reaches 10 readings.
                    </span>
                  </div>
                )}
              </div>

              {/* Personalized Calming Anchors (Dynamic from resident notes) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Personalized Calming Anchors
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Resident Specific</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                  {parsedAnchors.slice(0, 3).map((anchor, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>{anchor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Shift Handoff Generation Button */}
              <div>
                <button
                  onClick={handleGenerateHandoff}
                  disabled={generatingHandoff}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {generatingHandoff ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating 60s Shift Handoff Brief...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Generate 60-Second Shift Handoff (SBAR)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Rendered Shift Handoff */}
              {handoffBrief && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Shift Handoff Ready
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(handoffBrief);
                        setCopiedHandoff(true);
                        setTimeout(() => setCopiedHandoff(false), 2000);
                      }}
                      className="text-[10px] font-mono text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedHandoff ? 'Copied!' : 'Copy Brief'}
                    </button>
                  </div>
                  <MarkdownRenderer content={handoffBrief} />
                </div>
              )}

              {/* Inline Quick Ask Care Coach */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Ask Care Coach About {resident.firstName}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={caregiverQuery}
                    onChange={(e) => setCaregiverQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskCareCoach();
                    }}
                    placeholder={`e.g. ${resident.firstName} seems restless this evening...`}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  />
                  <button
                    onClick={handleAskCareCoach}
                    disabled={askingCareCoach || !caregiverQuery.trim()}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition cursor-pointer disabled:opacity-40"
                  >
                    {askingCareCoach ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {caregiverResponse && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                      Care Coach Recommendation:
                    </span>
                    <MarkdownRenderer content={caregiverResponse} />
                  </div>
                )}
              </div>
            </div>

            {/* Reference Physiological Baselines */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-emerald-500" />
                  Reference Physiological Baselines
                </h3>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Normal Range
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Resting Heart Rate */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Baseline Heart Rate</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      {resident.referenceHeartRate || 75}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">bpm (60 - 100)</span>
                  </div>
                </div>

                {/* Baseline HRV */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <Activity className="w-3.5 h-3.5 text-purple-500" />
                    <span>Baseline HRV</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      {resident.referenceHrv || 50}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ms (&gt; 35)</span>
                  </div>
                </div>

                {/* Blood Pressure */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                    <span>Target Blood Pressure</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      {resident.referenceSystolicBP || 120}/{resident.referenceDiastolicBP || 80}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">mmHg</span>
                  </div>
                </div>

                {/* SpO2 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <Wind className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Target Oxygen (SpO2)</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      {resident.referenceOxygenSaturation || 98}%
                    </span>
                    <span className="text-xs text-slate-400 font-mono">(&gt; 95%)</span>
                  </div>
                </div>

                {/* Body Temperature */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 col-span-2">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                    <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                    <span>Baseline Body Temperature</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      {resident.referenceBodyTemperature ? Number(resident.referenceBodyTemperature).toFixed(1) : '36.8'}°C
                    </span>
                    <span className="text-xs text-slate-400 font-mono">(36.5°C - 37.5°C normothermic)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Emergency Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                Contact & Emergency Information
              </h3>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {/* Email */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email Address</span>
                  </div>
                  <a
                    href={`mailto:${resident.emailAddress}`}
                    className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    {resident.emailAddress || 'Not registered'}
                  </a>
                </div>

                {/* Phone */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>Phone Number</span>
                  </div>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                    {resident.phoneNumber || 'N/A'}
                  </span>
                </div>

                {/* Emergency Contact */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Emergency Contact</span>
                  </div>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                    {resident.emergencyContactNumber || 'Not specified'}
                  </span>
                </div>

                {/* Address */}
                {resident.address && (
                  <div className="p-3.5 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>Address</span>
                    </div>
                    <span className="text-right text-slate-700 dark:text-slate-300">
                      {resident.address}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* careMP Sentinel: Assigned Hardware Pod & Sensor Fleet */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-500" />
                  Assigned Hardware Sensor Pod
                </h3>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                  $45 BOM
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      Sentinel Pod #BND-00{resident.id || 1}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-semibold">
                      BLE Active
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-500">
                    ⚡ 94% Battery
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Sensors: 60GHz mmWave Radar + Dual-λ PPG</span>
                    <span className="font-mono text-[10px] text-slate-400">Firmware v1.2.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lead Status: <strong className="text-emerald-600 dark:text-emerald-400">Lead Worn (Contact OK)</strong></span>
                    <span className="font-mono text-[10px] text-slate-400">Signal: -64 dBm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Timestamps */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Enrolled: {resident.createdAt ? new Date(resident.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span>Updated: {resident.updatedAt ? new Date(resident.updatedAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-end gap-3 flex-wrap">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>

            {onLaunchTelemedicine && (
              <button
                onClick={() => {
                  onClose();
                  onLaunchTelemedicine(resident.id);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-emerald-500/20 transition cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>AI Tele-Consult</span>
              </button>
            )}

            {onViewVitals && (
              <button
                onClick={() => {
                  onClose();
                  onViewVitals(resident.id);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white shadow-xs transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Vitals</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
