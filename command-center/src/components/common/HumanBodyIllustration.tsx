import React from 'react';

export type BodyHotspot = 'sundowning' | 'vitals' | 'wandering' | 'circadian' | 'deterioration' | null;

export interface HumanBodyIllustrationProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  selectedHotspot?: BodyHotspot;
  onSelectHotspot?: (hotspot: BodyHotspot) => void;
  agitationIndex?: number; // 0-100
  isSafePerimeter?: boolean;
}

export const HumanBodyIllustration: React.FC<HumanBodyIllustrationProps> = ({
  className = 'w-full h-auto',
  selectedHotspot = 'sundowning',
  onSelectHotspot,
  agitationIndex = 0,
  isSafePerimeter = true,
  ...props
}) => {
  const isSundowningSelected = selectedHotspot === 'sundowning';
  const isVitalsSelected = selectedHotspot === 'vitals';
  const isWanderingSelected = selectedHotspot === 'wandering';
  const isCircadianSelected = selectedHotspot === 'circadian';
  const isDeteriorationSelected = selectedHotspot === 'deterioration';

  const isAgitated = agitationIndex > 60;

  const handleClick = (hotspot: BodyHotspot, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectHotspot) {
      onSelectHotspot(selectedHotspot === hotspot ? null : hotspot);
    }
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      <svg
        width="190"
        height="430"
        viewBox="0 0 240 598"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-all duration-300 ${className}`}
        {...props}
      >
        <defs>
          {/* Minimal Muted Silhouette */}
          <linearGradient
            id="apple_body_silhouette"
            x1="120"
            y1="0"
            x2="120"
            y2="598"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#94A3B8" stopOpacity="0.18" />
            <stop offset="0.5" stopColor="#CBD5E1" stopOpacity="0.28" />
            <stop offset="1" stopColor="#94A3B8" stopOpacity="0.16" />
          </linearGradient>

          {/* Brain / Sundowning Highlight */}
          <linearGradient id="brain_active_grad" x1="0" y1="0" x2="35" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor={isAgitated ? '#F43F5E' : '#6366F1'} stopOpacity="0.9" />
            <stop offset="1" stopColor={isAgitated ? '#BE123C' : '#4F46E5'} stopOpacity="0.8" />
          </linearGradient>

          {/* Heart / Vitals Highlight */}
          <linearGradient id="heart_active_grad" x1="25" y1="17" x2="42" y2="51" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F43F5E" stopOpacity="0.9" />
            <stop offset="1" stopColor="#E11D48" stopOpacity="0.85" />
          </linearGradient>

          {/* Legs / Wandering Highlight */}
          <linearGradient id="mobility_active_grad" x1="120" y1="300" x2="120" y2="560" gradientUnits="userSpaceOnUse">
            <stop stopColor={isSafePerimeter ? '#0EA5E9' : '#F59E0B'} stopOpacity="0.85" />
            <stop offset="1" stopColor={isSafePerimeter ? '#0284C7' : '#D97706'} stopOpacity="0.8" />
          </linearGradient>

          {/* Circadian Subtle Halo */}
          <radialGradient id="circadian_halo" cx="120" cy="220" r="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Circadian Aura (Visible when Circadian Engine selected) */}
        {isCircadianSelected && (
          <ellipse
            cx="120"
            cy="210"
            rx="90"
            ry="180"
            fill="url(#circadian_halo)"
            className="transition-opacity duration-500"
          />
        )}

        {/* 1. Body Base Silhouette */}
        <g id="body-silhouette">
          <path
            d="M119.824 0.625C99.8236 0.625 90.8236 13.625 90.8236 32.625L91.8236 39.625C85.8236 36.625 86.8236 49.625 90.8236 54.625L93.8236 55.625C95.8236 66.625 102.824 73.625 107.824 77.625L106.824 91.625C98.8236 98.625 80.8236 100.625 65.8236 106.625C53.8236 111.625 45.8236 121.625 40.8236 136.625C35.8236 156.625 33.8236 177.625 29.8236 196.625C25.8236 211.625 21.8236 222.625 18.8236 238.625L11.8236 284.625C9.82363 294.625 6.82363 303.625 3.82363 313.625L0.82363 327.625C-0.17637 332.625 2.82363 334.625 4.82363 329.625L8.82363 317.625L6.82363 341.625C6.82363 346.625 10.8236 346.625 11.8236 342.625L14.8236 323.625L13.8236 347.625C13.8236 351.625 17.8236 351.625 18.8236 347.625L21.8236 324.625V345.625C21.8236 349.625 25.8236 349.625 26.8236 344.625L28.8236 322.625L29.8236 338.625C30.8236 342.625 33.8236 341.625 33.8236 337.625V315.625C32.8236 307.625 30.8236 301.625 32.8236 291.625L45.8236 246.625C49.8236 230.625 52.8236 216.625 54.8236 204.625L63.8236 166.625C67.8236 180.625 71.8236 198.625 70.8236 216.625C69.8236 230.625 64.8236 245.625 63.8236 261.625C62.8236 274.625 64.8236 292.625 67.8236 306.625C66.8236 328.625 67.8236 354.625 71.8236 378.625L78.8236 423.625C78.8236 435.625 75.8236 449.625 77.8236 464.625C79.8236 488.625 85.8236 516.625 87.8236 539.625V564.625C84.8236 574.625 78.8236 581.625 77.8236 588.625C76.8236 594.625 81.8236 596.625 90.8236 596.625H107.824C112.824 595.625 113.824 591.625 111.824 585.625L108.824 567.625L109.824 539.625C112.824 514.625 117.824 490.625 116.824 465.625L113.824 435.625C112.824 419.625 115.824 401.625 116.824 381.625L117.824 338.625C117.824 326.625 118.824 318.625 119.824 315.625C120.824 318.625 121.824 326.625 121.824 338.625L122.824 381.625C123.824 401.625 126.824 419.625 125.824 435.625L122.824 465.625C121.824 490.625 126.824 514.625 129.824 539.625L130.824 567.625L127.824 585.625C125.824 591.625 126.824 595.625 131.824 596.625H148.824C157.824 596.625 162.824 594.625 161.824 588.625C160.824 581.625 154.824 574.625 151.824 564.625V539.625C153.824 516.625 159.824 488.625 161.824 464.625C163.824 449.625 160.824 435.625 160.824 423.625L167.824 378.625C171.824 354.625 172.824 328.625 171.824 306.625C174.824 292.625 176.824 274.625 175.824 261.625C174.824 245.625 169.824 230.625 168.824 216.625C167.824 198.625 171.824 180.625 175.824 166.625L184.824 204.625C186.824 216.625 189.824 230.625 193.824 246.625L206.824 291.625C208.824 301.625 206.824 307.625 205.824 315.625V337.625C205.824 341.625 208.824 342.625 209.824 338.625L210.824 322.625L212.824 344.625C213.824 349.625 217.824 349.625 217.824 345.625V324.625L220.824 347.625C221.824 351.625 225.824 351.625 225.824 347.625L224.824 323.625L227.824 342.625C228.824 346.625 232.824 346.625 232.824 341.625L230.824 317.625L234.824 329.625C236.824 334.625 239.824 332.625 238.824 327.625L235.824 313.625C232.824 303.625 229.824 294.625 227.824 284.625L220.824 238.625C217.824 222.625 213.824 211.625 209.824 196.625C205.824 177.625 203.824 156.625 198.824 136.625C193.824 121.625 185.824 111.625 173.824 106.625C158.824 100.625 140.824 98.625 132.824 91.625L131.824 77.625C136.824 73.625 143.824 66.625 145.824 55.625L148.824 54.625C152.824 49.625 153.824 36.625 147.824 39.625L148.824 32.625C148.824 13.625 139.824 0.625 119.824 0.625Z"
            fill="url(#apple_body_silhouette)"
            stroke="#94A3B8"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        </g>

        {/* 2. Minimal Spine */}
        <g id="spine" transform="translate(115.42, 79.62)" pointerEvents="none">
          <path d="M4.4 0V200" strokeWidth="1.5" stroke="#94A3B8" strokeOpacity="0.25" />
        </g>

        {/* 3. Brain / Sundowning Engine Hotspot */}
        <g
          id="brain-hotspot"
          transform="translate(95.48, 14.62)"
          className="cursor-pointer transition-transform duration-200 hover:scale-105"
          onClick={(e) => handleClick('sundowning', e)}
        >
          <path
            d="M23.34 2.63C18.34 -1.37 12.34 0.63 10.34 4.63C4.34 4.63 1.34 9.63 2.34 14.63C-1.66 18.63 1.34 24.63 5.34 25.63C7.34 30.63 15.34 30.63 21.34 26.63L24.34 24.63L27.34 26.63C33.34 30.63 41.34 30.63 43.34 25.63C47.34 24.63 50.34 18.63 46.34 14.63C47.34 9.63 44.34 4.63 38.34 4.63C36.34 0.63 30.34 -1.37 25.34 2.63H23.34Z"
            fill={isSundowningSelected ? 'url(#brain_active_grad)' : '#94A3B8'}
            fillOpacity={isSundowningSelected ? '1' : '0.35'}
            stroke={isSundowningSelected ? (isAgitated ? '#E11D48' : '#4F46E5') : '#64748B'}
            strokeWidth={isSundowningSelected ? '1.5' : '0.8'}
          />
          <path
            d="M24.34 4.63V23.63M17.34 3.63C13.34 5.63 17.34 10.63 13.34 12.63C7.34 13.63 5.34 9.63 8.34 7.63M4.34 17.63C10.34 14.63 15.34 17.63 12.34 22.63M17.34 14.63C21.34 15.63 21.34 21.63 17.34 24.63M31.34 3.63C35.34 5.63 31.34 10.63 35.34 12.63C41.34 13.63 43.34 9.63 40.34 7.63M44.34 17.63C38.34 14.63 33.34 17.63 36.34 22.63M31.34 14.63C27.34 15.63 27.34 21.63 31.34 24.63"
            strokeWidth="0.8"
            strokeLinecap="round"
            stroke="#FFFFFF"
            strokeOpacity={isSundowningSelected ? '0.85' : '0.4'}
          />
        </g>

        {/* 4. Heart / Vitals Engine Hotspot */}
        <g
          id="heart-hotspot"
          transform="translate(112.43, 139.62)"
          className="cursor-pointer transition-transform duration-200 hover:scale-105"
          onClick={(e) => handleClick('vitals', e)}
        >
          <path
            d="M27 26L25 17C25 12 32 11 34 16L35 21"
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke={isVitalsSelected ? '#F43F5E' : '#94A3B8'}
            strokeOpacity={isVitalsSelected ? '1' : '0.4'}
          />
          <path
            d="M29 24C24 17 17 22 17 30C16 38 22 43 27 47C31 51 37 55 39 51C43 45 45 36 41 29C38 24 34 22 29 24Z"
            fill={isVitalsSelected ? 'url(#heart_active_grad)' : '#94A3B8'}
            fillOpacity={isVitalsSelected ? '1' : '0.35'}
            stroke={isVitalsSelected ? '#BE123C' : '#64748B'}
            strokeWidth={isVitalsSelected ? '1.5' : '0.8'}
          />
          <path
            d="M23 25C19 28 21 35 25 38"
            strokeWidth="1.2"
            strokeLinecap="round"
            stroke="#FFE4E6"
            strokeOpacity={isVitalsSelected ? '0.9' : '0.3'}
          />
        </g>

        {/* 4b. Early Warning & Deterioration Core Hotspot */}
        <g
          id="deterioration-hotspot"
          className="cursor-pointer transition-transform duration-200 hover:scale-110"
          onClick={(e) => handleClick('deterioration', e)}
        >
          <circle
            cx="120"
            cy="210"
            r={isDeteriorationSelected ? '13' : '9'}
            fill={isDeteriorationSelected ? '#F59E0B' : '#94A3B8'}
            fillOpacity={isDeteriorationSelected ? '0.9' : '0.25'}
            stroke={isDeteriorationSelected ? '#D97706' : '#64748B'}
            strokeWidth={isDeteriorationSelected ? '1.6' : '0.8'}
          />
          <path
            d="M120 205V215M115 210H125"
            stroke="#FFFFFF"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeOpacity={isDeteriorationSelected ? '0.95' : '0.6'}
          />
        </g>

        {/* 5. Legs / Wandering Engine Hotspot */}
        <g
          id="wandering-hotspot"
          className="cursor-pointer transition-opacity duration-200 hover:opacity-90"
          onClick={(e) => handleClick('wandering', e)}
        >
          {isWanderingSelected && (
            <>
              <path
                d="M82.82 307.62C72.82 335.62 81.82 384.62 89.82 419.62C93.82 436.62 87.82 451.62 89.82 473.62L97.82 552.62H102.82C100.82 521.62 107.82 490.62 106.82 463.62C102.82 442.62 101.82 426.62 104.82 405.62C107.82 370.62 104.82 335.62 97.82 318.62L82.82 307.62Z"
                fill="url(#mobility_active_grad)"
                stroke="#0284C7"
                strokeWidth="1.2"
              />
              <path
                d="M156.82 307.62C166.82 335.62 157.82 384.62 149.82 419.62C145.82 436.62 151.82 451.62 149.82 473.62L141.82 552.62H136.82C138.82 521.62 131.82 490.62 132.82 463.62C136.82 442.62 137.82 426.62 134.82 405.62C131.82 370.62 134.82 335.62 141.82 318.62L156.82 307.62Z"
                fill="url(#mobility_active_grad)"
                stroke="#0284C7"
                strokeWidth="1.2"
              />
            </>
          )}

          {/* Hit area for lower limbs */}
          <rect x="65" y="300" width="110" height="295" fill="transparent" />
        </g>
      </svg>
    </div>
  );
};

export default HumanBodyIllustration;
