import { useState, useMemo } from "react";
import {
  Heart,
  Activity,
  Droplets,
  Thermometer,
  Moon,
  Check,
  ChevronDown,
  ArrowUpRight,
  X,
  Send,
  Sparkles,
  Video,
  Dna,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { WellnessScorePieChart } from "./wellnessScorePieChart";
import {
  HumanBodyIllustration,
  type OrganType,
} from "./humanBodyIllustration";
import {
  VitalsTrendGraph,
  type VitalMetricKey,
  METRIC_CONFIGS,
} from "./vitalsTrendGraph";
import Logo from "@/assets/logo.png";
import { VitalRecord } from "@/types/vital";
import type { ResidentDigitalTwinData } from "../types/digitalTwin";
import { sendAgentChatMessage } from "../api";
import {
  VitalRelationshipsCard,
  BodyDataCard,
} from "./vitalRelationshipsAndBody";

export interface TabletDashboardViewProps {
  latestVital?: VitalRecord | null;
  trendVitals?: VitalRecord[];
  digitalTwin?: ResidentDigitalTwinData;
  currentUser?: {
    firstName?: string;
    lastName?: string;
    [key: string]: any;
  } | null;
  onSignOut?: () => void;
  onOpenAI?: () => void;
  onOpenTelemedicine?: () => void;
}

// 4-point Diamond Sparkle logo mark
function SparkleIcon({
  className = "w-5 h-5",
  fill = "currentColor",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill}>
      <path d="M12 2C12.4 7.2 16.8 11.6 22 12C16.8 12.4 12.4 16.8 12 22C11.6 16.8 7.2 12.4 2 12C7.2 11.6 11.6 7.2 12 2Z" />
    </svg>
  );
}

// Spline path generator for smooth wellness rhythm wave
const getSplinePath = (
  points: { value?: number; hr?: number; x?: number; y?: number }[],
  width: number,
  height = 110,
  minVal = 50,
  maxVal = 95,
) => {
  if (!points || points.length === 0) return "";
  const n = points.length;
  const coords = points.map((p, idx) => {
    const x = p.x !== undefined ? p.x : (idx / (n - 1)) * width;
    const val = p.value !== undefined ? p.value : p.hr || 70;
    const y =
      p.y !== undefined
        ? p.y
        : height - ((val - minVal) / (maxVal - minVal)) * height;
    return { x, y };
  });

  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

export function TabletDashboardView({
  latestVital,
  trendVitals = [],
  digitalTwin,
  currentUser,
  onSignOut,
  onOpenAI,
  onOpenTelemedicine,
}: TabletDashboardViewProps) {
  const [rhythmRange, setRhythmRange] = useState<
    "7 days" | "30 days" | "90 days"
  >("7 days");
  const [completedSteps, setCompletedSteps] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedTrendMetric, setSelectedTrendMetric] =
    useState<VitalMetricKey>(null);
  const [selectedTimeFilter, setSelectedTimeFilter] =
    useState("Last 30 minutes");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOrgan, setSelectedOrgan] = useState<OrganType>("heart");

  // In-Tablet AI Companion state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { id: string; role: "user" | "assistant"; text: string }[]
  >([
    {
      id: "t-1",
      role: "user",
      text: "Why might I feel more tired today?",
    },
    {
      id: "t-2",
      role: "assistant",
      text: "Your daily wellness score is 86/100 with steady vitals. However, 3 consecutive nights with reduced sleep (6h 45m last night) are creating a mild recovery deficit. Consider an early wind-down tonight.",
    },
  ]);

  const handleSendChatMessage = async (customText?: string) => {
    const text = (customText || chatInput).trim();
    if (!text) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user" as const, text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    try {
      const res = await sendAgentChatMessage(text, 1);
      if (res?.response) {
        setChatMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant" as const, text: res.response },
        ]);
        return;
      }
    } catch (e) {
      console.warn("Tablet AI agent chat fallback:", e);
    }

    setTimeout(() => {
      let reply =
        "Your cardiovascular indicators are nominal. Staying well-hydrated today will support resting heart rate balance.";
      if (text.toLowerCase().includes("baseline")) {
        reply =
          "Compared to your 30-day baseline: resting heart rate is -9 bpm (70 bpm) and HRV is +9 ms (45 ms), showing strong cardiac resilience.";
      } else if (text.toLowerCase().includes("sleep")) {
        reply =
          "Deep sleep was down 14% last night. A short 15-minute screen-free wind-down before bed is recommended.";
      }
      setChatMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant" as const, text: reply },
      ]);
    }, 400);
  };

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  // Vitals displays
  const hrDisplay = latestVital?.heartRate
    ? Math.round(parseFloat(latestVital.heartRate))
    : 72;
  const sysDisplay = latestVital?.systolicBP
    ? Math.round(parseFloat(latestVital.systolicBP))
    : 120;
  const diaDisplay = latestVital?.diastolicBP
    ? Math.round(parseFloat(latestVital.diastolicBP))
    : 80;
  const o2Display = latestVital?.oxygenSaturation
    ? Math.round(parseFloat(latestVital.oxygenSaturation))
    : 98;
  const tempVal = latestVital?.bodyTemperature
    ? Math.round(parseFloat(latestVital.bodyTemperature))
    : 37;
  const sleepTotal = latestVital?.totalSleepTime
    ? parseFloat(latestVital.totalSleepTime)
    : null;
  const sleepDisplay =
    sleepTotal !== null && sleepTotal > 0
      ? `${Math.floor(sleepTotal / 60)}h ${Math.round(sleepTotal % 60)}m`
      : "6h 45m";

  // Rhythm data
  const rhythmData = {
    "7 days": [
      { label: "Fri", value: 68 },
      { label: "Sat", value: 71 },
      { label: "Sun", value: 69 },
      { label: "Mon", value: 76 },
      { label: "Tue", value: 74 },
      { label: "Wed", value: 75 },
      { label: "Today", value: 72 },
    ],
    "30 days": [
      { label: "W1", value: 70 },
      { label: "W2", value: 73 },
      { label: "W3", value: 75 },
      { label: "W4", value: 72 },
    ],
    "90 days": [
      { label: "Month 1", value: 69 },
      { label: "Month 2", value: 74 },
      { label: "Month 3", value: 72 },
    ],
  };

  const currentRhythm = rhythmData[rhythmRange];
  const rhythmWidth = 420;
  const rhythmHeight = 110;
  const rhythmLinePath = getSplinePath(
    currentRhythm,
    rhythmWidth,
    rhythmHeight,
  );
  const rhythmAreaPath = `${rhythmLinePath} L ${rhythmWidth} ${rhythmHeight} L 0 ${rhythmHeight} Z`;

  // Trend latest metric stat
  const trendLatest = trendVitals.length > 0 ? trendVitals[0] : latestVital;
  const currentHr = trendLatest?.heartRate
    ? Math.round(parseFloat(trendLatest.heartRate))
    : (digitalTwin?.physiology?.heartRate?.value ? Math.round(digitalTwin.physiology.heartRate.value) : 70);
  const hrBaseline = digitalTwin?.baselines?.heartRate?.value
    ? Math.round(digitalTwin.baselines.heartRate.value)
    : 79;
  const hrDiff = Math.round(currentHr - hrBaseline);

  const currentSys = trendLatest?.systolicBP
    ? Math.round(parseFloat(trendLatest.systolicBP))
    : (digitalTwin?.physiology?.systolicBP?.value ? Math.round(digitalTwin.physiology.systolicBP.value) : 120);
  const sysBaseline = digitalTwin?.baselines?.systolicBP?.value
    ? Math.round(digitalTwin.baselines.systolicBP.value)
    : 120;
  const sysDiff = Math.round(currentSys - sysBaseline);

  const currentDia = trendLatest?.diastolicBP
    ? Math.round(parseFloat(trendLatest.diastolicBP))
    : (digitalTwin?.physiology?.diastolicBP?.value ? Math.round(digitalTwin.physiology.diastolicBP.value) : 80);
  const diaBaseline = digitalTwin?.baselines?.diastolicBP?.value
    ? Math.round(digitalTwin.baselines.diastolicBP.value)
    : 80;
  const diaDiff = Math.round(currentDia - diaBaseline);

  const currentTemp = trendLatest?.bodyTemperature
    ? parseFloat(trendLatest.bodyTemperature).toFixed(1)
    : digitalTwin?.physiology?.bodyTemperature?.value
      ? digitalTwin.physiology.bodyTemperature.value.toFixed(1)
      : "37.0";
  const tempBaseline = digitalTwin?.baselines?.bodyTemperature?.value
    ? Math.round(digitalTwin.baselines.bodyTemperature.value)
    : 37;
  const tempDiff = Math.round(parseFloat(currentTemp) - tempBaseline);

  const hrTrend = digitalTwin?.trends?.find((t) => t.vital === "heartRate");
  const hrTrendStatus = hrTrend
    ? {
        text:
          hrTrend.direction?.toUpperCase() === "INCREASING"
            ? "Increasing"
            : hrTrend.direction?.toUpperCase() === "DECREASING"
              ? "Decreasing"
              : "Stable",
        dot:
          hrTrend.direction?.toUpperCase() === "INCREASING"
            ? "bg-amber-500"
            : hrTrend.direction?.toUpperCase() === "DECREASING"
              ? "bg-blue-500"
              : "bg-slate-300",
        color:
          hrTrend.direction?.toUpperCase() === "INCREASING"
            ? "text-amber-600 font-medium"
            : hrTrend.direction?.toUpperCase() === "DECREASING"
              ? "text-blue-600 font-medium"
              : "text-slate-500",
      }
    : { text: "Stable", dot: "bg-slate-300", color: "text-slate-500" };

  const bpStatus =
    sysDisplay >= 140 || diaDisplay >= 90
      ? { text: "High", dot: "bg-rose-500", color: "text-rose-600 font-medium" }
      : sysDisplay > 120 || diaDisplay > 80
        ? { text: "Above ideal", dot: "bg-amber-500", color: "text-amber-600 font-medium" }
        : { text: "Optimal", dot: "bg-emerald-500", color: "text-emerald-600 font-medium" };

  const o2Status =
    o2Display < 90
      ? { text: "Low", dot: "bg-rose-500", color: "text-rose-600 font-medium" }
      : o2Display < 95
        ? { text: "Below ideal", dot: "bg-amber-500", color: "text-amber-600 font-medium" }
        : { text: "In your usual range", dot: "bg-slate-300", color: "text-slate-500" };

  const sleepStatus =
    sleepTotal !== null && sleepTotal > 0 && sleepTotal < 360
      ? { text: "Less than usual", dot: "bg-amber-500", color: "text-amber-600 font-medium" }
      : { text: "Normal", dot: "bg-emerald-400", color: "text-slate-500" };

  // Comparison table items using digitalTwin physiology and baselines
  const comparisonData = useMemo(() => {
    // 1. Heart rate
    const hrBase = Math.round(digitalTwin?.baselines?.heartRate?.value ?? 79);
    const hrVal =
      Math.round(digitalTwin?.physiology?.heartRate?.value ?? 70) ??
      (latestVital?.heartRate
        ? Math.round(parseFloat(latestVital.heartRate))
        : 70);
    const hrDiffVal = Math.round(hrVal - hrBase);

    // 2. Blood oxygen
    const o2Base = Math.round(digitalTwin?.baselines?.spo2?.value ?? 98);
    const o2Val =
      (digitalTwin?.physiology as any)?.spo2?.value ??
      (digitalTwin?.physiology as any)?.oxygenSaturation?.value ??
      (latestVital?.oxygenSaturation
        ? Math.round(parseFloat(latestVital.oxygenSaturation))
        : 97);
    const o2DiffVal = Math.round(o2Val - o2Base);

    // 3. Body temperature
    const tempBase = Math.round(
      digitalTwin?.baselines?.bodyTemperature?.value ?? 37,
    );
    const tempVal =
      Math.round(digitalTwin?.physiology?.bodyTemperature?.value ?? 35) ??
      (latestVital?.bodyTemperature
        ? parseFloat(parseFloat(latestVital.bodyTemperature).toFixed(1))
        : 37);
    const tempDiffVal = Number((tempVal - tempBase).toFixed(1));

    // 4. Heart rate variability
    const hrvBase = Math.round(digitalTwin?.baselines?.hrv?.value ?? 36);
    const hrvVal =
      Math.round(digitalTwin?.physiology?.hrv?.value ?? 29) ??
      (latestVital?.hrv ? Math.round(parseFloat(latestVital.hrv)) : 45);
    const hrvDiffVal = Math.round(hrvVal - hrvBase);

    // 5. Systolic pressure
    const sysBase = Math.round(
      digitalTwin?.baselines?.systolicBP?.value ?? 123,
    );
    const sysVal =
      Math.round(digitalTwin?.physiology?.systolicBP?.value ?? 125) ??
      (latestVital?.systolicBP
        ? Math.round(parseFloat(latestVital.systolicBP))
        : 120);
    const sysDiffVal = Math.round(sysVal - sysBase);

    // 6. Diastolic pressure
    const diaBase = Math.round(
      digitalTwin?.baselines?.diastolicBP?.value ?? 82,
    );
    const diaVal =
      Math.round(digitalTwin?.physiology?.diastolicBP?.value ?? 85) ??
      (latestVital?.diastolicBP
        ? Math.round(parseFloat(latestVital.diastolicBP))
        : 77);
    const diaDiffVal = Math.round(diaVal - diaBase);

    return [
      {
        signal: "Heart rate",
        baseline: `${hrBase} bpm`,
        today: `${hrVal} bpm`,
        diff:
          hrDiffVal === 0
            ? "No change"
            : `${hrDiffVal > 0 ? `+${hrDiffVal}` : hrDiffVal} bpm`,
        type: hrDiffVal === 0 ? "neutral" : "purple",
      },
      {
        signal: "Blood oxygen",
        baseline: `${o2Base}%`,
        today: `${o2Val}%`,
        diff:
          o2DiffVal === 0
            ? "No change"
            : `${o2DiffVal > 0 ? `+${o2DiffVal}` : o2DiffVal}%`,
        type: o2DiffVal === 0 ? "neutral" : "purple",
      },
      {
        signal: "Body temperature",
        baseline: `${tempBase}°C`,
        today: `${tempVal}°C`,
        diff:
          tempDiffVal === 0
            ? "No change"
            : `${tempDiffVal > 0 ? `+${tempDiffVal}` : tempDiffVal}°C`,
        type: tempDiffVal === 0 ? "neutral" : "purple",
      },
      {
        signal: "Heart rate variability",
        baseline: `${hrvBase} ms`,
        today: `${hrvVal} ms`,
        diff:
          hrvDiffVal === 0
            ? "No change"
            : `${hrvDiffVal > 0 ? `+${hrvDiffVal}` : hrvDiffVal} ms`,
        type: hrvDiffVal === 0 ? "neutral" : "purple",
      },
      {
        signal: "Systolic pressure",
        baseline: `${sysBase} mmHg`,
        today: `${sysVal} mmHg`,
        diff:
          sysDiffVal === 0
            ? "No change"
            : `${sysDiffVal > 0 ? `+${sysDiffVal}` : sysDiffVal} mmHg`,
        type: sysDiffVal === 0 ? "neutral" : "purple",
      },
      {
        signal: "Diastolic pressure",
        baseline: `${diaBase} mmHg`,
        today: `${diaVal} mmHg`,
        diff:
          diaDiffVal === 0
            ? "No change"
            : `${diaDiffVal > 0 ? `+${diaDiffVal}` : diaDiffVal} mmHg`,
        type: diaDiffVal === 0 ? "neutral" : "purple",
      },
    ];
  }, [digitalTwin, latestVital]);

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col">
      {/* Scrollable screen content */}
      <div
        className="w-full h-full overflow-y-auto overflow-x-hidden bg-[#F6F6FA] text-[#1c192d] selection:bg-purple-200 pb-20 font-sans"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Tablet Header Bar */}
        <header className="w-full bg-white border-b border-slate-200/50 sticky top-0 z-20 backdrop-blur-md">
          <div className="px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            {/* <div className="flex items-center gap-2">
              <SparkleIcon className="w-5 h-5 text-[#7C6EAD]" fill="#7C6EAD" />
              <span className="text-lg font-bold tracking-tight text-[#16122b]">
                careMP Sentinel
              </span>
            </div> */}
            <img src={Logo} className="w-36 sm:w-40 shrink-0" alt="logo" />

            {/* User Profile Capsule, Telemedicine & Sign Out */}
            <div className="flex items-center gap-3">
              {onOpenTelemedicine && (
                <button
                  onClick={onOpenTelemedicine}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                  <span>Tele-Consult</span>
                </button>
              )}

              <div className="flex items-center gap-2 bg-white/90 border border-slate-200/80 rounded-full px-3 py-1 shadow-2xs">
                <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center text-[10px] font-semibold text-slate-700">
                  {currentUser?.firstName?.[0] || "J"}
                </div>
                <span className="text-xs font-medium text-slate-800">
                  {currentUser?.firstName || "John"}
                </span>
              </div>

              <button
                onClick={onSignOut}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="px-6 py-6 space-y-7 max-w-[1180px] mx-auto">
          {/* Section 1: Greeting & Synced Indicator */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#212239]">
                  Good evening, {currentUser?.firstName || "John"}.
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  A clear picture of your health. A little guidance for
                  what&apos;s next.
                </p>
              </div>

              {/* Live Indicator Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/70 bg-white/90 text-xs font-medium text-slate-600 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span>Live · Synced 1 min ago</span>
              </div>
            </div>

            {/* Top Two Hero Cards */}
            <div className="grid grid-cols-12 gap-4">
              {/* Daily Wellness Gradient Card (8 cols) */}
              <div className="col-span-8 rounded-3xl p-6 bg-gradient-to-br from-[#26233E] via-[#494071] to-[#7C6EAD] text-white shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-60 h-60 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

                <div>
                  <span className="text-[10px] font-bold tracking-widest text-purple-200/80 uppercase">
                    YOUR DAILY WELLNESS
                  </span>

                  <div className="flex items-center justify-between gap-4 mt-3">
                    {/* Left Side: Score & Insights */}
                    <div className="space-y-2.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-medium tracking-tight">
                          86
                        </span>
                        <span className="text-sm text-purple-200/80 font-medium">
                          / 100
                        </span>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/15 backdrop-blur-xs text-white border border-white/10">
                          Good
                        </span>
                      </div>

                      <div className="space-y-0.5 max-w-sm">
                        <p className="text-xs font-medium text-white/95">
                          Steady overall. A little more rest will help.
                        </p>
                        <p className="text-[11px] text-purple-200/75 leading-relaxed">
                          Your body is holding its rhythm, with sleep below your
                          usual.
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Circular Gauge */}
                    <div className="flex flex-col items-center shrink-0">
                      <WellnessScorePieChart
                        score={86}
                        size={106}
                        strokeWidth={6}
                      />
                      {/* <span className="text-[10px] text-purple-200/70 font-medium mt-1.5">
                        A picture of today
                      </span> */}
                    </div>
                  </div>
                </div>

                {/* Bottom Row Link */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-purple-200/90 font-medium mt-4">
                  <a
                    href="#digital-twin"
                    className="hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    <span>Explore your Digital Twin</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>

              {/* Sentinel Insight Card (4 cols) */}
              <div className="col-span-4 rounded-3xl p-6 bg-[#F5F3FB] border border-purple-100/70 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-purple-700">
                    <SparkleIcon className="w-3.5 h-3.5 fill-purple-600" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                      SENTINEL INSIGHT
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#16122b] mt-2 leading-snug">
                    Your recovery could use a little extra kindness.
                  </h3>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Your vitals are steady. Three nights of less sleep may leave
                    you feeling more tired than usual.
                  </p>
                </div>

                {/* Footer Tags */}
                <div className="flex items-center justify-between text-[11px] pt-4 border-t border-purple-200/50 mt-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200/60">
                    Moderate fatigue risk
                  </span>
                  <span className="text-slate-400 font-medium">
                    92% confidence
                  </span>
                </div>
              </div>
            </div>

            {/* Pheno-Genomics & Longevity Summary Card */}
            <div className="rounded-3xl p-5 bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                    <Dna className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#16122b]">Pheno-Genomics &amp; Longevity Clock</h3>
                    <p className="text-[11px] text-slate-500">Biological age calculation and pharmacogenomic safety targets</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    Bio-Age: 68.2 yrs (-3.8 yrs)
                  </span>
                  {onOpenTelemedicine && (
                    <button
                      onClick={onOpenTelemedicine}
                      className="text-xs text-purple-600 hover:text-purple-700 font-semibold cursor-pointer underline"
                    >
                      Discuss with Doctor &rarr;
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <div className="text-emerald-800 font-semibold text-[11px]">Biological Age Delta</div>
                  <div className="text-xl font-mono font-bold text-emerald-950 mt-1">-3.8 Yrs</div>
                  <p className="text-[10px] text-emerald-700/80 mt-0.5">e-FI Frailty Index: 0.12 (Robust)</p>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <div className="text-purple-800 font-semibold text-[11px]">Coronary PRS Target</div>
                  <div className="text-xl font-mono font-bold text-purple-950 mt-1">&lt; 125 mmHg</div>
                  <p className="text-[10px] text-purple-700/80 mt-0.5">84th pct CAD risk management</p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                  <div className="text-amber-800 font-semibold text-[11px]">PGx Safety Profile</div>
                  <div className="text-base font-bold text-amber-950 mt-1">Ticagrelor Active</div>
                  <p className="text-[10px] text-amber-700/80 mt-0.5">CYP2C19 resistance protected</p>
                </div>
              </div>
            </div>

            {/* Row 2: "Your vitals, right now" */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#16122b]">
                  Your vitals, right now
                </h2>
                <span className="text-[11px] text-slate-400">
                  Auto-refreshes every minute
                </span>
              </div>

              {/* 5 Vitals Cards */}
              <div className="grid grid-cols-5 gap-3">
                {/* Heart rate */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-normal text-slate-500">
                      Heart rate
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline">
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                      {hrDisplay}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal ml-1">
                      bpm
                    </span>
                  </div>
                  <div className={`mt-1.5 flex items-center gap-1 text-[11px] ${hrTrendStatus.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hrTrendStatus.dot}`} />
                    <span>{hrTrendStatus.text}</span>
                  </div>
                </div>

                {/* Blood pressure */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-normal text-slate-500">
                      Blood pressure
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline">
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                      {sysDisplay}/{diaDisplay}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal ml-1">
                      mmHg
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Above ideal</span>
                  </div>
                </div>

                {/* Blood oxygen */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" />
                    <span className="text-xs font-normal text-slate-500">
                      Blood oxygen
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline">
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                      {o2Display}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal ml-1">
                      %
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>In your usual range</span>
                  </div>
                </div>

                {/* Body temperature */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-normal text-slate-500">
                      Body temperature
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline">
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                      {tempVal}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal ml-1">
                      °C
                    </span>
                  </div>
                  <div className={`mt-1.5 flex items-center gap-1 text-[11px] ${hrTrendStatus.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hrTrendStatus.dot}`} />
                    <span>{hrTrendStatus.text}</span>
                  </div>
                </div>

                {/* Sleep */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-normal text-slate-500">
                      Sleep
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline">
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                      {sleepDisplay}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Less than usual</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Wellness Rhythm & Action Steps */}
            <div className="grid grid-cols-12 gap-4">
              {/* Your wellness rhythm card (8 cols) */}
              <div className="col-span-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#16122b]">
                      Your wellness rhythm
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      A steady week, with a softer landing today.
                    </p>
                  </div>

                  {/* Segmented Filter Pills */}
                  <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100/80 border border-slate-200/50">
                    {(["7 days", "30 days", "90 days"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setRhythmRange(tab)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                          rhythmRange === tab
                            ? "bg-white text-purple-700 shadow-2xs font-semibold"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart Area */}
                <div className="relative mt-5 pt-2">
                  <div className="w-full h-24 relative flex flex-col justify-between pointer-events-none">
                    {[79, 65, 50].map((tick) => (
                      <div key={tick} className="flex items-center w-full">
                        <span className="text-[10px] text-slate-300 w-5 font-mono">
                          {tick}
                        </span>
                        <div className="flex-1 border-b border-slate-100 ml-2" />
                      </div>
                    ))}
                  </div>

                  {/* SVG Spline */}
                  <div className="absolute inset-x-0 bottom-6 top-1 ml-6">
                    <svg
                      className="w-full h-full overflow-visible"
                      viewBox={`0 0 ${rhythmWidth} ${rhythmHeight}`}
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="tabRhythmGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#8d66eb"
                            stopOpacity="0.22"
                          />
                          <stop
                            offset="100%"
                            stopColor="#8d66eb"
                            stopOpacity="0.0"
                          />
                        </linearGradient>
                      </defs>

                      <path d={rhythmAreaPath} fill="url(#tabRhythmGrad)" />
                      <path
                        d={rhythmLinePath}
                        fill="none"
                        stroke="#8c67eb"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Active Endpoint Node on Today */}
                      <circle cx={rhythmWidth} cy={52} r="5" fill="#8c67eb" />
                      <circle cx={rhythmWidth} cy={52} r="2" fill="#ffffff" />
                    </svg>
                  </div>

                  {/* X Axis Labels */}
                  <div className="flex justify-between items-center ml-6 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    {currentRhythm.map((item, idx) => (
                      <span
                        key={idx}
                        className={
                          item.label === "Today"
                            ? "font-semibold text-slate-700"
                            : ""
                        }
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* A small step for tonight card (4 cols) */}
              <div className="col-span-4 bg-[#F5F3FB] rounded-3xl p-6 border border-purple-100/70 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">
                    A SMALL STEP FOR TONIGHT
                  </span>

                  <h3 className="text-sm font-bold text-[#16122b] mt-1.5">
                    Give recovery a head start.
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Deep sleep is down 14%; daily steps are down 8%.
                  </p>

                  {/* Action Item Capsules */}
                  <div className="space-y-4">
                    <div
                      onClick={() => toggleStep("step1")}
                      className={`rounded-xl p-2.5 flex items-center gap-3 border transition-all cursor-pointer ${
                        completedSteps["step1"]
                          ? "bg-purple-50 border-purple-200"
                          : "bg-white hover:bg-slate-50 border-slate-200/60"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shadow-2xs border transition-colors ${
                          completedSteps["step1"]
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                      >
                        {completedSteps["step1"] ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          "01"
                        )}
                      </span>
                      <span
                        className={`text-xs font-medium line-clamp-1 ${
                          completedSteps["step1"]
                            ? "text-purple-900 line-through decoration-purple-300"
                            : "text-slate-800"
                        }`}
                      >
                        Take a gentle 30-minute walk
                      </span>
                    </div>

                    <div
                      onClick={() => toggleStep("step2")}
                      className={`rounded-xl p-2.5 flex items-center gap-3 border transition-all cursor-pointer ${
                        completedSteps["step2"]
                          ? "bg-purple-50 border-purple-200"
                          : "bg-white hover:bg-slate-50 border-slate-200/60"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shadow-2xs border transition-colors ${
                          completedSteps["step2"]
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                      >
                        {completedSteps["step2"] ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          "02"
                        )}
                      </span>
                      <span
                        className={`text-xs font-medium line-clamp-1 ${
                          completedSteps["step2"]
                            ? "text-purple-900 line-through decoration-purple-300"
                            : "text-slate-800"
                        }`}
                      >
                        Wind down 15 minutes earlier
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Vital Relationships & Body Data */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <VitalRelationshipsCard correlations={digitalTwin?.correlations} />
            </div>
            <div className="lg:col-span-5">
              <BodyDataCard body={digitalTwin?.body} />
            </div>
          </section>

          {/* Section 2: "Your body, in context." */}
          <section id="digital-twin" className="space-y-5 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#16122b]">
                  Your body, in context.
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Understand what&apos;s changing — and what&apos;s normal for
                  you.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/70 bg-white/90 text-xs font-medium text-slate-600 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span>Live · Synced 1 min ago</span>
              </div>
            </div>

            {/* Grid Layout: Left Digital Twin Graphic vs Right Detailed Data Cards */}
            <div className="grid grid-cols-12 gap-4 items-start">
              {/* Left Column: Digital Twin Card (5 cols) */}
              <div className="col-span-5 bg-[#eeeaf6] rounded-3xl p-5 border border-purple-200/50 shadow-xs relative flex flex-col justify-between min-h-[560px]">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#16122b]">
                      Your digital twin
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      A living picture of your body
                    </p>
                  </div>

                  <div className="bg-white/80 border border-purple-200/60 rounded-xl px-3 py-1 text-center shadow-2xs">
                    <div className="text-sm font-bold text-purple-950 leading-tight">
                      92%
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium">
                      53-min wellness
                    </div>
                  </div>
                </div>

                {/* Organ Selector Tabs/Pills */}
                <div className="flex items-center justify-center gap-1 mt-2.5 mb-1 flex-wrap">
                  {[
                    { id: "brain", label: "Brain", desc: "Sleep" },
                    { id: "heart", label: "Heart", desc: "HR & Trend" },
                    { id: "lungs", label: "Lungs", desc: "SpO₂" },
                    { id: "hands", label: "Arms", desc: "BP" },
                  ].map((organ) => {
                    const isAct = selectedOrgan === organ.id;
                    return (
                      <button
                        key={organ.id}
                        type="button"
                        onClick={() =>
                          setSelectedOrgan(
                            isAct ? null : (organ.id as OrganType),
                          )
                        }
                        className={`px-2.5 py-0.5 text-[10.5px] font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                          isAct
                            ? "bg-[#16122b] text-white shadow-xs"
                            : "bg-white/80 hover:bg-white text-slate-600 border border-purple-100"
                        }`}
                      >
                        <span>{organ.label}</span>
                        <span
                          className={`text-[9px] ${
                            isAct ? "text-purple-200" : "text-slate-400"
                          }`}
                        >
                          · {organ.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Center Human Body Illustration Container */}
                <div className="relative my-3 flex items-center justify-center min-h-[380px]">
                  <div className="relative w-56 max-w-full flex items-center justify-center">
                    <HumanBodyIllustration
                      className="w-full h-auto max-h-[380px] select-none drop-shadow-xs"
                      selectedOrgan={selectedOrgan}
                      onSelectOrgan={setSelectedOrgan}
                    />

                    {/* SVG Connector Callout Lines */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                      viewBox="0 0 240 598"
                    >
                      {/* Brain Callout Line */}
                      {selectedOrgan === "brain" && (
                        <g className="animate-in fade-in duration-200">
                          <line
                            x1="120"
                            y1="30"
                            x2="-20"
                            y2="30"
                            stroke="#b582a0"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          <circle
                            cx="120"
                            cy="30"
                            r="4"
                            fill="#b9839e"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                          <circle cx="-20" cy="30" r="3" fill="#b9839e" />
                        </g>
                      )}

                      {/* Heart Callout Line */}
                      {selectedOrgan === "heart" && (
                        <g className="animate-in fade-in duration-200">
                          <line
                            x1="138"
                            y1="160"
                            x2="260"
                            y2="160"
                            stroke="#f472b6"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          <circle
                            cx="138"
                            cy="160"
                            r="4"
                            fill="#e11d48"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                          <circle cx="260" cy="160" r="3" fill="#e11d48" />
                        </g>
                      )}

                      {/* Lungs Callout Line */}
                      {selectedOrgan === "lungs" && (
                        <g className="animate-in fade-in duration-200">
                          <line
                            x1="95"
                            y1="145"
                            x2="-20"
                            y2="145"
                            stroke="#b582a0"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          <circle
                            cx="95"
                            cy="145"
                            r="4"
                            fill="#b9839e"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                          <circle cx="-20" cy="145" r="3" fill="#b9839e" />
                        </g>
                      )}

                      {/* Hands / Arms Callout Line */}
                      {selectedOrgan === "hands" && (
                        <g className="animate-in fade-in duration-200">
                          <line
                            x1="25"
                            y1="230"
                            x2="-20"
                            y2="230"
                            stroke="#b18aa8"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          <circle
                            cx="25"
                            cy="230"
                            r="4"
                            fill="#d97706"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                          <circle cx="-20" cy="230" r="3" fill="#d97706" />
                        </g>
                      )}
                    </svg>
                  </div>

                  {/* Callout: Brain & Sleep */}
                  {selectedOrgan === "brain" && (
                    <div className="absolute top-[2%] -left-1 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-purple-200/80 z-20 min-w-[175px] max-w-[205px] animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-900 uppercase tracking-wider">
                        <Moon className="w-3.5 h-3.5 text-purple-600" />
                        <span>Sleep & Recovery</span>
                      </div>
                      <div className="text-lg font-extrabold text-[#16122b] mt-1 tracking-tight">
                        {sleepDisplay}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-medium">
                        <span
                          className={`w-2 h-2 rounded-full ${sleepStatus.dot}`}
                        />
                        <span>{sleepStatus.text}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Deep sleep:</span>
                          <span className="font-semibold text-slate-700">
                            {latestVital?.deepSleepTime
                              ? `${Math.floor(parseFloat(latestVital.deepSleepTime) / 60)}h ${Math.round(parseFloat(latestVital.deepSleepTime) % 60)}m`
                              : "1h 24m"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>REM sleep:</span>
                          <span className="font-semibold text-slate-700">
                            {latestVital?.remSleepTime
                              ? `${Math.floor(parseFloat(latestVital.remSleepTime) / 60)}h ${Math.round(parseFloat(latestVital.remSleepTime) % 60)}m`
                              : "1h 45m"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Circadian:</span>
                          <span className="font-semibold text-emerald-600">
                            Restorative
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Callout: Heart Rate & Trend & Baseline */}
                  {selectedOrgan === "heart" && (
                    <div className="absolute top-[20%] -right-1 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-rose-200/80 z-20 min-w-[175px] max-w-[205px] animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-900 uppercase tracking-wider">
                        <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />
                        <span>Heart Rate</span>
                      </div>
                      <div className="text-lg font-extrabold text-[#16122b] mt-1 tracking-tight">
                        {hrDisplay}{" "}
                        <span className="text-xs font-semibold text-slate-400">
                          bpm
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-medium">
                        <span
                          className={`w-2 h-2 rounded-full ${hrTrendStatus.dot}`}
                        />
                        <span>
                          Trend:{" "}
                          <span className="font-semibold text-slate-800">
                            {hrTrendStatus.text}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Baseline:</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {hrBaseline} bpm
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Difference:</span>
                          <span
                            className={`font-semibold font-mono ${
                              hrDiff < 0
                                ? "text-emerald-600"
                                : hrDiff > 0
                                  ? "text-amber-600"
                                  : "text-slate-600"
                            }`}
                          >
                            {hrDiff >= 0 ? `+${hrDiff}` : hrDiff} bpm
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Callout: Oxygen Saturation */}
                  {selectedOrgan === "lungs" && (
                    <div className="absolute top-[18%] -left-1 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-cyan-200/80 z-20 min-w-[175px] max-w-[205px] animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-900 uppercase tracking-wider">
                        <Droplets className="w-3.5 h-3.5 text-cyan-600 fill-cyan-500" />
                        <span>Oxygen Saturation</span>
                      </div>
                      <div className="text-lg font-extrabold text-[#16122b] mt-1 tracking-tight">
                        {o2Display}%
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-medium">
                        <span
                          className={`w-2 h-2 rounded-full ${o2Status.dot}`}
                        />
                        <span>{o2Status.text}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Baseline:</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {Math.round(
                              digitalTwin?.baselines?.spo2?.value ?? 98,
                            )}
                            %
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Target:</span>
                          <span className="font-semibold text-emerald-600 font-mono">
                            95 - 100%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Callout: Blood Pressure (Systolic & Diastolic) */}
                  {selectedOrgan === "hands" && (
                    <div className="absolute top-[32%] -left-1 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-amber-200/80 z-20 min-w-[185px] max-w-[215px] animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                        <Activity className="w-3.5 h-3.5 text-amber-600" />
                        <span>Blood Pressure</span>
                      </div>
                      <div className="text-lg font-extrabold text-[#16122b] mt-1 tracking-tight">
                        {sysDisplay}/{diaDisplay}{" "}
                        <span className="text-xs font-semibold text-slate-400">
                          mmHg
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-medium">
                        <span
                          className={`w-2 h-2 rounded-full ${bpStatus.dot}`}
                        />
                        <span>{bpStatus.text}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Systolic:</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {currentSys} mmHg (Base {sysBaseline})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Diastolic:</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {currentDia} mmHg (Base {diaBaseline})
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Footer Details */}
                <div className="pt-3 border-t border-purple-200/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">
                      ALL SYSTEMS CONNECTED
                    </span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Small shifts. One connected picture.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: 3 Cards Stack (7 cols) */}
              <div className="col-span-7 space-y-4">
                {/* Card 1: "You, compared with your usual" */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#16122b]">
                        You, compared with your usual
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your recent readings alongside your personal baseline.
                      </p>
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
                      >
                        <span>{selectedTimeFilter}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 text-xs">
                          {["Last 30 minutes", "Last 2 hours", "Today"].map(
                            (opt) => (
                              <div
                                key={opt}
                                onClick={() => {
                                  setSelectedTimeFilter(opt);
                                  setIsDropdownOpen(false);
                                }}
                                className="px-3 py-1.5 hover:bg-slate-50 cursor-pointer font-medium text-slate-700"
                              >
                                {opt}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                          <th className="py-2 font-medium">HEALTH SIGNAL</th>
                          <th className="py-2 font-medium">BASELINE</th>
                          <th className="py-2 font-medium">TODAY</th>
                          <th className="py-2 font-medium text-right">
                            VS. BASELINE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/60 font-medium">
                        {comparisonData.map((row, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            <td className="py-2.5 text-slate-800 flex items-center gap-2">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  row.type === "purple"
                                    ? "bg-purple-600"
                                    : "bg-slate-300"
                                }`}
                              />
                              <span>{row.signal}</span>
                            </td>
                            <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                              {row.baseline}
                            </td>
                            <td className="py-2.5 text-slate-800 font-mono text-[11px] font-semibold">
                              {row.today}
                            </td>
                            <td className="py-2.5 text-right font-mono text-[11px]">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md ${
                                  row.type === "purple"
                                    ? "bg-purple-50 text-purple-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {row.diff}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Card 2: "A closer look at your heart rate" / Vitals Trend Recharts */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#16122b]">
                        {selectedTrendMetric === "heartRate"
                          ? "A closer look at your heart rate"
                          : selectedTrendMetric === "systolicBP"
                            ? "A closer look at your SystolicBP"
                            : selectedTrendMetric === "diastolicBP"
                              ? "A closer look at your DiastolicBP"
                              : selectedTrendMetric === "temperature"
                                ? "A closer look at your temperature"
                                : "A closer look at you"}
                      </h3>

                      <div className="flex items-baseline gap-1 mt-1">
                        {selectedTrendMetric === null ? (
                          <span className="text-xs text-slate-500 font-normal">
                            All signals active · select any metric below to
                            isolate
                          </span>
                        ) : selectedTrendMetric === "heartRate" ? (
                          <>
                            <span className="text-xl font-bold text-slate-900">
                              {currentHr}
                            </span>
                            <span className="text-xs text-slate-500 font-normal">
                              bpm
                            </span>
                            <span className="text-xs text-slate-400 font-normal ml-2">
                              · {hrDiff >= 0 ? `+${hrDiff}` : hrDiff} bpm from
                              your baseline
                            </span>
                          </>
                        ) : selectedTrendMetric === "systolicBP" ? (
                          <>
                            <span className="text-xl font-bold text-slate-900">
                              {currentSys}
                            </span>
                            <span className="text-xs text-slate-500 font-normal">
                              mmHg
                            </span>
                            <span className="text-xs text-slate-400 font-normal ml-2">
                              · {sysDiff >= 0 ? `+${sysDiff}` : sysDiff} mmHg
                              from your baseline
                            </span>
                          </>
                        ) : selectedTrendMetric === "diastolicBP" ? (
                          <>
                            <span className="text-xl font-bold text-slate-900">
                              {currentDia}
                            </span>
                            <span className="text-xs text-slate-500 font-normal">
                              mmHg
                            </span>
                            <span className="text-xs text-slate-400 font-normal ml-2">
                              · {diaDiff >= 0 ? `+${diaDiff}` : diaDiff} mmHg
                              from your baseline
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-xl font-bold text-slate-900">
                              {currentTemp}
                            </span>
                            <span className="text-xs text-slate-500 font-normal">
                              °C
                            </span>
                            <span className="text-xs text-slate-400 font-normal ml-2">
                              ·{" "}
                              {Number(tempDiff) >= 0
                                ? `+${tempDiff}`
                                : tempDiff}{" "}
                              °C from your baseline
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Top Right Legend Indicator */}
                    <div className="flex items-center gap-4 text-xs">
                      {selectedTrendMetric !== null ? (
                        <>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span
                              className="w-3 h-0.5 rounded-full inline-block"
                              style={{
                                backgroundColor:
                                  METRIC_CONFIGS[selectedTrendMetric].color,
                              }}
                            />
                            <span>Recent</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="w-3 border-b-2 border-dotted border-slate-300 inline-block" />
                            <span>Baseline</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                          <span>4 channels synced</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vitals Trend Graph Recharts */}
                  <VitalsTrendGraph
                    data={trendVitals}
                    baseline={digitalTwin?.baselines?.heartRate?.value ?? 79}
                    baselines={digitalTwin?.baselines}
                    selectedMetric={selectedTrendMetric}
                    onSelectMetric={setSelectedTrendMetric}
                  />
                </div>

                {/* Card 3: "YOUR TWIN IS STILL LEARNING" Banner */}
                <div className="rounded-2xl p-4 bg-[#eeeaf6] border border-purple-200/50 shadow-2xs">
                  <span className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">
                    YOUR TWIN IS STILL LEARNING
                  </span>
                  <h4 className="text-sm font-bold text-[#16122b] mt-0.5">
                    A more personal sleep baseline is on its way.
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Your latest night: 6h 45m. More nights will help reveal your
                    usual rhythm.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Floating Sparkle Action Button in Bottom Right: truly floating in the bottom-right of the iPad screen! */}
      <div className="absolute bottom-5 right-5 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            if (onOpenAI) {
              onOpenAI();
            } else {
              setIsChatOpen(true);
            }
          }}
          aria-label="Sentinel AI Assistant"
          className="w-11 h-11 rounded-full bg-[#1e1738] hover:bg-[#2b2150] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        >
          <SparkleIcon className="w-5 h-5 fill-white transition-transform group-hover:rotate-12" />
        </button>
      </div>

      {/* In-Tablet Slide-Over AI Companion (strictly inside tablet screen bounds) */}
      {isChatOpen && (
        <div className="absolute inset-0 z-40 flex justify-end animate-in fade-in duration-150">
          {/* Dimmed backdrop inside tablet screen */}
          <div
            onClick={() => setIsChatOpen(false)}
            // className="absolute inset-0 bg-black/30 backdrop-blur-[1.5px]"
            className="absolute inset-0 bg-black/10"
          />

          {/* Slide-over panel inside tablet screen */}
          {/* <div className="relative w-[340px] h-full bg-white shadow-2xl z-10 flex flex-col border-l border-slate-200/80 animate-in slide-in-from-right duration-200"> */}
          <div className="relative w-[340px] h-full bg-white/50 backdrop-blur-lg shadow-2xl z-10 flex flex-col border-l border-slate-200/80 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#16122b]">
                    Sentinel AI Companion
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Personal health twin intelligence
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsChatOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] text-[11.5px] leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#1e1738] text-white rounded-br-xs"
                        : "bg-[#F5F3FB] text-slate-800 border border-purple-100 rounded-bl-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="p-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                {[
                  "Compare with baseline",
                  "How is my heart rhythm?",
                  "What should I do tonight?",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSendChatMessage(chip)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 font-medium transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-center gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendChatMessage();
                  }}
                  placeholder="Ask Sentinel AI anything..."
                  className="h-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-purple-500"
                />
                <button
                  onClick={() => handleSendChatMessage()}
                  disabled={!chatInput.trim()}
                  className="h-9 w-9 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TabletDashboardView;
