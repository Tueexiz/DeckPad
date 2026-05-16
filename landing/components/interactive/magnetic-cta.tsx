'use client';

import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  ariaLabel?: string;
};

/**
 * Magnetic CTA — cursor attraction (max ±10 px).
 * Disabled on touch + reduced motion. Premium feel via spring physics.
 */
export function MagneticCTA({
  children,
  href,
  onClick,
  className,
  variant = 'primary',
  ariaLabel,
}: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 200, damping: 20, mass: 0.6 });
  const y = useSpring(my, { stiffness: 200, damping: 20, mass: 0.6 });

  useEffect(() => {
    if (reduce) return;
    if (typeof window === 'undefined') return;
    const isCoarse = window.matchMedia?.('(pointer: coarse)').matches;
    if (isCoarse) return;

    const el = ref.current;
    if (!el) return;

    function onMove(e: MouseEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = 140;
      if (dist < radius) {
        mx.set((dx / radius) * 10);
        my.set((dy / radius) * 10);
      } else {
        mx.set(0);
        my.set(0);
      }
    }
    function onLeave() {
      mx.set(0);
      my.set(0);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [mx, my, reduce]);

  const baseCls = cn(
    'group relative inline-flex items-center justify-center gap-2 select-none cursor-pointer',
    'rounded-full px-7 py-4 text-base font-medium tracking-tight',
    'transition-[box-shadow,background-color,color,border-color] duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]',
    variant === 'primary'
      ? 'bg-[var(--color-indigo-500)] text-[var(--color-platinum-100)] shadow-[var(--shadow-glow)] hover:bg-[var(--color-indigo-400)] active:scale-[0.98]'
      : 'border border-[var(--color-hairline-strong)] bg-white/[0.02] text-[var(--color-platinum-100)] hover:bg-white/[0.05] active:scale-[0.98]',
    className,
  );

  const content = (
    <>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {variant === 'primary' && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.18), transparent 60%)',
          }}
        />
      )}
    </>
  );

  if (href) {
    return (
      <motion.a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        aria-label={ariaLabel}
        className={baseCls}
        style={{ x, y }}
        whileTap={{ scale: 0.97 }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={baseCls}
      style={{ x, y }}
      whileTap={{ scale: 0.97 }}
    >
      {content}
    </motion.button>
  );
}
