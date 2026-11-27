import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  User,
  ShieldCheck,
  ChevronRight,
  Moon,
  Heart,
  Check,
  X,
  BookOpen,
  Music,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  ChevronDown,
  Send,
  Activity,
  Droplets,
  Thermometer,
  LogOut,
  Footprints,
  RefreshCw,
  MapPin,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { VitalRecord } from "@/types/vital";
import type { ResidentDigitalTwinData } from "../types/digitalTwin";
import { Input } from "@/components/ui/input";
import { sendAgentChatMessage } from "../api";
import wavyBg from "@/assets/purpleWavyBg.png";
import eleanor from "@/assets/eleanor.png";
import { Resident } from "@/types/resident";
import sentinelLogo from "@/assets/CLogo.png";

export interface MobileDashboardViewProps {
  latestVital?: VitalRecord | null;
  trendVitals?: VitalRecord[];
  digitalTwin?: ResidentDigitalTwinData;
  residentDetails?: Resident;
  currentUser?: {
    firstName?: string;
    lastName?: string;
    [key: string]: any;
  } | null;
  onSignOut?: () => void;
  onOpenTelemedicine?: () => void;
  onRefreshVitals?: () => void;
}

// 4-pointed diamond sparkle icon matching careMP sentinel mark
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

// Lightweight Markdown Renderer
function ReactMarkdown({
  children,
  components,
}: {
  children?: string;
  components?: {
    p?: (props: { children: any }) => any;
    strong?: (props: { children: any }) => any;
    ul?: (props: { children: any }) => any;
    ol?: (props: { children: any }) => any;
    li?: (props: { children: any }) => any;
  };
}) {
  if (!children) return null;
  const P =
    components?.p ||
    (({ children }: any) => <p className="mb-1.5 last:mb-0">{children}</p>);
  const Strong =
    components?.strong ||
    (({ children }: any) => (
      <strong className="font-bold text-slate-900">{children}</strong>
    ));

  const paragraphs = children.split("\n\n");
  return (
    <>
      {paragraphs.map((para, i) => {
        const parts = para.split(/(\*\*.*?\*\*)/g);
        return (
          <P key={i}>
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <Strong key={j}>{part.slice(2, -2)}</Strong>;
              }
              return part;
            })}
          </P>
        );
      })}
    </>
  );
}

export function MobileDashboardView({
  latestVital,
  trendVitals: _trendVitals = [],
  digitalTwin: _digitalTwin,
  residentDetails,
  currentUser,
  onSignOut,
  onOpenTelemedicine: _onOpenTelemedicine,
  onRefreshVitals,
}: MobileDashboardViewProps) {
  const [completedSteps, setCompletedSteps] = useState<{
    [key: string]: boolean;
  }>({});
  const [isLifeStoryOpen, setIsLifeStoryOpen] = useState(false);
  const [isCareGuidanceOpen, setIsCareGuidanceOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHealthDialogOpen, setIsHealthDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isRefreshingVitals, setIsRefreshingVitals] = useState(false);

  const handleRefreshVitals = async () => {
    if (!onRefreshVitals || isRefreshingVitals) return;
    setIsRefreshingVitals(true);
    try {
      await onRefreshVitals();
    } finally {
      setTimeout(() => setIsRefreshingVitals(false), 500);
    }
  };
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { id: string; role: "user" | "assistant"; text: string }[]
  >([
    {
      id: "m-1",
      role: "user",
      text: "Give me an update on Eleanor Vance. Has anything changed in her behavior or routine today?",
    },
    {
      id: "m-2",
      role: "assistant",
      text: `Eleanor Vance — Today’s Update
              Eleanor’s overall status is stable, but Sentinel has detected a few changes from her usual pattern today.
              • Activity: Lower than her usual daytime activity
              • Sleep: More interrupted overnight
              • Movement: Increased hallway movement during the afternoon
              • Behavior: Mild increase in restlessness around 5:00 PM 
              These changes are not necessarily concerning on their own, but the combination is different from Eleanor’s recent baseline.
              Suggested attention: Keep an eye on her this evening and maintain her usual calming routine.`,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    if (isDialogOpen) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [messages, isDialogOpen, isChatLoading]);

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || chatInput).trim();
    if (!text || isChatLoading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user" as const,
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await sendAgentChatMessage(text, 1);
      if (res?.response) {
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", text: res.response },
        ]);
        setIsChatLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Mobile AI agent chat fallback:", e);
    }

    setTimeout(() => {
      let reply =
        "Your cardiovascular indicators are nominal. Staying well-hydrated today will support resting heart rate balance.";
      if (text.toLowerCase().includes("baseline")) {
        reply =
          "Compared to your 30-day baseline: resting heart rate is **-9 bpm** (70 bpm) and HRV is **+9 ms** (45 ms), showing strong cardiac resilience.";
      } else if (
        text.toLowerCase().includes("heart") ||
        text.toLowerCase().includes("rhythm")
      ) {
        reply =
          "Your resting heart rate is steady at **72 bpm** with normal sinus rhythm observed over the past 24 hours.";
      } else if (text.toLowerCase().includes("sleep")) {
        reply =
          "Deep sleep was down 14% last night. A short 15-minute screen-free wind-down before bed is recommended.";
      }
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: reply },
      ]);
      setIsChatLoading(false);
    }, 600);
  };

  // Tele-Consultation state
  const [isTelemedicineCallOpen, setIsTelemedicineCallOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callSeconds, setCallSeconds] = useState(55);
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: "doctor" | "user"; time: string; text: string }[]
  >([
    {
      id: "m-1",
      sender: "doctor",
      time: "10:32 AM",
      text: "Hello Mary! I have your continuous telemetry HUD and digital twin open on my screen. How are you feeling right now?",
    },
    {
      id: "m-2",
      sender: "user",
      time: "10:33 AM",
      text: "Your nocturnal dipping and vitals are looking stable today.",
    },
    {
      id: "m-3",
      sender: "doctor",
      time: "10:33 AM",
      text: "Your nocturnal dipping and vitals are looking stable today.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    if (!isTelemedicineCallOpen) return;
    const interval = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTelemedicineCallOpen]);

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? "0" : ""}${remSecs}`;
  };

  const handleSendConsultMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "user" as const,
      time: "10:34 AM",
      text: inputMessage.trim(),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
  };

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  // Dynamic derivation with graceful fallback to mockup defaults
  const sleepValue = latestVital?.totalSleepTime
    ? `${Math.floor(parseFloat(latestVital.totalSleepTime) / 60)}h ${Math.round(
        parseFloat(latestVital.totalSleepTime) % 60,
      )}m last night`
    : "6h 45m last night";

  const caregiverName = currentUser?.firstName || "Margaret";
  const residentName = "Eleanor";
  const residentAge = "82";
  const roomNumber = "214";

  const now = new Date();
  const currentHour = now.getHours();
  const timeOfDay =
    currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "evening";
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
        ? "Good afternoon"
        : "Good evening";
  const currentDate = `${now.toLocaleDateString("en-US", {
    weekday: "long",
  })}, ${now.getDate()} ${now.toLocaleDateString("en-US", {
    month: "short",
  })}`;

  const sundowningSummary = {
    CALM: {
      text1: "Eleanor is calm and appears comfortable right now.",
      text2:
        "Her heart rate and movement have remained steady, suggesting she is feeling settled and comfortable right now.",
      text3:
        "A quiet environment and familiar routines may help her stay relaxed.",
    },
    RESTLESS: {
      text1: "Eleanor may need a little extra reassurance right now.",
      text2:
        "Increased movement and a slightly elevated heart rate suggest she may be feeling restless or having difficulty settling.",
      text3:
        "A familiar activity, gentle reassurance, or her favorite music may help her settle.",
    },
    SUNDOWNING_SURGE: {
      text1: "Eleanor may need a calmer afternoon and extra reassurance.",
      text2:
        " Rising movement and heart rate in the late afternoon match a pattern of increased evening restlessness.",
      text3:
        "Familiar music, softer lighting, and her lavender blanket may help her feel calm and comfortable.",
    },
  };

  const heartRateValue = latestVital?.heartRate
    ? Math.round(parseFloat(latestVital.heartRate))
    : 78;
  const bpValue = latestVital?.systolicBP
    ? `${Math.round(parseFloat(latestVital.systolicBP))}/${
        latestVital?.diastolicBP
          ? Math.round(parseFloat(latestVital.diastolicBP))
          : 78
      }`
    : "120/78";
  const spo2Value = latestVital?.oxygenSaturation
    ? Math.round(parseFloat(latestVital.oxygenSaturation))
    : 98;
  const tempValue = latestVital?.bodyTemperature
    ? parseFloat(latestVital.bodyTemperature).toFixed(1)
    : "37.1";

  const getRoundedBaseline = (entry: any, fallback: number): number => {
    if (entry === null || entry === undefined) return fallback;
    const raw =
      typeof entry === "object" && entry !== null && "value" in entry
        ? entry.value
        : entry;
    const num = typeof raw === "number" ? raw : parseFloat(raw);
    return isNaN(num) ? fallback : Math.round(num);
  };

  const hrBaseline = getRoundedBaseline(_digitalTwin?.baselines?.heartRate, 72);
  const sysBaseline = getRoundedBaseline(
    _digitalTwin?.baselines?.systolicBP,
    120,
  );
  const diaBaseline = getRoundedBaseline(
    _digitalTwin?.baselines?.diastolicBP,
    80,
  );
  const spo2Baseline = getRoundedBaseline(_digitalTwin?.baselines?.spo2, 98);
  const tempBaseline = getRoundedBaseline(
    _digitalTwin?.baselines?.bodyTemperature,
    37,
  );

  const healthCards = [
    {
      title: "Heart rate",
      value: heartRateValue,
      unit: "bpm",
      variation: "+1",
      baseline: `${hrBaseline} bpm`,
      trend: "up" as const,
      icon: Heart,
      iconBg: "bg-rose-100 text-rose-600",
      trendColor: "text-amber-700 border-amber-200/60",
    },
    {
      title: "BP",
      value: bpValue,
      unit: "mmHg",
      variation: "-1",
      baseline: `${sysBaseline}/${diaBaseline} mmHg`,
      trend: "down" as const,
      icon: Activity,
      iconBg: "bg-indigo-100 text-indigo-600",
      trendColor: "text-blue-700 border-blue-200/60",
    },
    {
      title: "SpO₂",
      value: `${spo2Value}%`,
      unit: "",
      variation: "+1",
      baseline: `${spo2Baseline}%`,
      trend: "up" as const,
      icon: Droplets,
      iconBg: "bg-teal-100 text-teal-600",
      trendColor: "text-emerald-700 border-emerald-200/60",
    },
    {
      title: "Temperature",
      value: `${tempValue}°C`,
      unit: "",
      variation: "+1",
      baseline: `${tempBaseline}°C`,
      trend: "up" as const,
      icon: Thermometer,
      iconBg: "bg-amber-100 text-amber-600",
      trendColor: "text-amber-700 border-amber-200/60",
    },
  ];

  const wanderingData = _digitalTwin?.healthInsights?.wandering;
  const wanderingLocation =
    wanderingData?.currentLocation || `Room ${roomNumber}`;
  const isSafeZone = wanderingData?.isSafeZone ?? true;
  const wanderingStatusRaw = wanderingData?.wanderingStatus || "SAFE_IN_ROOM";
  const wanderingStatusFormatted = wanderingStatusRaw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
  const elopementRisk = wanderingData?.elopementRisk || "LOW";
  const riskScore = wanderingData?.riskScore ?? 14;
  const pacingLoopCount = wanderingData?.pacingLoopCount ?? 2;
  const minutesOutOfBed = wanderingData?.minutesOutOfBed ?? 18;
  const nightBedExit = wanderingData?.nightBedExit ?? false;
  const actionAlert = wanderingData?.actionAlert || null;
  const contributingFactors = wanderingData?.contributingFactors || [
    "Mild restlessness",
    "Late afternoon corridor movement",
  ];

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col font-sans select-none">
      {/* Scrollable Container */}
      <div
        className="w-full h-full overflow-y-auto overflow-x-hidden bg-[#F8F9FC] text-slate-900 pb-12"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Top Header */}
        <header className="w-full px-5 pt-10 pb-2 flex items-center justify-between sticky top-0 z-20 bg-[#F8F9FC]/90 backdrop-blur-md">
          {/* careMP SENTINEL Logo */}
          <div className="flex items-center gap-2">
            {/* <div className="w-8 h-8 rounded-full bg-[#654BB9] flex items-center justify-center text-white shadow-xs">
              <SparkleIcon className="w-4 h-4 fill-white" />
            </div> */}
            <img src={sentinelLogo} width={30} height={30} />
            <div className="flex flex-col">
              <span className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">
                careMP
              </span>
              <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase leading-none mt-1">
                SENTINEL
              </span>
            </div>
          </div>

          {/* Right Action Icons: Notification Bell & User Profile */}
          <div className="flex items-center gap-2 relative">
            {/* Telemedicine Call Button */}
            <button
              type="button"
              onClick={() => setIsTelemedicineCallOpen(true)}
              className="w-9 h-9 rounded-full bg-purple-100/70 hover:bg-purple-200/70 flex items-center justify-center text-slate-700 transition-colors relative cursor-pointer"
              title="Tele-Consultation"
            >
              <Video className="w-4 h-4 text-purple-900" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#F8F9FC] animate-pulse" />
            </button>

            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full border border-slate-200/80 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-2xs"
              title="Account"
            >
              <User className="w-4 h-4" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-11 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">
                    {caregiverName}
                  </p>
                  <p className="text-[10px] text-slate-400">Caregiver</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsTelemedicineCallOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-purple-700 hover:bg-purple-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Telemedicine Call</span>
                </button>
                {onSignOut && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onSignOut();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content Stream */}
        <main className="px-4 pt-4 space-y-4">
          {/* <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Updated 3:40 PM</span>
            </span>
            <span className="text-xs text-slate-400 font-normal">
              Thursday, 14 May
            </span>
          </div> */}
          <span className="text-xs text-slate-700 font-normal">
            {currentDate}
          </span>
          {/* Greeting Section */}
          <div className="">
            <h1 className="text-[26px] font-bold tracking-tight text-slate-900 leading-tight">
              {greeting}, {caregiverName}.
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here&apos;s how {residentName} is doing today
            </p>
          </div>

          {/* AI CARE SUMMARY CARD (Rich Purple Gradient) */}
          <div className="relative overflow-hidden rounded-[26px]">
            <img
              src={wavyBg}
              className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
            />
            <div className="relative z-10 p-5">
              {/* Overline */}
              <div className="flex items-center gap-1.5 text-purple-200 text-[10px] font-bold tracking-widest uppercase mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>AI CARE SUMMARY</span>
              </div>

              {/* Main Headline */}
              <h2 className="text-[21px] font-bold text-white tracking-tight leading-snug mb-2.5">
                Checking in on Eleanor this {timeOfDay}.
              </h2>

              {/* Description */}
              <p className="text-[13px] text-purple-100/95 leading-relaxed font-normal mb-3.5">
                {_digitalTwin?.aiSummary ||
                  `Her sleep was slightly disrupted last night. She was calm this
                morning, but is becoming a little restless now.`}
              </p>

              {/* Status Badge */}
              <div className="flex items-center gap-2 text-purple-100 text-xs font-medium mb-3.5">
                <ShieldCheck className="w-4 h-4 text-purple-200 shrink-0" />
                <span>
                  Current location ·{" "}
                  {_digitalTwin?.healthInsights?.wandering?.currentLocation ||
                    `Room ${roomNumber}`}
                </span>
              </div>

              {/* Eleanor Resident Subcard / Pill */}
              <div
                onClick={() => setIsLifeStoryOpen(true)}
                className="bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/20 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={eleanor}
                    alt={residentName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-white/30 shadow-xs shrink-0"
                  />
                  <div>
                    <div className="text-sm font-bold text-white leading-tight">
                      {residentName} · {residentAge}
                    </div>
                    <div className="text-xs text-purple-200 font-normal mt-0.5 hover:underline">
                      View her Life Story
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/70 mr-1 shrink-0" />
              </div>
            </div>
          </div>

          {/* AI CARE SUMMARY CARD (Rich Purple Gradient) */}
          <div className="hidden relative rounded-[26px] p-5 text-white shadow-md overflow-hidden bg-gradient-to-br from-[#5E499D] via-[#6D53AF] to-[#4A358A]">
            {/* Subtle background glow decorative circle */}
            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-purple-900/40 blur-xl pointer-events-none" />

            <div className="relative z-10">
              {/* Overline */}
              <div className="flex items-center gap-1.5 text-purple-200 text-[10px] font-bold tracking-widest uppercase mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>AI CARE SUMMARY</span>
              </div>

              {/* Main Headline */}
              <h2 className="text-[21px] font-bold text-white tracking-tight leading-snug mb-2.5">
                Checking in on Eleanor this afternoon.
              </h2>

              {/* Description */}
              <p className="text-[13px] text-purple-100/95 leading-relaxed font-normal mb-3.5">
                Her sleep was slightly disrupted last night. She was calm this
                morning, but is becoming a little restless now.
              </p>

              {/* Status Badge */}
              <div className="flex items-center gap-2 text-purple-100 text-xs font-medium mb-3.5">
                <ShieldCheck className="w-4 h-4 text-purple-200 shrink-0" />
                <span>Safe in her room · Room {roomNumber}</span>
              </div>

              {/* Eleanor Resident Subcard / Pill */}
              <div
                onClick={() => setIsLifeStoryOpen(true)}
                className="bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/20 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={eleanor}
                    alt={residentName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-white/30 shadow-xs shrink-0"
                  />
                  <div>
                    <div className="text-sm font-bold text-white leading-tight">
                      {residentName} · {residentAge}
                    </div>
                    <div className="text-xs text-purple-200 font-normal mt-0.5 hover:underline">
                      View her Life Story
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/70 mr-1 shrink-0" />
              </div>
            </div>
          </div>

          {/* SUNDOWNING WATCH CARD */}
          <div className="bg-[#F5F2FB] border border-[#ECE5F8] rounded-[26px] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
                Sundowning Watch
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDF3E7] text-[#B45309] border border-[#FCD9B6]">
                {_digitalTwin?.healthInsights?.sundowning?.status
                  ?.toLowerCase()
                  .replace(/^./, (char) => char.toUpperCase()) || "Restless"}
              </span>
            </div>

            <h4 className="text-[15px] font-bold text-slate-800 mt-2 mb-1.5 leading-snug">
              {
                sundowningSummary[
                  _digitalTwin?.healthInsights?.sundowning?.status ?? "CALM"
                ].text1
              }
            </h4>

            <p className="text-[13px] text-slate-600 leading-relaxed mb-3">
              {
                sundowningSummary[
                  _digitalTwin?.healthInsights?.sundowning?.status ?? "CALM"
                ].text2
              }
            </p>

            <p className="text-[13px] font-medium text-purple-700 leading-relaxed">
              {
                sundowningSummary[
                  _digitalTwin?.healthInsights?.sundowning?.status ?? "CALM"
                ].text3
              }
            </p>
          </div>

          {/* CURRENT CARE STATUS SECTION */}
          <div className="space-y-2 pt-1">
            <div className="px-1">
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
                Current care status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Changes are compared with Eleanor&apos;s usual pattern
              </p>
            </div>

            <div className="bg-white rounded-[26px] p-5 shadow-xs border border-slate-100 divide-y divide-slate-100">
              {/* Sleep */}
              <div className="pb-3.5 flex items-start gap-3.5">
                <div className="mt-0.5 shrink-0">
                  <Moon className="w-4 h-4 text-amber-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[11px] font-medium text-slate-400">
                    Sleep
                  </span>
                  <span className="block text-sm font-bold text-slate-900 mt-0.5">
                    {sleepValue}
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {sleepValue === "0"
                      ? "3 awakenings · Mild disruption"
                      : "No Sleep recorded"}
                  </span>
                </div>
              </div>

              {/* Activity & behavior */}
              <div className="py-3.5 flex items-start gap-3.5">
                <div className="mt-0.5 shrink-0">
                  <Footprints className="w-4 h-4 text-amber-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[11px] font-medium text-slate-400">
                    Activity & behavior
                  </span>
                  <span className="block text-sm font-bold text-slate-900 mt-0.5">
                    More restless than usual
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Some pacing since 3:20 PM
                  </span>
                </div>
              </div>

              {/* Health */}
              <div
                onClick={() => setIsHealthDialogOpen(true)}
                className="py-3.5 flex items-start gap-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 cursor-pointer transition-all rounded-xl px-2 -mx-2"
              >
                <div className="mt-0.5 shrink-0">
                  <Heart className="w-4 h-4 text-amber-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[11px] font-medium text-slate-400">
                    Health
                  </span>
                  <span className="block text-sm font-bold text-slate-900 mt-0.5">
                    Slight change from usual
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Higher pulse and temperature
                  </span>
                </div>

                <ChevronRight className="w-5 h-5 mt-5 text-slate-400" />
              </div>

              {/* Location & movement */}
              <div
                onClick={() => setIsLocationDialogOpen(true)}
                className="pt-3.5 flex items-start gap-3.5 hover:bg-slate-50/80 active:bg-slate-100/60 cursor-pointer transition-all rounded-xl px-2 -mx-2"
              >
                <div className="mt-0.5 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[11px] font-medium text-slate-400">
                    Location & movement
                  </span>
                  <span className="block text-sm font-bold text-slate-900 mt-0.5">
                    {wanderingStatusFormatted}
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {actionAlert || "No active wandering alert"}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 mt-5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* WHAT MAY HELP RIGHT NOW CARD */}
          <div className="bg-white rounded-[26px] p-5 shadow-xs border border-slate-100">
            <div className="flex items-center gap-1.5 text-purple-700 text-[10px] font-bold tracking-widest uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>WHAT MAY HELP RIGHT NOW</span>
            </div>

            <h3 className="text-[17px] font-bold text-slate-900 leading-snug mb-1.5">
              Bring a little familiarity into her afternoon.
            </h3>

            <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
              Eleanor has always loved music and books. These familiar comforts
              have helped her settle before.
            </p>

            {/* 3 Action Items */}
            <div className="space-y-2 mb-4">
              {/* Item 01 */}
              <div
                onClick={() => toggleStep("step-1")}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 hover:bg-purple-50/60 active:bg-purple-100/60 transition-colors cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors ${
                    completedSteps["step-1"]
                      ? "bg-purple-600 text-white"
                      : "bg-[#F0EBFA] text-[#654BB9]"
                  }`}
                >
                  {completedSteps["step-1"] ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    "01"
                  )}
                </div>
                <span
                  className={`text-xs sm:text-[13px] font-medium transition-colors ${
                    completedSteps["step-1"]
                      ? "text-slate-400 line-through"
                      : "text-slate-800"
                  }`}
                >
                  Play soft big-band music
                </span>
              </div>

              {/* Item 02 */}
              <div
                onClick={() => toggleStep("step-2")}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 hover:bg-purple-50/60 active:bg-purple-100/60 transition-colors cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors ${
                    completedSteps["step-2"]
                      ? "bg-purple-600 text-white"
                      : "bg-[#F0EBFA] text-[#654BB9]"
                  }`}
                >
                  {completedSteps["step-2"] ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    "02"
                  )}
                </div>
                <span
                  className={`text-xs sm:text-[13px] font-medium transition-colors ${
                    completedSteps["step-2"]
                      ? "text-slate-400 line-through"
                      : "text-slate-800"
                  }`}
                >
                  Offer her lavender blanket
                </span>
              </div>

              {/* Item 03 */}
              <div
                onClick={() => toggleStep("step-3")}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 hover:bg-purple-50/60 active:bg-purple-100/60 transition-colors cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors ${
                    completedSteps["step-3"]
                      ? "bg-purple-600 text-white"
                      : "bg-[#F0EBFA] text-[#654BB9]"
                  }`}
                >
                  {completedSteps["step-3"] ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    "03"
                  )}
                </div>
                <span
                  className={`text-xs sm:text-[13px] font-medium transition-colors ${
                    completedSteps["step-3"]
                      ? "text-slate-400 line-through"
                      : "text-slate-800"
                  }`}
                >
                  Invite her to organize books
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => setIsCareGuidanceOpen(true)}
              className="w-full py-3.5 px-4 bg-[#654BB9] hover:bg-[#583FA7] active:bg-[#4E359B] text-white rounded-2xl text-[13px] font-semibold flex items-center justify-between shadow-xs transition-all cursor-pointer"
            >
              <span>View Eleanor&apos;s care guidance</span>
              <ChevronRight className="w-4 h-4 text-white/90" />
            </button>
          </div>

          {/* RECENT CARE CONTEXT CARD */}
          <div className="bg-white rounded-[26px] p-5 shadow-xs border border-slate-100">
            <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
              Recent care context
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Small details that help you understand her day.
            </p>

            <div className="space-y-3.5">
              {/* Item 1: 3:20 PM */}
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-semibold text-purple-900/80 w-16 shrink-0 pt-0.5">
                  3:20 PM
                </span>
                <div className="flex-1">
                  <h4 className="text-[13px] font-bold text-slate-900 leading-tight">
                    Restlessness beginning
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    More wrist movement, a little pacing.
                  </p>
                </div>
              </div>

              {/* Item 2: 11:00 AM */}
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-semibold text-purple-900/80 w-16 shrink-0 pt-0.5">
                  11:00 AM
                </span>
                <div className="flex-1">
                  <h4 className="text-[13px] font-bold text-slate-900 leading-tight">
                    A short spell of pacing
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Settled after organizing familiar books.
                  </p>
                </div>
              </div>

              {/* Item 3: 8:15 AM */}
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-semibold text-purple-900/80 w-16 shrink-0 pt-0.5">
                  8:15 AM
                </span>
                <div className="flex-1">
                  <h4 className="text-[13px] font-bold text-slate-900 leading-tight">
                    Morning medication refused
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Eleanor reported gum soreness.
                  </p>
                </div>
              </div>

              {/* Item 4: 7:45 AM */}
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-semibold text-purple-900/80 w-16 shrink-0 pt-0.5">
                  7:45 AM
                </span>
                <div className="flex-1">
                  <h4 className="text-[13px] font-bold text-slate-900 leading-tight">
                    Breakfast preference
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Enjoyed lukewarm pureed oatmeal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          {/* <div className="pt-2 pb-6 px-4 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              Insights support care decisions. They do not replace advice from
              Eleanor&apos;s care team.
            </p>
          </div> */}
        </main>
      </div>

      {/* Modal: Eleanor's Life Story */}
      {isLifeStoryOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end p-0 animate-in fade-in">
          <div className="w-full bg-white rounded-t-3xl max-h-[85%] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden">
            {/* Fixed Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 p-5 pb-3.5 bg-white">
              <div className="flex items-center gap-2.5">
                <img
                  src={eleanor}
                  alt={residentName}
                  className="w-10 h-10 rounded-full object-cover border border-purple-200"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Eleanor Vance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Age {residentDetails?.age || residentAge} ·{" "}
                    {_digitalTwin?.healthInsights?.wandering?.currentLocation ||
                      `Room ${roomNumber}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLifeStoryOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 pt-3 space-y-3 text-xs leading-relaxed text-slate-600 sleek-scrollbar">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <span className="font-semibold text-purple-900 block mb-1">
                  Personal Biography & Interests
                </span>
                {residentDetails?.description ||
                  `Eleanor was an elementary school librarian for 34 years in
                Oakridge. She has a deep love for hardcover books, historical
                fiction, and big band orchestra jazz (Glenn Miller, Benny
                Goodman).`}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-purple-100">
                <span className="font-semibold text-slate-800 block mb-1">
                  Notes
                </span>
                {residentDetails?.notes ||
                  `Active medications: Donepezil 5mg daily. Monitored for sundowning agitation, circadian rhythm inversion, and hallway pacing.`}
              </div>

              <div className="p-3 bg-green-50 rounded-2xl border border-slate-100">
                <span className="font-semibold text-slate-800 block mb-1">
                  🌿Calming Anchors & Familiar Routines
                </span>
                {residentDetails?.specialNotes ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {residentDetails.specialNotes
                      .replace(/^Personalized anchors:\s*/i, "")
                      .split(",")
                      .map((note, index) => (
                        <li key={index}>{note.trim()}</li>
                      ))}
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>
                      Soft wool lavender blanket gifted by daughter Margaret.
                    </li>
                    <li>Holding or arranging classic literature books.</li>
                    <li>
                      Gentle lavender essential oil scent in the afternoon.
                    </li>
                    <li>Tea with a splash of warm milk around 4:00 PM.</li>
                  </ul>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-slate-100">
                <span className="font-semibold text-slate-800 block mb-1">
                  ⚠️ Known triggers
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Loud television</li>
                  <li>Dim lighting</li>
                  <li>Being rushed during transfers</li>
                </ul>
              </div>

              <div className="p-3 bg-pink-50 rounded-2xl border border-slate-100">
                <span className="font-semibold text-slate-800 block mb-1">
                  👨‍👩‍👧 Family Contacts
                </span>
                <p>
                  Daughter: Margaret Vance (Primary Caregiver & Healthcare
                  Proxy)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eleanor's Care Guidance */}
      {isCareGuidanceOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end p-0 animate-in fade-in">
          <div className="w-full bg-white rounded-t-3xl max-h-[85%] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden">
            {/* Fixed Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 p-5 pb-3.5 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Care Guidance
                </h3>
                <p className="text-xs text-slate-500">
                  Personalized recommendations for Eleanor
                </p>
              </div>
              <button
                onClick={() => setIsCareGuidanceOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 pt-3 space-y-2.5 text-xs text-slate-600 sleek-scrollbar">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-2.5">
                <Music className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-purple-900">
                    Afternoon Sundowning Protocol
                  </h4>
                  <p className="mt-0.5 text-purple-800/90 leading-relaxed">
                    Begin sensory soothing 30 minutes before typical onset
                    (around 3:30 PM). Dim overhead fluorescents and introduce
                    warm ambient lamp light.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">
                    Meaningful Engagement
                  </h4>
                  <p className="mt-0.5 text-slate-600 leading-relaxed">
                    Provide the hardcover bird identifier book. Eleanor finds
                    turning pages tactilely soothing and organizing bookmarks
                    reduces restlessness.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setIsCareGuidanceOpen(false);
                    setIsTelemedicineCallOpen(true);
                  }}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Video className="w-4 h-4" />
                  <span>Connect with Care Team (Telemedicine)</span>
                </button>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 bg-white">
              <button
                onClick={() => setIsCareGuidanceOpen(false)}
                className="w-full py-3 bg-[#654BB9] text-white font-medium text-xs rounded-xl hover:bg-[#583FA7] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tele-Consultation In-App View */}
      {isTelemedicineCallOpen && (
        <div className="absolute inset-0 z-50 bg-[#F8F9FC] flex flex-col h-full w-full overflow-hidden select-none animate-in fade-in duration-150">
          {/* Top Fixed Header */}
          <div className="shrink-0 bg-white border-b border-slate-100 px-4 pt-10 pb-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F0EBFA] flex items-center justify-center text-[#654BB9] shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-slate-900 leading-tight">
                    Tele-Consultation
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    In progress · {formatCallTime(callSeconds)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTelemedicineCallOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                title="Minimize call"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badges row */}
            {/* <div className="flex items-center justify-between mt-2.5 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200/50">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>HIPAA &amp; E2E Protected</span>
              </div>
              <span className="text-[10px] font-medium text-emerald-700/90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Encrypted Stream
              </span>
            </div> */}
          </div>

          {/* Doctor Card with Floating PiP */}
          <div className="bg-black rounded-3xl mx-2 mt-2 p-4 shadow-2xs border border-slate-100 relative text-center">
            {/* Floating Self Feed PiP (top-right) */}
            <div className="absolute right-3.5 top-3.5 bg-[#F0EBFA] border border-purple-200/70 rounded-lg px-3 py-2 text-right shadow-2xs">
              <div className="flex items-center justify-end gap-1.5 text-[11px] font-bold text-purple-950">
                <span>You (Mary)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-purple-700 font-medium leading-tight mt-0.5">
                Live Self Feed
              </p>
              <p className="text-[9px] text-slate-500 font-normal leading-tight mt-0.5">
                {isMicMuted ? "Mic Muted" : "Mic On"}
              </p>
            </div>

            {/* Doctor Avatar */}
            <div className="inline-block relative mt-1">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
                alt="Dr. Sarah Jenkins"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#654BB9] ring-4 ring-purple-100 shadow-xs mx-auto"
              />
            </div>

            {/* Doctor Info */}
            <h3 className="text-[17px] font-bold text-white mt-2 leading-tight">
              Dr. Sarah Jenkins, MD
            </h3>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Clinical Telemedicine Lead
            </p>
            {/* <p className="text-xs font-semibold text-[#654BB9] mt-1.5">
              Observing Continuous Telemetry
            </p> */}

            {/* Audio active indicator with animated sound waves */}
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[11px] font-medium text-green-500">
              <span className="flex items-center gap-0.5">
                <span className="w-0.5 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="w-0.5 h-3 bg-green-500 rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-0.5 h-2 bg-green-500 rounded-full animate-pulse [animation-delay:300ms]" />
              </span>
              <span>Audio active</span>
            </div>

            {/* Mic, Camera, and End Consult Controls */}
            <div className="flex items-center justify-center gap-3 pt-5">
              {/* Mic button */}
              <button
                type="button"
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isMicMuted
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-[#F0EBFA] text-[#654BB9] border border-purple-100"
                }`}
                title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMicMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Camera button */}
              <button
                type="button"
                onClick={() => setIsCameraOff(!isCameraOff)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isCameraOff
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-[#F0EBFA] text-[#654BB9] border border-purple-100"
                }`}
                title={isCameraOff ? "Turn on camera" : "Turn off camera"}
              >
                {isCameraOff ? (
                  <VideoOff className="w-5 h-5" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
              </button>

              {/* End Consult button */}
              <button
                type="button"
                onClick={() => setIsTelemedicineCallOpen(false)}
                className="py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] text-white rounded-full font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                {/* <span>End Consult</span> */}
              </button>
            </div>
          </div>

          {/* Scrollable Middle Area (Doctor card, Live Vitals, Collapsible Chat & Notes) */}
          <div
            className="flex-1 overflow-y-auto px-2 py-3 space-y-3"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Live Vitals Strip */}
            <div className="bg-white rounded-3xl p-3.5 shadow-2xs border border-slate-100">
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span className="text-xs font-bold text-slate-900">
                  Live vitals
                </span>
                <span className="text-[10px] font-medium text-emerald-700">
                  Synced to Doctor HUD
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {/* HR */}
                <div className="bg-[#FAF9FD] rounded-2xl p-2 text-center border border-purple-50">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-purple-900">
                    <Heart className="w-3 h-3 text-purple-600" />
                    <span>HR</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {latestVital?.heartRate
                      ? Math.round(parseFloat(latestVital.heartRate))
                      : 72}
                  </div>
                  <div className="text-[9px] text-slate-400">bpm</div>
                </div>

                {/* BP */}
                <div className="bg-[#FAF9FD] rounded-2xl p-2 text-center border border-purple-50">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-purple-900">
                    <Activity className="w-3 h-3 text-purple-600" />
                    <span>BP</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {latestVital?.systolicBP
                      ? `${Math.round(parseFloat(latestVital.systolicBP))}/${
                          latestVital?.diastolicBP
                            ? Math.round(parseFloat(latestVital.diastolicBP))
                            : 78
                        }`
                      : "120/78"}
                  </div>
                  <div className="text-[9px] text-slate-400">mmHg</div>
                </div>

                {/* SpO2 */}
                <div className="bg-[#FAF9FD] rounded-2xl p-2 text-center border border-purple-50">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-purple-900">
                    <Droplets className="w-3 h-3 text-purple-600" />
                    <span>SpO2</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {latestVital?.oxygenSaturation
                      ? `${Math.round(parseFloat(latestVital.oxygenSaturation))}%`
                      : "98%"}
                  </div>
                  <div className="text-[9px] text-slate-400 opacity-0">-</div>
                </div>

                {/* Temp */}
                <div className="bg-[#FAF9FD] rounded-2xl p-2 text-center border border-purple-50">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-purple-900">
                    <Thermometer className="w-3 h-3 text-purple-600" />
                    <span>Temp</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {latestVital?.bodyTemperature
                      ? `${parseFloat(latestVital.bodyTemperature).toFixed(1)}°C`
                      : "36.6°C"}
                  </div>
                  <div className="text-[9px] text-slate-400 opacity-0">-</div>
                </div>
              </div>
            </div>

            {/* Collapsible Section: Consultation chat & clinical notes */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsChatExpanded(!isChatExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#654BB9]" />
                  <span className="text-xs font-bold text-slate-900">
                    Consultation chat &amp; clinical notes
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                    isChatExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isChatExpanded && (
                <div className="px-4 pb-4 space-y-3 pt-1 border-t border-slate-100/60">
                  {/* Genomic & Clinical Context */}
                  <div className="bg-[#F7F4FD] border border-purple-100/80 rounded-2xl p-3 text-[11px] leading-relaxed">
                    <div className="flex items-center gap-1.5 text-[#654BB9] font-bold mb-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Genomic &amp; Clinical Context</span>
                    </div>
                    <p className="text-slate-700 font-normal">
                      Genomic Target: CAD PRS 84th pct &rarr; Systolic target
                      &lt;125 mmHg
                    </p>
                    <p className="text-slate-700 font-normal mt-1">
                      Pharmacogenomics: CYP2C19 poor metabolizer &rarr;
                      Ticagrelor verified safe
                    </p>
                  </div>

                  {/* Chat Messages */}
                  <div className="space-y-3 pt-1">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <span className="text-[10px] text-slate-400 mb-1 px-1">
                          {msg.sender === "doctor"
                            ? "Dr. Sarah Jenkins"
                            : "You"}{" "}
                          · {msg.time}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-[#EEF2FF] text-slate-800 rounded-tr-xs"
                              : "bg-slate-100 text-slate-800 rounded-tl-xs"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Bottom Section (Input & Controls) */}
          <div className="shrink-0 bg-white border-t border-slate-100 px-4 pt-3 pb-3.5 space-y-3 shadow-lg">
            {/* Message Input Row */}
            <form
              onSubmit={handleSendConsultMessage}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Message Dr. Jenkins..."
                className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#654BB9] focus:ring-1 focus:ring-[#654BB9] transition-all"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-full bg-[#654BB9] hover:bg-[#583FA7] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-colors"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Mic, Camera, and End Consult Controls */}
            <div className="hidden flex items-center justify-between gap-3">
              {/* Mic button */}
              <button
                type="button"
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isMicMuted
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-[#F0EBFA] text-[#654BB9] border border-purple-100"
                }`}
                title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMicMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Camera button */}
              <button
                type="button"
                onClick={() => setIsCameraOff(!isCameraOff)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isCameraOff
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-[#F0EBFA] text-[#654BB9] border border-purple-100"
                }`}
                title={isCameraOff ? "Turn on camera" : "Turn off camera"}
              >
                {isCameraOff ? (
                  <VideoOff className="w-5 h-5" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
              </button>

              {/* End Consult button */}
              <button
                type="button"
                onClick={() => setIsTelemedicineCallOpen(false)}
                className="flex-1 py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] text-white rounded-full font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Consult</span>
              </button>
            </div>

            {/* Footer note */}
            <p className="text-[10px] text-slate-400 text-center leading-none">
              Your consultation is private and encrypted
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button for AI Agent */}
      {!isTelemedicineCallOpen && (
        <div className="absolute bottom-5 right-5 z-40">
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            aria-label="Open LifeTwin AI Companion"
            className="w-12 h-12 rounded-full bg-[#1e1738] hover:bg-[#2b2150] active:scale-95 text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all cursor-pointer group border border-purple-400/30 ring-4 ring-purple-500/10"
          >
            <SparkleIcon className="w-5 h-5 fill-white transition-transform group-hover:rotate-12" />
          </button>
        </div>
      )}

      {/* Confined in-phone AI Dialog */}
      {isDialogOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          {/* Backdrop confined to phone screen */}
          <div
            onClick={() => setIsDialogOpen(false)}
            className="absolute inset-0 bg-black/80"
          />

          {/* Dialog Card inside phone screen */}
          <div className="relative w-full max-w-[320px] bg-white backdrop-blur-md rounded-2xl shadow-2xl p-3.5 flex flex-col gap-2.5 z-10 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-black">
                    LifeTwin AI Companion
                  </h3>
                  <p className="text-[9.5px] text-gray-800">
                    Personal health twin intelligence
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDialogOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div
              ref={messagesContainerRef}
              className="h-[400px] overflow-y-auto space-y-2 pr-1 text-xs sleek-scrollbar"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-2xl max-w-[88%] text-[11px] font-semibold leading-relaxed ${
                      m.role === "user"
                        ? "bg-violet-200 text-slate-900 rounded-br-xs"
                        : "bg-[#F5F3FB] text-slate-900 border border-purple-100 rounded-bl-xs"
                    }`}
                  >
                    {m.role === "user" ? (
                      m.text
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({ children }: any) => (
                            <p className="mb-1.5 last:mb-0">{children}</p>
                          ),
                          strong: ({ children }: any) => (
                            <strong className="font-bold text-slate-900">
                              {children}
                            </strong>
                          ),
                          ul: ({ children }: any) => (
                            <ul className="list-disc pl-3.5 space-y-0.5 my-1">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }: any) => (
                            <ol className="list-decimal pl-3.5 space-y-0.5 my-1">
                              {children}
                            </ol>
                          ),
                          li: ({ children }: any) => <li>{children}</li>,
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex flex-col items-start animate-in fade-in duration-200">
                  <div className="p-2.5 px-3 rounded-2xl bg-[#F5F3FB] border border-purple-100 rounded-bl-xs flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
                    <span className="text-[10px] text-purple-700 font-medium ml-1">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 text-[9.5px] border-t border-slate-200">
              {[
                "Why is Eleanor’s behavior different today?”",
                // "How is my heart rhythm?",
                // "What should I do tonight?",
              ].map((chip) => (
                <button
                  key={chip}
                  disabled={isChatLoading}
                  onClick={() => handleSendMessage(chip)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 disabled:opacity-50 text-purple-700 border border-purple-200/60 font-medium transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input & Send Bar */}
            <div className="flex items-center gap-1.5">
              <Input
                value={chatInput}
                disabled={isChatLoading}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isChatLoading) handleSendMessage();
                }}
                placeholder={
                  isChatLoading ? "LifeTwin is thinking..." : "Ask LifeTwin..."
                }
                className="h-8 text-[11px] rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-purple-500 disabled:opacity-60"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!chatInput.trim() || isChatLoading}
                className="h-8 w-8 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
              >
                {isChatLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confined in-phone Health Dialog */}
      {isHealthDialogOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          {/* Backdrop confined to phone screen */}
          <div
            onClick={() => setIsHealthDialogOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Dialog Card inside phone screen */}
          <div className="relative w-full max-w-[340px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 flex flex-col gap-4 z-10 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Health</h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Current vital signs & trends
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRefreshVitals}
                  disabled={isRefreshingVitals}
                  title="Refresh vitals"
                  className="w-7 h-7 rounded-full hover:bg-slate-100 active:scale-95 flex items-center justify-center text-slate-400 hover:text-purple-600 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isRefreshingVitals ? "animate-spin text-purple-600" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={() => setIsHealthDialogOpen(false)}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4 Health Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {healthCards.map((card) => (
                <div
                  key={card.title}
                  className="bg-[#FAF9FD] rounded-2xl p-3 border border-purple-100/70 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${card.iconBg}`}
                    >
                      <card.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {card.title}
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg font-bold text-slate-900 tracking-tight">
                        {card.value}
                      </span>
                      {card.unit && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {card.unit}
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex items-center justify-start gap-1 text-[10px] text-gray-500 font-bold  py-0.5 rounded-full`}
                    >
                      <span>
                        <span className="text-slate-400 font-normal">
                          baseline:
                        </span>{" "}
                        {card.baseline}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* <div
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.trendColor}`}
                    >
                      {card.trend === "up" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{card.variation}</span>
                    </div> */}

            {/* Context Note */}
            {/* <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-200/50 flex items-start gap-2 text-[11px] text-amber-900 leading-snug">
              <span className="shrink-0 text-amber-600 font-bold">•</span>
              <span>
                Higher pulse and temperature detected compared to baseline.
              </span>
            </div> */}
          </div>
        </div>
      )}
      {/* Confined in-phone Location & Movement Dialog */}
      {isLocationDialogOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          {/* Backdrop confined to phone screen */}
          <div
            onClick={() => setIsLocationDialogOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Dialog Card inside phone screen */}
          <div className="relative w-full max-w-[340px] max-h-[88vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 flex flex-col gap-3.5 z-10 animate-in zoom-in-95 duration-150 sleek-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Location & Movement
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Real-time position & safety tracking
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsLocationDialogOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Location & Status Banner */}
            <div className="bg-[#F8F9FC] rounded-2xl p-3.5 border border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate max-w-[170px]">
                    {wanderingLocation}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isSafeZone
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                      : "bg-rose-50 text-rose-700 border-rose-200/60"
                  }`}
                >
                  {isSafeZone ? "Safe Zone" : "Restricted Area"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-slate-800">
                  {wanderingStatusFormatted}
                </span>
              </div>
            </div>

            {/* 4 Movement Stats Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Pacing Loop Count */}
              <div className="bg-[#FAF9FD] rounded-2xl p-3 border border-purple-100/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-100/70 flex items-center justify-center text-purple-700">
                    <Footprints className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-slate-500">
                    Pacing loops
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold text-slate-900 tracking-tight">
                    {pacingLoopCount}
                  </div>
                  <span className="text-[9.5px] text-slate-400">
                    hallway rounds
                  </span>
                </div>
              </div>

              {/* Minutes Out of Bed */}
              <div className="bg-[#FAF9FD] rounded-2xl p-3 border border-purple-100/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100/70 flex items-center justify-center text-indigo-700">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-slate-500">
                    Out of bed
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold text-slate-900 tracking-tight">
                    {minutesOutOfBed}m
                  </div>
                  <span className="text-[9.5px] text-slate-400">
                    active time
                  </span>
                </div>
              </div>

              {/* Night Bed Exit */}
              <div className="bg-[#FAF9FD] rounded-2xl p-3 border border-purple-100/70 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100/70 flex items-center justify-center text-blue-700">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-slate-500">
                    Night bed exit
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold text-slate-900 tracking-tight">
                    {nightBedExit ? "Detected" : "None"}
                  </div>
                  <span className="text-[9.5px] text-slate-400">
                    {nightBedExit ? "requires check" : "normal sleep"}
                  </span>
                </div>
              </div>

              {/* Elopement Risk & Score */}
              <div className="bg-[#FAF9FD] rounded-2xl p-3 border border-purple-100/70 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold text-slate-500">
                    Risk level
                  </span>
                  <span
                    className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border ${
                      elopementRisk === "LOW"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                        : elopementRisk === "ELEVATED"
                          ? "bg-amber-50 text-amber-700 border-amber-200/60"
                          : "bg-rose-50 text-rose-700 border-rose-200/60"
                    }`}
                  >
                    {elopementRisk}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold text-slate-900 tracking-tight">
                    {riskScore}
                    <span className="text-xs text-slate-400 font-normal">
                      /100
                    </span>
                  </div>
                  <span className="text-[9.5px] text-slate-400">
                    risk score
                  </span>
                </div>
              </div>
            </div>

            {/* Action Alert Banner */}
            {actionAlert ? (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Action Alert</span>
                  <span className="text-amber-800 leading-snug">
                    {actionAlert}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/50 text-[11px] text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>No active wandering or perimeter alert.</span>
              </div>
            )}

            {/* Contributing Factors */}
            {contributingFactors && contributingFactors.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1.5">
                  Contributing Factors
                </span>
                <div className="flex flex-wrap gap-1">
                  {contributingFactors.map((factor, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
