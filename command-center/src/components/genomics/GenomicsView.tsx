import React, { useState } from 'react';
import {
  Dna,
  ShieldAlert,
  Heart,
  Brain,
  Activity,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Pill,
  User,
  Zap,
  FileText,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Resident } from '../../types';
import { ClinicalReportModal } from '../reports/ClinicalReportModal';

interface GenomicsViewProps {
  residents: Resident[];
  selectedResidentId?: number | null;
  onSelectResident?: (residentId: number) => void;
  onLaunchTelemedicine?: (residentId: number) => void;
}

interface PRSScore {
  condition: string;
  percentile: number;
  riskLevel: 'LOW' | 'AVERAGE' | 'ELEVATED' | 'HIGH';
  oddsRatio: number;
  snps: number;
  clinicalTarget: string;
  icon: any;
  color: string;
}

interface PGxAlert {
  medication: string;
  gene: string;
  diplotype: string;
  phenotype: string;
  severity: 'HIGH_RISK' | 'WARNING' | 'ADVISORY';
  cpicLevel: 'A' | 'B';
  mechanism: string;
  recommendation: string;
  alternatives: string[];
}

export const GenomicsView: React.FC<GenomicsViewProps> = ({
  residents,
  selectedResidentId: initialResidentId,
  onLaunchTelemedicine,
}) => {
  const [activeResidentId, setActiveResidentId] = useState<number>(initialResidentId || 1);
  const [switchedMeds, setSwitchedMeds] = useState<Record<string, string>>({});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleSwitchMedication = (originalMed: string, alternative: string) => {
    setSwitchedMeds((prev) => ({
      ...prev,
      [originalMed]: alternative,
    }));
  };

  const activeResident = residents.find((r) => r.id === activeResidentId) || residents[0] || {
    id: 1,
    firstName: 'Alex',
    lastName: 'Rivera',
    age: 72,
    gender: 1,
    uhid: 'RES-001',
  };

  const prsScores: PRSScore[] = [
    {
      condition: 'Coronary Artery Disease (CAD)',
      percentile: 84.0,
      riskLevel: 'HIGH',
      oddsRatio: 1.85,
      snps: 182,
      clinicalTarget: 'Systolic BP target tightened to <125 mmHg; mandatory nocturnal dipping >10%.',
      icon: Heart,
      color: 'rose',
    },
    {
      condition: 'Type 2 Diabetes (T2D)',
      percentile: 62.0,
      riskLevel: 'ELEVATED',
      oddsRatio: 1.24,
      snps: 240,
      clinicalTarget: 'Continuous autonomic glycemic strain monitoring & tighter resting HRV tolerance.',
      icon: Activity,
      color: 'amber',
    },
    {
      condition: "Late-Onset Alzheimer's (APOE4)",
      percentile: 72.0,
      riskLevel: 'ELEVATED',
      oddsRatio: 1.77,
      snps: 95,
      clinicalTarget: 'Circadian slow-wave sleep entrainment; glymphatic clearance optimization.',
      icon: Brain,
      color: 'indigo',
    },
    {
      condition: 'Sarcopenia & Musculoskeletal Frailty',
      percentile: 58.0,
      riskLevel: 'AVERAGE',
      oddsRatio: 1.14,
      snps: 110,
      clinicalTarget: 'Continuous gait velocity tracking and progressive resistance exercise protocol.',
      icon: Zap,
      color: 'emerald',
    },
  ];

  const pgxAlerts: PGxAlert[] = [
    {
      medication: 'Clopidogrel (Plavix 75mg)',
      gene: 'CYP2C19',
      diplotype: '*1/*2',
      phenotype: 'Intermediate Metabolizer',
      severity: 'HIGH_RISK',
      cpicLevel: 'A',
      mechanism: 'Diminished hepatic conversion to active thiol metabolite; 3.2x increased risk of stent thrombosis and ischemic recurrence.',
      recommendation: 'Discontinue Clopidogrel per CPIC Level A guideline. Transition to alternative P2Y12 receptor antagonist.',
      alternatives: ['Ticagrelor (90 mg BID)', 'Prasugrel (10 mg QD)'],
    },
    {
      medication: 'Atorvastatin (Lipitor 40mg)',
      gene: 'SLCO1B1',
      diplotype: '521T>C',
      phenotype: 'Decreased Function',
      severity: 'HIGH_RISK',
      cpicLevel: 'A',
      mechanism: 'Impaired OATP1B1 hepatic uptake transporter leads to marked elevation of systemic statin plasma exposure and up to 17x risk of statin-induced myopathy.',
      recommendation: 'Reduce dose (<=20 mg/day) or switch to non-OATP1B1 dependent statin with baseline CK monitoring.',
      alternatives: ['Rosuvastatin (5-10 mg)', 'Pravastatin (20-40 mg)'],
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/70 via-teal-950/60 to-slate-900 p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold">
              <Dna className="w-3.5 h-3.5 animate-spin-slow" />
              BIOTECH & PRECISION MEDICINE ENGINE
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Genomic Architecture & Functional Healthspan
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Unifying static Polygenic Risk Scores (PRS) and CPIC Pharmacogenomic safety with real-time wearable telemetry to dynamically calibrate individual longevity targets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Export Clinical Report</span>
            </button>

            {onLaunchTelemedicine && (
              <button
                onClick={() => onLaunchTelemedicine(activeResident.id)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Telemedicine Consult</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resident Selection Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-mono uppercase text-slate-400 font-bold px-2">
          Select Resident:
        </span>
        {residents.map((r) => {
          const isSelected = r.id === activeResidentId;
          return (
            <button
              key={r.id}
              onClick={() => setActiveResidentId(r.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer border ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>
                {r.firstName} {r.lastName}
              </span>
              <span className="font-mono text-[10px] opacity-70">#{r.id}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Polygenic Risk Scores (PRS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Polygenic Risk Profile (PRS)
              </h3>
              <p className="text-xs text-slate-500">
                Population percentile distributions & dynamic pheno-genomic vital calibrations
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-slate-400">Reference: UK Biobank / ClinVar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {prsScores.map((prs, idx) => {
            const Icon = prs.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge
                      variant={prs.riskLevel === 'HIGH' ? 'critical' : prs.riskLevel === 'ELEVATED' ? 'warning' : 'normal'}
                      size="sm"
                    >
                      {prs.riskLevel} RISK
                    </Badge>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{prs.condition}</h4>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
                      {prs.percentile}th
                    </span>
                    <span className="text-xs font-mono text-slate-400">percentile</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        prs.percentile >= 80
                          ? 'bg-rose-500'
                          : prs.percentile >= 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${prs.percentile}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                    <span>Odds Ratio: {prs.oddsRatio}x</span>
                    <span>{prs.snps} SNPs</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Target: </span>
                    {prs.clinicalTarget}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Pharmacogenomics (PGx) Safety Engine */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pharmacogenomics (PGx) Safety Engine
              </h3>
              <p className="text-xs text-slate-500">
                CPIC Level A clinical safety alerts cross-referenced against active resident prescriptions
              </p>
            </div>
          </div>
          {Object.keys(switchedMeds).length === pgxAlerts.length ? (
            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Prescriptions CPIC-Compliant (0 Flags)
            </span>
          ) : (
            <span className="font-mono text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30">
              {pgxAlerts.length - Object.keys(switchedMeds).length} Active High-Risk Flag{pgxAlerts.length - Object.keys(switchedMeds).length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {pgxAlerts.map((alert, idx) => {
            const isSwitched = Boolean(switchedMeds[alert.medication]);
            const activeAlt = switchedMeds[alert.medication];

            return (
              <div
                key={idx}
                className={`rounded-2xl border p-5 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6 transition-all ${
                  isSwitched
                    ? 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/20'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {alert.medication}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-semibold">
                      {alert.gene} ({alert.diplotype} &bull; {alert.phenotype})
                    </span>
                    {isSwitched ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        RESOLVED &bull; CPIC LEVEL {alert.cpicLevel} APPLIED
                      </span>
                    ) : (
                      <Badge variant="critical" size="sm">
                        {alert.severity} &bull; CPIC LEVEL {alert.cpicLevel}
                      </Badge>
                    )}
                  </div>

                  {isSwitched ? (
                    <div className="p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Prescription Updated: Switched to {activeAlt}</span>
                      </div>
                      <p className="text-[11px] mt-1 text-emerald-800 dark:text-emerald-300">
                        Authorized by Dr. Sarah Jenkins (Attending Physician) &bull; Adverse drug-gene conflict averted.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="font-semibold text-rose-600 dark:text-rose-400">Mechanism: </span>
                        {alert.mechanism}
                      </p>

                      <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium">
                        <span className="font-bold">Clinical Directive: </span>
                        {alert.recommendation}
                      </p>
                    </>
                  )}
                </div>

                <div className="md:w-72 shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                    {isSwitched ? 'Active Regimen:' : 'Apply CPIC Alternative:'}
                  </span>
                  {isSwitched ? (
                    <div className="flex items-center justify-between text-xs font-mono py-2 px-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                      <span>{activeAlt}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {alert.alternatives.map((alt, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSwitchMedication(alert.medication, alt)}
                          className="w-full text-left py-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                        >
                          <span className="truncate">{alt}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0 ml-1">
                            Switch &rarr;
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Longevity & Rockwood Frailty Index */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Functional Longevity & Rockwood Electronic Frailty Index (e-FI)
            </h3>
            <p className="text-xs text-slate-500">
              Multi-domain deficit accumulation tracking biological aging trajectory
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
              Biological Age Delta
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-rose-500">+5.8 yrs</span>
              <span className="text-xs text-slate-500">(Chrono: 72 yrs)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Accelerated aging driven by acute inflammatory & hemodynamic strain.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
              Rockwood e-FI Score
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-amber-500">0.32</span>
              <Badge variant="warning" size="sm">FRAIL</Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Cutoff &gt;0.25 indicates vulnerable functional reserve.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
              Autonomic Resilience
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-emerald-500">61.6 / 100</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Vagal parasympathetic recovery following exertion.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
              Locomotion & Sarcopenia
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-amber-500">MODERATE</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Step cadence velocity proxy indicates mild gait slowing.
            </p>
          </div>
        </div>
      </section>

      {/* Clinical SBAR Longevity Report Modal */}
      <ClinicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        resident={activeResident}
      />
    </div>
  );
};
