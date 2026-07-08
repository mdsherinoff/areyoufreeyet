"use client";

export type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Your schedule" },
  { n: 2, label: "Friends" },
  { n: 3, label: "Results" },
];

interface StepNavProps {
  current: Step;
  onChange: (step: Step) => void;
}

export function StepNav({ current, onChange }: StepNavProps) {
  return (
    <div className="flex bg-surface border border-border rounded-card p-1 mb-8">
      {STEPS.map(({ n, label }) => {
        const active = n === current;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-2.5 px-1.5 rounded-[11px] text-[13px] flex items-center justify-center gap-1.5 transition-all ${
              active
                ? "bg-maroon text-white font-medium shadow-sm"
                : "text-text-3 hover:text-text-2 hover:bg-black/[0.03]"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                active ? "bg-white/20" : "bg-black/[0.06]"
              }`}
            >
              {n}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
