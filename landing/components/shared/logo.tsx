import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Show wordmark next to monogram. */
  withWordmark?: boolean;
};

/**
 * DeckPad monogram — platinum DP set in Bodoni Moda.
 * Pure SVG so it scales perfectly and respects color tokens.
 */
export function Logo({ className, withWordmark = true }: Props) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-hairline-strong)] bg-gradient-to-br from-[var(--color-indigo-900)] to-[var(--color-bg-elev-1)]"
      >
        <svg
          viewBox="0 0 36 36"
          className="h-5 w-5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="dp" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="var(--color-platinum-100)" />
              <stop offset="1" stopColor="var(--color-platinum-400)" />
            </linearGradient>
          </defs>
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-display)"
            fontWeight="600"
            fontSize="18"
            letterSpacing="-0.04em"
            fill="url(#dp)"
          >
            DP
          </text>
        </svg>
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5"
        />
      </span>
      {withWordmark && (
        <span
          className="text-[18px] font-medium tracking-tight text-[var(--color-platinum-100)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          DeckPad
        </span>
      )}
    </div>
  );
}
