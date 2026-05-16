'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { AuroraBackground } from '@/components/motion/aurora-background';
import { Grain } from '@/components/motion/grain';
import { TextReveal } from '@/components/motion/text-reveal';
import { MagneticCTA } from '@/components/interactive/magnetic-cta';
import { DemoDialog } from '@/components/interactive/demo-dialog';
import { LiveDeckPreview } from '@/components/sections/live-deck-preview';
import { fr } from '@/lib/copy/fr';

const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden min-h-[100dvh] pt-28 pb-24 sm:pt-32 sm:pb-32"
    >
      <AuroraBackground intensity={1} />
      <Grain />

      <div className="container-tight relative z-20 grid gap-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12">
        {/* Left column — copy */}
        <div className="text-center lg:text-left">
          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: PREMIUM_EASE }}
            className="text-eyebrow mb-6 inline-flex items-center gap-2"
          >
            <span className="h-1 w-1 rounded-full bg-[var(--color-indigo-400)]" />
            {fr.hero.eyebrow}
          </motion.p>

          <TextReveal
            as="h1"
            words={fr.hero.h1Words}
            stagger={0.07}
            delay={0.2}
            className="text-hero mb-7"
          />

          <motion.p
            id="hero-title"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 1.0, duration: 0.6, ease: PREMIUM_EASE }}
            className="text-lead mx-auto lg:mx-0 max-w-[36ch] mb-10"
          >
            {fr.hero.subline}
          </motion.p>

          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.55, ease: PREMIUM_EASE }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
          >
            <MagneticCTA href={fr.hero.ctaPrimaryHref} variant="primary" ariaLabel={fr.hero.ctaPrimary}>
              {fr.hero.ctaPrimary}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </MagneticCTA>

            <DemoDialog
              trigger={
                <button
                  type="button"
                  data-demo-trigger="true"
                  className="group inline-flex cursor-pointer items-center gap-2.5 rounded-full px-5 py-3 text-[15px] text-[var(--color-platinum-200)] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-hairline-strong)] bg-white/[0.04] transition-colors group-hover:border-[var(--color-indigo-400)] group-hover:bg-[var(--color-indigo-500)]/20">
                    <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  </span>
                  {fr.hero.ctaSecondary}
                </button>
              }
            />
          </motion.div>

          {/* Trust strip */}
          <motion.ul
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.55, ease: PREMIUM_EASE }}
            className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-[13px] text-[var(--color-platinum-500)]"
          >
            {fr.hero.trust.map((t, i) => (
              <li key={t.label} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/15" />}
                <span className="tracking-tight">{t.label}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Right column — deck preview */}
        <div className="relative">
          <LiveDeckPreview />
        </div>
      </div>

      {/* Bottom hairline + scroll hint */}
      <div className="container-tight relative z-20 mt-20 hidden md:block">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-[var(--color-platinum-600)]"
        >
          <span className="h-px w-12 bg-[var(--color-hairline-strong)]" />
          Défile pour découvrir
        </motion.div>
      </div>
    </section>
  );
}
