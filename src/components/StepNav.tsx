"use client";

export type Step = 1 | 2 | 3;

const STEPS: { n: Step; num: string; label: string }[] = [
  { n: 1, num: "01", label: "Your schedule" },
  { n: 2, num: "02", label: "Friends" },
  { n: 3, num: "03", label: "Results" },
];

interface StepNavProps {
  current: Step;
  onChange: (step: Step) => void;
}

export function StepNav({ current, onChange }: StepNavProps) {
  return (
    <nav className="mt-8 mb-10 flex gap-6 sm:gap-9 border-b border-border">
      {STEPS.map(({ n, num, label }) => {
        const active = n === current;
        const done = n < current;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`group -mb-px flex items-baseline gap-2 border-b-2 pb-3.5 transition-colors ${
              active ? "border-maroon" : "border-transparent"
            }`}
          >
            <span
              className={`font-mono text-[12px] ${
                active
                  ? "text-maroon"
                  : done
                    ? "text-text-2"
                    : "text-text-3"
              }`}
            >
              {num}
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
          </button>
        );
      })}
    </nav>
  );
}
