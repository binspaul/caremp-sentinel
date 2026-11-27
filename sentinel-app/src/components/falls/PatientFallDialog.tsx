import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Video,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { FallIncidentData, resolveFallIncident } from "../../api";

interface PatientFallDialogProps {
  incident: FallIncidentData | null;
  onDismiss: () => void;
  onCallCareTeam: () => void;
}

export const PatientFallDialog: React.FC<PatientFallDialogProps> = ({
  incident,
  onDismiss,
  onCallCareTeam,
}) => {
  const [countdown, setCountdown] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!incident) {
      setCountdown(30);
      return;
    }

    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoDispatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incident]);

  if (!incident) return null;

  const handleAutoDispatch = async () => {
    try {
      await resolveFallIncident(
        incident.id,
        "emergency_dispatched",
        "Automated countdown expired with no resident response. Emergency assistance dispatched."
      );
    } catch (err) {
      console.error("Auto dispatch failed:", err);
    }
  };

  const handleImOk = async () => {
    setIsSubmitting(true);
    try {
      await resolveFallIncident(
        incident.id,
        "resolved_false_alarm",
        "Resident responded on screen: I'm OK (False Alarm)."
      );
      onDismiss();
    } catch (err) {
      console.error("Failed to dismiss fall alarm:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestHelp = async () => {
    setIsSubmitting(true);
    try {
      await resolveFallIncident(
        incident.id,
        "emergency_dispatched",
        "Resident requested immediate care team assistance via Patient App."
      );
      onCallCareTeam();
    } catch (err) {
      console.error("Failed to call care team:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-red-500 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/50 flex flex-col items-center text-center overflow-hidden">
        {/* Pulsing Alert Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Pulsing Warning Icon */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/60 border-2 border-red-500 flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-bold text-xs">
            {countdown}s
          </span>
        </div>

        {/* Title & Prompt */}
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Hard Fall Detected
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-md">
          Your wearable sensor pod detected a sudden impact (
          <span className="font-semibold text-red-600 dark:text-red-400">
            {incident.impactForceG}g
          </span>
          ) and lack of movement. Are you okay?
        </p>

        {/* Countdown Progress Display */}
        <div className="w-full my-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <Clock className="w-4 h-4 animate-spin-slow" />
            <span>Auto-alerting care team in:</span>
          </div>
          <span className="text-xl font-bold text-red-600 dark:text-red-400">
            {countdown} seconds
          </span>
        </div>

        {/* Dual Primary Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          {/* I'm OK Button */}
          <button
            disabled={isSubmitting}
            onClick={handleImOk}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>I'm OK (False Alarm)</span>
          </button>

          {/* I Need Help Button */}
          <button
            disabled={isSubmitting}
            onClick={handleRequestHelp}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Video className="w-5 h-5 animate-pulse" />
            <span>Call Care Team Now</span>
          </button>
        </div>

        {/* Small reassurance caption */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4">
          If you cannot reach this screen, help will be automatically dispatched when the timer reaches zero.
        </p>
      </div>
    </div>
  );
};
