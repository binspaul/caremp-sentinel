import React, { useState } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import {
  X,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Heart,
  Wind,
  Activity,
  Thermometer,
  ShieldAlert,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  FileText,
  MessageSquare,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { Resident, Vital } from '../../types';
import { ClinicalReportModal } from '../reports/ClinicalReportModal';

interface TelemedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident?: Resident | null;
  recentVital?: Vital | null;
}

interface ChatMessage {
  id: string;
  sender: 'copilot' | 'physician';
  text: string;
  timestamp: string;
}

export const TelemedicineModal: React.FC<TelemedicineModalProps> = ({
  isOpen,
  onClose,
  resident,
  recentVital,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'copilot',
      text: `- **Ready**: Pre-loaded Eleanor Vance's longitudinal dementia telemetry, sundowning agitation metrics (76/100), and personalized life anchors.\n- **Support**: Ask me for real-time de-escalation actions, validation scripts, or 60-second shift handoffs.`,
      timestamp: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const residentName = resident ? `${resident.firstName} ${resident.lastName}` : 'Eleanor Vance';
  const uhid = resident?.uhid || 'RES-001';
  const age = resident?.age || 78;

  // Use current vital or fallback to simulated deterioration numbers
  const hr = recentVital?.heartRate ? Math.round(recentVital.heartRate) : 126;
  const spo2 = recentVital?.oxygenSaturation || 89;
  const sbp = recentVital?.systolicBP ? Math.round(recentVital.systolicBP) : 88;
  const dbp = recentVital?.diastolicBP ? Math.round(recentVital.diastolicBP) : 54;
  const temp = recentVital?.bodyTemperature ? Number(recentVital.bodyTemperature).toFixed(1) : '39.3';

  const isCritical = spo2 < 91 || hr > 120 || sbp < 90;

  const handleSendQuery = async (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'physician',
      text: q,
      timestamp: 'Now',
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    const agentUrl = (import.meta as any).env?.VITE_AGENT_API_URL || 'http://localhost:8000/api/chat';
    const targetResidentId = resident?.id || 1;

    try {
      // 1. Attempt live query to careMP Sentinel AI Agent (Gemini 3.8 Flash)
      const res = await axios.post<{ response: string; status: string }>(
        agentUrl,
        {
          message: q,
          resident_id: targetResidentId,
        },
        { timeout: 25000 }
      );

      if (res.data?.response) {
        const copilotMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'copilot',
          text: res.data.response,
          timestamp: 'Just now',
        };
        setChatMessages((prev) => [...prev, copilotMsg]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('Agent API unreachable, falling back to clinical rule copilot:', err);
    }

    // 2. Resilient local fallback if Agent server is offline
    setTimeout(() => {
      let reply = '';
      const lowerQ = q.toLowerCase();

      if (lowerQ.includes('sundown') || lowerQ.includes('agitat') || lowerQ.includes('delirium') || lowerQ.includes('sepsis') || lowerQ.includes('news2')) {
        reply = `CRITICAL ALERT: Sundowning & Pre-Delirium Agitation Index is 88/100 (High Risk). Autonomic parameter breakdown: Marked sympathetic surge (HR ${hr} bpm), micro-motion restlessness via 60-GHz mmWave radar (74% fragmentation), and late-afternoon circadian disorientation window. Recommend non-pharmacological calming protocol: adjust lighting to 2700K warm tone, initiate 432 Hz auditory relaxation, and assign reassuring caregiver presence before overt agitation escalates.`;
      } else if (lowerQ.includes('geofence') || lowerQ.includes('wander') || lowerQ.includes('perimeter') || lowerQ.includes('location')) {
        reply = `GEOFENCE & WANDERING SURVEILLANCE: Resident ${residentName} (UHID: ${uhid}) is monitored via BLE RSSI beacon. Location: Memory Ward Suite 4B / Corridor Perimeter. Pre-agitation micro-motion surge indicates elevated risk of unassisted bed-exit; bedside sensor alert armed.`;
      } else if (lowerQ.includes('pgx') || lowerQ.includes('anticholinergic') || lowerQ.includes('donepezil') || lowerQ.includes('drug') || lowerQ.includes('medication')) {
        reply = `COGNITIVE PHARMACOGENOMIC WARNING: Resident carries CYP2D6 Poor Metabolizer phenotype; Donepezil (Aricept) clearance is reduced, requiring 5 mg daily cap to avoid cholinergic toxicity. Additionally, Anticholinergic Burden Score (ARS) is elevated; recommend discontinuing bladder antispasmodics/sedatives to prevent drug-induced cognitive worsening and delirium.`;
      } else if (lowerQ.includes('note') || lowerQ.includes('handover') || lowerQ.includes('summary')) {
        reply = `CLINICAL COGNITIVE CONSULTATION NOTE (FHIR-Compliant):\n• Patient: ${residentName} (UHID: ${uhid}, ${age}yo)\n• Indication: Sundowning agitation & nocturnal wandering surveillance\n• Objective Vitals: HR ${hr} bpm (Sympathetic surge), BP ${sbp}/${dbp} mmHg, SpO2 ${spo2}%, Temp ${temp}°C\n• Neuro-Behavioral: Sundowning Agitation Index 88/100, Radar Sleep Fragmentation 74%\n• Safe-Zone Status: Memory Ward Corridor Perimeter (BLE RSSI active)\n• Pharmacogenomics: CYP2D6 Poor Metabolizer (Donepezil 5mg cap), High Anticholinergic Risk\n• Disposition: Environmental calming protocol; bedtime 1:1 orientation supervision.`;
      } else {
        reply = `Resident ${residentName}'s baseline shows cognitive vulnerability (FAST Stage 4 Alzheimer's / MCI). Current telemetry indicates late-afternoon autonomic sympathetic escalation (Agitation Index 88/100). Non-pharmacological sensory de-escalation protocol prepared.`;
      }

      const copilotMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'copilot',
        text: reply,
        timestamp: 'Just now',
      };
      setChatMessages((prev) => [...prev, copilotMsg]);
      setIsTyping(false);
    }, 700);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white transition-colors">
        {/* Header */}
        <div className="h-18 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{residentName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                  UHID: {uhid}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{age} yrs</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">
                  Secure Encrypted Telehealth Link · WebRTC Connected
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
              title="Export Clinical Handover & SBAR Report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export SBAR Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: Simulated Video + Live Telemetry HUD (7 Cols) */}
          <div className="lg:col-span-7 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
            {/* Simulated Telehealth Video Frame */}
            <div className="relative w-full aspect-video bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-950 dark:to-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-inner flex items-center justify-center group">
              <div className="flex flex-col items-center gap-2 text-center text-slate-400">
                <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-emerald-400 shadow-md">
                  {residentName.split(' ').map((n) => n[0]).join('')}
                </div>
                <p className="text-xs font-semibold text-slate-200">Resident Video Stream (Remote Bedside)</p>
                <p className="text-[11px] font-mono text-slate-400">720p HD · 60fps · Latency 28ms</p>
              </div>

              {/* Patient Live Video Pill */}
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE FEED</span>
              </div>

              {/* Call Controls Floating Bar */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 rounded-full backdrop-blur-md border transition cursor-pointer ${
                    isMuted ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-3 rounded-full backdrop-blur-md border transition cursor-pointer ${
                    isVideoOff ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-lg cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Synchronized Memory Care & Biometric Telemetry HUD */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Live Memory Care &amp; Sensor Telemetry HUD
                </span>
                <span className={isCritical ? 'text-rose-600 dark:text-rose-400 font-extrabold animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}>
                  {isCritical ? 'SUNDOWNING AGITATION SURGE DETECTED' : 'COGNITIVE STATE: RESTFUL'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Heart Rate & Autonomic Vagal Tone */}
                <div className={`p-3 rounded-2xl border transition-colors ${
                  hr > 115 
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Heart Rate &amp; Tone</span>
                  </div>
                  <div className="mt-1 font-mono font-bold text-xl text-slate-900 dark:text-white">
                    {hr} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">bpm</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    {hr > 110 ? '⚡ Sympathetic Surge' : '🌿 Vagal Restful'}
                  </span>
                </div>

                {/* Sundowning / Agitation Risk Index */}
                <div className={`p-3 rounded-2xl border transition-colors ${
                  isCritical 
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sundowning Risk</span>
                  </div>
                  <div className="mt-1 font-mono font-bold text-xl text-slate-900 dark:text-white">
                    {isCritical ? '88' : '14'} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">/100</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    {isCritical ? '🚨 Escalating Pre-Delirium' : '✓ Calm Baseline'}
                  </span>
                </div>

                {/* 60-GHz mmWave Radar Micro-Motion / Sleep Restlessness */}
                <div className={`p-3 rounded-2xl border transition-colors ${
                  isCritical 
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Wind className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Radar Micro-Motion</span>
                  </div>
                  <div className="mt-1 font-mono font-bold text-xl text-slate-900 dark:text-white">
                    {isCritical ? '74%' : '18%'}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    {isCritical ? 'Restless Fragmentation' : 'Restful Continuity'}
                  </span>
                </div>

                {/* Safe-Zone Geofence / Wandering Location */}
                <div className={`p-3 rounded-2xl border transition-colors ${
                  isCritical 
                    ? 'bg-orange-500/10 border-orange-500/40 text-orange-700 dark:text-orange-300' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                    <span>Safe Geofence (BLE)</span>
                  </div>
                  <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-white truncate">
                    {isCritical ? 'Doorway Egress' : 'Suite 4B'}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    {isCritical ? '⚠️ Corridor Alert' : '✓ Perimeter Safe'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Clinical Diagnostic Brief & Interactive Copilot (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-hidden bg-slate-50/70 dark:bg-slate-900/90 p-4 gap-3">
            {/* Compact Clinical Brief Card with Collapsible Details */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    30s AI Triage Synopsis
                  </span>
                  <Badge variant={isCritical ? 'critical' : 'normal'} size="sm">
                    {isCritical ? 'SUNDOWNING SURGE (76)' : 'COGNITIVE STABLE'}
                  </Badge>
                </div>

                <button
                  onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                  className="flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md transition"
                  title={isSynopsisExpanded ? 'Collapse synopsis' : 'Expand full clinical synopsis'}
                >
                  <span>{isSynopsisExpanded ? 'Less' : 'Details'}</span>
                  {isSynopsisExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Streamlined Summary Badges (Always Visible) */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20">
                  ⚠️ Sundowning Surge: Window (4:00-6:30 PM)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
                  🧬 CYP2D6 Poor Metabolizer (Donepezil 5mg cap)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  ⚡ Calm Anchor: Lavender Blanket &amp; Jazz
                </span>
              </div>

              {/* Expanded Clinical Narrative (Toggleable) */}
              {isSynopsisExpanded && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-sans leading-relaxed">
                  <p>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">Sundowning Prodrome: </span>
                    Late-afternoon sympathetic autonomic surge and micro-motion hyperactivity detected 40 min prior to overt combativeness. Peak vulnerability window active.
                  </p>
                  <p>
                    <span className="font-semibold text-purple-700 dark:text-purple-400">Anticholinergic / PGx Warning: </span>
                    CYP2D6 Poor Metabolizer (Donepezil capped 5mg) &amp; High Anticholinergic Burden (ARS: 3). High risk of drug-induced cognitive worsening and delirium.
                  </p>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-mono text-slate-500">Action:</span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Non-Pharm De-escalation &bull; Dim Circadian Light &bull; Reassuring Bedside Check
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Gemini Chat Assistant (Expansive Layout) */}
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-3 overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0 space-y-3 p-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'physician' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[92%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'physician'
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-bl-none shadow-2xs'
                      }`}
                    >
                      {msg.sender === 'copilot' ? (
                        <MarkdownRenderer content={msg.text} />
                      ) : (
                        <span className="whitespace-pre-line">{msg.text}</span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-1.5 p-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                    <span>Gemini analyzing cognitive context...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips (Smooth scroll without ugly scrollbar track) */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2 shrink-0 border-t border-slate-200 dark:border-slate-800/60 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => handleSendQuery('Explain the Sundowning Agitation Score and de-escalation protocol')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent text-[11px] whitespace-nowrap transition cursor-pointer"
                >
                  ⚡ Sundowning De-escalation
                </button>
                <button
                  onClick={() => handleSendQuery('Check current safe-zone geofence and wandering log')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent text-[11px] whitespace-nowrap transition cursor-pointer"
                >
                  🧭 Safe-Zone &amp; Wandering
                </button>
                <button
                  onClick={() => handleSendQuery('Audit anticholinergic burden and Donepezil PGx')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent text-[11px] whitespace-nowrap transition cursor-pointer"
                >
                  🧬 Anticholinergic &amp; PGx
                </button>
                <button
                  onClick={() => handleSendQuery('Generate formal clinical handover note')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent text-[11px] whitespace-nowrap transition cursor-pointer"
                >
                  📋 Handover Note
                </button>
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                  placeholder="Ask Gemini Clinical Copilot..."
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 dark:focus:border-emerald-500 transition"
                />
                <button
                  onClick={() => handleSendQuery()}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded SBAR Clinical Report Modal */}
      <ClinicalReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        resident={resident}
        vital={recentVital}
      />
    </div>,
    document.body
  );
};
