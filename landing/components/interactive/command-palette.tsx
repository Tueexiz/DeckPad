'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Search,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Command as CommandIcon,
  type LucideIcon,
  Sparkles,
  Home,
  Layers,
  Activity,
  Calculator,
  Download,
  HelpCircle,
  Github,
  MessageCircle,
  Twitter,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fr } from '@/lib/copy/fr';

/* ----------- Commands schema ----------- */

type Command = {
  id: string;
  group: 'navigation' | 'sections' | 'actions' | 'social';
  label: string;
  hint?: string;
  icon: LucideIcon;
  /** Anchor href (in-page) or external URL */
  href?: string;
  /** Arbitrary handler */
  run?: () => void;
  /** Keywords for fuzzy match (lowercased) */
  keywords?: string[];
};

function buildCommands(close: () => void): Command[] {
  return [
    {
      id: 'top',
      group: 'navigation',
      label: fr.cmd.cmds.top,
      hint: fr.cmd.hints.scroll,
      icon: Home,
      keywords: ['haut', 'top', 'home', 'accueil'],
      run: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        close();
      },
    },
    {
      id: 'features',
      group: 'sections',
      label: fr.cmd.cmds.features,
      icon: Layers,
      href: '#fonctionnalites',
      keywords: ['fonctionnalites', 'features', 'benefices'],
    },
    {
      id: 'platforms',
      group: 'sections',
      label: fr.cmd.cmds.platforms,
      icon: Sparkles,
      href: '#comment-ca-marche',
      keywords: ['plateforme', 'windows', 'android', 'platforms'],
    },
    {
      id: 'latency',
      group: 'sections',
      label: fr.cmd.cmds.latency,
      icon: Activity,
      href: '#latence',
      keywords: ['latence', 'ping', 'ms', 'mesure'],
    },
    {
      id: 'savings',
      group: 'sections',
      label: fr.cmd.cmds.savings,
      icon: Calculator,
      href: '#economies',
      keywords: ['economies', 'savings', 'calculateur', 'prix'],
    },
    {
      id: 'download',
      group: 'actions',
      label: fr.cmd.cmds.download,
      icon: Download,
      href: '#telechargement',
      keywords: ['telecharger', 'download', 'install', 'apk'],
    },
    {
      id: 'demo',
      group: 'actions',
      label: fr.cmd.cmds.demo,
      icon: PlayCircle,
      keywords: ['demo', 'video', 'voir'],
      run: () => {
        // Trigger the hero demo button if present
        const trigger = document.querySelector<HTMLElement>(
          '[data-demo-trigger="true"]',
        );
        trigger?.click();
        close();
      },
    },
    {
      id: 'faq',
      group: 'sections',
      label: fr.cmd.cmds.faq,
      icon: HelpCircle,
      href: '#faq',
      keywords: ['faq', 'questions', 'aide'],
    },
    {
      id: 'github',
      group: 'social',
      label: fr.cmd.cmds.github,
      icon: Github,
      href: 'https://github.com/',
      keywords: ['github', 'code', 'source', 'mit'],
    },
    {
      id: 'discord',
      group: 'social',
      label: fr.cmd.cmds.discord,
      icon: MessageCircle,
      href: '#discord',
      keywords: ['discord', 'communaute', 'chat'],
    },
    {
      id: 'twitter',
      group: 'social',
      label: fr.cmd.cmds.twitter,
      icon: Twitter,
      href: '#twitter',
      keywords: ['twitter', 'x', 'social'],
    },
  ];
}

/* ----------- fuzzy match ----------- */
function score(query: string, target: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 60;
  if (t.includes(q)) return 40;
  // subseq match
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) return 20;
  }
  return 0;
}

function matchCommand(cmd: Command, query: string): number {
  if (!query) return 1;
  const fields = [cmd.label, cmd.group, ...(cmd.keywords ?? [])];
  return Math.max(...fields.map((f) => score(query, f)));
}

/* ----------- component ----------- */

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: Props) {
  const reduce = useReducedMotion();
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement | null>(null);

  const commands = React.useMemo(() => buildCommands(() => onOpenChange(false)), [onOpenChange]);

  const filtered = React.useMemo(() => {
    const ranked = commands
      .map((c) => ({ c, s: matchCommand(c, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s);
    return ranked.map((r) => r.c);
  }, [commands, query]);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  React.useEffect(() => {
    setActive(0);
  }, [query]);

  // Scroll active item into view
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLLIElement>(
      `[data-cmd-index="${active}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function runCommand(c: Command) {
    if (c.run) {
      c.run();
      return;
    }
    if (c.href) {
      if (c.href.startsWith('http') || c.href.startsWith('mailto:')) {
        window.open(c.href, c.href.startsWith('http') ? '_blank' : '_self', 'noopener,noreferrer');
      } else if (c.href.startsWith('#')) {
        const target = document.querySelector(c.href);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.href = c.href;
      }
      onOpenChange(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = filtered[active];
      if (c) runCommand(c);
    }
  }

  // Group filtered for display
  const grouped = React.useMemo(() => {
    const map = new Map<Command['group'], Command[]>();
    for (const c of filtered) {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  let absoluteIndex = -1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          aria-label={fr.cmd.title}
          className={cn(
            'fixed left-1/2 top-[20vh] z-50 w-[min(96vw,640px)] -translate-x-1/2',
            'overflow-hidden rounded-2xl border border-[var(--color-hairline-strong)]',
            'bg-[var(--color-bg-elev-1)]/95 backdrop-blur-2xl shadow-[var(--shadow-3)]',
            'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
          onKeyDown={onKey}
        >
          <DialogPrimitive.Title className="sr-only">{fr.cmd.title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {fr.cmd.description}
          </DialogPrimitive.Description>

          {/* Search */}
          <div className="flex items-center gap-3 border-b border-[var(--color-hairline)] px-4 py-3">
            <Search className="h-4 w-4 text-[var(--color-platinum-500)]" aria-hidden="true" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={fr.cmd.placeholder}
              spellCheck={false}
              aria-label={fr.cmd.placeholder}
              className="w-full bg-transparent text-[15px] text-[var(--color-platinum-100)] placeholder:text-[var(--color-platinum-500)] focus:outline-none"
            />
            <kbd className="hidden text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-platinum-500)] sm:inline">
              ESC
            </kbd>
          </div>

          {/* List */}
          <ul ref={listRef} className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
            <AnimatePresence initial={false} mode="popLayout">
              {grouped.length === 0 ? (
                <motion.li
                  key="empty"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-3 py-6 text-center text-[14px] text-[var(--color-platinum-400)]"
                >
                  {fr.cmd.empty}
                </motion.li>
              ) : (
                grouped.map(([groupName, items]) => (
                  <motion.li
                    key={groupName}
                    initial={reduce ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <p className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-platinum-500)]">
                      {fr.cmd.groups[groupName]}
                    </p>
                    <ul>
                      {items.map((c) => {
                        absoluteIndex += 1;
                        const idx = absoluteIndex;
                        const isActive = idx === active;
                        return (
                          <li
                            key={c.id}
                            data-cmd-index={idx}
                            role="option"
                            aria-selected={isActive}
                          >
                            <button
                              type="button"
                              onMouseEnter={() => setActive(idx)}
                              onClick={() => runCommand(c)}
                              className={cn(
                                'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer',
                                isActive
                                  ? 'bg-[var(--color-indigo-500)]/15 text-[var(--color-platinum-100)]'
                                  : 'text-[var(--color-platinum-300)] hover:bg-white/[0.04]',
                              )}
                            >
                              <span
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
                                  isActive
                                    ? 'border-[var(--color-indigo-400)] bg-[var(--color-indigo-500)]/20'
                                    : 'border-[var(--color-hairline-strong)] bg-white/[0.02]',
                                )}
                              >
                                <c.icon
                                  className="h-3.5 w-3.5"
                                  strokeWidth={1.75}
                                  aria-hidden="true"
                                />
                              </span>
                              <span className="flex-1 truncate text-[14px] font-medium">
                                {c.label}
                              </span>
                              {c.hint && (
                                <span className="hidden text-[11px] text-[var(--color-platinum-500)] sm:inline">
                                  {c.hint}
                                </span>
                              )}
                              <ArrowRight
                                aria-hidden="true"
                                className={cn(
                                  'h-3.5 w-3.5 transition-opacity',
                                  isActive ? 'opacity-100 text-[var(--color-indigo-300)]' : 'opacity-0',
                                )}
                              />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.li>
                ))
              )}
            </AnimatePresence>
          </ul>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 border-t border-[var(--color-hairline)] px-4 py-2.5 text-[11px] text-[var(--color-platinum-500)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Kbd>
                  <ArrowUp className="h-3 w-3" aria-hidden="true" />
                </Kbd>
                <Kbd>
                  <ArrowDown className="h-3 w-3" aria-hidden="true" />
                </Kbd>
                {fr.cmd.legend.navigate}
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>
                  <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
                </Kbd>
                {fr.cmd.legend.open}
              </span>
            </div>
            <span className="text-mono uppercase tracking-[0.18em]">
              DeckPad
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* --- Public trigger button --- */

export function CommandPaletteTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  const [isMac, setIsMac] = React.useState(false);
  React.useEffect(() => {
    setIsMac(
      typeof navigator !== 'undefined' &&
        /Mac|iPhone|iPad|iPod/i.test(navigator.platform || ''),
    );
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={fr.cmd.openLabel}
      className={cn(
        'group hidden md:inline-flex items-center gap-2 rounded-full border border-[var(--color-hairline-strong)] bg-white/[0.03]',
        'px-3 py-1.5 text-[12px] text-[var(--color-platinum-400)] transition-colors',
        'hover:bg-white/[0.06] hover:text-[var(--color-platinum-100)] cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]',
        className,
      )}
    >
      <Search className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{fr.cmd.searchShort}</span>
      <span className="flex items-center gap-0.5 ml-2">
        <Kbd>{isMac ? <CommandIcon className="h-3 w-3" aria-hidden="true" /> : 'Ctrl'}</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-[5px] border border-[var(--color-hairline-strong)] bg-white/[0.04] px-1 text-[10px] font-medium text-[var(--color-platinum-300)]">
      {children}
    </kbd>
  );
}

/* --- Hook that wires the global ⌘K / Ctrl+K shortcut --- */

export function useCommandPalette(): {
  open: boolean;
  setOpen: (v: boolean) => void;
} {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === '/' && !isInTextField(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return { open, setOpen };
}

function isInTextField(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || t.isContentEditable;
}
