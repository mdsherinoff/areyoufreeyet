"use client";

import type { Ref } from "react";
import { IconCheck } from "./Icons";

export type Step = 1 | 2 | 3;

const STEPS: { n: Step; num: string; label: string }[] = [
  { n: 1, num: "01", label: "Your schedule" },
  { n: 2, num: "02", label: "Friends" },
  { n: 3, num: "03", label: "Results" },
];

interface StepNavProps {
  current: Step;
  onChange: (step: Step) => void;
  /** Optional small count shown next to each step label. */
  counts?: Partial<Record<Step, number>>;
  ref?: Ref<HTMLElement>;
}

export function StepNav({ current, onChange, counts = {}, ref }: StepNavProps) {
  return (
    <nav
      ref={ref}
      aria-label="Steps"
      className="mt-8 mb-10 scroll-mt-4 grid grid-cols-3 border-b border-border"
    >
      {STEPS.map(({ n, num, label }) => {
        const active = n === current;
        const done = n < current;
        const count = counts[n];
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={active ? "step" : undefined}
            className={`group -mb-px flex flex-col items-start gap-1 border-b-2 pb-3.5 pr-2 text-left transition-colors sm:flex-row sm:items-center sm:gap-2.5 ${
              active ? "border-maroon" : "border-transparent hover:border-border-mid"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center font-mono text-[11px] transition-colors ${
                active
                  ? "bg-maroon text-white"
                  : done
                    ? "bg-maroon-light text-maroon"
                    : "border border-border-mid text-text-3"
              }`}
            >
              {done ? <IconCheck width={12} height={12} strokeWidth={3} /> : num}
            </span>
            <span
              className={`font-display text-[14px] font-semibold tracking-tight ${
                active
                  ? "text-text"
                  : "text-text-3 group-hover:text-text-2"
              }`}
            >
              {label}
            </span>
            {count !== undefined && count > 0 && (
              <span
                className={`hidden font-mono text-[11px] tabular-nums sm:inline ${
                  active ? "text-maroon" : "text-text-3"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
