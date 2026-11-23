import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'normal' | 'warning' | 'critical' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  pulse = false,
}) => {
  const variantStyles = {
    normal:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
    warning:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
    critical:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
    info:
      'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30',
    purple:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
    neutral:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono tracking-wide ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            variant === 'normal'
              ? 'bg-emerald-500 dark:bg-emerald-400'
              : variant === 'warning'
              ? 'bg-amber-500 dark:bg-amber-400'
              : variant === 'critical'
              ? 'bg-rose-500 dark:bg-rose-400'
              : 'bg-cyan-500 dark:bg-cyan-400'
          }`}
        />
      )}
      {children}
    </span>
  );
};

export function getVitalStatus(vital: {
  heartRate?: number;
  oxygenSaturation?: number;
  systolicBP?: number;
  diastolicBP?: number;
  bodyTemperature?: number;
}): { label: string; variant: 'normal' | 'warning' | 'critical' } {
  const hr = Number(vital.heartRate || 0);
  const spo2 = Number(vital.oxygenSaturation || 0);
  const sbp = Number(vital.systolicBP || 0);
  const temp = Number(vital.bodyTemperature || 0);

  // Sepsis Prodrome check (High NEWS2)
  if (spo2 > 0 && spo2 < 91 && hr > 118 && (temp > 38.8 || temp < 35.8)) {
    return { label: 'NEWS2 CRITICAL: SEPSIS', variant: 'critical' };
  }

  // Critical checks
  if (
    (spo2 > 0 && spo2 < 90) ||
    (hr > 0 && (hr < 45 || hr > 130)) ||
    (sbp > 0 && sbp > 160) ||
    (temp > 0 && temp > 39.0)
  ) {
    return { label: 'CRITICAL', variant: 'critical' };
  }

  // PGx / Autonomic distress
  if (hr > 100 && sbp >= 148 && spo2 >= 94) {
    return { label: 'PGx AUTONOMIC STRAIN', variant: 'warning' };
  }

  // Warning checks
  if (
    (spo2 > 0 && spo2 < 95) ||
    (hr > 0 && (hr < 55 || hr > 105)) ||
    (sbp > 0 && sbp > 135) ||
    (temp > 0 && temp > 37.8)
  ) {
    return { label: 'WARNING', variant: 'warning' };
  }

  return { label: 'NORMAL', variant: 'normal' };
}
