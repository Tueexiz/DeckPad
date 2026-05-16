import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  cn(
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-tight',
    'border transition-colors',
  ),
  {
    variants: {
      variant: {
        default:
          'border-[var(--color-hairline-strong)] bg-white/[0.04] text-[var(--color-platinum-300)]',
        accent:
          'border-[var(--color-indigo-700)] bg-[var(--color-indigo-900)]/40 text-[var(--color-indigo-300)]',
        mono:
          'border-[var(--color-hairline)] bg-transparent text-[var(--color-platinum-500)] font-mono',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
