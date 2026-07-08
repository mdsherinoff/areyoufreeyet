"use client";

import { useState } from "react";
import { useSession } from "@/context/SessionContext";
import { PersonSchedule } from "@/components/PersonSchedule";
import { AddFriend } from "@/components/AddFriend";
import { Results } from "@/components/Results";
import { StepNav, Step } from "@/components/StepNav";
import { ShareButton } from "@/components/ShareButton";
import { IconArrowLeft, IconArrowRight } from "@/components/Icons";

const STEP_META: Record<Step, { num: string; title: string; blurb: string }> = {
  1: {
    num: "01",
    title: "Your schedule",
    blurb: "Block out your classes and commitments, or import a calendar.",
  },
  2: {
    num: "02",
    title: "Friends",
    blurb:
      "Add the people you want to find time with — type their schedule, import their calendar, or send them the link so they add themselves.",
  },
  3: {
    num: "03",
    title: "Results",
    blurb: "Where everyone's free. The deeper the shade, the more people open.",
  },
};

export default function Home() {
  const { session, ready, joinedFromLink } = useSession();
  const [step, setStep] = useState<Step>(1);

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-6 py-16">
        <div className="eyebrow">Loading…</div>
      </div>
    );
  }

  const you = session.people[0];
  const friends = session.people.slice(1);
  const meta = STEP_META[step];

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-14 sm:py-16">
      {/* Masthead */}
      <header>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <h1 className="display uppercase text-[clamp(42px,10vw,74px)]">
            Are<span className="text-maroon">You</span>
            <br />
            FreeYet<span className="text-maroon">.</span>
          </h1>
          <div className="pt-1.5">
            <ShareButton />
          </div>
        </div>
        <p className="eyebrow mt-5">Find time that works for everyone</p>
        <div className="rule-bold mt-5" />
      </header>

      <StepNav current={step} onChange={setStep} />

      {joinedFromLink && (
        <div className="mb-10 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-l-2 border-maroon pl-4 text-[13px]">
          <span className="eyebrow text-maroon">Shared plan</span>
          <span className="text-text-2">
            You&apos;ve joined a plan with {session.people.length}{" "}
            {session.people.length === 1 ? "person" : "people"}. Add yourself
            under{" "}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="font-medium text-text underline decoration-maroon decoration-2 underline-offset-2"
            >
              Friends
            </button>
            , then re-share.
          </span>
        </div>
      )}

      {/* Active section */}
      <section className="mb-12">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-[15px] text-maroon">{meta.num}</span>
          <h2 className="display uppercase text-[clamp(26px,5vw,34px)]">
            {meta.title}
          </h2>
        </div>
        <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-text-2">
          {meta.blurb}
        </p>
        <div className="rule mt-6 pt-8">
          {step === 1 &&
            (you ? (
              <PersonSchedule person={you} />
            ) : (
              <div className="eyebrow">No one here yet.</div>
            ))}

          {step === 2 && (
            <div className="flex flex-col gap-8">
              {friends.length === 0 ? (
                <div className="border border-dashed border-border-mid px-6 py-10 text-center">
                  <div className="eyebrow mb-2">No friends yet</div>
                  <div className="text-[13px] text-text-2">
                    Add someone below, or share the link so they add themselves.
                  </div>
                </div>
              ) : (
                friends.map((f) => (
                  <PersonSchedule key={f.id} person={f} removable />
                ))
              )}
              <div className="flex flex-wrap items-center gap-3">
                <AddFriend defaultTimezone={you?.timezone ?? "UTC"} />
                <ShareButton />
              </div>
            </div>
          )}

          {step === 3 && <Results />}
        </div>
      </section>

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-3">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((step - 1) as Step)}
            className="group inline-flex items-center gap-2 text-[13px] font-medium text-text-2 hover:text-text transition-colors"
          >
            <IconArrowLeft
              width={16}
              height={16}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back
          </button>
        ) : (
          <span />
        )}
        {step < 3 && (
          <button
            type="button"
            onClick={() => setStep((step + 1) as Step)}
            className="group inline-flex items-center gap-2.5 bg-maroon px-6 py-3 text-white transition-all hover:bg-maroon-dark active:scale-[0.98]"
          >
            <span className="font-mono text-[12px] uppercase tracking-[0.14em]">
              {step === 1 ? "Add friends" : "See results"}
            </span>
            <IconArrowRight
              width={16}
              height={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>
        )}
      </div>
    </div>
  );
}
