'use client';

import dynamic from 'next/dynamic';

/**
 * Below-the-fold module: the Waitlist multi-step form (with zod + Sonner)
 * is the heaviest interactive piece (~25 kB gz when bundled in /).
 * Loading it lazily on the client trims initial bundle and keeps LCP fast.
 */
export const WaitlistFormLazy = dynamic(
  () => import('./waitlist-form').then((m) => m.WaitlistForm),
  {
    ssr: false,
    loading: () => (
      <section className="section-pad" aria-hidden="true">
        <div className="container-tight">
          <div className="mx-auto h-[520px] max-w-2xl animate-pulse rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-bg-elev-1)]" />
        </div>
      </section>
    ),
  },
);
