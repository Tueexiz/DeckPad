import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl border border-[var(--color-hairline-strong)]',
          'bg-white/[0.02] px-4 py-3 text-[15px] text-[var(--color-platinum-100)]',
          'placeholder:text-[var(--color-platinum-500)]',
          'transition-[border-color,box-shadow,background-color] duration-200',
          'focus-visible:outline-none focus-visible:border-[var(--color-indigo-400)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-0',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-rose-500/30',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
