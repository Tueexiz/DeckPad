'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { CompatibilityBadge } from '@/components/interactive/compatibility-badge';
import { CommandPaletteTrigger } from '@/components/interactive/command-palette';
import { fr } from '@/lib/copy/fr';
import { cn } from '@/lib/utils';

type NavbarProps = {
  onOpenCommandPalette?: () => void;
};

export function Navbar({ onOpenCommandPalette }: NavbarProps = {}) {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={reduce ? { opacity: 0 } : { y: -32, opacity: 0 }}
      animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
      transition={{ delay: 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[backdrop-filter,background-color,border-color,padding] duration-300',
        scrolled
          ? 'border-b border-[var(--color-hairline)] bg-[var(--color-bg-base)]/72 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container-tight flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          aria-label="DeckPad — accueil"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]"
        >
          <Logo />
        </Link>

        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {fr.nav.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-full px-4 py-2 text-sm text-[var(--color-platinum-300)] transition-colors hover:bg-white/[0.04] hover:text-[var(--color-platinum-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <CompatibilityBadge variant="pill" />
          {onOpenCommandPalette && (
            <CommandPaletteTrigger onClick={onOpenCommandPalette} />
          )}
          <Button asChild size="sm" variant="primary">
            <a href={fr.nav.ctaHref}>{fr.nav.cta}</a>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
