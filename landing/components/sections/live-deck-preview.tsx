'use client';

import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useEffect, useRef } from 'react';
import {
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Monitor,
  Power,
  Mic,
  Music,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Cell = { icon: LucideIcon; label: string; tone?: 'neutral' | 'accent' | 'danger' };

const CELLS: Cell[] = [
  { icon: SkipBack, label: 'Précédent' },
  { icon: Play, label: 'Lecture', tone: 'accent' },
  { icon: SkipForward, label: 'Suivant' },
  { icon: VolumeX, label: 'Couper' },
  { icon: Volume1, label: 'Volume −' },
  { icon: Volume2, label: 'Volume +' },
  { icon: Mic, label: 'Micro' },
  { icon: Music, label: 'Soundboard' },
  { icon: Monitor, label: 'Bureau' },
  { icon: Power, label: 'Arrêt', tone: 'danger' },
];

/**
 * Live 3D-ish deck preview. Hero companion piece.
 * Mouse parallax (subtle), continuous ambient float, staggered key reveal.
 */
export function LiveDeckPreview() {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sx = useSpring(rx, { stiffness: 80, damping: 18, mass: 1 });
  const sy = useSpring(ry, { stiffness: 80, damping: 18, mass: 1 });

  const rotateX = useTransform(sy, [-1, 1], [8, -8]);
  const rotateY = useTransform(sx, [-1, 1], [-12, 12]);

  useEffect(() => {
    if (reduce) return;
    const el = containerRef.current;
    if (!el) return;
    function onMove(e: MouseEvent) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      rx.set(Math.max(-1, Math.min(1, dx)));
      ry.set(Math.max(-1, Math.min(1, dy)));
    }
    function onLeave() {
      rx.set(0);
      ry.set(0);
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [reduce, rx, ry]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative mx-auto w-full max-w-[560px] [perspective:1400px]"
    >
      {/* Floating ambient halo */}
      <motion.div
        className="pointer-events-none absolute -inset-20 rounded-[40%] blur-3xl"
        style={{
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(79,70,229,0.45), rgba(79,70,229,0) 70%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ delay: 1.0, duration: 1.2 }}
      />

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotateX: 14 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotateX: 8 }}
        transition={{ delay: 0.9, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={
          reduce
            ? undefined
            : ({ rotateX, rotateY, transformStyle: 'preserve-3d' } as React.CSSProperties)
        }
        className="relative"
      >
        {/* Continuous float wrap */}
        <motion.div
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={
            reduce
              ? undefined
              : { duration: 6, ease: 'easeInOut', repeat: Infinity, delay: 1.5 }
          }
        >
          {/* Chassis */}
          <div
            className={cn(
              'relative rounded-[28px] border border-[var(--color-hairline-strong)]',
              'bg-gradient-to-br from-[#1a162e] via-[#0e0b1f] to-[#08070f]',
              'p-5 sm:p-7 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]',
            )}
          >
            {/* Chassis top reflection */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              }}
            />
            {/* Chassis label */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-platinum-500)]">
                DeckPad · 5×2
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-platinum-300)]">
                  Connecté
                </span>
              </span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-3 sm:gap-4">
              {CELLS.map((c, i) => (
                <DeckKey key={i} idx={i} {...c} />
              ))}
            </div>

            {/* Chassis bottom shadow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 -bottom-6 h-8 rounded-full blur-2xl"
              style={{ background: 'rgba(0,0,0,0.6)' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function DeckKey({ icon: Icon, label, tone = 'neutral', idx }: Cell & { idx: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.9 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 1.1 + idx * 0.045,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduce ? undefined : { scale: 1.06, y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className={cn(
        'relative aspect-square rounded-2xl border',
        'flex items-center justify-center',
        'transition-[border-color,background-color] duration-200',
        tone === 'accent' &&
          'border-[var(--color-indigo-400)] bg-[linear-gradient(180deg,var(--color-indigo-500),var(--color-indigo-700))] shadow-[0_8px_24px_-8px_rgba(79,70,229,0.7),inset_0_1px_0_rgba(255,255,255,0.25)]',
        tone === 'danger' &&
          'border-rose-500/40 bg-[linear-gradient(180deg,#5b1d2c,#33101a)] shadow-[0_8px_24px_-8px_rgba(244,63,94,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]',
        tone === 'neutral' &&
          'border-[var(--color-hairline-strong)] bg-[linear-gradient(180deg,#19152c,#0c0a1a)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_12px_-4px_rgba(0,0,0,0.6)]',
      )}
      aria-label={label}
    >
      {/* Top sheen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 top-1 h-px rounded-full"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        }}
      />
      <Icon
        className={cn(
          'h-6 w-6 sm:h-7 sm:w-7',
          tone === 'accent'
            ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
            : tone === 'danger'
              ? 'text-rose-200'
              : 'text-[var(--color-platinum-200)]',
        )}
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </motion.div>
  );
}
