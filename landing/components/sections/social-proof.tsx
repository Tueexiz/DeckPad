'use client';

import { motion, useReducedMotion, useInView, animate as animateValue, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { ScrollReveal, Stagger, StaggerItem } from '@/components/motion/motion-primitives';
import { metrics } from '@/content/credibility';
import { fr } from '@/lib/copy/fr';
import { Separator } from '@/components/ui/separator';

export function SocialProof() {
  return (
    <section
      id="compatibilite"
      aria-labelledby="proof-heading"
      className="section-pad relative border-y border-[var(--color-hairline)] bg-[var(--color-bg-elev-1)]"
    >
      <div className="container-tight">
        <ScrollReveal>
          <div className="mb-14 max-w-2xl">
            <p className="text-eyebrow mb-4">{fr.socialProof.eyebrow}</p>
            <h2 id="proof-heading" className="text-h2">
              {fr.socialProof.heading}
            </h2>
          </div>
        </ScrollReveal>

        {/* Tech credibility band */}
        <ScrollReveal delay={0.05}>
          <ul
            aria-label="Stack technique"
            className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-bg-elev-2)] px-6 py-5 sm:px-10"
          >
            {fr.socialProof.techBadges.map((b, i) => (
              <li key={b.label} className="flex items-center gap-6">
                {i > 0 && (
                  <Separator orientation="vertical" className="!h-5 hidden sm:block" />
                )}
                <span className="text-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-platinum-400)]">
                  {b.label}
                </span>
              </li>
            ))}
          </ul>
        </ScrollReveal>

        {/* Metrics */}
        <Stagger
          className="mt-12 grid gap-5 sm:grid-cols-3"
          gap={0.1}
          delayChildren={0.15}
        >
          {metrics.map((m) => (
            <StaggerItem key={m.label}>
              <MetricCard {...m} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function MetricCard({
  value,
  prefix,
  suffix,
  label,
  note,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  note: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  const mv = useMotionValue(0);
  const displayed = useTransform(mv, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animateValue(mv, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, value, mv, reduce]);

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-bg-base)] p-8 transition-colors hover:border-[var(--color-hairline-strong)]"
    >
      <div className="flex items-baseline gap-1">
        {prefix && (
          <span className="text-mono text-3xl text-[var(--color-platinum-300)]">
            {prefix.trim()}
          </span>
        )}
        <motion.span
          className="text-mono text-5xl font-semibold tracking-tight text-[var(--color-platinum-100)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {displayed}
        </motion.span>
        {suffix && (
          <span className="text-mono text-2xl text-[var(--color-platinum-400)]">
            {suffix}
          </span>
        )}
      </div>
      <p className="mt-3 text-[14px] font-medium text-[var(--color-platinum-200)]">
        {label}
      </p>
      <p className="mt-1 text-[13px] text-[var(--color-platinum-500)]">{note}</p>
    </div>
  );
}
