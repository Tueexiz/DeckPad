'use client';

import { type ReactNode } from 'react';
import {
  CommandPalette,
  useCommandPalette,
} from '@/components/interactive/command-palette';
import { ScrollProgress } from '@/components/shared/scroll-progress';
import { Navbar } from '@/components/sections/navbar';

/**
 * Client root shell — hosts the global ⌘K command palette, the scroll-progress
 * bar, and the navbar. Keeps app/layout.tsx as a Server Component.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { open, setOpen } = useCommandPalette();

  return (
    <>
      <Navbar onOpenCommandPalette={() => setOpen(true)} />
      <ScrollProgress />
      <CommandPalette open={open} onOpenChange={setOpen} />
      {children}
    </>
  );
}
