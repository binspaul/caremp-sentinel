import { useState, useEffect, useMemo } from "react";
import {
  HumanBodyIllustration,
  type OrganType,
} from "./components/humanBodyIllustration";
import { AIHealthCompanion } from "./components/aiHealthCompanion";
import { WellnessScorePieChart } from "./components/wellnessScorePieChart";
import {
  Heart,
  Droplets,
  Thermometer,
  Moon,
  ArrowUpRight,
  Activity,
  Check,
  LayoutGrid,
  Smartphone,
  Tablet,
  Video,
} from "lucide-react";
import Logo from "@/assets/logo.png";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Iphone16Pro } from "./components/iPhone16Pro";
import { IpadPro } from "./components/iPadPro";
import { MobileDashboardView } from "./components/mobileDashboardView";
import { TabletDashboardView } from "./components/tabletDashboardView";
import { PatientTelemedicineModal } from "./components/telemedicine/PatientTelemedicineModal";
import { PatientGenomicsCard } from "./components/genomics/PatientGenomicsCard";
import { Login } from "./Login";
import { getDigitalTwin, getVitals, getVitalsTrendData } from "./api";
import {
  VitalsTrendGraph,
  type VitalMetricKey,
  METRIC_CONFIGS,
} from "./components/vitalsTrendGraph";
import { getGreeting } from "./helpers";
import { VitalRecord } from "./types/vital";
import { ResidentDigitalTwinData } from "./types/digitalTwin";
import {
  VitalRelationshipsCard,
  BodyDataCard,
} from "./components/vitalRelationshipsAndBody";

export interface User {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
  gender: number;
  avatar?: string;
  roleName: string;
  personId?: number;
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem("token"));
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const fullName = [
    currentUser?.firstName,
    currentUser?.middleName,
    currentUser?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("auth");
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const [deviceTab, setDeviceTab] = useState<"dashboard" | "mobile" | "tablet">(
    "dashboard",
  );
  const [latestVital, setLatestVital] = useState<VitalRecord | null>(null);
  const [trendVitals, setTrendVitals] = useState<VitalRecord[]>([]);
  const [isTelemedicineOpen, setIsTelemedicineOpen] = useState(false);

  const [digitalTwin, setDigitalTwin] = useState<ResidentDigitalTwinData>();
  const [selectedOrgan, setSelectedOrgan] = useState<OrganType>("heart");
  console.log("digitalTwin", digitalTwin);

  const fetchVitalsData = async () => {
    try {
      const list = await getVitals();
      if (list && list.length > 0) {
        // use the latest one which will be the first one since its being ordered from API
        setLatestVital(list[0]);
      }
      const trendList = await getVitalsTrendData({
        total: 50,
        skip: 0,
        limit: 100,
      });
      if (trendList && trendList.length > 0) {
        setTrendVitals(trendList);
      }
    } catch (err) {
      console.error("Failed to fetch vitals:", err);
    }
  };

  const fetchDigitalTwin = async () => {
    try {
      const residentId = Number(currentUser?.personId || currentUser?.id || 1);
      const response = await getDigitalTwin(residentId);
      if (response) {
        setDigitalTwin(response);
      }
    } catch (err) {
      console.error("Failed to fetch residents digital twin:", err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDigitalTwin();
    const interval = setInterval(fetchDigitalTwin, 30 * 60 * 1000); // 30 min interval
    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser?.personId, currentUser?.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchVitalsData();
    const interval = setInterval(fetchVitalsData, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const [rhythmRange, setRhythmRange] = useState<
    "7 days" | "30 days" | "90 days"
  >("7 days");

  const [selectedTimeFilter, setSelectedTimeFilter] =
    useState("Last 30 minutes");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<{
    [key: string]: boolean;
  }>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTrendMetric, setSelectedTrendMetric] =
    useState<VitalMetricKey>(null);

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  // Rhythm chart data sets
  const rhythmDataSets = {
    "7 days": [
      { label: "Fri", value: 80, y: 70 },
      { label: "Sat", value: 82, y: 64 },
      { label: "Sun", value: 81, y: 67 },
      { label: "Mon", value: 88, y: 44 },
      { label: "Tue", value: 87, y: 48 },
      { label: "Wed", value: 86, y: 52 },
      { label: "Today", value: 86, y: 52 },
    ],
    "30 days": [
      { label: "W1", value: 82, y: 64 },
      { label: "W2", value: 85, y: 55 },
      { label: "W3", value: 89, y: 41 },
      { label: "W4", value: 86, y: 52 },
    ],
    "90 days": [
      { label: "Month 1", value: 83, y: 60 },
      { label: "Month 2", value: 85, y: 54 },
      { label: "Month 3", value: 87, y: 48 },
    ],
  };

  const currentRhythm = rhythmDataSets[rhythmRange];

  // Generate smooth SVG path for rhythm chart
  const getSplinePath = (points: { y: number }[], width: number) => {
    if (points.length < 2) return "";
    const dx = width / (points.length - 1);
    const coords = points.map((p, i) => ({ x: i * dx, y: p.y }));

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const rhythmWidth = 420;
  const rhythmHeight = 110;
  const rhythmLinePath = getSplinePath(currentRhythm, rhythmWidth);
  const rhythmAreaPath = `${rhythmLinePath} L ${rhythmWidth} ${rhythmHeight} L 0 ${rhythmHeight} Z`;

  // Comparison table items using digitalTwin physiology (current vitals) and baselines
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

  // If not authenticated, show Login screen
  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={() => {
          try {
            const stored = localStorage.getItem("user");
            if (stored) {
              setCurrentUser(JSON.parse(stored));
            }
          } catch {
            // ignore
          }
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // Dynamic vitals calculation from latest API record
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

  const hrNumber = latestVital?.heartRate
    ? parseFloat(latestVital.heartRate)
    : null;
  const hrDisplay =
    hrNumber !== null
      ? Math.round(hrNumber)
      : digitalTwin?.physiology?.heartRate?.value
        ? Math.round(digitalTwin.physiology.heartRate.value)
        : 72;
  const hrStatus =
    hrNumber !== null
      ? hrNumber > 100
        ? {
            text: "Elevated",
            dot: "bg-rose-500",
            color: "text-rose-600 font-medium",
          }
        : hrNumber < 60
          ? {
              text: "Low",
              dot: "bg-amber-500",
              color: "text-amber-600 font-medium",
            }
          : hrTrendStatus
      : hrTrendStatus;

  const sysNumber = latestVital?.systolicBP
    ? parseFloat(latestVital.systolicBP)
    : null;
  const diaNumber = latestVital?.diastolicBP
    ? parseFloat(latestVital.diastolicBP)
    : null;
  const bpDisplay =
    sysNumber !== null && diaNumber !== null
      ? `${Math.round(sysNumber)}/${Math.round(diaNumber)}`
      : "120/80";
  const bpStatus =
    sysNumber !== null && diaNumber !== null
      ? sysNumber >= 140 || diaNumber >= 90
        ? {
            text: "High",
            dot: "bg-rose-500",
            color: "text-rose-600 font-medium",
          }
        : sysNumber > 120 || diaNumber > 80
          ? {
              text: "Above ideal",
              dot: "bg-amber-500",
              color: "text-amber-600 font-medium",
            }
          : {
              text: "Optimal",
              dot: "bg-emerald-500",
              color: "text-emerald-600 font-medium",
            }
      : {
          text: "Above ideal",
          dot: "bg-amber-500",
          color: "text-amber-600 font-medium",
        };

  const o2Number = latestVital?.oxygenSaturation
    ? parseFloat(latestVital.oxygenSaturation)
    : null;
  const o2Display = o2Number !== null ? Math.round(o2Number) : 98;
  const o2Status =
    o2Number !== null
      ? o2Number < 90
        ? {
            text: "Low",
            dot: "bg-rose-500",
            color: "text-rose-600 font-medium",
          }
        : o2Number < 95
          ? {
              text: "Below ideal",
              dot: "bg-amber-500",
              color: "text-amber-600 font-medium",
            }
          : {
              text: "In your usual range",
              dot: "bg-slate-300",
              color: "text-slate-500",
            }
      : {
          text: "In your usual range",
          dot: "bg-slate-300",
          color: "text-slate-500",
        };

  const tempNumber = latestVital?.bodyTemperature
    ? parseFloat(latestVital.bodyTemperature)
    : null;
  const tempUnit = latestVital?.temperatureUnit === 1 ? "°F" : "°C";
  const tempDisplay = tempNumber !== null ? tempNumber.toFixed(1) : "37";
  const tempTrend = digitalTwin?.trends?.find(
    (t) => t.vital === "bodyTemperature",
  );
  const tempTrendStatus = tempTrend
    ? {
        text:
          tempTrend.direction?.toUpperCase() === "INCREASING"
            ? "Increasing"
            : tempTrend.direction?.toUpperCase() === "DECREASING"
              ? "Decreasing"
              : "Stable",
        dot:
          tempTrend.direction?.toUpperCase() === "INCREASING"
            ? "bg-amber-500"
            : tempTrend.direction?.toUpperCase() === "DECREASING"
              ? "bg-blue-500"
              : "bg-slate-300",
        color:
          tempTrend.direction?.toUpperCase() === "INCREASING"
            ? "text-amber-600 font-medium"
            : tempTrend.direction?.toUpperCase() === "DECREASING"
              ? "text-blue-600 font-medium"
              : "text-slate-500",
      }
    : { text: "Stable", dot: "bg-slate-300", color: "text-slate-500" };

  const tempStatus =
    tempNumber !== null
      ? tempNumber > 38.0
        ? {
            text: "Fever",
            dot: "bg-rose-500",
            color: "text-rose-600 font-medium",
          }
        : tempNumber > 37.5
          ? {
              text: "Slightly elevated",
              dot: "bg-amber-500",
              color: "text-amber-600 font-medium",
            }
          : tempTrendStatus
      : tempTrendStatus;

  const sleepNumber = latestVital?.totalSleepTime
    ? parseFloat(latestVital.totalSleepTime)
    : null;
  const sleepDisplay =
    sleepNumber !== null && sleepNumber > 0
      ? `${Math.floor(sleepNumber / 60)}h ${Math.round(sleepNumber % 60)}m`
      : latestVital
        ? latestVital.sleepStatus === 0
          ? "Awake"
          : "0h"
        : "6h 45m";
  const sleepStatus =
    sleepNumber !== null
      ? sleepNumber > 0 && sleepNumber < 360
        ? {
            text: "Less than usual",
            dot: "bg-amber-500",
            color: "text-amber-600 font-medium",
          }
        : sleepNumber === 0
          ? {
              text: "Tracking active",
              dot: "bg-slate-300",
              color: "text-slate-500",
            }
          : { text: "Normal", dot: "bg-emerald-400", color: "text-slate-500" }
      : {
          text: "Less than usual",
          dot: "bg-amber-500",
          color: "text-amber-600 font-medium",
        };

  const trendLatest = trendVitals.length > 0 ? trendVitals[0] : latestVital;
  const currentHr = trendLatest?.heartRate
    ? Math.round(parseFloat(trendLatest.heartRate))
    : digitalTwin?.physiology?.heartRate?.value
      ? Math.round(digitalTwin.physiology.heartRate.value)
      : 70;
  const hrBaseline = digitalTwin?.baselines?.heartRate?.value
    ? Math.round(digitalTwin.baselines.heartRate.value)
    : 79;
  const hrDiff = Math.round(currentHr - hrBaseline);

  const currentSys = trendLatest?.systolicBP
    ? Math.round(parseFloat(trendLatest.systolicBP))
    : digitalTwin?.physiology?.systolicBP?.value
      ? Math.round(digitalTwin.physiology.systolicBP.value)
      : 120;
  const sysBaseline = digitalTwin?.baselines?.systolicBP?.value
    ? Math.round(digitalTwin.baselines.systolicBP.value)
    : 120;
  const sysDiff = Math.round(currentSys - sysBaseline);

  const currentDia = trendLatest?.diastolicBP
    ? Math.round(parseFloat(trendLatest.diastolicBP))
    : digitalTwin?.physiology?.diastolicBP?.value
      ? Math.round(digitalTwin.physiology.diastolicBP.value)
      : 80;
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

  const rawWellnessScore =
    digitalTwin?.healthInsights?.healthyAgeing?.score || 80;
  const wellnessScore = Number(rawWellnessScore);

  const wellnessCategory =
    digitalTwin?.healthInsights?.healthyAgeing?.category || "GOOD";

  const triggeredRules = digitalTwin?.healthInsights?.healthyAgeing
    ?.triggeredRules || [
    "Steady overall. A little more rest will help.",
    "Your body is holding its rhythm, with sleep below your usual.",
  ];

  const aiSummary =
    digitalTwin?.aiSummary || "Your recovery could use a little kindness.";

  return (
    <Tabs
      value={deviceTab}
      onValueChange={(val) =>
        setDeviceTab(val as "dashboard" | "mobile" | "tablet")
      }
      className="min-h-screen bg-[#F6F6FA] text-[#1c192d] selection:bg-purple-200 flex flex-col"
    >
      {/* Top Header / Nav */}
      <header className="w-full bg-white border-b border-slate-200/50 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <img src={Logo} className="w-36 sm:w-40 shrink-0" alt="logo" />

          {/* Center Tabs: Dashboard, Mobile, Tablet */}
          <TabsList className="bg-[#ECEEF2] border border-slate-200/70 rounded-full p-1 h-auto gap-1">
            <TabsTrigger
              value="dashboard"
              className="rounded-full px-4 py-1.5 text-xs font-semibold gap-2 transition-all data-active:bg-white data-active:text-slate-900 data-active:shadow-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <LayoutGrid
                className={`w-4 h-4 transition-colors ${
                  deviceTab === "dashboard"
                    ? "text-purple-600"
                    : "text-slate-400"
                }`}
              />
              <span>Dashboard</span>
            </TabsTrigger>

            <TabsTrigger
              value="mobile"
              className="rounded-full px-4 py-1.5 text-xs font-semibold gap-2 transition-all data-active:bg-white data-active:text-slate-900 data-active:shadow-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <Smartphone
                className={`w-4 h-4 transition-colors ${
                  deviceTab === "mobile" ? "text-purple-600" : "text-slate-400"
                }`}
              />
              <span>Mobile</span>
            </TabsTrigger>

            <TabsTrigger
              value="tablet"
              className="rounded-full px-4 py-1.5 text-xs font-semibold gap-2 transition-all data-active:bg-white data-active:text-slate-900 data-active:shadow-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <Tablet
                className={`w-4 h-4 transition-colors ${
                  deviceTab === "tablet" ? "text-purple-600" : "text-slate-400"
                }`}
              />
              <span>Tablet</span>
            </TabsTrigger>
          </TabsList>

          {/* User Capsule, Telemedicine & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsTelemedicineOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
              <span>Live Tele-Consult</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
            </button>

            <div className="flex items-center gap-2 bg-white/90 border border-slate-200/80 rounded-full px-3 py-1 shadow-2xs">
              <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center text-[11px] font-semibold text-slate-700">
                {currentUser?.firstName?.[0] || "J"}
              </div>
              <span className="text-xs font-medium text-slate-800">
                {/* {currentUser?.firstName || "John"} */}
                {fullName || "John"}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Content 1: Dashboard (Current Layout & Design) */}
      <TabsContent value="dashboard" className="outline-none flex-1">
        <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-9">
          {/* Section 1: Greeting & Synced Indicator */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#212239]">
                  {getGreeting()}, {fullName}.
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  A clear picture of your health. A little guidance for
                  what&apos;s next.
                </p>
              </div>

              {/* Live Indicator Pill */}
              <div className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/70 bg-white/80 text-xs font-medium text-slate-600 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span>Live</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">Synced 1 min ago</span>
              </div>
            </div>

            {/* Top Two Featured Hero Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Daily Wellness Gradient Card */}
              <div className="lg:col-span-8 rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#26233E] via-[#494071] to-[#7C6EAD] text-white shadow-sm relative overflow-hidden flex flex-col justify-between">
                {/* Subtle background glow circle */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

                <div>
                  <span className="text-[10px] font-bold tracking-widest text-purple-200/80 uppercase">
                    YOUR DAILY WELLNESS
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mt-3">
                    {/* Left Side: Big Score & Insights */}
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl sm:text-6xl font-medium tracking-tight">
                          {wellnessScore}
                        </span>
                        <span className="text-base text-purple-200/80 font-medium">
                          / 100
                        </span>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/15 backdrop-blur-xs text-white border border-white/10">
                          {wellnessCategory}
                        </span>
                      </div>

                      <div className="space-y-1 max-w-md">
                        <p className="text-sm font-medium text-white/95">
                          {triggeredRules[0]}
                        </p>
                        <p className="text-xs text-purple-200/75 leading-relaxed">
                          {triggeredRules[1]}
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Circular Gauge */}
                    <div className="self-center sm:self-auto sm:pr-4">
                      <WellnessScorePieChart score={86} />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-6 mt-2 border-t border-white/10">
                  <a
                    href="#digital-twin"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 hover:text-white transition-colors group"
                  >
                    <span>Explore your Digital Twin</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>

              {/* Sentinel Insight Card */}
              <div className="lg:col-span-4 rounded-3xl p-6 sm:p-7 bg-[#EEEBF8] border border-slate-100 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-purple-600">
                    <SparkleIcon className="w-3.5 h-3.5 fill-purple-600" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                      SENTINEL INSIGHT
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#1a162e] mt-3 leading-snug">
                    AI Summary
                  </h3>

                  {/* <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Your vitals are steady. Three nights of less sleep may leave
                    you feeling more tired than usual.
                  </p> */}
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {aiSummary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#DCD6ED]">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E5DEEF] text-[#766080]">
                    Moderate fatigue risk
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    92% confidence
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: "Your vitals, right now" */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-[#16122b]">
                Your vitals, right now
              </h2>
              <span className="text-xs text-slate-400 font-normal">
                Auto-refreshes every minute
              </span>
            </div>

            {/* 5 Vitals Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* Heart rate */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2 text-slate-400">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-normal text-slate-500">
                    Heart rate
                  </span>
                </div>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {hrDisplay}
                  </span>
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    bpm
                  </span>
                </div>
                <div
                  className={`mt-2 flex items-center gap-1 text-[11px] ${hrStatus.color}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${hrStatus.dot}`}
                  ></span>
                  <span>{hrStatus.text}</span>
                </div>
              </div>

              {/* Blood pressure */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2 text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-normal text-slate-500">
                    Blood pressure
                  </span>
                </div>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {bpDisplay}
                  </span>
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    mmHg
                  </span>
                </div>
                <div
                  className={`mt-2 flex items-center gap-1 text-[11px] ${bpStatus.color}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${bpStatus.dot}`}
                  ></span>
                  <span>{bpStatus.text}</span>
                </div>
              </div>

              {/* Blood oxygen */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2 text-slate-400">
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  <span className="text-xs font-normal text-slate-500">
                    Blood oxygen
                  </span>
                </div>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {o2Display}
                  </span>
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    %
                  </span>
                </div>
                <div
                  className={`mt-2 flex items-center gap-1 text-[11px] ${o2Status.color}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${o2Status.dot}`}
                  ></span>
                  <span>{o2Status.text}</span>
                </div>
              </div>

              {/* Body temperature */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2 text-slate-400">
                  <Thermometer className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-normal text-slate-500">
                    Body temperature
                  </span>
                </div>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {tempDisplay}
                  </span>
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    {tempUnit}
                  </span>
                </div>
                <div
                  className={`mt-2 flex items-center gap-1 text-[11px] ${tempStatus.color}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${tempStatus.dot}`}
                  ></span>
                  <span>{tempStatus.text}</span>
                </div>
              </div>

              {/* Sleep */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-normal text-slate-500">
                    Sleep
                  </span>
                </div>
                <div className="mt-3 flex items-baseline">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {sleepDisplay}
                  </span>
                </div>
                <div
                  className={`mt-2 flex items-center gap-1 text-[11px] ${sleepStatus.color}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${sleepStatus.dot}`}
                  ></span>
                  <span>{sleepStatus.text}</span>
                </div>
              </div>
            </div>
          </section>

          {/* careMP Sentinel Pheno-Genomics & Longevity Matrix */}
          <section aria-label="Pheno-Genomics and Longevity">
            <PatientGenomicsCard onOpenTelemedicine={() => setIsTelemedicineOpen(true)} />
          </section>

          {/* Your wellness rhythm card */}
          <div className="hidden lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs flex flex-col justify-between">
            {/* Header + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#16122b]">
                  Your wellness rhythm
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  A steady week, with a softer landing today.
                </p>
              </div>

              {/* Segmented Filter Pills */}
              <div className="self-start sm:self-auto inline-flex items-center p-0.5 rounded-lg bg-slate-100/80 border border-slate-200/50">
                {(["7 days", "30 days", "90 days"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setRhythmRange(tab)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
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
            <div className="relative mt-6 pt-2">
              {/* Y Axis Grid Lines */}
              <div className="w-full h-28 relative flex flex-col justify-between pointer-events-none">
                {[95, 85, 75].map((tick) => (
                  <div key={tick} className="flex items-center w-full">
                    <span className="text-[10px] text-slate-300 w-6 font-mono">
                      {tick}
                    </span>
                    <div className="flex-1 border-b border-slate-100/90 ml-2" />
                  </div>
                ))}
              </div>

              {/* SVG Spline */}
              <div className="absolute inset-x-0 bottom-6 top-1 ml-7">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox={`0 0 ${rhythmWidth} ${rhythmHeight}`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="rhythmGrad" x1="0" y1="0" x2="0" y2="1">
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

                  {/* Shaded Area */}
                  <path d={rhythmAreaPath} fill="url(#rhythmGrad)" />

                  {/* Line */}
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
              <div className="flex justify-between items-center ml-7 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
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

          {/* Section 3: Vital Relationships, Body Data & Action Steps in the same row */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-5 flex flex-col">
              <VitalRelationshipsCard
                correlations={digitalTwin?.correlations}
              />
            </div>
            <div className="lg:col-span-3 flex flex-col">
              <BodyDataCard body={digitalTwin?.body} />
            </div>

            {/* A small step for tonight card */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs flex flex-col justify-between h-full">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-purple-600 uppercase">
                  A SMALL STEP FOR TONIGHT
                </span>

                <h3 className="text-sm font-bold text-[#16122b] mt-0.5">
                  Give recovery a head start.
                </h3>

                <p className="text-xs text-slate-500 mt-0.5 mb-3.5">
                  Deep sleep is down 14%; daily steps are down 8%.
                </p>

                {/* Action Item Capsules */}
                <div className="space-y-2.5">
                  {/* Step 1 */}
                  <div
                    onClick={() => toggleStep("step1")}
                    className={`group rounded-xl p-3 flex items-center gap-3 border transition-all cursor-pointer ${
                      completedSteps["step1"]
                        ? "bg-purple-50/70 border-purple-200"
                        : "bg-[#f8f7fc] hover:bg-[#f2eff9] border-slate-100"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shadow-2xs border transition-colors ${
                        completedSteps["step1"]
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-slate-400 border-slate-100 group-hover:text-purple-600"
                      }`}
                    >
                      {completedSteps["step1"] ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        "01"
                      )}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        completedSteps["step1"]
                          ? "text-purple-900 line-through decoration-purple-300"
                          : "text-slate-800"
                      }`}
                    >
                      Take a gentle 30-minute walk
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div
                    onClick={() => toggleStep("step2")}
                    className={`group rounded-xl p-3 flex items-center gap-3 border transition-all cursor-pointer ${
                      completedSteps["step2"]
                        ? "bg-purple-50/70 border-purple-200"
                        : "bg-[#f8f7fc] hover:bg-[#f2eff9] border-slate-100"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shadow-2xs border transition-colors ${
                        completedSteps["step2"]
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-slate-400 border-slate-100 group-hover:text-purple-600"
                      }`}
                    >
                      {completedSteps["step2"] ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        "02"
                      )}
                    </span>
                    <span
                      className={`text-xs font-medium ${
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

              <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  {Object.values(completedSteps).filter(Boolean).length} of 2
                  completed
                </span>
                <span className="text-purple-600 font-medium hover:underline cursor-pointer">
                  View all habits
                </span>
              </div>
            </div>
          </section>

          {/* Section 4: "Your body, in context." */}
          <section id="digital-twin" className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#16122b]">
                  Your body, in context.
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Understand what&apos;s changing — and what&apos;s normal for
                  you.
                </p>
              </div>

              {/* Live Indicator Pill */}
              <div className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/70 bg-white/80 text-xs font-medium text-slate-600 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span>Live</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">Synced 1 min ago</span>
              </div>
            </div>

            {/* Grid Layout: Left Digital Twin Graphic vs Right Detailed Data Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Digital Twin Card */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs relative flex flex-col justify-between min-h-[580px]">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#16122b]">
                      Your digital twin
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      A living picture of your body
                    </p>
                  </div>

                  {/* 92% Pill */}
                  <div className="bg-[#f5f2fb] border border-purple-100/90 rounded-2xl px-3.5 py-1.5 text-center">
                    <div className="text-base font-bold text-purple-950 leading-tight">
                      92%
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-medium">
                      34-min wellness
                    </div>
                  </div>
                </div>

                {/* Organ Selector Tabs/Pills */}
                <div className="flex items-center justify-center gap-1.5 mt-3 mb-1 flex-wrap">
                  {[
                    { id: "brain", label: "Brain", desc: "Sleep" },
                    { id: "heart", label: "Heart", desc: "HR & Trend" },
                    { id: "lungs", label: "Lungs", desc: "SpO₂" },
                    { id: "hands", label: "Arms / Hands", desc: "BP" },
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
                        className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                          isAct
                            ? "bg-[#16122b] text-white shadow-xs"
                            : "bg-white/80 hover:bg-white text-slate-600 border border-purple-100"
                        }`}
                      >
                        <span>{organ.label}</span>
                        <span
                          className={`text-[9.5px] ${
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
                <div className="relative my-4 flex items-center justify-center min-h-[400px]">
                  {/* Digital Twin Blueprint Graphic */}
                  <div className="relative w-56 sm:w-64 max-w-full flex items-center justify-center">
                    <HumanBodyIllustration
                      className="w-full h-auto max-h-[410px] select-none drop-shadow-xs"
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
                    <div className="absolute top-[2%] -left-1 sm:-left-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-lg border border-purple-200/80 z-20 min-w-[185px] max-w-[215px] animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-purple-900 uppercase tracking-wider">
                        <Moon className="w-3.5 h-3.5 text-purple-600" />
                        <span>Sleep & Recovery</span>
                      </div>
                      <div className="text-xl font-extrabold text-[#16122b] mt-1 tracking-tight">
                        {sleepDisplay}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-medium">
                        <span
                          className={`w-2 h-2 rounded-full ${sleepStatus.dot}`}
                        />
                        <span>{sleepStatus.text}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] text-slate-500 space-y-1">
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
                    <div className="absolute top-[22%] -right-1 sm:-right-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-lg border border-rose-200/80 z-20 min-w-[185px] max-w-[215px] animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-rose-900 uppercase tracking-wider">
                        <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />
                        <span>Heart Rate</span>
                      </div>
                      <div className="text-xl font-extrabold text-[#16122b] mt-1 tracking-tight">
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
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] text-slate-500 space-y-1">
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
                    <div className="absolute top-[18%] -left-1 sm:-left-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-lg border border-cyan-200/80 z-20 min-w-[185px] max-w-[215px] animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-cyan-900 uppercase tracking-wider">
                        <Droplets className="w-3.5 h-3.5 text-cyan-600 fill-cyan-500" />
                        <span>Oxygen Saturation</span>
                      </div>
                      <div className="text-xl font-extrabold text-[#16122b] mt-1 tracking-tight">
                        {o2Display}%
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-medium">
                        <span
                          className={`w-2 h-2 rounded-full ${o2Status.dot}`}
                        />
                        <span>{o2Status.text}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] text-slate-500 space-y-1">
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
                    <div className="absolute top-[34%] -left-1 sm:-left-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-lg border border-amber-200/80 z-20 min-w-[195px] max-w-[225px] animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-900 uppercase tracking-wider">
                        <Activity className="w-3.5 h-3.5 text-amber-600" />
                        <span>Blood Pressure</span>
                      </div>
                      <div className="text-xl font-extrabold text-[#16122b] mt-1 tracking-tight">
                        {bpDisplay}{" "}
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
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10.5px] text-slate-500 space-y-1">
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

                {/* Bottom Label */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    ALL SYSTEMS CONNECTED
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    Small shifts. One connected picture.
                  </div>
                </div>
              </div>

              {/* Right Column: Stacked Data Cards */}
              <div className="lg:col-span-7 space-y-5">
                {/* Card 1: "You, compared with your usual" */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs">
                  {/* Header & Filter Dropdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[#16122b]">
                        You, compared with your usual
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your recent readings alongside your personal baseline.
                      </p>
                    </div>

                    {/* Dropdown Button */}
                    <div className="relative self-start sm:self-auto">
                      <button
                        // onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/80 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        <span>{selectedTimeFilter}</span>
                        {/* <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> */}
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                          {[
                            "Last 30 minutes",
                            "Last 2 hours",
                            "Today",
                            "Last 7 days",
                          ].map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                setSelectedTimeFilter(option);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                                selectedTimeFilter === option
                                  ? "bg-purple-50 text-purple-700 font-semibold"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table Header */}
                  <div className="mt-6 grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                    <div className="col-span-5">HEALTH SIGNAL</div>
                    <div className="col-span-2 text-right">BASELINE</div>
                    <div className="col-span-2 text-right">TODAY</div>
                    <div className="col-span-3 text-right">VS. BASELINE</div>
                  </div>

                  {/* Table Rows */}
                  <div className="divide-y divide-slate-100/70">
                    {comparisonData.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 items-center py-2.5 text-xs hover:bg-slate-50/50 rounded-lg transition-colors px-1"
                      >
                        {/* Signal Name */}
                        <div className="col-span-5 flex items-center gap-2 text-slate-700 font-normal">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>{row.signal}</span>
                        </div>

                        {/* Baseline */}
                        <div className="col-span-2 text-right text-slate-500 font-normal">
                          {row.baseline}
                        </div>

                        {/* Today */}
                        <div className="col-span-2 text-right text-slate-900 font-medium">
                          {row.today}
                        </div>

                        {/* Pill Badge */}
                        <div className="col-span-3 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              row.type === "purple"
                                ? "bg-[#f2eff8] text-[#5c3e90]"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {row.diff}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 2: "A closer look at you" or selected vital signal */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs">
                  {/* Header with Title, Stat and Legend */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                            <span className="text-2xl font-bold text-slate-900">
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
                            <span className="text-2xl font-bold text-slate-900">
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
                            <span className="text-2xl font-bold text-slate-900">
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
                            <span className="text-2xl font-bold text-slate-900">
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

                    {/* Top Right Legend Indicator (baseline is only shown when a metric is selected) */}
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

                  {/* Vitals Trend Chart (Recharts) */}
                  <VitalsTrendGraph
                    data={trendVitals}
                    baseline={digitalTwin?.baselines?.heartRate?.value ?? 79}
                    baselines={digitalTwin?.baselines}
                    selectedMetric={selectedTrendMetric}
                    onSelectMetric={setSelectedTrendMetric}
                  />
                </div>

                {/* Card 3: "YOUR TWIN IS STILL LEARNING" Banner */}
                {/* <div className="rounded-2xl p-5 bg-[#eeeaf6] border border-purple-200/50 shadow-2xs">
                  <span className="text-[10px] font-bold tracking-wider text-purple-700 uppercase">
                    YOUR TWIN IS STILL LEARNING
                  </span>
                  <h4 className="text-sm font-bold text-[#16122b] mt-1">
                    A more personal sleep baseline is on its way.
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Your latest night: 6h 45m. More nights will help reveal your
                    usual rhythm.
                  </p>
                </div> */}
              </div>
            </div>
          </section>
        </main>
      </TabsContent>

      {/* Tabs Content 2: Mobile (iPhone 16 Pro) */}
      <TabsContent value="mobile" className="outline-none flex-1">
        <div className="w-full py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-xs font-semibold text-purple-700 border border-purple-200/60 shadow-2xs">
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone 16 Pro • Interactive Mobile Experience</span>
            </span>
          </div>

          <Iphone16Pro width={390} height={780}>
            <MobileDashboardView
              latestVital={latestVital}
              trendVitals={trendVitals}
              digitalTwin={digitalTwin}
              currentUser={currentUser}
              onSignOut={handleSignOut}
              onOpenTelemedicine={() => setIsTelemedicineOpen(true)}
            />
          </Iphone16Pro>
        </div>
      </TabsContent>

      {/* Tabs Content 3: Tablet (iPad Pro) */}
      <TabsContent value="tablet" className="outline-none flex-1">
        <div className="w-full py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-xs font-semibold text-purple-700 border border-purple-200/60 shadow-2xs">
              <Tablet className="w-3.5 h-3.5" />
              <span>iPad Pro 11″ • Interactive Tablet Experience</span>
            </span>
          </div>

          <IpadPro width={850} height={642}>
            <TabletDashboardView
              latestVital={latestVital}
              trendVitals={trendVitals}
              digitalTwin={digitalTwin}
              currentUser={currentUser}
              onSignOut={handleSignOut}
              onOpenTelemedicine={() => setIsTelemedicineOpen(true)}
            />
          </IpadPro>
        </div>
      </TabsContent>

      {/* Floating Action AI Button & Drawer (Desktop Dashboard only) */}
      {deviceTab === "dashboard" && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setChatOpen(true)}
            aria-label="Open careMP AI Companion"
            className="w-12 h-12 rounded-full bg-[#1e1738] hover:bg-[#2b2150] text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <SparkleIcon className="w-5 h-5 fill-white transition-transform group-hover:rotate-12" />
          </button>
        </div>
      )}

      {/* careMP AI Health Companion Sheet */}
      <AIHealthCompanion
        open={chatOpen}
        onOpenChange={setChatOpen}
        wellnessScore={86}
        sleepTime="6h 45m"
        vitalsStatus="steady"
      />

      {/* Patient Telemedicine Video Modal */}
      <PatientTelemedicineModal
        isOpen={isTelemedicineOpen}
        onClose={() => setIsTelemedicineOpen(false)}
        latestVital={latestVital}
        patientName={fullName || "John Doe"}
      />
    </Tabs>
  );
}
