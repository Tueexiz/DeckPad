'use client';

import { useMemo, useState, useDeferredValue } from 'react';
import { Search } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/motion-primitives';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { faq } from '@/content/faq';
import { fr } from '@/lib/copy/fr';

export function Faq() {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    if (!q) return faq;
    return faq.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q),
    );
  }, [deferred]);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="section-pad relative"
    >
      <div className="container-tight">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <ScrollReveal>
            <div className="lg:sticky lg:top-32">
              <p className="text-eyebrow mb-4">{fr.faq.eyebrow}</p>
              <h2 id="faq-heading" className="text-h2 mb-5">
                {fr.faq.heading}
              </h2>
              <p className="text-lead mb-8">{fr.faq.lead}</p>

              <label className="relative block">
                <span className="sr-only">{fr.faq.searchPlaceholder}</span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-platinum-500)]"
                />
                <Input
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  placeholder={fr.faq.searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-11"
                />
              </label>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            {filtered.length === 0 ? (
              <p
                role="status"
                aria-live="polite"
                className="rounded-2xl border border-dashed border-[var(--color-hairline-strong)] bg-white/[0.02] p-8 text-[15px] text-[var(--color-platinum-300)]"
              >
                {fr.faq.empty}
              </p>
            ) : (
              <Accordion
                type="single"
                collapsible
                className="rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-bg-elev-1)] px-6 sm:px-10"
              >
                {filtered.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
