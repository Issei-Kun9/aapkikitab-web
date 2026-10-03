"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { motionTokens, springs } from "@/lib/motion-tokens";
import { useSafeMotion } from "@/hooks/use-safe-motion";

/* Scroll reveal: rises once into view. SSR-safe (renders hidden on both). */
export function Reveal({ children, delay = 0, y }: { children: ReactNode; delay?: number; y?: number }) {
  const safe = useSafeMotion(y ?? motionTokens.distance.lg);
  return (
    <motion.div
      initial={safe.initial}
      whileInView={safe.animate}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth, delay }}
    >
      {children}
    </motion.div>
  );
}

/* Tactile press for primary CTAs: communicates state, no layout shift. */
export function Press({ children }: { children: ReactNode }) {
  return (
    <motion.span
      className="inline-flex"
      whileTap={{ scale: motionTokens.scale.press }}
      transition={springs.snappy}
    >
      {children}
    </motion.span>
  );
}

/* Count bump: remounts on value change for a small celebratory pop. */
export function Bump({ value, children }: { value: number; children: ReactNode }) {
  return (
    <motion.span
      key={value}
      initial={{ scale: 0.4 }}
      animate={{ scale: 1 }}
      transition={springs.bouncy}
      className="inline-flex"
    >
      {children}
    </motion.span>
  );
}
