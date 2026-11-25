import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Video,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Clock,
  Compass,
  Activity,
  Radio,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-react';
import { FallIncident } from '../../types';
import commandCenterService from '../../services/commandCenterService';

interface EmergencyFallModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: FallIncident | null;
  onResolved: () => void;
  onLaunchTelemedicine?: (residentId: number) => void;
  onLocateOnMap?: (location?: string) => void;
}

export const EmergencyFallModal: React.FC<EmergencyFallModalProps> = ({
  isOpen,
  onClose,
  incident,
  onResolved,
  onLaunchTelemedicine,
  onLocateOnMap,
}) => {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

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

  if (!isOpen) return null;

  const residentName = incident?.resident
    ? `${incident.resident.firstName} ${incident.resident.lastName}`
    : incident?.residentId
    ? `Resident #${incident.residentId}`
    : 'Unknown Resident';

  const bandLabel = incident?.band
    ? `${incident.band.serialNumber} (${incident.band.model || 'Bio-Band'})`
    : incident?.bandId
    ? `Pod #${incident.bandId}`
    : 'Sentinel Pod Telemetry';

  const handleAction = async (
    status: 'resolved_assisted' | 'resolved_false_alarm' | 'emergency_dispatched',
  ) => {
    if (!incident) return;
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
      onClose();
    } catch (err) {
      console.error('Failed to resolve fall incident:', err);
    } finally {
      setIsResolving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                incident
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {incident ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Emergency Fall Management</span>
                {incident ? (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    ACUTE INCIDENT PENDING
                  </span>
                ) : (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    ALL CLEAR
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {incident
                  ? 'Immediate triage, emergency video dispatch, and clinical response'
                  : 'No active acute unassisted fall incidents'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {incident ? (
          <div className="space-y-4">
            {/* Acute Incident Hero Banner */}
            <div className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white p-5 rounded-2xl shadow-lg shadow-rose-900/20 border border-red-500/30 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950">
                      LEVEL 1 ALERT
                    </span>
                    <span className="text-xs text-rose-100 font-mono">
                      Detected: {new Date(incident.detectedAt).toLocaleTimeString()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                      {incident.location || 'Suite Location'}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold tracking-tight text-white mt-1.5">
                    Fall Detected: {residentName}{' '}
                    <span className="text-sm font-normal text-rose-100">
                      ({incident.resident?.uhid || 'UHID'})
                    </span>
                  </h4>
                  <p className="text-xs text-rose-100/90 mt-1 max-w-xl">
                    {incident.clinicalDescription ||
                      'High-g impact deceleration detected followed by prolonged post-fall immobility.'}
                  </p>
                </div>
              </div>

              {/* Kinematic Telemetry Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/25 backdrop-blur font-mono text-xs">
                  <Activity className="w-3.5 h-3.5 text-yellow-300" />
                  <div>
                    <span className="text-rose-200 text-[10px] block">Impact Force:</span>
                    <span className="font-bold">{incident.impactForceG}g</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/25 backdrop-blur font-mono text-xs">
                  <Compass className="w-3.5 h-3.5 text-blue-300" />
                  <div>
                    <span className="text-rose-200 text-[10px] block">Orientation:</span>
                    <span className="font-bold">{incident.orientationChangeDeg}°</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/25 backdrop-blur font-mono text-xs">
                  <Clock className="w-3.5 h-3.5 text-red-300" />
                  <div>
                    <span className="text-rose-200 text-[10px] block">Immobility:</span>
                    <span className="font-bold">{incident.motionlessDurationSeconds}s</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/25 backdrop-blur font-mono text-xs">
                  <Radio className="w-3.5 h-3.5 text-emerald-300" />
                  <div>
                    <span className="text-rose-200 text-[10px] block">Sensor:</span>
                    <span className="font-bold truncate max-w-[90px]">{bandLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Emergency Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* 1-Click Telemedicine Call */}
              {onLaunchTelemedicine && (
                <button
                  onClick={() => {
                    onClose();
                    onLaunchTelemedicine(incident.residentId);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Video className="w-4 h-4 animate-pulse" />
                  <span>Launch Video Call</span>
                </button>
              )}

              {/* Locate on Indoor Map */}
              {onLocateOnMap && (
                <button
                  onClick={() => {
                    onClose();
                    onLocateOnMap(incident.location);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition active:scale-95 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Locate on Map</span>
                </button>
              )}

              {/* Dispatch EMS */}
              <button
                disabled={isResolving}
                onClick={() => handleAction('emergency_dispatched')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <PhoneCall className="w-3.5 h-3.5 text-yellow-300" />
                <span>Dispatch EMS</span>
              </button>

              {/* Triage Expand Button */}
              <button
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <span>Triage Options</span>
                {showNoteInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Expanded Triage / Note Input Area */}
            {showNoteInput && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Clinical Resolution / Incident Triage Note:
                </label>
                <input
                  type="text"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Floor nurse on scene, resident standing comfortably, vitals normal..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-hidden focus:border-rose-500"
                />

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    disabled={isResolving}
                    onClick={() => handleAction('resolved_assisted')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Assisted &amp; Clear</span>
                  </button>

                  <button
                    disabled={isResolving}
                    onClick={() => handleAction('resolved_false_alarm')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>False Alarm</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 px-4 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              All Clear — No Acute Fall Emergencies
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Continuous 60-GHz contact-free radar and wearable pulse sensor telemetry is active across all resident suites. All residents are currently upright and safe.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};