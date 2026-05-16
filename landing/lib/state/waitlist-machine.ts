/**
 * Waitlist multi-step state machine — typed useReducer.
 * No XState dependency. Discriminated unions for safety.
 */
import { z } from 'zod';

export const WaitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Adresse email invalide.')
    .email('Adresse email invalide.'),
  usecase: z.enum(['gaming', 'streaming', 'productivity', 'other'], {
    errorMap: () => ({ message: 'Sélectionne un usage.' }),
  }),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Le consentement est requis.' }),
  }),
});

export type WaitlistData = z.infer<typeof WaitlistSchema>;

export type Step = 1 | 2 | 3;
export type Status = 'idle' | 'submitting' | 'success' | 'error';

export type State = {
  step: Step;
  data: { email: string; usecase: WaitlistData['usecase'] | null; consent: boolean };
  errors: Partial<Record<keyof WaitlistData, string>>;
  status: Status;
  errorMessage: string | null;
};

export type Event =
  | { type: 'SET_EMAIL'; value: string }
  | { type: 'SET_CONSENT'; value: boolean }
  | { type: 'SET_USECASE'; value: WaitlistData['usecase'] }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; message: string }
  | { type: 'RESET' };

export const initial: State = {
  step: 1,
  data: { email: '', usecase: null, consent: false },
  errors: {},
  status: 'idle',
  errorMessage: null,
};

function validateStep1(data: State['data']): Partial<Record<'email' | 'consent', string>> {
  const errors: Partial<Record<'email' | 'consent', string>> = {};
  const email = WaitlistSchema.shape.email.safeParse(data.email);
  if (!email.success) errors.email = email.error.issues[0]?.message ?? 'Adresse email invalide.';
  if (!data.consent) errors.consent = 'Le consentement est requis.';
  return errors;
}

function validateStep2(data: State['data']): Partial<Record<'usecase', string>> {
  const errors: Partial<Record<'usecase', string>> = {};
  if (!data.usecase) errors.usecase = 'Sélectionne un usage.';
  return errors;
}

export function reducer(state: State, event: Event): State {
  switch (event.type) {
    case 'SET_EMAIL':
      return {
        ...state,
        data: { ...state.data, email: event.value },
        errors: { ...state.errors, email: undefined },
      };
    case 'SET_CONSENT':
      return {
        ...state,
        data: { ...state.data, consent: event.value },
        errors: { ...state.errors, consent: undefined },
      };
    case 'SET_USECASE':
      return {
        ...state,
        data: { ...state.data, usecase: event.value },
        errors: { ...state.errors, usecase: undefined },
      };
    case 'NEXT': {
      if (state.step === 1) {
        const errs = validateStep1(state.data);
        if (Object.keys(errs).length) return { ...state, errors: { ...state.errors, ...errs } };
        return { ...state, step: 2, errors: {} };
      }
      if (state.step === 2) {
        const errs = validateStep2(state.data);
        if (Object.keys(errs).length) return { ...state, errors: { ...state.errors, ...errs } };
        return { ...state, step: 3, errors: {} };
      }
      return state;
    }
    case 'BACK':
      return state.step > 1
        ? { ...state, step: (state.step - 1) as Step, errors: {} }
        : state;
    case 'SUBMIT_START':
      return { ...state, status: 'submitting', errorMessage: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, status: 'success', errorMessage: null };
    case 'SUBMIT_ERROR':
      return { ...state, status: 'error', errorMessage: event.message };
    case 'RESET':
      return initial;
    default:
      return state;
  }
}
