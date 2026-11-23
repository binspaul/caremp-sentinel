import type { ReactNode } from "react";

export interface IpadProProps {
  width?: number;
  height?: number;
  src?: string;
  className?: string;
  children?: ReactNode;
}

export function IpadPro({
  width = 530,
  height = 400,
  src,
  className = "",
  children,
  ...props
}: IpadProProps) {
  if (children) {
    return (
      <div
        className={`relative inline-block select-none ${className}`}
        style={{ width, height }}
        {...props}
      >
        {/* Screen Content Container */}
        <div
          className="absolute z-10 overflow-hidden rounded-[30px] bg-[#F6F6FA] text-left"
          style={{
            left: "2.83%",
            top: "3.75%",
            width: "94.34%",
            height: "92.5%",
          }}
        >
          {children}
        </div>

        {/* SVG iPad Frame overlay on top */}
        <svg
          width={width}
          height={height}
          viewBox="0 0 530 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 pointer-events-none z-20 w-full h-full drop-shadow-2xl"
        >
          <defs>
            <mask id="ipad-screen-cutout">
              {/* White allows everything to show */}
              <rect width="530" height="400" fill="#ffffff" />
              {/* Black punches out the screen area to make it completely transparent */}
              <rect x="15" y="15" width="500" height="370" rx="24" fill="#000000" />
            </mask>
          </defs>

          {/* Group containing outer body and black bezel with screen area masked out */}
          <g mask="url(#ipad-screen-cutout)">
            {/* Outer iPad body */}
            <rect x="3" y="3" width="524" height="394" rx="32" fill="#303333" />

            {/* Inner black bezel */}
            <rect x="8" y="8" width="514" height="384" rx="28" fill="#000000" />
          </g>

          {/* Front camera */}
          <circle cx="265" cy="10" r="3" fill="#080d4c" />
          <circle cx="265" cy="10" r="1.2" fill="#1D2A7A" />

          {/* Right side buttons */}
          <rect x="527" y="105" width="3" height="52" rx="1.5" fill="#222525" />
          <rect x="527" y="170" width="3" height="34" rx="1.5" fill="#222525" />

          {/* Speaker details */}
          <circle cx="185" cy="396" r="1.2" fill="#171919" />
          <circle cx="195" cy="396" r="1.2" fill="#171919" />
          <circle cx="205" cy="396" r="1.2" fill="#171919" />
          <circle cx="215" cy="396" r="1.2" fill="#171919" />
          <circle cx="225" cy="396" r="1.2" fill="#171919" />
          <circle cx="235" cy="396" r="1.2" fill="#171919" />
          <circle cx="245" cy="396" r="1.2" fill="#171919" />
          <circle cx="255" cy="396" r="1.2" fill="#171919" />
          <circle cx="265" cy="396" r="1.2" fill="#171919" />
          <circle cx="275" cy="396" r="1.2" fill="#171919" />
          <circle cx="285" cy="396" r="1.2" fill="#171919" />
          <circle cx="295" cy="396" r="1.2" fill="#171919" />
          <circle cx="305" cy="396" r="1.2" fill="#171919" />
          <circle cx="315" cy="396" r="1.2" fill="#171919" />
        </svg>
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 530 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer iPad body */}
      <rect x="3" y="3" width="524" height="394" rx="32" fill="#303333" />

      {/* Inner black bezel */}
      <rect x="8" y="8" width="514" height="384" rx="28" fill="#000000" />

      {/* Screen */}
      <rect
        x="15"
        y="15"
        width="500"
        height="370"
        rx="24"
        fill="currentColor"
      />

      {/* Screen image */}
      {src && (
        <image
          href={src}
          x="15"
          y="15"
          width="500"
          height="370"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#roundedCorners)"
        />
      )}

      {/* Front camera */}
      <circle cx="265" cy="10" r="3" fill="#080d4c" />

      <circle cx="265" cy="10" r="1.2" fill="#1D2A7A" />

      {/* Right side buttons */}
      <rect x="527" y="105" width="3" height="52" rx="1.5" fill="#222525" />

      <rect x="527" y="170" width="3" height="34" rx="1.5" fill="#222525" />

      {/* Speaker details */}
      <circle cx="185" cy="396" r="1.2" fill="#171919" />
      <circle cx="195" cy="396" r="1.2" fill="#171919" />
      <circle cx="205" cy="396" r="1.2" fill="#171919" />
      <circle cx="215" cy="396" r="1.2" fill="#171919" />
      <circle cx="225" cy="396" r="1.2" fill="#171919" />
      <circle cx="235" cy="396" r="1.2" fill="#171919" />
      <circle cx="245" cy="396" r="1.2" fill="#171919" />
      <circle cx="255" cy="396" r="1.2" fill="#171919" />
      <circle cx="265" cy="396" r="1.2" fill="#171919" />
      <circle cx="275" cy="396" r="1.2" fill="#171919" />
      <circle cx="285" cy="396" r="1.2" fill="#171919" />
      <circle cx="295" cy="396" r="1.2" fill="#171919" />
      <circle cx="305" cy="396" r="1.2" fill="#171919" />
      <circle cx="315" cy="396" r="1.2" fill="#171919" />

      <defs>
        <clipPath id="roundedCorners">
          <rect x="15" y="15" width="500" height="370" rx="24" ry="24" />
        </clipPath>
      </defs>
    </svg>
  );
}
