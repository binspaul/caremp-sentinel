import { Heart, Droplets, Activity, Thermometer } from "lucide-react";
import type { Correlation, BodyMetrics } from "../types/digitalTwin";

interface VitalRelationshipsCardProps {
  correlations?: Correlation[];
}

export function VitalRelationshipsCard({
  correlations = [],
}: VitalRelationshipsCardProps) {
  const findCorr = (pair: string) =>
    correlations.find((c) => c.vitalPair === pair);

  const c1 = findCorr("heartRate-spo2");
  const c2 = findCorr("heartRate-hrv");
  const c3 = findCorr("systolicBP-diastolicBP");
  const c4 = findCorr("hrv-bodyTemperature");

  const rows = [
    {
      id: "hr-spo2",
      leftIcon: <Heart className="w-3.5 h-3.5 text-rose-500" />,
      leftLabel: "Heart Rate",
      rightIcon: <Droplets className="w-3.5 h-3.5 text-sky-500" />,
      rightLabel: "SpO₂",
      coefficient: c1?.coefficient ?? 0.51,
      direction: c1?.direction ?? "POSITIVE",
      strength: c1?.strength ?? "MODERATE",
    },
    {
      id: "hr-hrv",
      leftIcon: <Heart className="w-3.5 h-3.5 text-rose-500" />,
      leftLabel: "Heart Rate",
      rightIcon: <Heart className="w-3.5 h-3.5 text-rose-500" />,
      rightLabel: "HRV",
      coefficient: c2?.coefficient ?? -0.48,
      direction: c2?.direction ?? "NEGATIVE",
      strength: c2?.strength ?? "MODERATE",
    },
    {
      id: "sys-dia",
      leftIcon: <Activity className="w-3.5 h-3.5 text-amber-600" />,
      leftLabel: "Systolic BP",
      rightIcon: <Activity className="w-3.5 h-3.5 text-amber-600" />,
      rightLabel: "Diastolic BP",
      coefficient: c3?.coefficient ?? 0.58,
      direction: c3?.direction ?? "POSITIVE",
      strength: c3?.strength ?? "MODERATE",
    },
    {
      id: "hrv-temp",
      leftIcon: <Heart className="w-3.5 h-3.5 text-rose-500" />,
      leftLabel: "HRV",
      rightIcon: <Thermometer className="w-3.5 h-3.5 text-purple-500" />,
      rightLabel: "Temperature",
      coefficient: c4?.coefficient ?? -0.71,
      direction: c4?.direction ?? "NEGATIVE",
      strength: c4?.strength ?? "STRONG",
    },
  ];

  const formatDirection = (dir?: string) => {
    if (!dir) return "Positive";
    const lower = dir.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  const formatStrength = (str?: string) => {
    if (!str) return "Moderate";
    const lower = str.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs flex flex-col justify-between h-full">
      <div>
        <h3 className="text-sm font-bold text-[#16122b]">
          Vital Relationships
        </h3>
        <p className="text-xs text-slate-500 font-normal mt-0.5 mb-3.5">
          How your vitals move together
        </p>

        {/* List of 4 Relationships */}
        <div className="space-y-2">
          {rows.map((row) => {
            const coef = Number(row.coefficient);
            const formattedCoef =
              coef > 0 ? `+${coef.toFixed(2)}` : coef.toFixed(2);
            const strengthText = formatStrength(row.strength);
            const directionText = formatDirection(row.direction);

            return (
              <div
                key={row.id}
                className="bg-[#f8f7fc] rounded-2xl px-3.5 py-2 flex items-center justify-between border border-purple-50/40"
              >
                {/* Left Side */}
                <div className="flex items-center gap-2 shrink-0">
                  {row.leftIcon}
                  <span className="text-xs font-medium text-slate-700">
                    {row.leftLabel}
                  </span>
                </div>

                {/* Left Connector Line */}
                <div className="flex-1 h-px bg-slate-200/80 mx-3 min-w-[12px]" />

                {/* Center Overlapping Badge */}
                <div className="relative flex flex-col items-center shrink-0">
                  <div className="bg-white rounded-full px-3 py-0.5 border border-slate-200/80 shadow-2xs flex items-center gap-1.5 z-10 -mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7042c1]" />
                    <span className="text-xs font-bold text-slate-900 tracking-tight">
                      {formattedCoef}
                    </span>
                  </div>
                  <div className="bg-[#ede8f8] text-[#5e3da5] text-[9.5px] font-medium px-3.5 pt-2 pb-0.5 rounded-full text-center whitespace-nowrap">
                    {strengthText} · {directionText}
                  </div>
                </div>

                {/* Right Connector Line */}
                <div className="flex-1 h-px bg-slate-200/80 mx-3 min-w-[12px]" />

                {/* Right Side */}
                <div className="flex items-center gap-2 shrink-0">
                  {row.rightIcon}
                  <span className="text-xs font-medium text-slate-700">
                    {row.rightLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface BodyDataCardProps {
  body?: BodyMetrics;
}

export function BodyDataCard({ body }: BodyDataCardProps) {
  const bmiVal = body?.bmi !== undefined ? Number(body.bmi).toFixed(1) : "24.4";
  const heightVal = body?.heightCm ?? 162;
  const weightVal = body?.weightKg ?? 64;
  const bloodGroupVal = body?.bloodGroup ?? "O+";

  const items = [
    { label: "BMI", value: bmiVal },
    { label: "Height", value: heightVal, unit: "cm" },
    { label: "Weight", value: weightVal, unit: "kg" },
    { label: "Blood group", value: bloodGroupVal },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs flex flex-col justify-between h-full">
      <div>
        <h3 className="text-sm font-bold text-[#16122b]">Body data</h3>
        <p className="text-xs text-slate-500 font-normal mt-0.5 mb-3.5">
          Your personal measurements
        </p>

        {/* List of 4 Body Metrics */}
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="bg-[#f8f7fc] rounded-2xl px-4 py-2 flex items-center justify-between border border-purple-50/40 min-h-[46px]"
            >
              <span className="text-xs font-medium text-slate-600">
                {item.label}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-[#16122b] tracking-tight">
                  {item.value}
                </span>
                {item.unit && (
                  <span className="text-[10.5px] font-normal text-slate-400">
                    {item.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
