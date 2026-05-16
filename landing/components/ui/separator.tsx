import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
};

export function Separator({ className, orientation = 'horizontal' }: Props) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'bg-[var(--color-hairline)]',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className,
      )}
    />
  );
}
