'use client';

import { useReducer, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCw } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/motion-primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  initial,
  reducer,
  type State,
  WaitlistSchema,
} from '@/lib/state/waitlist-machine';
import { fr } from '@/lib/copy/fr';
import { track } from '@/lib/analytics';

const EASE = [0.22, 1, 0.36, 1] as const;

export function WaitlistForm() {
  const [state, dispatch] = useReducer(reducer, initial);
  const reduce = useReducedMotion();
  const formRef = useRef<HTMLFormElement | null>(null);

  // Focus first invalid field (DOM order) after a validation error.
  // Querying the DOM avoids the ref-write race when multiple fields fail.
  useEffect(() => {
    const hasErrors = Object.values(state.errors).some(Boolean);
    if (!hasErrors || !formRef.current) return;
    const first = formRef.current.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    first?.focus();
  }, [state.errors, state.step]);

  const progress = state.status === 'success' ? 100 : Math.round((state.step / 3) * 100);

  async function submit() {
    const parsed = WaitlistSchema.safeParse({
      email: state.data.email,
      usecase: state.data.usecase,
      consent: state.data.consent,
    });
    if (!parsed.success) {
      // Surface field errors and jump back to the failing step.
      const issues = parsed.error.flatten().fieldErrors;
      if (issues.email || issues.consent) {
        dispatch({ type: 'BACK' });
        dispatch({ type: 'BACK' });
      } else if (issues.usecase) {
        dispatch({ type: 'BACK' });
      }
      dispatch({ type: 'SUBMIT_ERROR', message: 'validation' });
      return;
    }

    dispatch({ type: 'SUBMIT_START' });
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? 'network');
      }
      dispatch({ type: 'SUBMIT_SUCCESS' });
      toast.success(fr.waitlist.toastSuccess);
      track('waitlist_submit_success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      dispatch({ type: 'SUBMIT_ERROR', message: msg });
      toast.error(fr.waitlist.toastError);
      track('waitlist_submit_error', { error: msg });
    }
  }

  return (
    <section
      id="telechargement"
      aria-labelledby="waitlist-heading"
      className="section-pad relative"
    >
      <div className="container-tight">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <p className="text-eyebrow mb-4">{fr.waitlist.eyebrow}</p>
              <h2 id="waitlist-heading" className="text-h2 mb-4">
                {fr.waitlist.heading}
              </h2>
              <p className="text-lead">{fr.waitlist.lead}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <div className="rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-bg-elev-1)] p-6 sm:p-10 shadow-[var(--shadow-2)]">
              {/* Progress */}
              {state.status !== 'success' && (
                <div className="mb-8">
                  <div className="mb-3 flex items-center justify-between text-[12px] uppercase tracking-[0.16em] text-[var(--color-platinum-500)]">
                    <span>
                      Étape {state.step} sur 3 — {fr.waitlist.steps[state.step - 1]?.label}
                    </span>
                    <span className="text-mono" style={{ fontFamily: 'var(--font-mono)' }}>
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} aria-label="Progression du formulaire" />
                </div>
              )}

              <form
                ref={formRef}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (state.step < 3) dispatch({ type: 'NEXT' });
                  else void submit();
                }}
                noValidate
                aria-busy={state.status === 'submitting'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {state.status === 'success' ? (
                    <motion.div
                      key="success"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="py-6 text-center"
                    >
                      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
                        <Check className="h-6 w-6 text-emerald-400" strokeWidth={2.5} aria-hidden="true" />
                      </div>
                      <h3 className="text-h3 mb-3">{fr.waitlist.success.title}</h3>
                      <p className="text-[15px] text-[var(--color-platinum-300)]">
                        {fr.waitlist.success.body}
                      </p>
                      <div className="mt-8">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => dispatch({ type: 'RESET' })}
                        >
                          <RotateCw className="h-4 w-4" aria-hidden="true" />
                          {fr.waitlist.success.reset}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`step-${state.step}`}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                      transition={{ duration: 0.4, ease: EASE }}
                    >
                      {state.step === 1 && <Step1 state={state} dispatch={dispatch} />}
                      {state.step === 2 && <Step2 state={state} dispatch={dispatch} />}
                      {state.step === 3 && <Step3 state={state} />}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer / nav */}
                {state.status !== 'success' && (
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {state.step > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => dispatch({ type: 'BACK' })}
                          disabled={state.status === 'submitting'}
                        >
                          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                          {state.step === 3 ? fr.waitlist.step3.back : fr.waitlist.step2.back}
                        </Button>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={state.status === 'submitting'}
                      variant="primary"
                      size="lg"
                    >
                      {state.status === 'submitting' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          {fr.waitlist.submitting}
                        </>
                      ) : state.step === 3 ? (
                        <>
                          {fr.waitlist.step3.submit}
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </>
                      ) : (
                        <>
                          {state.step === 1 ? fr.waitlist.step1.next : fr.waitlist.step2.next}
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Error state */}
                {state.status === 'error' && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 text-[14px] text-rose-200"
                  >
                    <p className="font-medium">{fr.waitlist.error.title}</p>
                    <p className="mt-1 text-rose-200/80">{fr.waitlist.error.body}</p>
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => void submit()}
                      >
                        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                        {fr.waitlist.error.retry}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Steps ----------------------------- */

type StepProps = {
  state: State;
  dispatch: React.Dispatch<Parameters<typeof reducer>[1]>;
};

function Step1({ state, dispatch }: StepProps) {
  const errEmail = state.errors.email;
  const errConsent = state.errors.consent;

  return (
    <div className="space-y-6">
      <h3 className="text-h3 mb-2" style={{ fontSize: 'clamp(1.25rem, 2vw, 1.5rem)' }}>
        {fr.waitlist.step1.title}
      </h3>

      <div className="space-y-2">
        <Label htmlFor="wl-email">{fr.waitlist.step1.emailLabel}</Label>
        <Input
          id="wl-email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder={fr.waitlist.step1.emailPlaceholder}
          value={state.data.email}
          onChange={(e) => dispatch({ type: 'SET_EMAIL', value: e.target.value })}
          aria-invalid={!!errEmail}
          aria-describedby={errEmail ? 'wl-email-error' : undefined}
        />
        {errEmail && (
          <p id="wl-email-error" role="alert" className="text-[13px] text-rose-300">
            {errEmail}
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--color-hairline)] bg-white/[0.02] p-4 transition-colors hover:border-[var(--color-hairline-strong)]">
        <input
          type="checkbox"
          checked={state.data.consent}
          onChange={(e) => dispatch({ type: 'SET_CONSENT', value: e.target.checked })}
          aria-invalid={!!errConsent}
          aria-describedby={errConsent ? 'wl-consent-error' : undefined}
          className="mt-1 h-4 w-4 cursor-pointer rounded border-[var(--color-hairline-strong)] bg-white/[0.04] text-[var(--color-indigo-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        />
        <span className="text-[14px] leading-relaxed text-[var(--color-platinum-300)]">
          {fr.waitlist.step1.consentLabel}
        </span>
      </label>
      {errConsent && (
        <p id="wl-consent-error" role="alert" className="text-[13px] text-rose-300">
          {errConsent}
        </p>
      )}
    </div>
  );
}

function Step2({ state, dispatch }: StepProps) {
  const err = state.errors.usecase;
  return (
    <div className="space-y-6">
      <h3 className="text-h3 mb-2" style={{ fontSize: 'clamp(1.25rem, 2vw, 1.5rem)' }}>
        {fr.waitlist.step2.title}
      </h3>
      <RadioGroup
        value={state.data.usecase ?? ''}
        onValueChange={(v) =>
          dispatch({
            type: 'SET_USECASE',
            value: v as Exclude<State['data']['usecase'], null>,
          })
        }
        aria-invalid={!!err}
        aria-describedby={err ? 'wl-usecase-error' : undefined}
      >
        {fr.waitlist.step2.options.map((opt) => (
          <label
            key={opt.value}
            htmlFor={`uc-${opt.value}`}
            className={`flex cursor-pointer items-center gap-4 rounded-2xl border bg-white/[0.02] p-4 transition-colors hover:border-[var(--color-hairline-strong)] ${
              state.data.usecase === opt.value
                ? 'border-[var(--color-indigo-400)] bg-[var(--color-indigo-500)]/10'
                : 'border-[var(--color-hairline)]'
            }`}
          >
            <RadioGroupItem value={opt.value} id={`uc-${opt.value}`} />
            <span className="text-[15px] text-[var(--color-platinum-200)]">{opt.label}</span>
          </label>
        ))}
      </RadioGroup>
      {err && (
        <p id="wl-usecase-error" role="alert" className="text-[13px] text-rose-300">
          {err}
        </p>
      )}
    </div>
  );
}

function Step3({ state }: { state: State }) {
  const ucLabel = fr.waitlist.step2.options.find((o) => o.value === state.data.usecase)?.label;
  return (
    <div className="space-y-6">
      <h3 className="text-h3 mb-2" style={{ fontSize: 'clamp(1.25rem, 2vw, 1.5rem)' }}>
        {fr.waitlist.step3.title}
      </h3>
      <dl className="grid gap-3 rounded-2xl border border-[var(--color-hairline)] bg-white/[0.02] p-5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[13px] uppercase tracking-[0.14em] text-[var(--color-platinum-500)]">
            {fr.waitlist.step3.labelEmail}
          </dt>
          <dd className="text-[15px] text-[var(--color-platinum-100)]">{state.data.email}</dd>
        </div>
        <div className="h-px w-full bg-[var(--color-hairline)]" />
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[13px] uppercase tracking-[0.14em] text-[var(--color-platinum-500)]">
            {fr.waitlist.step3.labelUsecase}
          </dt>
          <dd className="text-[15px] text-[var(--color-platinum-100)]">{ucLabel}</dd>
        </div>
      </dl>
    </div>
  );
}
