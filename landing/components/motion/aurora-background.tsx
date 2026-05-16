'use client';

import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Intensity multiplier 0..1 (defaults 1) */
  intensity?: number;
};

/**
 * Premium aurora gradient mesh.
 * Uses three drifting radial gradients in indigo + platinum tones,
 * with a slow hue shift. Pure CSS animation (Framer not needed),
 * but reduced-motion aware via a static fallback.
 */
export function AuroraBackground({ className, intensity = 1 }: Props) {
  const reduce = useReducedMotion();
  const opacity = Math.max(0, Math.min(1, intensity));

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      {/* Base radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(79,70,229,0.18), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(20,16,44,0.6), transparent 70%)',
        }}
      />
      {/* Drifting blobs */}
      <div
        className="absolute -top-1/3 -left-1/4 h-[80vh] w-[80vh] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(79,70,229,0.55), rgba(79,70,229,0) 65%)',
          opacity: opacity * 0.7,
          animation: reduce ? undefined : 'aurora-drift 22s ease-in-out infinite, aurora-hue 30s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-1/4 -right-1/4 h-[70vh] w-[70vh] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.42), rgba(99,102,241,0) 65%)',
          opacity: opacity * 0.6,
          animation: reduce ? undefined : 'aurora-drift 28s ease-in-out infinite reverse, aurora-hue 40s ease-in-out infinite',
          animationDelay: '-8s',
        }}
      />
      <div
        className="absolute -bottom-1/4 left-1/4 h-[60vh] w-[60vh] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(129,140,248,0.28), rgba(129,140,248,0) 65%)',
          opacity: opacity * 0.55,
          animation: reduce ? undefined : 'aurora-drift 26s ease-in-out infinite',
          animationDelay: '-14s',
        }}
      />
      {/* Platinum highlight at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-[60%]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(245,244,240,0.35), transparent)',
        }}
      />
      {/* Soft bottom fade to base */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background:
            'linear-gradient(to bottom, transparent, var(--color-bg-base))',
        }}
      />
    </div>
  );
}
