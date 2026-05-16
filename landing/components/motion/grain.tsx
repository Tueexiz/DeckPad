/**
 * Static SVG grain overlay — adds tactile premium feel.
 * Decorative (aria-hidden); no animation, no JS cost.
 */
import { cn } from '@/lib/utils';

export function Grain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-10 mix-blend-overlay opacity-[0.045]',
        className,
      )}
      style={{
        backgroundImage:
          'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/></svg>")',
      }}
    />
  );
}
