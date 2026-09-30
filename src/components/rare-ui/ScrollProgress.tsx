/*
 * Adapted from Rare UI's Scroll Progress.
 * Copyright (c) 2026 Swami Malode
 * See ./LICENSE for the full license and attribution requirements.
 */
import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronUp } from "lucide-react";
import "./rareUi.css";

export interface ScrollProgressSection {
  id: string;
  label: string;
}

interface ScrollProgressProps {
  sections: readonly ScrollProgressSection[];
  offset?: number;
}

export function ScrollProgress({ sections, offset = 104 }: ScrollProgressProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const menuId = useId();

  useEffect(() => {
    const scrollContainer = rootRef.current?.closest(".home-body") as HTMLElement | null;
    if (!scrollContainer) return;

    const update = () => {
      const maximum = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      setProgress(maximum > 0 ? Math.min(1, Math.max(0, scrollContainer.scrollTop / maximum)) : 0);
      const anchor = scrollContainer.getBoundingClientRect().top + offset;
      const visible = sections.filter(({ id }) => {
        const element = document.getElementById(id);
        return element && element.getBoundingClientRect().top <= anchor;
      });
      setActiveId(visible.at(-1)?.id ?? sections[0]?.id ?? "");
    };

    update();
    scrollContainer.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      scrollContainer.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [offset, sections]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOnPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnPointer);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnPointer);
    };
  }, [open]);

  const selectSection = (id: string) => {
    const scrollContainer = rootRef.current?.closest(".home-body") as HTMLElement | null;
    const target = document.getElementById(id);
    if (!scrollContainer || !target) return;
    const currentTop = scrollContainer.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    scrollContainer.scrollTo({
      top: scrollContainer.scrollTop + targetTop - currentTop - offset,
      behavior: reducedMotion ? "auto" : "smooth",
    });
    setActiveId(id);
    setOpen(false);
  };

  const activeLabel = sections.find((section) => section.id === activeId)?.label ?? sections[0]?.label;
  if (!sections.length) return null;

  return (
    <div ref={rootRef} className="rare-scroll-progress" data-slot="scroll-progress">
      <AnimatePresence>
        {open && (
          <motion.ul
            id={menuId}
            className="rare-scroll-progress__menu"
            initial={reducedMotion ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(3px)" }}
            transition={{ duration: reducedMotion ? 0 : 0.18 }}
          >
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  aria-current={section.id === activeId ? "location" : undefined}
                  onClick={() => selectSection(section.id)}
                >
                  <span aria-hidden="true" />
                  {section.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <button
        type="button"
        className="rare-scroll-progress__trigger"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="rare-scroll-progress__ring" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <motion.circle
              cx="12"
              cy="12"
              r="9"
              pathLength="1"
              initial={false}
              animate={{ pathLength: progress }}
              transition={{ duration: reducedMotion ? 0 : 0.16 }}
            />
          </svg>
        </span>
        <span>{activeLabel}</span>
        <ChevronUp size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
