import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  AlertTriangle,
  Activity,
  Compass,
  Clock,
  Radio,
  CheckCircle2,
  ShieldAlert,
  PhoneCall,
  Video,
  Eye,
  MapPin,
  Calendar,
  User,
  Shield,
  FileText,
} from 'lucide-react';
import { FallIncident } from '../../types';

interface FallDetailDrawerProps {
  incident: FallIncident | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunchTelemedicine?: (residentId: number) => void;
  onResolve?: (
    id: number,
    status: 'resolved_assisted' | 'resolved_false_alarm' | 'emergency_dispatched',
    notes: string
  ) => Promise<void>;
}

export const FallDetailDrawer: React.FC<FallDetailDrawerProps> = ({
  incident,
  isOpen,
  onClose,
  onLaunchTelemedicine,
  onResolve,
}) => {
  const [isResolving, setIsResolving] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<
    'resolved_assisted' | 'resolved_false_alarm' | 'emergency_dispatched' | null
  >(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !incident) return null;

  const residentName = incident.resident
    ? `${incident.resident.firstName} ${incident.resident.lastName}`
    : `Resident #${incident.residentId}`;

  const handleAction = async (
    status: 'resolved_assisted' | 'resolved_false_alarm' | 'emergency_dispatched',
    defaultNote: string
  ) => {
    if (!onResolve) return;
    setIsResolving(true);
    try {
      await onResolve(incident.id, status, customNotes.trim() || defaultNote);
      setShowNotesInput(false);
      setCustomNotes('');
      setPendingStatus(null);
      onClose();
    } finally {
      setIsResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unresolved':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            UNRESOLVED
          </span>
        );
      case 'emergency_dispatched':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            EMS DISPATCHED
          </span>
        );
      case 'resolved_assisted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            ASSISTED & RESOLVED
          </span>
        );
      case 'resolved_false_alarm':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            FALSE ALARM
          </span>
        );
      default:
        return null;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-red-600 text-white shadow-xs">
            CRITICAL
          </span>
        );
      case 'severe':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-500 text-white shadow-xs">
            SEVERE
          </span>
        );
      case 'moderate':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-500 text-white shadow-xs">
            MODERATE
          </span>
        );
    }
  };

  const drawerContent = (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/60 dark:bg-slate-950/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                #INC-{incident.id}
              </span>
              {getSeverityBadge(incident.severity)}
              {getStatusBadge(incident.status)}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white pt-1">
              {residentName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              UHID: {incident.resident?.uhid || 'RES-UHID'} &bull; Resident ID: {incident.residentId}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close Drawer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Kinematic Telemetry Card Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Kinematic Impact Telemetry
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                  Peak Impact
                </span>
                <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  {incident.impactForceG}g
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Threshold: 2.5g</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                  Orientation Tilt
                </span>
                <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                  {incident.orientationChangeDeg}°
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Postural change</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">
                  Motionless
                </span>
                <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  {incident.motionlessDurationSeconds}s
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Post-fall inertia</span>
              </div>
            </div>
          </div>

          {/* Location & Time Context */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-cyan-500 shrink-0" />
              <div>
                <span className="font-semibold">Location:</span>{' '}
                <span className="font-mono">{incident.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-semibold">Detected At:</span>{' '}
                <span className="font-mono">{new Date(incident.detectedAt).toLocaleString()}</span>
              </div>
            </div>

            {incident.band && (
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Radio className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-semibold">Sensor Pod:</span>{' '}
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {incident.band.serialNumber}
                  </span>{' '}
                  <span className="text-slate-400">({incident.band.model || 'Bio-Band'})</span>
                </div>
              </div>
            )}
          </div>

          {/* Clinical Description */}
          {incident.clinicalDescription && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Clinical Event Description
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {incident.clinicalDescription}
              </div>
            </div>
          )}

          {/* Resolution Details (if resolved) */}
          {incident.resolutionNotes && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolution Log
              </h4>
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Resolved by: <strong>{incident.resolvedBy || 'Clinical Staff'}</strong></span>
                  <span>{incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : ''}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {incident.resolutionNotes}
                </p>
              </div>
            </div>
          )}

          {/* Custom Notes Input when resolving */}
          {showNotesInput && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Resolution Note for {pendingStatus?.replace('_', ' ').toUpperCase()}:
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Enter clinical assessment or dispatch note..."
                rows={3}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-rose-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNotesInput(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isResolving}
                  onClick={() => {
                    if (pendingStatus) {
                      handleAction(pendingStatus, 'Incident updated by clinical command center.');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Confirm Resolution
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col gap-2">
          {onLaunchTelemedicine && (
            <button
              onClick={() => {
                onLaunchTelemedicine(incident.residentId);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs shadow-xs cursor-pointer active:scale-98 transition"
            >
              <Video className="w-4 h-4" />
              <span>Launch Telemedicine Call with Resident</span>
            </button>
          )}

          {incident.status === 'unresolved' && !showNotesInput && (
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={isResolving}
                onClick={() => {
                  setPendingStatus('resolved_assisted');
                  setCustomNotes('Floor nursing arrived on-scene. Patient helped up, vitals stable.');
                  setShowNotesInput(true);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs cursor-pointer transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Assisted</span>
              </button>

              <button
                disabled={isResolving}
                onClick={() => {
                  setPendingStatus('emergency_dispatched');
                  setCustomNotes('EMS response team mobilized.');
                  setShowNotesInput(true);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs cursor-pointer transition disabled:opacity-50"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Dispatch EMS</span>
              </button>

              <button
                disabled={isResolving}
                onClick={() => {
                  setPendingStatus('resolved_false_alarm');
                  setCustomNotes('Resident confirms accidental band drop; no injury.');
                  setShowNotesInput(true);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs cursor-pointer transition disabled:opacity-50"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>False Alarm</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};
