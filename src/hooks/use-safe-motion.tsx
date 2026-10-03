"use client";

import { useReducedMotion } from "motion/react";
import { motionTokens } from "@/lib/motion-tokens";

export function useSafeMotion(fullY: number = motionTokens.distance.lg) {
  const reduce = useReducedMotion();
  return {
    reduced: !!reduce,
    initial: { opacity: 0, y: reduce ? 0 : fullY },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduce ? 0 : -fullY },
  };
}
