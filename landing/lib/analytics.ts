/**
 * Thin analytics wrapper. Currently uses Vercel Analytics injection
 * (handled by <Analytics /> in layout). This module exists to centralize
 * future custom event tracking without vendor lock.
 */
export function track(event: string, payload?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  // Vercel Analytics custom events (if available)
  type VAFn = (name: string, props?: Record<string, unknown>) => void;
  const w = window as unknown as { va?: VAFn };
  if (w.va && typeof w.va === 'function') {
    try {
      w.va(event, payload);
    } catch {
      /* noop */
    }
  }
}
