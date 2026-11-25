import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  FileText,
  Clock,
  Heart,
  Dna,
  Activity,
  Pill,
  CheckCircle2,
} from 'lucide-react';
import { Resident, Vital } from '../../types';

interface ClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident?: Resident | null;
  vital?: Vital | null;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  isOpen,
  onClose,
  resident,
  vital,
}) => {
  if (!isOpen) return null;

  const residentName = resident ? `${resident.firstName} ${resident.lastName}` : 'Eleanor Vance';
  const age = resident?.age ?? 78;
  const uhid = resident?.uhid ?? 'RES-001';
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const hr = vital?.heartRate ?? 72;
  const sys = vital?.systolicBP ?? 120;
  const dia = vital?.diastolicBP ?? 78;
  const spo2 = vital?.oxygenSaturation ?? 98;
  const temp = vital?.bodyTemperature ?? 36.6;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Top Action Bar (hidden during print) */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Clinical Longevity &amp; Telemetry SBAR Report
              </h2>
              <p className="text-xs text-slate-500">
                Official careMP Sentinel Pheno-Genomic Diagnostic Dossier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 print:p-0 print:space-y-4 print:text-black">
          {/* Clinic Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  careMP Sentinel &bull; Precision Longevity
                </span>
                <span className="text-xs text-slate-400 font-mono">Build 2036 Protocol</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
                COMPREHENSIVE PHENO-GENOMIC REPORT
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-Organ Digital Twin, Polygenic Risk &amp; CPIC Pharmacogenomic Clearance
              </p>
            </div>

            <div className="text-right font-mono text-xs text-slate-500 dark:text-slate-400">
              <div>Date: <strong className="text-slate-800 dark:text-slate-200">{currentDate}</strong></div>
              <div>Time: <strong className="text-slate-800 dark:text-slate-200">{currentTime}</strong></div>
              <div>Physician: <strong className="text-emerald-600 dark:text-emerald-400">Dr. Sarah Jenkins, MD</strong></div>
            </div>
          </div>

          {/* Patient Demographics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Patient Name</span>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">{residentName}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">UHID / MRN</span>
              <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{uhid}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chronological Age</span>
              <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{age} years</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clinical Status</span>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Monitored &bull; Stable</span>
              </div>
            </div>
          </div>

          {/* SBAR Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1">
              Structured SBAR Clinical Analysis
            </h3>

            {/* S: Situation */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20">
                S &bull; Situation
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                Patient is undergoing continuous non-invasive radar and wearable telemetry monitoring. National Early Warning Score 2 (NEWS2) is currently evaluated at baseline normal with zero immediate sepsis prodrome criteria. Nocturnal blood pressure dipping compliance is being sustained.
              </p>
            </div>

            {/* B: Background */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/10 text-purple-600 border border-purple-500/20">
                B &bull; Background &amp; Genomics
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                Germline polygenic risk stratification demonstrates <strong>Coronary Artery Disease (CAD) at the 84th percentile</strong> and <strong>Type 2 Diabetes (T2D) at the 62nd percentile</strong>. Rockwood Electronic Frailty Index (e-FI) is calculated at <strong>0.12 (Robust / Low Deficit Accumulation)</strong>.
              </p>
            </div>

            {/* A: Assessment */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                A &bull; Assessment &amp; Longevity Clock
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase">Biological Age</span>
                  <div className="text-lg font-mono font-black text-emerald-950 dark:text-emerald-200">68.2 yrs</div>
                  <span className="text-[10px] text-emerald-600 font-bold">&Delta;BioAge: -3.8 yrs younger</span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60">
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold uppercase">Dynamic Target</span>
                  <div className="text-lg font-mono font-black text-purple-950 dark:text-purple-200">&lt; 125 mmHg</div>
                  <span className="text-[10px] text-purple-600 font-bold">Calibrated to 84th pct CAD</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60">
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase">CPIC Pharmacogenomics</span>
                  <div className="text-base font-bold text-amber-950 dark:text-amber-200">Ticagrelor Active</div>
                  <span className="text-[10px] text-amber-700 font-bold">CYP2C19 Poor Metabolizer safe</span>
                </div>
              </div>
            </div>

            {/* R: Recommendation */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-teal-500/10 text-teal-600 border border-teal-500/20">
                R &bull; Recommendation &amp; Follow-up
              </span>
              <ul className="text-xs text-slate-700 dark:text-slate-300 list-disc list-inside space-y-1 mt-1 leading-relaxed">
                <li>Maintain strict systolic blood pressure &lt;125 mmHg and ensure evening relaxation to preserve nocturnal dip.</li>
                <li>Continue <strong>Ticagrelor 90mg BID</strong> as active P2Y12 antiplatelet therapy. Clopidogrel remains strictly contraindicated.</li>
                <li>Continue passive contact-free 60-GHz mmWave radar respiration and HRV micro-motion monitoring.</li>
                <li>Scheduled follow-up via careMP Telemedicine Video Suite in 14 days or automatically if NEWS2 &ge; 4.</li>
              </ul>
            </div>
          </div>

          {/* Vitals Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Concurrent Biometric Telemetry (Affordable Hardware Ingestion)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2 font-mono">
              <div>HR: <strong className="text-rose-500">{hr} bpm</strong></div>
              <div>BP: <strong className="text-purple-500">{sys}/{dia} mmHg</strong></div>
              <div>SpO2: <strong className="text-cyan-500">{spo2}%</strong></div>
              <div>Temp: <strong className="text-amber-500">{temp}&deg;C</strong></div>
              <div>Sensor: <strong className="text-emerald-500">mmWave+PPG</strong></div>
            </div>
          </div>

          {/* Physician Electronic Signature */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified by Clinical Decision Support System (CDSS)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                CPIC Level A &bull; Royal College of Physicians NEWS2 &bull; Rockwood 36-Deficit Clock
              </p>
            </div>

            <div className="text-right font-mono">
              <div className="font-bold text-slate-900 dark:text-white">Dr. Sarah Jenkins, MD</div>
              <div className="text-[11px] text-slate-500">Attending Physician &bull; ID: MD-884219</div>
              <div className="text-[10px] text-emerald-600 font-bold">DIGITALLY SIGNED &bull; CAREMP SENTINEL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
