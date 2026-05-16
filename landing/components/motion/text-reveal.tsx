'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';

const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: PREMIUM_EASE },
  },
};

type Props = {
  words: readonly string[] | string[];
  className?: string;
  /** Time between words in seconds. */
  stagger?: number;
  /** Initial delay before the first word in seconds. */
  delay?: number;
  /** Render tag (defaults to h1). */
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
};

export function TextReveal({
  words,
  className,
  stagger = 0.08,
  delay = 0.2,
  as = 'h1',
}: Props) {
  const reduce = useReducedMotion();

  if (reduce) {
    const Tag = as as 'h1' | 'h2' | 'h3' | 'p' | 'span';
    return <Tag className={className}>{words.join(' ')}</Tag>;
  }

  const MotionTag = motion[as] as typeof motion.h1;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={words.join(' ')}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={wordVariants}
          className="inline-block mr-[0.25em]"
          aria-hidden="true"
        >
          {word}
        </motion.span>
      ))}
    </MotionTag>
  );
}
