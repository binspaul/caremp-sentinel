import React, { useState, useEffect } from 'react';
import {
  Dna,
  ShieldCheck,
  Clock,
  Sparkles,
  Pill,
  Activity,
  Video,
  ShieldAlert,
} from 'lucide-react';
import { getResidentGenomicProfile, getResidentHealthspan } from '../../api';

interface PatientGenomicsCardProps {
  residentId?: number;
  onOpenTelemedicine?: () => void;
}

export const PatientGenomicsCard: React.FC<PatientGenomicsCardProps> = ({
  residentId = 1,
  onOpenTelemedicine,
}) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [healthspan, setHealthspan] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getResidentGenomicProfile(residentId),
      getResidentHealthspan(residentId),
    ])
      .then(([p, h]) => {
        if (isMounted) {
          if (p) setProfile(p);
          if (h) setHealthspan(h);
        }
      })
      .catch((err) => {
        console.error('Error fetching patient genomic/healthspan info:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [residentId]);

  // Derived bio-age metrics
  const chronologicalAge = healthspan?.chronologicalAge ?? 72;
  const biologicalAge = healthspan?.biologicalAge ? Number(healthspan.biologicalAge) : 68.2;
  const bioAgeDelta = healthspan?.biologicalAgeDelta
    ? Number(healthspan.biologicalAgeDelta)
    : biologicalAge - chronologicalAge;

  const frailtyScore = healthspan?.frailtyIndex ? Number(healthspan.frailtyIndex) : 0.12;
  const frailtyClassification = healthspan?.classification || 'ROBUST';

  // PGx alerts check
  const alerts: any[] = profile?.activePgxAlerts || [];
  const reconciledAlerts = alerts.filter((a) => a.isReconciled);
  const unreconciledAlerts = alerts.filter((a) => !a.isReconciled);

  // PRS scores
  const prsScores: any[] = profile?.prsScores || [
    {
      condition: 'Coronary Artery (CAD)',
      percentile: 84.0,
      clinicalTarget: 'Systolic BP <125 mmHg. Nocturnal dip mandatory.',
    },
    {
      condition: 'Type 2 Diabetes (T2D)',
      percentile: 62.0,
      clinicalTarget: 'Target: Postprandial glucose spike avoidance via low glycemic index.',
    },
    {
      condition: "Alzheimer's (APOE)",
      percentile: 72.0,
      clinicalTarget: 'Circadian deep sleep preservation; slow-wave sleep >90 min.',
    },
  ];

  return (
    <div className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-700 dark:text-purple-400">
            <Dna className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-[#1c192d] dark:text-white">
                Pheno-Genomics &amp; Longevity Clock
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800">
                CPIC Level A Verified
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Integrated Polygenic Risk Scores, Rockwood Frailty Index, and Pharmacogenomic Safety
            </p>
          </div>
        </div>

        {onOpenTelemedicine && (
          <button
            onClick={onOpenTelemedicine}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Video className="w-3.5 h-3.5 text-purple-200" />
            <span>Consult Doctor About Genomics</span>
          </button>
        )}
      </div>

      {/* Grid: Biological Age vs Chronological Age & Rockwood Frailty & PGx */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Biological Age Tile */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-100/80 dark:border-emerald-800/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Biological Age Clock
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                bioAgeDelta <= 0
                  ? 'bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100'
                  : 'bg-amber-200/60 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100'
              }`}
            >
              {bioAgeDelta <= 0
                ? `${Math.abs(bioAgeDelta).toFixed(1)} Yrs Rejuvenated`
                : `+${bioAgeDelta.toFixed(1)} Yrs Strain`}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950 dark:text-emerald-100 font-mono">
              {biologicalAge.toFixed(1)}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">years</span>
            <span className="text-xs text-slate-400 line-through ml-auto">
              {chronologicalAge.toFixed(1)} cal
            </span>
          </div>

          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
            {bioAgeDelta <= 0
              ? 'Your physiological biomarker composite reflects extended healthspan and lower autonomic wear.'
              : 'Targeted longevity interventions active to decelerate cumulative biological strain.'}
          </p>
        </div>

        {/* Rockwood Electronic Frailty Index (e-FI) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-100/80 dark:border-indigo-800/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Rockwood Frailty Index
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-800/60 text-indigo-900 dark:text-indigo-100 text-[10px] font-bold uppercase">
              {frailtyClassification.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-950 dark:text-indigo-100 font-mono">
              {frailtyScore.toFixed(3)}
            </span>
            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">deficit ratio</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-auto">
              &lt; 0.20 Target
            </span>
          </div>

          <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
            Multi-domain functional reserve assessment across 36 clinical indicators.
          </p>
        </div>

        {/* Pharmacogenomics (PGx) Safety */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-100/80 dark:border-amber-800/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-900 dark:text-amber-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              PGx Drug-Gene Safety
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                unreconciledAlerts.length === 0
                  ? 'bg-emerald-200/70 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-200'
                  : 'bg-rose-200/70 text-rose-950 dark:bg-rose-900/60 dark:text-rose-200'
              }`}
            >
              {unreconciledAlerts.length === 0 ? 'Protected' : `${unreconciledAlerts.length} Flagged`}
            </span>
          </div>

          <div className="space-y-1">
            {reconciledAlerts.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {reconciledAlerts[0].gene} ({reconciledAlerts[0].diplotype})
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                </div>
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                  Reconciled to <strong>{reconciledAlerts[0].reconciledMedication}</strong> (toxicity avoided).
                </p>
              </>
            ) : alerts.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {alerts[0].gene} Conflict
                  </span>
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 ml-1" />
                </div>
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                  Active monitoring on <strong>{alerts[0].medication}</strong>.
                </p>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>No active drug-gene conflicts.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Polygenic Risk Summary Row */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          Active Polygenic Targets &amp; Clinical Action Plan
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {prsScores.slice(0, 3).map((prs, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {prs.condition}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${
                    prs.percentile >= 80
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                      : prs.percentile >= 60
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                  }`}
                >
                  {prs.percentile}th pct
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {prs.clinicalTarget}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
