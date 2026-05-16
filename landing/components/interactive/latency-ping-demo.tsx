'use client';

import { useEffect, useReducer, useRef, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useInView,
} from 'framer-motion';
import { Tablet, Monitor, Zap, RotateCw } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/motion-primitives';
import { Button } from '@/components/ui/button';
import { fr } from '@/lib/copy/fr';
import { cn } from '@/lib/utils';

/* -------- state -------- */
type Status = 'idle' | 'pinging' | 'returning' | 'done';

type State = {
  status: Status;
  lastMs: number | null;
  history: number[]; // last 8 measurements
  jitter: number; // computed
  best: number | null;
  worst: number | null;
};

type Event =
  | { type: 'START' }
  | { type: 'TURN' }
  | { type: 'RESULT'; ms: number }
  | { type: 'RESET' };

const initial: State = {
  status: 'idle',
  lastMs: null,
  history: [],
  jitter: 0,
  best: null,
  worst: null,
};

function reducer(state: State, e: Event): State {
  switch (e.type) {
    case 'START':
      return { ...state, status: 'pinging' };
    case 'TURN':
      return { ...state, status: 'returning' };
    case 'RESULT': {
      const history = [...state.history, e.ms].slice(-8);
      const avg = history.reduce((a, b) => a + b, 0) / history.length;
      const jitter =
        history.length > 1
          ? Math.sqrt(
              history.reduce((acc, v) => acc + (v - avg) ** 2, 0) / history.length,
            )
          : 0;
      const best = Math.min(...history);
      const worst = Math.max(...history);
      return { ...state, status: 'done', lastMs: e.ms, history, jitter, best, worst };
    }
    case 'RESET':
      return initial;
    default:
      return state;
  }
}

export function LatencyPingDemo() {
  const reduce = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, initial);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(containerRef, { amount: 0.4 });
  const startRef = useRef<number>(0);
  const timers = useRef<number[]>([]);
  const autoTimer = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);

  const ping = useCallback(() => {
    clearTimers();
    startRef.current = performance.now();
    dispatch({ type: 'START' });

    // Simulate a realistic local-network round trip: 14-32 ms, with mild jitter
    const oneWay = 7 + Math.random() * 9; // 7-16 ms
    const returnExtra = 7 + Math.random() * 9;
    const t1 = window.setTimeout(() => dispatch({ type: 'TURN' }), oneWay);
    const t2 = window.setTimeout(
      () => {
        const ms = Math.round(performance.now() - startRef.current);
        dispatch({ type: 'RESULT', ms });
      },
      oneWay + returnExtra,
    );
    timers.current.push(t1, t2);
  }, [clearTimers]);

  // Auto-ping loop when in view
  useEffect(() => {
    if (!inView || reduce) return;
    // first ping after a short delay
    const initialDelay = window.setTimeout(() => ping(), 600);
    const loop = window.setInterval(() => {
      // only re-ping when not actively pinging
      ping();
    }, 2800);
    autoTimer.current = loop;
    return () => {
      clearTimeout(initialDelay);
      clearInterval(loop);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce]);

  return (
    <section
      id="latence"
      aria-labelledby="latency-heading"
      className="section-pad relative"
      ref={containerRef}
    >
      <div className="container-tight">
        <ScrollReveal>
          <div className="mb-12 max-w-2xl">
            <p className="text-eyebrow mb-4">{fr.latency.eyebrow}</p>
            <h2 id="latency-heading" className="text-h2 mb-5">
              {fr.latency.heading}
            </h2>
            <p className="text-lead">{fr.latency.lead}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Visualization */}
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-bg-elev-1)] p-6 sm:p-10">
              {/* Glow */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(79,70,229,0.35), rgba(79,70,229,0) 70%)',
                }}
              />

              <div className="relative grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-8">
                {/* Tablet */}
                <Endpoint
                  icon={Tablet}
                  label={fr.latency.tablet}
                  pulsing={state.status === 'pinging'}
                />

                {/* Wire + packet */}
                <div className="relative h-16">
                  {/* Track */}
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, var(--color-hairline-strong) 0 6px, transparent 6px 12px)',
                    }}
                  />
                  {/* Active wire glow */}
                  <AnimatePresence>
                    {(state.status === 'pinging' || state.status === 'returning') && (
                      <motion.span
                        key={`wire-${state.status}`}
                        aria-hidden="true"
                        initial={{ scaleX: 0, originX: state.status === 'pinging' ? 0 : 1 }}
                        animate={{ scaleX: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduce ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
                        style={{
                          background:
                            'linear-gradient(90deg, transparent, var(--color-indigo-300), transparent)',
                          boxShadow: '0 0 8px var(--color-indigo-400)',
                          transformOrigin: state.status === 'pinging' ? 'left' : 'right',
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Packet */}
                  <AnimatePresence>
                    {(state.status === 'pinging' || state.status === 'returning') && (
                      <motion.span
                        key={`pkt-${state.status}`}
                        aria-hidden="true"
                        initial={{
                          left: state.status === 'pinging' ? '0%' : '100%',
                          opacity: 0,
                          scale: 0.7,
                        }}
                        animate={{
                          left: state.status === 'pinging' ? '100%' : '0%',
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{
                          duration: reduce ? 0 : 0.14,
                          ease: 'linear',
                        }}
                        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full"
                        style={{
                          background: 'var(--color-platinum-100)',
                          boxShadow:
                            '0 0 16px 4px var(--color-indigo-400), 0 0 32px 8px rgba(79,70,229,0.4)',
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Ms label flash */}
                  <AnimatePresence>
                    {state.status === 'done' && state.lastMs !== null && (
                      <motion.span
                        key={state.lastMs}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[140%] text-mono text-xs font-semibold text-[var(--color-indigo-300)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {state.lastMs} ms
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* PC */}
                <Endpoint
                  icon={Monitor}
                  label={fr.latency.pc}
                  pulsing={state.status === 'returning'}
                />
              </div>

              {/* Live readout + manual button */}
              <div className="relative mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-hairline)] pt-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-eyebrow">{fr.latency.live}</span>
                  <motion.span
                    key={state.lastMs ?? 'idle'}
                    initial={reduce ? false : { opacity: 0.5, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-mono text-3xl font-semibold text-[var(--color-platinum-100)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {state.lastMs !== null ? `${state.lastMs} ms` : '— ms'}
                  </motion.span>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={ping}
                  disabled={state.status === 'pinging' || state.status === 'returning'}
                >
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  {fr.latency.pingNow}
                </Button>
              </div>
            </div>
          </ScrollReveal>

          {/* Stats panel */}
          <ScrollReveal delay={0.05}>
            <div className="grid h-full content-start gap-3 rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-bg-elev-1)] p-6 sm:p-8">
              <StatRow label={fr.latency.best} value={state.best} unit="ms" tone="ok" />
              <StatRow label={fr.latency.avg} value={avg(state.history)} unit="ms" />
              <StatRow label={fr.latency.worst} value={state.worst} unit="ms" />
              <StatRow
                label={fr.latency.jitter}
                value={state.jitter ? Math.round(state.jitter * 10) / 10 : null}
                unit="ms"
                tone={state.jitter > 5 ? 'warn' : 'ok'}
              />

              {/* Mini histogram */}
              <div className="mt-4">
                <p className="text-eyebrow mb-3">{fr.latency.histogram}</p>
                <div className="flex h-20 items-end gap-1.5">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const v = state.history[i];
                    const max = state.worst ?? 30;
                    const pct = v ? Math.max(8, (v / max) * 100) : 0;
                    return (
                      <motion.span
                        key={`bar-${i}`}
                        aria-hidden="true"
                        initial={false}
                        animate={{ height: `${pct}%` }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          'flex-1 rounded-t-sm',
                          v
                            ? 'bg-gradient-to-t from-[var(--color-indigo-700)] to-[var(--color-indigo-400)]'
                            : 'bg-white/[0.04]',
                        )}
                      />
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => dispatch({ type: 'RESET' })}
                className="mt-3 inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-[12px] text-[var(--color-platinum-400)] transition-colors hover:bg-white/[0.04] hover:text-[var(--color-platinum-100)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <RotateCw className="h-3 w-3" aria-hidden="true" />
                {fr.latency.reset}
              </button>

              <p className="mt-2 text-[12px] text-[var(--color-platinum-500)]">
                {fr.latency.note}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* --------- helpers --------- */

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function Endpoint({
  icon: Icon,
  label,
  pulsing,
}: {
  icon: typeof Tablet;
  label: string;
  pulsing: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div
        className={cn(
          'relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border transition-all duration-300',
          pulsing
            ? 'border-[var(--color-indigo-400)] bg-[var(--color-indigo-500)]/15 shadow-[0_0_24px_-4px_rgba(99,102,241,0.6)]'
            : 'border-[var(--color-hairline-strong)] bg-white/[0.02]',
        )}
      >
        <Icon
          className={cn(
            'h-6 w-6 sm:h-7 sm:w-7',
            pulsing ? 'text-[var(--color-indigo-300)]' : 'text-[var(--color-platinum-300)]',
          )}
          strokeWidth={1.6}
          aria-hidden="true"
        />
        {pulsing && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.6, ease: 'easeOut', repeat: Infinity }}
            style={{ border: '1px solid var(--color-indigo-400)' }}
          />
        )}
      </div>
      <span className="text-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-platinum-500)]">
        {label}
      </span>
    </div>
  );
}

function StatRow({
  label,
  value,
  unit,
  tone = 'neutral',
}: {
  label: string;
  value: number | null;
  unit: string;
  tone?: 'neutral' | 'ok' | 'warn';
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-hairline)] py-2 last:border-b-0">
      <span className="text-[12px] uppercase tracking-[0.16em] text-[var(--color-platinum-500)]">
        {label}
      </span>
      <span
        className={cn(
          'text-mono text-lg font-semibold',
          tone === 'ok' && 'text-emerald-300',
          tone === 'warn' && 'text-amber-300',
          tone === 'neutral' && 'text-[var(--color-platinum-100)]',
        )}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {value !== null ? `${value} ${unit}` : '— ms'}
      </span>
    </div>
  );
}
