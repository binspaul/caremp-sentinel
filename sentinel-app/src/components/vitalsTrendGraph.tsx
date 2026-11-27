import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
} from "recharts";
import type { VitalRecord } from "../types/vital";
import type { Baselines } from "../types/digitalTwin";

export type VitalMetricKey =
  | "heartRate"
  | "systolicBP"
  | "diastolicBP"
  | "temperature"
  | null;

export interface MetricConfig {
  key: "heartRate" | "systolicBP" | "diastolicBP" | "temperature";
  label: string;
  shortLabel: string;
  title: string;
  unit: string;
  color: string;
  gradientId: string;
  baseline: number;
}

export const METRIC_CONFIGS: Record<
  "heartRate" | "systolicBP" | "diastolicBP" | "temperature",
  MetricConfig
> = {
  heartRate: {
    key: "heartRate",
    label: "Heart rate",
    shortLabel: "HR",
    title: "A closer look at your heart rate",
    unit: "bpm",
    color: "#8c67eb", // Purple
    gradientId: "gradHeartRate",
    baseline: 79,
  },
  systolicBP: {
    key: "systolicBP",
    label: "SystolicBP",
    shortLabel: "Sys BP",
    title: "A closer look at your SystolicBP",
    unit: "mmHg",
    color: "#3b82f6", // Blue
    gradientId: "gradSystolicBP",
    baseline: 120,
  },
  diastolicBP: {
    key: "diastolicBP",
    label: "DiastolicBP",
    shortLabel: "Dia BP",
    title: "A closer look at your DiastolicBP",
    unit: "mmHg",
    color: "#10b981", // Emerald
    gradientId: "gradDiastolicBP",
    baseline: 80,
  },
  temperature: {
    key: "temperature",
    label: "Temperature",
    shortLabel: "Temp",
    title: "A closer look at your temperature",
    unit: "°C",
    color: "#f59e0b", // Amber
    gradientId: "gradTemperature",
    baseline: 37.0,
  },
};

export interface VitalsTrendGraphProps {
  data?: VitalRecord[];
  baseline?: number;
  baselines?:
    | Baselines
    | Partial<
        Record<
          | "heartRate"
          | "systolicBP"
          | "diastolicBP"
          | "temperature"
          | "bodyTemperature",
          number
        >
      >;
  className?: string;
  selectedMetric?: VitalMetricKey;
  onSelectMetric?: (metric: VitalMetricKey) => void;
}

export function VitalsTrendGraph({
  data = [],
  baseline = 79,
  baselines,
  className = "",
  selectedMetric: controlledMetric,
  onSelectMetric,
}: VitalsTrendGraphProps) {
  const [internalMetric, setInternalMetric] = useState<VitalMetricKey>(null);

  // Controlled or uncontrolled selection
  const activeMetric =
    controlledMetric !== undefined ? controlledMetric : internalMetric;

  const handleToggle = (
    key: "heartRate" | "systolicBP" | "diastolicBP" | "temperature",
  ) => {
    const nextMetric = activeMetric === key ? null : key;
    if (onSelectMetric) {
      onSelectMetric(nextMetric);
    }
    setInternalMetric(nextMetric);
  };

  // Process data chronologically (left to right)
  const chartData = React.useMemo(() => {
    if (data && data.length > 0) {
      // Reverse because API returns newest first (descending)
      const list = [...data].reverse();
      // Up to 30 points for smooth trend line
      const sampled = list.length > 30 ? list.slice(list.length - 30) : list;

      return sampled.map((item, index) => {
        const isLast = index === sampled.length - 1;
        let timeLabel = "";

        if (isLast) {
          timeLabel = "Now";
        } else if (item.generatedAt) {
          try {
            const date = new Date(item.generatedAt);
            if (!isNaN(date.getTime())) {
              const h = date.getHours() % 12 || 12;
              const hoursStr = String(h).padStart(2, "0");
              const minutesStr = String(date.getMinutes()).padStart(2, "0");
              // 12-hour format without AM/PM (e.g. "05:33", "05:36")
              timeLabel = `${hoursStr}:${minutesStr}`;
            } else {
              timeLabel = `${sampled.length - 1 - index}m ago`;
            }
          } catch {
            timeLabel = `${sampled.length - 1 - index}m ago`;
          }
        } else {
          timeLabel = `${sampled.length - 1 - index}m ago`;
        }

        const hr = parseFloat(item.heartRate);
        const sys = parseFloat(item.systolicBP);
        const dia = parseFloat(item.diastolicBP);
        const temp = parseFloat(item.bodyTemperature);

        return {
          time: timeLabel,
          heartRate: isNaN(hr) ? 70 : Math.round(hr),
          systolicBP: isNaN(sys) ? 120 : Math.round(sys),
          diastolicBP: isNaN(dia) ? 80 : Math.round(dia),
          temperature: isNaN(temp) ? 37.0 : parseFloat(temp.toFixed(1)),
        };
      });
    }

    // Default reference points matching initial design
    return [
      {
        time: "05:00",
        heartRate: 71,
        systolicBP: 121,
        diastolicBP: 79,
        temperature: 36.8,
      },
      {
        time: "05:05",
        heartRate: 73,
        systolicBP: 123,
        diastolicBP: 81,
        temperature: 36.9,
      },
      {
        time: "05:10",
        heartRate: 69,
        systolicBP: 118,
        diastolicBP: 78,
        temperature: 37.0,
      },
      {
        time: "05:15",
        heartRate: 72,
        systolicBP: 122,
        diastolicBP: 80,
        temperature: 36.9,
      },
      {
        time: "05:20",
        heartRate: 69,
        systolicBP: 119,
        diastolicBP: 79,
        temperature: 37.1,
      },
      {
        time: "05:25",
        heartRate: 71,
        systolicBP: 121,
        diastolicBP: 80,
        temperature: 37.0,
      },
      {
        time: "Now",
        heartRate: 70,
        systolicBP: 120,
        diastolicBP: 80,
        temperature: 37.0,
      },
    ];
  }, [data]);

  // Extract dynamic baselines, preferring digitalTwin.baselines values when available
  const resolvedBaselines = React.useMemo(() => {
    const b = baselines as any;
    const hr =
      b?.heartRate?.value ??
      b?.heartRate ??
      baseline ??
      METRIC_CONFIGS.heartRate.baseline;
    const sys =
      b?.systolicBP?.value ??
      b?.systolicBP ??
      METRIC_CONFIGS.systolicBP.baseline;
    const dia =
      b?.diastolicBP?.value ??
      b?.diastolicBP ??
      METRIC_CONFIGS.diastolicBP.baseline;
    const temp =
      b?.bodyTemperature?.value ??
      b?.temperature?.value ??
      b?.bodyTemperature ??
      b?.temperature ??
      METRIC_CONFIGS.temperature.baseline;

    return {
      heartRate: Math.round(Number(hr)),
      systolicBP: Math.round(Number(sys)),
      diastolicBP: Math.round(Number(dia)),
      temperature: Math.round(Number(temp) * 10) / 10,
    };
  }, [baselines, baseline]);

  // Compute domains based on active selection
  const { yMin, yMax, yTicks, tempMin, tempMax } = React.useMemo(() => {
    // Temperature bounds
    const temps = chartData.map((d) => d.temperature);
    temps.push(resolvedBaselines.temperature);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const tMin = Math.floor(minT * 2) / 2 - 0.5;
    const tMax = Math.ceil(maxT * 2) / 2 + 0.5;

    if (activeMetric === "temperature") {
      const midT = parseFloat(((tMin + tMax) / 2).toFixed(1));
      return {
        yMin: tMin,
        yMax: tMax,
        yTicks: [tMax, midT, tMin],
        tempMin: tMin,
        tempMax: tMax,
      };
    }

    // Primary values (hr, sys, dia)
    let values: number[] = [];
    if (activeMetric === "heartRate") {
      values = chartData.map((d) => d.heartRate);
      values.push(resolvedBaselines.heartRate);
    } else if (activeMetric === "systolicBP") {
      values = chartData.map((d) => d.systolicBP);
      values.push(resolvedBaselines.systolicBP);
    } else if (activeMetric === "diastolicBP") {
      values = chartData.map((d) => d.diastolicBP);
      values.push(resolvedBaselines.diastolicBP);
    } else {
      // All shown: span all 3 main vital signals
      values = [
        ...chartData.map((d) => d.heartRate),
        ...chartData.map((d) => d.systolicBP),
        ...chartData.map((d) => d.diastolicBP),
      ];
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const roundedMin = Math.max(0, Math.floor((min - 5) / 10) * 10);
    const roundedMax = Math.ceil((max + 5) / 10) * 10;
    const mid = Math.round((roundedMin + roundedMax) / 20) * 10;

    return {
      yMin: roundedMin,
      yMax: roundedMax,
      yTicks: [roundedMax, mid, roundedMin],
      tempMin: tMin,
      tempMax: tMax,
    };
  }, [chartData, activeMetric, resolvedBaselines]);

  // Active baseline value (only shown when a single metric is selected)
  const currentBaseline = React.useMemo(() => {
    if (!activeMetric) return null;
    return resolvedBaselines[activeMetric];
  }, [activeMetric, resolvedBaselines]);

  // Endpoint halo dot on the latest reading
  const createEndpointDot = (color: string) => {
    return (props: any) => {
      const { cx, cy, index } = props;
      if (index === chartData.length - 1) {
        return (
          <g key={`endpoint-${color}-${index}`}>
            <circle cx={cx} cy={cy} r={4.5} fill={color} />
            <circle cx={cx} cy={cy} r={2} fill="#ffffff" />
          </g>
        );
      }
      return <React.Fragment key={`dot-${color}-${index}`} />;
    };
  };

  // Latest readings for legend display
  const latestPoint = chartData[chartData.length - 1];

  return (
    <div className={`relative mt-4 w-full ${className}`}>
      {/* Chart Canvas */}
      <div className="w-full h-[135px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 10, left: -22, bottom: 0 }}
          >
            <defs>
              {/* Gradients for each metric */}
              <linearGradient id="gradHeartRate" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="#8c67eb"
                  stopOpacity={activeMetric === "heartRate" ? 0.25 : 0.08}
                />
                <stop offset="100%" stopColor="#8c67eb" stopOpacity={0.0} />
              </linearGradient>

              <linearGradient id="gradSystolicBP" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="#3b82f6"
                  stopOpacity={activeMetric === "systolicBP" ? 0.25 : 0.08}
                />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>

              <linearGradient id="gradDiastolicBP" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="#10b981"
                  stopOpacity={activeMetric === "diastolicBP" ? 0.25 : 0.08}
                />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>

              <linearGradient id="gradTemperature" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="#f59e0b"
                  stopOpacity={activeMetric === "temperature" ? 0.25 : 0.08}
                />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Subtle horizontal grid lines */}
            <CartesianGrid stroke="#f1f5f9" vertical={false} />

            {/* Primary Y Axis */}
            <YAxis
              yAxisId="primary"
              domain={[yMin, yMax]}
              ticks={yTicks}
              axisLine={false}
              tickLine={false}
              width={34}
              tick={{
                fill: "#cbd5e1",
                fontSize: 10,
                fontFamily: "monospace",
              }}
              tickFormatter={(v) =>
                activeMetric === "temperature" ? `${v}` : `${v}`
              }
            />

            {/* Secondary Temperature Y Axis (only active when all metrics are shown) */}
            {activeMetric === null && (
              <YAxis
                yAxisId="temp"
                orientation="right"
                domain={[tempMin, tempMax]}
                hide={true}
              />
            )}

            {/* X Axis Time Marks (e.g. "05:33", "05:36", "Now") */}
            <XAxis
              dataKey="time"
              axisLine={{ stroke: "#f1f5f9" }}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10.5 }}
              dy={6}
              interval="preserveStartEnd"
            />

            {/* Interactive Tooltip */}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-xs text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-slate-800 space-y-1.5 pointer-events-none z-50">
                      <div className="text-[10px] font-medium text-slate-400 border-b border-slate-800 pb-1">
                        Time: <span className="text-slate-200">{d.time}</span>
                      </div>

                      {(activeMetric === null ||
                        activeMetric === "heartRate") && (
                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="flex items-center gap-1.5 text-purple-300">
                            <span className="w-2 h-2 rounded-full bg-[#8c67eb]" />
                            Heart rate
                          </span>
                          <span className="font-semibold text-white">
                            {d.heartRate} bpm
                          </span>
                        </div>
                      )}

                      {(activeMetric === null ||
                        activeMetric === "systolicBP") && (
                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="flex items-center gap-1.5 text-blue-300">
                            <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                            SystolicBP
                          </span>
                          <span className="font-semibold text-white">
                            {d.systolicBP} mmHg
                          </span>
                        </div>
                      )}

                      {(activeMetric === null ||
                        activeMetric === "diastolicBP") && (
                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="flex items-center gap-1.5 text-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                            DiastolicBP
                          </span>
                          <span className="font-semibold text-white">
                            {d.diastolicBP} mmHg
                          </span>
                        </div>
                      )}

                      {(activeMetric === null ||
                        activeMetric === "temperature") && (
                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="flex items-center gap-1.5 text-amber-300">
                            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                            Temperature
                          </span>
                          <span className="font-semibold text-white">
                            {d.temperature} °C
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Dotted Baseline Line (ONLY shown when a single metric is selected) */}
            {activeMetric !== null && currentBaseline !== null && (
              <ReferenceLine
                yAxisId="primary"
                y={currentBaseline}
                stroke="#cbd5e1"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )}

            {/* Heart Rate Area */}
            {(activeMetric === null || activeMetric === "heartRate") && (
              <Area
                yAxisId="primary"
                type="monotone"
                dataKey="heartRate"
                stroke="#8c67eb"
                strokeWidth={activeMetric === "heartRate" ? 2.5 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#gradHeartRate)"
                dot={
                  activeMetric === "heartRate"
                    ? createEndpointDot("#8c67eb")
                    : false
                }
                activeDot={{
                  r: 5,
                  fill: "#8c67eb",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                isAnimationActive={true}
                animationDuration={600}
              />
            )}

            {/* Systolic BP Area */}
            {(activeMetric === null || activeMetric === "systolicBP") && (
              <Area
                yAxisId="primary"
                type="monotone"
                dataKey="systolicBP"
                stroke="#3b82f6"
                strokeWidth={activeMetric === "systolicBP" ? 2.5 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#gradSystolicBP)"
                dot={
                  activeMetric === "systolicBP"
                    ? createEndpointDot("#3b82f6")
                    : false
                }
                activeDot={{
                  r: 5,
                  fill: "#3b82f6",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                isAnimationActive={true}
                animationDuration={600}
              />
            )}

            {/* Diastolic BP Area */}
            {(activeMetric === null || activeMetric === "diastolicBP") && (
              <Area
                yAxisId="primary"
                type="monotone"
                dataKey="diastolicBP"
                stroke="#10b981"
                strokeWidth={activeMetric === "diastolicBP" ? 2.5 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#gradDiastolicBP)"
                dot={
                  activeMetric === "diastolicBP"
                    ? createEndpointDot("#10b981")
                    : false
                }
                activeDot={{
                  r: 5,
                  fill: "#10b981",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                isAnimationActive={true}
                animationDuration={600}
              />
            )}

            {/* Temperature Area (maps to primary if isolated, or secondary temp axis if all shown) */}
            {(activeMetric === null || activeMetric === "temperature") && (
              <Area
                yAxisId={activeMetric === "temperature" ? "primary" : "temp"}
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                strokeWidth={activeMetric === "temperature" ? 2.5 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#gradTemperature)"
                dot={
                  activeMetric === "temperature"
                    ? createEndpointDot("#f59e0b")
                    : false
                }
                activeDot={{
                  r: 5,
                  fill: "#f59e0b",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                isAnimationActive={true}
                animationDuration={600}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Legend Below */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-3 mt-2 border-t border-slate-100">
        {(
          ["heartRate", "systolicBP", "diastolicBP", "temperature"] as const
        ).map((key) => {
          const cfg = METRIC_CONFIGS[key];
          const isSelected = activeMetric === key;
          const isDimmed = activeMetric !== null && !isSelected;

          const currentVal =
            key === "heartRate"
              ? `${latestPoint?.heartRate ?? 70} bpm`
              : key === "systolicBP"
                ? `${latestPoint?.systolicBP ?? 120} mmHg`
                : key === "diastolicBP"
                  ? `${latestPoint?.diastolicBP ?? 80} mmHg`
                  : `${latestPoint?.temperature ?? 37.0} °C`;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleToggle(key)}
              title={
                isSelected
                  ? "Click to view all signals"
                  : `Click to focus on ${cfg.label}`
              }
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer select-none border ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs scale-105 font-medium"
                  : isDimmed
                    ? "bg-white/60 text-slate-400 border-slate-200/60 opacity-60 hover:opacity-100 hover:border-slate-300"
                    : "bg-slate-50/90 hover:bg-slate-100 text-slate-700 border-slate-200/70"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cfg.color }}
              />
              <span className="font-medium">{cfg.label}</span>
              <span
                className={`text-[11px] font-mono ${
                  isSelected ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {currentVal}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default VitalsTrendGraph;
