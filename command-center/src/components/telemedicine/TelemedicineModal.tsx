import React, { useState } from 'react';
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
} from 'lucide-react';
import { Badge } from '../common/Badge';
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
  const [inputQuery, setInputQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'copilot',
      text: "Hello Dr. Jenkins. I have pre-loaded Alex Rivera's longitudinal twin telemetry, latest acute vital anomaly, and sequenced pharmacogenomic profile. What would you like me to analyze?",
      timestamp: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const residentName = resident ? `${resident.firstName} ${resident.lastName}` : 'Alex Rivera';
  const uhid = resident?.uhid || 'RES-001';
  const age = resident?.age || 72;

  // Use current vital or fallback to simulated deterioration numbers
  const hr = recentVital?.heartRate ? Math.round(recentVital.heartRate) : 126;
  const spo2 = recentVital?.oxygenSaturation || 89;
  const sbp = recentVital?.systolicBP ? Math.round(recentVital.systolicBP) : 88;
  const dbp = recentVital?.diastolicBP ? Math.round(recentVital.diastolicBP) : 54;
  const temp = recentVital?.bodyTemperature ? Number(recentVital.bodyTemperature).toFixed(1) : '39.3';

  const isCritical = spo2 < 91 || hr > 120 || sbp < 90;

  const handleSendQuery = (textToSend?: string) => {
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

    setTimeout(() => {
      let reply = '';
      const lowerQ = q.toLowerCase();

      if (lowerQ.includes('sepsis') || lowerQ.includes('news2') || lowerQ.includes('deteriorat')) {
        reply = `CRITICAL ALERT: Current NEWS2 is 12 (High Clinical Risk). Parameter breakdown: Tachypnea (24 bpm, 2 pts), Severe Hypotension (${sbp}/${dbp} mmHg, 3 pts), Severe Hypoxemia (${spo2}%, 3 pts), Tachycardia (${hr} bpm, 2 pts), Pyrexia (${temp}°C, 2 pts). qSOFA is 2. Recommend immediate Sepsis Six protocol: obtain blood cultures, check lactate, initiate IV fluid bolus, and start broad-spectrum IV antimicrobials.`;
      } else if (lowerQ.includes('pgx') || lowerQ.includes('statin') || lowerQ.includes('clopidogrel') || lowerQ.includes('drug') || lowerQ.includes('medication')) {
        reply = `PHARMACOGENOMIC WARNING: Alex Rivera carries CYP2C19 *1/*2 (Intermediate Metabolizer) causing reduced Clopidogrel bioactivation; switch to Ticagrelor 90 mg BID. Additionally, SLCO1B1 521T>C variant confers high statin myopathy risk with Atorvastatin 40mg; recommend switching to Rosuvastatin 5-10 mg daily with CK monitoring.`;
      } else if (lowerQ.includes('note') || lowerQ.includes('handover') || lowerQ.includes('summary')) {
        reply = `CLINICAL CONSULTATION NOTE (FHIR-Compliant):\n• Patient: ${residentName} (UHID: ${uhid}, 72yo M)\n• Tele-consult indication: Emergency deterioration triage\n• Objective Vitals: HR ${hr} bpm, BP ${sbp}/${dbp} mmHg, SpO2 ${spo2}%, Temp ${temp}°C\n• Acuity: NEWS2 12 (Critical), Sepsis prodrome confirmed\n• Pharmacogenomics: CYP2C19 *1/*2 (switch Plavix to Ticagrelor), SLCO1B1 (switch Atorvastatin to Rosuvastatin)\n• Disposition: Emergency medical transfer / ICU admission.`;
      } else {
        reply = `Resident ${residentName}'s baseline trajectory shows high cardiovascular vulnerability (CAD PRS 84th percentile). Current telemetry reflects acute systemic decompensation over the last 90 minutes. I have prepared the emergency protocol order and pharmacogenomic medication adjustments.`;
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
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="h-18 px-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">{residentName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  UHID: {uhid}
                </span>
                <span className="text-xs text-slate-400">{age} yrs</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Secure Encrypted Telehealth Link · WebRTC Connected
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
              title="Export Clinical Handover & SBAR Report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export SBAR Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: Simulated Video + Live Telemetry HUD (7 Cols) */}
          <div className="lg:col-span-7 border-r border-slate-800 p-6 flex flex-col justify-between overflow-y-auto bg-slate-950/40 space-y-4">
            {/* Simulated Telehealth Video Frame */}
            <div className="relative w-full aspect-video bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center group">
              <div className="flex flex-col items-center gap-2 text-center text-slate-400">
                <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-emerald-400">
                  {residentName.split(' ').map((n) => n[0]).join('')}
                </div>
                <p className="text-xs font-semibold text-slate-300">Resident Video Stream (Remote Bedside)</p>
                <p className="text-[11px] font-mono text-slate-500">720p HD · 60fps · Latency 28ms</p>
              </div>

              {/* Patient Live Video Pill */}
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono">
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

            {/* Live Synchronized Biometric Telemetry HUD */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Live Wearable Sensor Telemetry HUD
                </span>
                <span className={isCritical ? 'text-rose-400 font-extrabold animate-pulse' : 'text-emerald-400'}>
                  {isCritical ? 'CRITICAL DETERIORATION DETECTED' : 'NORMAL VITALS'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Heart Rate */}
                <div className={`p-3 rounded-2xl border ${hr > 115 ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Heart Rate</span>
                  </div>
                  <div className="mt-1 font-mono font-bold text-xl text-white">
                    {hr} <span className="text-[10px] font-normal text-slate-400">bpm</span>
                  </div>
                </div>

                {/* Blood Pressure */}
                <div className={`p-3 rounded-2xl border ${sbp < 95 ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                    <span>BP (SBP/DBP)</span>
                  </div>
                  <div className="mt-1 font-mono font-bold text-xl text-white">
                    {sbp}/{dbp} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                  </div>
                </div>

                {/* SpO2 */}
                <div className={`p-3 rounded-2xl border ${spo2 < 92 ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SpO2 Pulse Ox</span>
                  </div>
                  <div className="mt-1 font-mono font-bold text-xl text-white">
                    {spo2}%
                  </div>
                </div>

                {/* Temp */}
                <div className={`p-3 rounded-2xl border ${Number(temp) > 38.5 ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                    <span>Temperature</span>
                  </div>
                  <div className="mt-1 font-mono font-bold text-xl text-white">
                    {temp}°C
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Clinical Diagnostic Brief & Interactive Copilot (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between overflow-hidden bg-slate-900/90 p-5 space-y-4">
            {/* Clinical Brief Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  30s AI Triage Diagnostic Synopsis
                </span>
                <Badge variant={isCritical ? 'critical' : 'normal'} size="sm">
                  {isCritical ? 'NEWS2: 12 (CRITICAL)' : 'NEWS2: 0 (ROUTINE)'}
                </Badge>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 font-sans leading-relaxed">
                <p>
                  <span className="font-semibold text-rose-400">Sepsis Prodrome: </span>
                  qSOFA 2/3 (Tachypnea + Hypotension) detected. Estimated 8.5 hr advance warning window before overt septic shock.
                </p>
                <p>
                  <span className="font-semibold text-purple-400">Pharmacogenomic Conflict: </span>
                  Taking <span className="font-mono text-purple-300">Clopidogrel</span> with CYP2C19 *1/*2 (Antiplatelet failure) and <span className="font-mono text-purple-300">Atorvastatin</span> with SLCO1B1 (Myopathy risk).
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-mono text-slate-400">Action:</span>
                <span className="text-[11px] font-semibold text-emerald-400">
                  Switch Plavix → Ticagrelor 90mg BID · Sepsis Six Protocol
                </span>
              </div>
            </div>

            {/* Interactive Gemini Chat Assistant */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950 rounded-2xl border border-slate-800 p-3 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 p-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'physician' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'physician'
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-bl-none whitespace-pre-line'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-1.5 p-2 text-xs text-slate-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                    <span>Gemini analyzing clinical context...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2 shrink-0 border-t border-slate-800/60">
                <button
                  onClick={() => handleSendQuery('Why is the NEWS2 score critical?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap transition cursor-pointer"
                >
                  ⚡ Explain NEWS2 Score
                </button>
                <button
                  onClick={() => handleSendQuery('Review active Pharmacogenomic conflicts')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap transition cursor-pointer"
                >
                  🧬 Review PGx Conflicts
                </button>
                <button
                  onClick={() => handleSendQuery('Generate formal clinical handover note')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap transition cursor-pointer"
                >
                  📋 Handover Note
                </button>
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 shrink-0">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                  placeholder="Ask Gemini Clinical Copilot..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition"
                />
                <button
                  onClick={() => handleSendQuery()}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
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
