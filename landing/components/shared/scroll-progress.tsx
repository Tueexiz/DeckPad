'use client';

import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Thin scroll-progress bar fixed under the navbar. Uses Framer's useScroll
 * with a spring smoother for a premium feel; respects reduced-motion.
 */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.5,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-16 z-30 h-px origin-left"
      style={{
        scaleX: reduce ? scrollYProgress : smoothed,
        background:
          'linear-gradient(90deg, transparent, var(--color-indigo-400) 30%, var(--color-platinum-200) 60%, var(--color-indigo-400) 90%, transparent)',
        boxShadow: '0 0 12px rgba(99,102,241,0.5)',
      }}
    />
  );
}
