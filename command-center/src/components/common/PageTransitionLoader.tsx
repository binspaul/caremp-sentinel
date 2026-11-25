import React, { useEffect, useState, useRef } from 'react';
import { Heart } from 'lucide-react';
import { NavTab } from './Sidebar';

interface PageTransitionLoaderProps {
  activeTab: NavTab;
}

export const PageTransitionLoader: React.FC<PageTransitionLoaderProps> = ({ activeTab }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const prevTabRef = useRef<NavTab | null>(null);

  useEffect(() => {
    // Trigger smooth cardiac heartbeat transition on tab changes after initial mount
    if (prevTabRef.current !== null && prevTabRef.current !== activeTab) {
      setIsVisible(true);
      setIsFading(false);

      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, 380);

      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setIsFading(false);
      }, 540);

      prevTabRef.current = activeTab;
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-150 ease-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Soft Frosted Backdrop Blur */}
      <div className="absolute inset-0 bg-slate-900/15 dark:bg-slate-950/40 backdrop-blur-[3px] transition-colors" />

      {/* Pulsing Heart Emblem with Expanding Waves in Application Color Theme */}
      <div className="relative z-10 flex items-center justify-center w-24 h-24">
        {/* Concentric Expanding Ripple 1 */}
        <span className="absolute inset-0 rounded-full bg-emerald-500/25 dark:bg-emerald-500/35 animate-cardiac-ripple" />
        {/* Concentric Expanding Ripple 2 */}
        <span className="absolute inset-0 rounded-full bg-teal-500/20 dark:bg-teal-500/30 animate-cardiac-ripple [animation-delay:350ms]" />

        {/* Pure Rhythmic Beating Cardiac Heart in Application Color Theme */}
        <Heart className="relative z-10 w-12 h-12 text-emerald-500 fill-emerald-500 drop-shadow-[0_0_16px_rgba(16,185,129,0.7)] animate-cardiac-beat" />
      </div>
    </div>
  );
};
