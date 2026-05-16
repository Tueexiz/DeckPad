'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/[0.08]">
      <SliderPrimitive.Range className="absolute h-full bg-[var(--color-indigo-500)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        'block h-6 w-6 rounded-full border-2 border-[var(--color-indigo-400)] bg-[var(--color-platinum-100)]',
        'shadow-[0_4px_16px_-4px_rgba(79,70,229,0.6)] transition-transform cursor-grab active:cursor-grabbing active:scale-110',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
      aria-label="Curseur"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = 'Slider';

export { Slider };
