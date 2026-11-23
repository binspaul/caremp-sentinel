import { PieChart, Pie, Cell } from "recharts";

// 4-point Diamond Sparkle logo mark
function SparkleIcon({
  className = "w-4 h-4",
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

export interface WellnessScorePieChartProps {
  score?: number;
  maxScore?: number;
  statusText?: string;
  subtitle?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function WellnessScorePieChart({
  score = 86,
  maxScore = 100,
  statusText = "FEELING GOOD",
  subtitle = "A picture of today",
  size = 104,
  strokeWidth = 6,
  className = "",
}: WellnessScorePieChartProps) {
  const clampedScore = Math.min(Math.max(score, 0), maxScore);
  const remaining = Math.max(0, maxScore - clampedScore);

  const data = [
    { name: "Score", value: clampedScore, color: "#dcd2f7" },
    { name: "Remaining", value: remaining, color: "rgba(255, 255, 255, 0.16)" },
  ];

  const outerRadius = size / 2 - 3;
  const innerRadius = outerRadius - strokeWidth;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <PieChart
          width={size}
          height={size}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <Pie
            data={data}
            cx={size / 2}
            cy={size / 2}
            startAngle={90}
            endAngle={-270}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            cornerRadius={strokeWidth}
            dataKey="value"
            stroke="none"
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none">
          <SparkleIcon className="w-4 h-4 text-purple-200 fill-purple-200 mb-0.5" />
          <span className="text-[8.5px] font-bold tracking-wider text-purple-100 uppercase">
            {statusText}
          </span>
        </div>
      </div>
      {subtitle && (
        <span className="text-[11px] font-normal text-purple-200/80 mt-2">
          {subtitle}
        </span>
      )}
    </div>
  );
}

// Named alias for backward compatibility
export const WellnessRing = WellnessScorePieChart;

export default WellnessScorePieChart;
