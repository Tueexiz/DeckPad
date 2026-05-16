'use client';

import { useReducer, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from 'framer-motion';
import { ScrollReveal } from '@/components/motion/motion-primitives';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  initial,
  reducer,
  computeTotal,
  TIER_PRICES,
  type Tier,
} from '@/lib/state/savings-machine';
import { fr } from '@/lib/copy/fr';
import { formatEuro } from '@/lib/utils';

export function SavingsCalculator() {
  const reduce = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, initial);
  const total = computeTotal(state);

  const mv = useMotionValue(total);
  const displayed = useTransform(mv, (v) => formatEuro(Math.round(v)));

  useEffect(() => {
    if (reduce) {
      mv.set(total);
      return;
    }
    const c = animate(mv, total, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => c.stop();
  }, [total, mv, reduce]);

  return (
    <section
      id="economies"
      aria-labelledby="savings-heading"
      className="section-pad relative"
    >
      <div className="container-tight">
        <ScrollReveal>
          <div className="mb-12 max-w-2xl">
            <p className="text-eyebrow mb-4">{fr.savings.eyebrow}</p>
            <h2 id="savings-heading" className="text-h2 mb-5">
              {fr.savings.heading}
            </h2>
            <p className="text-lead">{fr.savings.lead}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Controls */}
          <ScrollReveal>
            <div className="space-y-10 rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-bg-elev-1)] p-8 sm:p-10">
              {/* Devices */}
              <div>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <Label htmlFor="devices-slider">{fr.savings.deviceLabel}</Label>
                  <span
                    className="text-mono text-2xl font-semibold text-[var(--color-platinum-100)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {state.devices}
                  </span>
                </div>
                <Slider
                  id="devices-slider"
                  min={1}
                  max={20}
                  step={1}
                  value={[state.devices]}
                  onValueChange={(v) =>
                    dispatch({ type: 'SET_DEVICES', value: v[0] ?? 1 })
                  }
                  aria-label={fr.savings.deviceLabel}
                />
                <div className="mt-2 flex justify-between text-[12px] text-[var(--color-platinum-500)]">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              {/* Tier */}
              <div>
                <Label className="mb-4 block">{fr.savings.tierLabel}</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {fr.savings.tiers.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() =>
                        dispatch({ type: 'SET_TIER', value: t.value as Tier })
                      }
                      aria-pressed={state.tier === t.value}
                      className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-[border-color,background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)] ${
                        state.tier === t.value
                          ? 'border-[var(--color-indigo-400)] bg-[var(--color-indigo-500)]/15 text-[var(--color-platinum-100)]'
                          : 'border-[var(--color-hairline)] bg-white/[0.02] text-[var(--color-platinum-300)] hover:border-[var(--color-hairline-strong)] hover:text-[var(--color-platinum-100)]'
                      }`}
                    >
                      <p className="text-[13px] font-medium">{t.label}</p>
                      <p
                        className="text-mono mt-1 text-[12px] text-[var(--color-platinum-500)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {formatEuro(t.price)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[12px] text-[var(--color-platinum-500)]">
                {fr.savings.note}
              </p>
            </div>
          </ScrollReveal>

          {/* Output */}
          <ScrollReveal delay={0.08}>
            <div className="relative h-full overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-gradient-to-br from-[var(--color-indigo-900)]/40 via-[var(--color-bg-elev-1)] to-[var(--color-bg-elev-2)] p-8 sm:p-10">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(79,70,229,0.5), rgba(79,70,229,0) 70%)',
                }}
              />

              <div className="relative space-y-8">
                <div>
                  <p className="text-eyebrow mb-3">{fr.savings.youPay}</p>
                  <motion.p
                    className="text-mono text-5xl sm:text-6xl font-semibold tracking-tight text-[var(--color-platinum-100)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {displayed}
                  </motion.p>
                  <p className="mt-2 text-[13px] text-[var(--color-platinum-500)]">
                    {state.devices} × {formatEuro(TIER_PRICES[state.tier])}
                  </p>
                </div>

                <div className="h-px w-full bg-[var(--color-hairline)]" />

                <div>
                  <p className="text-eyebrow mb-3">{fr.savings.deckpadCost}</p>
                  <p
                    className="text-mono text-5xl sm:text-6xl font-semibold tracking-tight text-[var(--color-indigo-300)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {formatEuro(0)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-indigo-700)] bg-[var(--color-indigo-900)]/40 p-5">
                  <p className="text-eyebrow mb-2 text-[var(--color-indigo-300)]">
                    {fr.savings.saved}
                  </p>
                  <motion.p
                    className="text-mono text-3xl font-semibold text-[var(--color-platinum-100)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {displayed}
                  </motion.p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
