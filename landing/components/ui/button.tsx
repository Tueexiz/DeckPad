import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-tight',
    'transition-[background-color,color,border-color,box-shadow,transform] duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer select-none active:scale-[0.98]',
  ),
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-indigo-500)] text-[var(--color-platinum-100)] hover:bg-[var(--color-indigo-400)] shadow-[var(--shadow-glow)]',
        secondary:
          'border border-[var(--color-hairline-strong)] bg-white/[0.02] text-[var(--color-platinum-100)] hover:bg-white/[0.06]',
        ghost:
          'bg-transparent text-[var(--color-platinum-300)] hover:bg-white/[0.04] hover:text-[var(--color-platinum-100)]',
        link:
          'text-[var(--color-platinum-300)] hover:text-[var(--color-platinum-100)] underline-offset-4 hover:underline rounded-none active:scale-100',
        danger:
          'bg-[var(--color-danger)] text-white hover:bg-rose-500',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-[15px]',
        lg: 'h-14 px-7 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
