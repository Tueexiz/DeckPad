'use client';

/**
 * Motion primitives — single source for premium, reduced-motion-aware animations.
 * All primitives animate transform + opacity + filter only (never width/height/top/left).
 */
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from 'framer-motion';
import { type ReactNode } from 'react';

const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: 'spring' as const, stiffness: 120, damping: 20, mass: 0.8 };

/* ----------------------------- FadeIn ----------------------------- */
type FadeInProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
  y?: number;
  x?: number;
  delay?: number;
  duration?: number;
  className?: string;
};

export function FadeIn({
  children,
  y = 24,
  x = 0,
  delay = 0,
  duration = 0.6,
  className,
  ...rest
}: FadeInProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, x, filter: 'blur(8px)' }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: reduce ? 0.2 : duration, delay, ease: PREMIUM_EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------- Stagger ----------------------------- */
type StaggerProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
  gap?: number;
  delayChildren?: number;
  className?: string;
  /** Animate when the element enters the viewport (default true). */
  whenInView?: boolean;
};

const staggerParent: Variants = {
  hidden: {},
  visible: (custom: { gap: number; delayChildren: number }) => ({
    transition: {
      staggerChildren: custom.gap,
      delayChildren: custom.delayChildren,
    },
  }),
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: PREMIUM_EASE } },
};

export function Stagger({
  children,
  gap = 0.06,
  delayChildren = 0.1,
  className,
  whenInView = true,
  ...rest
}: StaggerProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      custom={{ gap, delayChildren }}
      initial="hidden"
      {...(whenInView
        ? { whileInView: 'visible', viewport: { once: true, amount: 0.2 } }
        : { animate: 'visible' })}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...rest
}: HTMLMotionProps<'div'> & { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={staggerChild} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

/* -------------------------- ScrollReveal -------------------------- */
type ScrollRevealProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
  y?: number;
  delay?: number;
  className?: string;
};

export function ScrollReveal({
  children,
  y = 32,
  delay = 0,
  className,
  ...rest
}: ScrollRevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0.2 : 0.7, delay, ease: PREMIUM_EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------ Float ----------------------------- */
type FloatProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
  range?: number;
  duration?: number;
  className?: string;
};

export function Float({
  children,
  range = 6,
  duration = 4,
  className,
  ...rest
}: FloatProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -range, 0] }}
      transition={{ duration, ease: 'easeInOut', repeat: Infinity }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export { PREMIUM_EASE, SPRING };
