/*
 * Adapted from Rare UI's Animated Counter.
 * Copyright (c) 2026 Swami Malode
 * See ./LICENSE for the full license and attribution requirements.
 */
import React, { useEffect, useMemo, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import "./rareUi.css";

interface DigitProps {
  value: number;
  duration: number;
}

function Digit({ value, duration }: DigitProps) {
  const reducedMotion = useReducedMotion();
  const wheel = useMotionValue(value);
  const previous = useRef(value);
  const direction = value >= previous.current ? 1 : -1;

  useEffect(() => {
    const from = wheel.get();
    const current = ((Math.round(from) % 10) + 10) % 10;
    const distance = direction > 0
      ? (value - current + 10) % 10
      : -((current - value + 10) % 10);
    previous.current = value;
    if (reducedMotion) {
      wheel.set(value);
      return;
    }
    const controls = animate(wheel, from + distance, {
      type: "spring",
      visualDuration: duration,
      bounce: 0.12,
    });
    return () => controls.stop();
  }, [direction, duration, reducedMotion, value, wheel]);

  const y = useTransform(wheel, (position) => {
    const face = ((position % 10) + 10) % 10;
    return `${-face * 10}%`;
  });

  return (
    <span className="rare-counter__digit" aria-hidden="true">
      <motion.span style={{ y }}>
        {Array.from({ length: 10 }, (_, digit) => (
          <span key={digit}>{digit}</span>
        ))}
      </motion.span>
    </span>
  );
}

export interface AnimatedCounterProps
  extends Omit<React.ComponentProps<"span">, "children"> {
  value: number;
  duration?: number;
}

export function AnimatedCounter({
  value,
  duration = 0.55,
  className = "",
  ...props
}: AnimatedCounterProps) {
  const amount = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const digits = useMemo(() => String(amount).split("").map(Number), [amount]);

  return (
    <span
      data-slot="animated-counter"
      className={`rare-counter ${className}`.trim()}
      aria-label={String(amount)}
      {...props}
    >
      {digits.map((digit, index) => (
        <Digit
          key={`${digits.length - index}`}
          value={digit}
          duration={duration}
        />
      ))}
    </span>
  );
}
