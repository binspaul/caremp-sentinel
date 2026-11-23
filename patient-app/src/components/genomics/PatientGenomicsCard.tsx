import React from 'react';
import {
  Dna,
  ShieldCheck,
  Clock,
  Sparkles,
  Pill,
  Activity,
  Video,
} from 'lucide-react';

interface PatientGenomicsCardProps {
  onOpenTelemedicine?: () => void;
}

export const PatientGenomicsCard: React.FC<PatientGenomicsCardProps> = ({
  onOpenTelemedicine,
}) => {
  return (
    <div className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-[#1c192d]">
                Pheno-Genomics &amp; Longevity Clock
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
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

      {/* Grid: Biological Age vs Chronological Age & Rockwood Frailty */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Biological Age Tile */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Biological Age Clock
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 text-[10px] font-bold">
              -3.8 Yrs Younger
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950 font-mono">68.2</span>
            <span className="text-xs text-emerald-700 font-medium">years</span>
            <span className="text-xs text-slate-400 line-through ml-auto">72.0 cal</span>
          </div>

          <p className="text-[11px] text-emerald-800/80 leading-relaxed">
            Your physiological biomarker composite reflects extended healthspan and lower autonomic wear.
          </p>
        </div>

        {/* Rockwood Electronic Frailty Index (e-FI) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50/50 border border-indigo-100/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-800 font-semibold">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              Rockwood Frailty Index
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-900 text-[10px] font-bold">
              Robust
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-950 font-mono">0.12</span>
            <span className="text-xs text-indigo-700 font-medium">deficit ratio</span>
            <span className="text-[10px] text-emerald-600 font-semibold ml-auto">&lt; 0.20 Target</span>
          </div>

          <p className="text-[11px] text-indigo-800/80 leading-relaxed">
            Minimal cumulative functional deficits across 36 clinical indicators.
          </p>
        </div>

        {/* Pharmacogenomics (PGx) Safety */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-900 font-semibold">
            <span className="flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-amber-700" />
              PGx Drug-Gene Safety
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-950 text-[10px] font-bold">
              Protected
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">CYP2C19 Poor Metabolizer</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] text-amber-900 leading-snug">
              Switched to <strong>Ticagrelor</strong> (Clopidogrel resistance avoided).
            </p>
          </div>
        </div>
      </div>

      {/* Polygenic Risk Summary Row */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          Active Polygenic Targets &amp; Clinical Action Plan
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Coronary Artery (CAD)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">84th pct</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Personalized target: Systolic BP &lt;125 mmHg. Nocturnal dip mandatory.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Type 2 Diabetes (T2D)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">62nd pct</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Target: Postprandial glucose spike avoidance via low glycemic index.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Alzheimer&apos;s (APOE)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">&epsilon;3 / &epsilon;3 Neutral</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Average genetic risk. Sleep circadian consistency recommended.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
