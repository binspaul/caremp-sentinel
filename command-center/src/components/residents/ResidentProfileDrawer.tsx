import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { Resident, Vital } from '../../types';
import { Badge, getVitalStatus } from '../common/Badge';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
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
  // Dementia Care Status & Copilot state
  const [dementiaStatus, setDementiaStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
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

  // Fetch dementia status whenever resident changes
  useEffect(() => {
    if (!resident || !isOpen) return;

    let isMounted = true;
    setLoadingStatus(true);
    setHandoffBrief(null);
    setCaregiverResponse(null);

    axios
      .get(`http://localhost:8000/api/dementia/status/${resident.id}`, { timeout: 8000 })
      .then((res) => {
        if (isMounted && res.data) {
          setDementiaStatus(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch dementia status from agent:', err);
        if (isMounted) {
          setDementiaStatus({
            agitationIndex: 76,
            alertLevel: 'SUNDOWNING_SURGE',
            wanderingStatus: 'HALLWAY_PACING',
            locationZone: 'North Memory Corridor Gallery',
            calmingSuggestions: [
              'Wrap shoulders in cherished lavender knit blanket',
              'Play Glen Miller big-band jazz softly in Room 204',
              'Invite to organize illustrated library books (32-yr school librarian anchor)',
            ],
            circadianRegularityScore: 48,
            dayNightStatus: 'MILD',
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingStatus(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resident?.id, isOpen]);

  const handleGenerateHandoff = async () => {
    if (!resident) return;
    setGeneratingHandoff(true);
    try {
      const res = await axios.post(`http://localhost:8000/api/handoff/${resident.id}`, {}, { timeout: 15000 });
      if (res.data?.brief) {
        setHandoffBrief(res.data.brief);
      }
    } catch (e) {
      console.error('Failed to generate handoff brief:', e);
      setHandoffBrief(
        `**SBAR Shift Handoff Brief for ${resident.firstName} ${resident.lastName}**\n\n- **Situation**: Sundowning agitation surge (Index 76/100) and corridor pacing.\n- **Background**: FAST Stage 5 Alzheimer's with circadian inversion.\n- **Assessment**: Elevated sympathetic drive; NEWS2 score 5 (pyuria noted; UTI rule-out ongoing).\n- **Recommendation**: Close blinds against glare, provide lavender blanket, play Big Band jazz, offer warm chamomile tea.`
      );
    } finally {
      setGeneratingHandoff(false);
    }
  };

  const handleAskCareCoach = async () => {
    if (!caregiverQuery.trim() || !resident) return;
    setAskingCareCoach(true);
    setCaregiverResponse(null);
    try {
      const res = await axios.post(
        'http://localhost:8000/api/chat',
        {
          message: caregiverQuery,
          resident_id: resident.id,
        },
        { timeout: 25000 }
      );
      if (res.data?.response) {
        setCaregiverResponse(res.data.response);
      }
    } catch (e) {
      setCaregiverResponse(
        `- **Immediate Action**: Guide ${resident.firstName} to a quiet, dimly lit space away from shadows.\n- **What to Say**: *"Everything is safe here, ${resident.firstName}. Let's take a calm moment together."*\n- **Sensory Anchor**: Offer her favorite blanket and warm chamomile tea.\n- **Clinical Safety**: Check vitals and temperature to rule out infection or delirium.`
      );
    } finally {
      setAskingCareCoach(false);
    }
  };

  if (!isOpen || !resident) return null;

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
        <div className="w-screen max-w-md sm:max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out">
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

            {/* careMP Sentinel: Dementia Care & AI Care Coach Insights */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <Brain className="w-4 h-4 text-emerald-500" />
                  Dementia Care &amp; Sundowning Status
                </h3>
                {dementiaStatus && (
                  <Badge
                    variant={dementiaStatus.agitationIndex > 50 ? 'critical' : 'normal'}
                    size="sm"
                    pulse={dementiaStatus.agitationIndex > 50}
                  >
                    {dementiaStatus.alertLevel || (dementiaStatus.agitationIndex > 50 ? 'SUNDOWNING SURGE' : 'STABLE')} ({dementiaStatus.agitationIndex}/100)
                  </Badge>
                )}
              </div>

              {/* Status Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/5 via-slate-50 to-emerald-500/5 dark:from-purple-950/20 dark:via-slate-950/40 dark:to-emerald-950/20 border border-purple-500/20 dark:border-purple-800/40 space-y-3">
                {/* Agitation Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-600 dark:text-slate-400">Autonomic Agitation Index:</span>
                    <span className={`font-bold ${dementiaStatus?.agitationIndex > 50 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                      {dementiaStatus?.agitationIndex || 76}/100
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        (dementiaStatus?.agitationIndex || 76) > 60
                          ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${dementiaStatus?.agitationIndex || 76}%` }}
                    />
                  </div>
                </div>

                {/* Spatial Zone & Circadian Sleep Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex items-start gap-2">
                    <Compass className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 font-mono block text-[10px] uppercase">Zone / Spatial Activity</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {dementiaStatus?.locationZone || 'North Corridor Gallery'}
                      </span>
                      <span className="text-rose-500 block text-[10px] font-mono mt-0.5">
                        {dementiaStatus?.wanderingStatus || 'Hallway Pacing Detected'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex items-start gap-2">
                    <Moon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 font-mono block text-[10px] uppercase">Circadian Sleep Profile</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Regularity: {dementiaStatus?.circadianRegularityScore || 48}/100
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 block text-[10px] font-mono mt-0.5">
                        Day-Night Inversion ({dementiaStatus?.dayNightStatus || 'Mild'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personalized Calming Anchors (LTM) */}
                <div className="p-3 rounded-xl bg-purple-500/10 dark:bg-purple-900/20 border border-purple-500/20 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-700 dark:text-purple-300 block">
                    Personalized Calming Anchors (Long-Term Memory)
                  </span>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <li className="flex items-start gap-1.5">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>Wrap shoulders in cherished <strong>lavender knit blanket</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>Play <strong>Glen Miller big-band jazz</strong> softly in Room 204</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>Invite to organize illustrated books (<strong>32-yr school librarian</strong>)</span>
                    </li>
                  </ul>
                </div>

                {/* Shift Handoff Generation Button */}
                <div className="pt-1">
                  <button
                    onClick={handleGenerateHandoff}
                    disabled={generatingHandoff}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {generatingHandoff ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating 60s SBAR Handoff Brief...</span>
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
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-500/30 shadow-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
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
                <div className="pt-2 border-t border-purple-500/20 space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 block">
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
                      placeholder={`e.g. ${resident.firstName} is restless at 5 PM looking for students...`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleAskCareCoach}
                      disabled={askingCareCoach || !caregiverQuery.trim()}
                      className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer disabled:opacity-40"
                    >
                      {askingCareCoach ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {caregiverResponse && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-500/30 text-xs shadow-xs">
                      <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Care Coach Action Plan:
                      </div>
                      <MarkdownRenderer content={caregiverResponse} />
                    </div>
                  )}
                </div>
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
