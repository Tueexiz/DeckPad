'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollReveal } from '@/components/motion/motion-primitives';
import { fr } from '@/lib/copy/fr';

const HASH_KEY = 'plateforme';

export function PlatformTabs() {
  const reduce = useReducedMotion();
  const [value, setValue] = useState<string>(fr.platforms.tabs[0].value);

  // Sync from URL hash
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const v = hash.get(HASH_KEY);
    if (v && fr.platforms.tabs.some((t) => t.value === v)) setValue(v);
  }, []);

  function onChange(v: string) {
    setValue(v);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.hash = `${HASH_KEY}=${v}`;
    window.history.replaceState(null, '', url.toString());
  }

  return (
    <section
      id="comment-ca-marche"
      aria-labelledby="platforms-heading"
      className="section-pad relative"
    >
      <div className="container-tight">
        <ScrollReveal>
          <div className="mb-12 max-w-2xl">
            <p className="text-eyebrow mb-4">{fr.platforms.eyebrow}</p>
            <h2 id="platforms-heading" className="text-h2">
              {fr.platforms.heading}
            </h2>
          </div>
        </ScrollReveal>

        <Tabs value={value} onValueChange={onChange} className="w-full">
          <TabsList>
            {fr.platforms.tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            {fr.platforms.tabs.map((t) =>
              t.value === value ? (
                <TabsContent key={t.value} value={t.value} forceMount>
                  <motion.div
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="grid gap-8 rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-bg-elev-1)] p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]"
                  >
                    <div>
                      <h3 className="text-h3 mb-4">{t.title}</h3>
                      <p className="text-[15px] leading-relaxed text-[var(--color-platinum-300)]">
                        {t.body}
                      </p>
                    </div>
                    <ul className="grid content-center gap-3">
                      {t.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-3 rounded-xl border border-[var(--color-hairline)] bg-white/[0.02] px-4 py-3"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-indigo-500)]/20 ring-1 ring-[var(--color-indigo-400)]/40">
                            <Check className="h-3 w-3 text-[var(--color-indigo-300)]" strokeWidth={3} aria-hidden="true" />
                          </span>
                          <span className="text-[14px] text-[var(--color-platinum-200)]">
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </TabsContent>
              ) : null,
            )}
          </AnimatePresence>
        </Tabs>
      </div>
    </section>
  );
}
