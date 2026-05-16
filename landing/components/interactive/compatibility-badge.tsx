'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronRight,
  Cpu,
  Smartphone,
  Globe,
} from 'lucide-react';
import { detectPlatform, type Platform } from '@/lib/detect-platform';
import { ScrollReveal } from '@/components/motion/motion-primitives';
import { Button } from '@/components/ui/button';
import { fr } from '@/lib/copy/fr';
import { cn } from '@/lib/utils';

type Variant = 'pill' | 'card';

type Props = {
  variant?: Variant;
  className?: string;
};

/* Verdict color/icon mapping */
const VERDICT_STYLES = {
  compatible: {
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    dot: 'bg-emerald-400',
    Icon: CheckCircle2,
  },
  partial: {
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    dot: 'bg-amber-400',
    Icon: AlertTriangle,
  },
  incompatible: {
    color: 'text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
    dot: 'bg-rose-400',
    Icon: XCircle,
  },
  unknown: {
    color: 'text-[var(--color-platinum-400)]',
    bg: 'bg-white/[0.03]',
    border: 'border-[var(--color-hairline-strong)]',
    dot: 'bg-[var(--color-platinum-500)]',
    Icon: Globe,
  },
} as const;

export function CompatibilityBadge({ variant = 'card', className }: Props) {
  const reduce = useReducedMotion();
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    let cancelled = false;
    detectPlatform().then((p) => {
      if (!cancelled) setPlatform(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (variant === 'pill') return <Pill platform={platform} className={className} />;
  return <Card platform={platform} reduce={!!reduce} className={className} />;
}

/* ----------- Navbar pill (compact) ----------- */

function Pill({ platform, className }: { platform: Platform | null; className?: string }) {
  if (!platform) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'hidden lg:inline-flex items-center gap-2 rounded-full border border-[var(--color-hairline-strong)] bg-white/[0.02] px-3 py-1.5 text-[12px] text-[var(--color-platinum-500)]',
          className,
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        {fr.compat.detecting}
      </span>
    );
  }
  const s = VERDICT_STYLES[platform.verdict];

  return (
    <a
      href="#compatibilite-verdict"
      className={cn(
        'hidden lg:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-colors cursor-pointer',
        s.border,
        s.bg,
        'hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]',
        className,
      )}
      aria-label={`${fr.compat.label}: ${platform.osLabel}, ${platform.browserLabel}`}
    >
      <span className={cn('relative h-1.5 w-1.5 rounded-full', s.dot)}>
        <span className={cn('absolute inset-0 rounded-full motion-safe:animate-ping', s.dot, 'opacity-60')} />
      </span>
      <span className={cn('font-medium', s.color)}>{platform.osLabel}</span>
      <span className="text-[var(--color-platinum-500)]">·</span>
      <span className="text-[var(--color-platinum-400)]">{platform.browserLabel}</span>
    </a>
  );
}

/* ----------- Section card (detailed) ----------- */

function Card({
  platform,
  reduce,
  className,
}: {
  platform: Platform | null;
  reduce: boolean;
  className?: string;
}) {
  return (
    <section
      id="compatibilite-verdict"
      aria-labelledby="compat-heading"
      className={cn('section-pad relative', className)}
    >
      <div className="container-tight">
        <ScrollReveal>
          <div className="mb-10 max-w-2xl">
            <p className="text-eyebrow mb-4">{fr.compat.eyebrow}</p>
            <h2 id="compat-heading" className="text-h2 mb-5">
              {fr.compat.heading}
            </h2>
            <p className="text-lead">{fr.compat.lead}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <div className="relative overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-bg-elev-1)] p-6 sm:p-10">
            <AnimatePresence mode="wait" initial={false}>
              {!platform ? (
                <motion.div
                  key="loading"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 text-[14px] text-[var(--color-platinum-400)]"
                >
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {fr.compat.detecting}
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Verdict platform={platform} />
                  <Details platform={platform} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function Verdict({ platform }: { platform: Platform }) {
  const s = VERDICT_STYLES[platform.verdict];
  const title = fr.compat.verdicts[platform.verdict];

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
      {/* Icon halo */}
      <div className="relative inline-flex h-20 w-20 items-center justify-center self-start lg:self-center">
        <span
          aria-hidden="true"
          className={cn('absolute inset-0 rounded-full blur-2xl opacity-50', s.bg)}
        />
        <div
          className={cn(
            'relative flex h-16 w-16 items-center justify-center rounded-full border',
            s.border,
            s.bg,
          )}
        >
          <s.Icon className={cn('h-7 w-7', s.color)} strokeWidth={1.75} aria-hidden="true" />
        </div>
      </div>

      <div>
        <p className={cn('text-eyebrow mb-2', s.color)}>{fr.compat.label}</p>
        <h3 className="text-h3 mb-3" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>
          {title}
        </h3>
        <p className="max-w-prose text-[15px] leading-relaxed text-[var(--color-platinum-300)]">
          {platform.message}
        </p>
      </div>

      <div className="lg:self-center">
        {platform.side === 'server' && (
          <Button asChild variant="primary">
            <a href="#telechargement">
              {fr.compat.cta.server}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        )}
        {platform.side === 'client' && (
          <Button asChild variant="primary">
            <a href="#telechargement">
              {fr.compat.cta.client}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        )}
        {platform.side === 'none' && (
          <Button asChild variant="secondary">
            <a href="#faq">
              {fr.compat.cta.none}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function Details({ platform }: { platform: Platform }) {
  return (
    <dl className="mt-8 grid gap-3 border-t border-[var(--color-hairline)] pt-8 sm:grid-cols-3">
      <Detail
        icon={Cpu}
        label={fr.compat.fields.os}
        value={platform.osLabel}
        hint={platform.is64bit === true ? '64 bits' : platform.is64bit === false ? '32 bits' : null}
      />
      <Detail
        icon={Globe}
        label={fr.compat.fields.browser}
        value={platform.browserLabel}
      />
      <Detail
        icon={Smartphone}
        label={fr.compat.fields.role}
        value={
          platform.side === 'server'
            ? fr.compat.roles.server
            : platform.side === 'client'
              ? fr.compat.roles.client
              : fr.compat.roles.none
        }
      />
    </dl>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  hint?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-hairline)] bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-2 text-[var(--color-platinum-500)]">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <dt className="text-[11px] uppercase tracking-[0.16em]">{label}</dt>
      </div>
      <dd className="flex items-baseline gap-2">
        <span className="text-[15px] font-medium text-[var(--color-platinum-100)]">{value}</span>
        {hint && (
          <span className="text-mono text-[11px] text-[var(--color-platinum-500)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {hint}
          </span>
        )}
      </dd>
    </div>
  );
}
