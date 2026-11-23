import React, { useState } from 'react';
import {
  AlertTriangle,
  Video,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  Clock,
  Compass,
  Activity,
  Radio,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FallIncident } from '../../types';
import commandCenterService from '../../services/commandCenterService';

interface EmergencyFallAlertProps {
  incident: FallIncident | null;
  onResolved: () => void;
  onLaunchTelemedicine: (residentId: number) => void;
}

export const EmergencyFallAlert: React.FC<EmergencyFallAlertProps> = ({
  incident,
  onResolved,
  onLaunchTelemedicine,
}) => {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  if (!incident) return null;

  const residentName = incident.resident
    ? `${incident.resident.firstName} ${incident.resident.lastName}`
    : `Resident #${incident.residentId}`;

  const bandLabel = incident.band
    ? `${incident.band.serialNumber} (${incident.band.deviceType})`
    : incident.bandId
    ? `Pod #${incident.bandId}`
    : 'Sentinel Pod Telemetry';

  const handleAction = async (
    status: 'resolved_assisted' | 'resolved_false_alarm' | 'emergency_dispatched'
  ) => {
    setIsResolving(true);
    try {
      await commandCenterService.resolveFall(incident.id, {
        status,
        resolvedBy: 'Dr. Sarah Jenkins (Command Center)',
        resolutionNotes:
          resolutionNote ||
          (status === 'emergency_dispatched'
            ? 'Emergency response dispatched to resident location.'
            : status === 'resolved_false_alarm'
            ? 'Verified false alarm; resident confirms safe and mobile.'
            : 'Nursing team assisted resident; vitals stable.'),
      });
      setShowNoteInput(false);
      setResolutionNote('');
      onResolved();
    } catch (err) {
      console.error('Failed to resolve fall incident:', err);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 dark:from-rose-950 dark:via-red-900 dark:to-amber-950 text-white p-4 rounded-2xl shadow-xl shadow-rose-900/30 border-2 border-red-500/40 relative overflow-hidden animate-pulse-slow">
      {/* Background Warning Glow Accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-red-400/20 blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
        {/* Left: Emergency Status & Core Metrics */}
        <div className="flex items-start gap-3">
          <div className="p-3 bg-white/20 dark:bg-black/40 rounded-xl backdrop-blur shrink-0 animate-bounce">
            <AlertTriangle className="w-6 h-6 text-yellow-300 drop-shadow" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 shadow-xs animate-pulse">
                ACUTE INCIDENT
              </span>
              <span className="text-xs text-rose-100 font-mono">
                Detected: {new Date(incident.detectedAt).toLocaleTimeString()}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                {incident.location || 'Bedroom Bedside'}
              </span>
            </div>

            <h3 className="text-lg font-bold tracking-tight text-white mt-1">
              Fall Detected: {residentName}{' '}
              <span className="text-sm font-normal text-rose-100">
                ({incident.resident?.uhid || 'UHID'})
              </span>
            </h3>

            <p className="text-xs text-rose-100/90 mt-0.5 max-w-xl">
              {incident.clinicalDescription ||
                'High-g impact deceleration detected followed by prolonged post-fall immobility.'}
            </p>
          </div>
        </div>

        {/* Center: Kinematic Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-2 bg-black/25 dark:bg-black/40 p-2.5 rounded-xl border border-white/10 backdrop-blur">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 text-white font-mono text-xs">
            <Activity className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-rose-200">Impact:</span>
            <span className="font-bold">{incident.impactForceG}g</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 text-white font-mono text-xs">
            <Compass className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-rose-200">Orientation:</span>
            <span className="font-bold">{incident.orientationChangeDeg}°</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 text-white font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-red-300" />
            <span className="text-rose-200">Immobility:</span>
            <span className="font-bold">{incident.motionlessDurationSeconds}s</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 text-white font-mono text-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-rose-200">Device:</span>
            <span className="font-bold">{bandLabel}</span>
          </div>
        </div>

        {/* Right: Emergency Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Telemedicine Call */}
          <button
            onClick={() => onLaunchTelemedicine(incident.residentId)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Video className="w-4 h-4 text-rose-600 animate-pulse" />
            <span>Launch Emergency Video</span>
          </button>

          {/* Floor Dispatch Button */}
          <button
            disabled={isResolving}
            onClick={() => handleAction('emergency_dispatched')}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-white font-medium text-xs border border-white/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <PhoneCall className="w-3.5 h-3.5 text-yellow-300" />
            <span>Dispatch EMS</span>
          </button>

          {/* Quick Resolve / False Alarm Dropdown/Toggle */}
          <button
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs border border-white/20 transition active:scale-95 cursor-pointer"
          >
            <span>Triage</span>
            {showNoteInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Triage / Note Input Area */}
      {showNoteInput && (
        <div className="mt-4 pt-3 border-t border-white/20 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder="Clinical resolution note (e.g. Floor nurse on scene, resident standing comfortably)..."
            className="flex-1 w-full bg-white/20 placeholder-rose-200 text-white text-xs px-3 py-2 rounded-xl border border-white/30 focus:outline-hidden focus:border-white"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              disabled={isResolving}
              onClick={() => handleAction('resolved_assisted')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Assisted & Clear</span>
            </button>

            <button
              disabled={isResolving}
              onClick={() => handleAction('resolved_false_alarm')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>False Alarm</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
