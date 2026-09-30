/*
 * Adapted from Rare UI's Gooey Nav.
 * Copyright (c) 2026 Swami Malode
 * See ./LICENSE for the full license and attribution requirements.
 */
import React from "react";
import { motion, useReducedMotion } from "motion/react";
import "./rareUi.css";

export interface GooeyNavItem<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface GooeyNavProps<T extends string> {
  items: readonly GooeyNavItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

export function GooeyNav<T extends string>({
  items,
  value,
  onChange,
  label,
  className = "",
}: GooeyNavProps<T>) {
  const reducedMotion = useReducedMotion();

  return (
    <nav
      data-slot="gooey-nav"
      className={`rare-gooey-nav ${className}`.trim()}
      aria-label={label}
    >
      <ul>
        {items.map((item, index) => {
          const active = item.value === value;
          const previousActive = index > 0 && items[index - 1]?.value === value;
          return (
            <motion.li
              key={item.value}
              data-active={active || undefined}
              animate={{
                marginLeft: index > 0 && (active || previousActive) ? 7 : -1,
                borderTopLeftRadius: active || previousActive || index === 0 ? 9 : 0,
                borderBottomLeftRadius: active || previousActive || index === 0 ? 9 : 0,
                borderTopRightRadius: active || items[index + 1]?.value === value || index === items.length - 1 ? 9 : 0,
                borderBottomRightRadius: active || items[index + 1]?.value === value || index === items.length - 1 ? 9 : 0,
              }}
              transition={reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.42, bounce: 0.12 }}
            >
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange(item.value)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </nav>
  );
}
