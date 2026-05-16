'use client';

import { Stagger, StaggerItem } from '@/components/motion/motion-primitives';
import { benefits } from '@/content/benefits';
import { fr } from '@/lib/copy/fr';

export function BenefitsGrid() {
  return (
    <section
      id="fonctionnalites"
      aria-labelledby="benefits-heading"
      className="section-pad relative"
    >
      <div className="container-tight">
        <div className="mb-14 max-w-2xl">
          <p className="text-eyebrow mb-4">{fr.benefits.eyebrow}</p>
          <h2 id="benefits-heading" className="text-h2 mb-5">
            {fr.benefits.heading}
          </h2>
          <p className="text-lead">{fr.benefits.lead}</p>
        </div>

        <Stagger
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          gap={0.08}
          delayChildren={0.1}
        >
          {benefits.map((b) => (
            <StaggerItem key={b.title}>
              <article
                className="group relative h-full overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-bg-elev-1)] p-8 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-1 hover:border-[var(--color-hairline-strong)] hover:bg-[var(--color-bg-elev-2)]"
              >
                {/* Indigo glow on hover */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(79,70,229,0.55), rgba(79,70,229,0) 70%)',
                  }}
                />

                <div className="relative">
                  <div className="mb-7 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-hairline-strong)] bg-gradient-to-br from-[var(--color-indigo-900)]/60 to-transparent">
                    <b.icon
                      className="h-5 w-5 text-[var(--color-indigo-300)]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="text-h3 mb-3" style={{ fontSize: 'clamp(1.375rem, 2vw, 1.625rem)' }}>
                    {b.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-[var(--color-platinum-300)]">
                    {b.body}
                  </p>

                  {b.stat && (
                    <div className="mt-7 flex items-baseline gap-3 border-t border-[var(--color-hairline)] pt-5">
                      <span
                        className="text-mono text-2xl font-semibold text-[var(--color-platinum-100)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {b.stat.value}
                      </span>
                      <span className="text-[12px] uppercase tracking-[0.16em] text-[var(--color-platinum-500)]">
                        {b.stat.label}
                      </span>
                    </div>
                  )}
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
