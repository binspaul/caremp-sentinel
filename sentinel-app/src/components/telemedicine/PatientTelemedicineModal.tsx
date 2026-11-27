import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Activity,
  Heart,
  Droplets,
  Thermometer,
  Sparkles,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { VitalRecord } from '../../types/vital';

interface PatientTelemedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestVital?: VitalRecord | null;
  patientName?: string;
}

export const PatientTelemedicineModal: React.FC<PatientTelemedicineModalProps> = ({
  isOpen,
  onClose,
  latestVital,
  patientName = 'John Doe',
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(42); // Seconds into consult
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'doctor' | 'patient'; text: string; time: string }>>([
    {
      sender: 'doctor',
      text: `Hello ${patientName.split(' ')[0]}! I have your continuous telemetry HUD and digital twin open on my screen. How are you feeling right now?`,
      time: '10:32 AM',
    },
    {
      sender: 'doctor',
      text: 'Your nocturnal dipping and vitals are looking stable today.',
      time: '10:33 AM',
    },
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [...prev, { sender: 'patient', text: chatMessage.trim(), time: now }]);
    setChatMessage('');

    // Simulated doctor response after 1.5s
    setTimeout(() => {
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'doctor',
          text: 'Understood. Based on your CYP2C19 profile, your current Ticagrelor dosage is functioning optimally without adverse strain.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  const hr = latestVital?.heartRate ? Number(latestVital.heartRate) : 72;
  const sys = latestVital?.systolicBP ? Number(latestVital.systolicBP) : 120;
  const dia = latestVital?.diastolicBP ? Number(latestVital.diastolicBP) : 78;
  const spo2 = latestVital?.oxygenSaturation ? Number(latestVital.oxygenSaturation) : 98;
  const temp = latestVital?.bodyTemperature ? Number(latestVital.bodyTemperature) : 36.6;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[750px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Header */}
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Video className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Tele-Consultation in Progress</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Encrypted Stream
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dr. Sarah Jenkins, MD &bull; Clinical Telemedicine Lead &bull; Duration: {formatDuration(callDuration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              HIPAA &amp; E2EE Protected
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-0 overflow-hidden">
          {/* Video Feed Area (2 columns on large screens) */}
          <div className="lg:col-span-2 relative bg-slate-950 flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* Simulated Remote Doctor Video */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-xl">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
                    alt="Dr. Sarah Jenkins"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow">
                  <Activity className="w-3.5 h-3.5 text-slate-900" />
                </div>
              </div>

              <div className="mt-3 text-center">
                <p className="text-sm font-bold text-white">Dr. Sarah Jenkins, MD</p>
                <p className="text-xs text-emerald-400 font-medium">Observing Continuous Telemetry</p>
              </div>

              {/* Doctor Speaking Indicator Waveform */}
              <div className="flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <span className="w-1.5 h-5 bg-emerald-400 rounded-full animate-pulse delay-75" />
                <span className="w-1.5 h-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
                <span className="ml-1 text-[10px] text-slate-400">Audio active</span>
              </div>
            </div>

            {/* Floating Live Telemetry HUD Bar (Shared with Doctor) */}
            <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800/80 shadow-lg">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700/60 text-xs">
                <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span className="text-slate-400 text-[10px]">HR</span>
                <span className="font-bold font-mono text-white">{hr}</span>
                <span className="text-[9px] text-slate-400">bpm</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700/60 text-xs">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-400 text-[10px]">BP</span>
                <span className="font-bold font-mono text-white">{sys}/{dia}</span>
                <span className="text-[9px] text-slate-400">mmHg</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700/60 text-xs">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 text-[10px]">SpO2</span>
                <span className="font-bold font-mono text-white">{spo2}%</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700/60 text-xs">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 text-[10px]">Temp</span>
                <span className="font-bold font-mono text-white">{temp}°C</span>
              </div>

              <span className="ml-auto text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                Synced to Doctor HUD
              </span>
            </div>

            {/* Patient Self-Preview (PIP Corner) */}
            <div className="absolute bottom-4 right-4 w-32 sm:w-40 h-24 sm:h-28 rounded-2xl bg-slate-800/95 border-2 border-slate-700/80 shadow-2xl overflow-hidden z-20 flex flex-col justify-between p-2">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-medium">
                <span>You ({patientName.split(' ')[0]})</span>
                {isVideoOff ? (
                  <span className="text-rose-400">Camera Off</span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </div>
              {!isVideoOff ? (
                <div className="self-center text-[10px] text-slate-400 text-center">
                  Live Self Feed
                </div>
              ) : (
                <div className="self-center p-2 rounded-full bg-slate-700 text-slate-400">
                  <VideoOff className="w-4 h-4" />
                </div>
              )}
              <div className="text-[9px] text-slate-400 font-mono truncate">
                {isMuted ? 'Muted' : 'Mic On'}
              </div>
            </div>
          </div>

          {/* Right Consultation Panel: Notes & Chat */}
          <div className="flex flex-col bg-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/95 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Consultation Chat &amp; Clinical Notes</h3>
            </div>

            {/* Shared Clinical Safeguards Box */}
            <div className="p-3 bg-purple-950/20 border-b border-purple-900/30 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Genomic &amp; Clinical Context</span>
              </div>
              <p className="text-slate-300 text-[10.5px]">
                &bull; <strong>Genomic Target:</strong> CAD PRS 84th pct &rarr; Systolic target &lt;125 mmHg<br />
                &bull; <strong>Pharmacogenomics:</strong> <em>CYP2C19</em> poor metabolizer &rarr; Ticagrelor verified safe
              </p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatLog.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'patient' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                    <span>{msg.sender === 'doctor' ? 'Dr. Sarah Jenkins' : 'You'}</span>
                    <span>&bull;</span>
                    <span>{msg.time}</span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl max-w-[90%] text-xs leading-relaxed ${
                      msg.sender === 'patient'
                        ? 'bg-purple-600 text-white rounded-br-xs'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Message Dr. Jenkins..."
                className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Call Controls Bar */}
        <footer className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Encrypted Session: <span className="font-mono text-emerald-400">caremp-sentinel-webrtc</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition cursor-pointer ${
                isMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-3 rounded-full transition cursor-pointer ${
                isVideoOff ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Consult</span>
            </button>
          </div>

          <div className="hidden sm:block text-xs text-slate-400">
            Telemetry: <span className="font-semibold text-emerald-400">Streaming (1 Hz)</span>
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
