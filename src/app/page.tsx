"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/context/SessionContext";
import { PersonSchedule } from "@/components/PersonSchedule";
import { AddFriend } from "@/components/AddFriend";
import { Results } from "@/components/Results";
import { StepNav, Step } from "@/components/StepNav";
import { ShareButton } from "@/components/ShareButton";
import { Toaster } from "@/components/Toaster";
import { IconArrowLeft, IconArrowRight, IconClose } from "@/components/Icons";

const STEP_KEY = "areyoufreeyet:step";

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
  const [step, setStepState] = useState<Step>(1);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [newFriendId, setNewFriendId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Restore the last step on reload; a fresh shared link lands on Friends so
  // the visitor can add themselves straight away.
  useEffect(() => {
    if (!ready) return;
    let saved: Step | null = null;
    try {
      const n = Number(window.localStorage.getItem(STEP_KEY));
      if (n === 1 || n === 2 || n === 3) saved = n;
    } catch {
      /* storage blocked — start at step 1 */
    }
    const initial = joinedFromLink ? 2 : saved;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initial) setStepState(initial);
  }, [ready, joinedFromLink]);

  const setStep = (next: Step) => {
    setStepState(next);
    try {
      window.localStorage.setItem(STEP_KEY, String(next));
    } catch {
      /* non-fatal */
    }
    // Keep the step tabs in view when moving between steps from the footer.
    const nav = navRef.current;
    if (nav && nav.getBoundingClientRect().top < 0) {
      nav.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Scroll a just-added friend's card into view.
  useEffect(() => {
    if (!newFriendId) return;
    document
      .getElementById(`person-${newFriendId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [newFriendId]);

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-6 py-14 sm:py-16" aria-busy>
        <div className="h-[132px] w-[300px] max-w-full animate-pulse bg-border/60" />
        <div className="rule-bold mt-10 opacity-30" />
        <div className="mt-10 h-[280px] animate-pulse border border-border bg-surface/60" />
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

      <StepNav
        ref={navRef}
        current={step}
        onChange={setStep}
        counts={{ 1: you?.events.length ?? 0, 2: friends.length }}
      />

      {joinedFromLink && bannerOpen && (
        <div className="mb-10 flex items-start gap-3 border-l-2 border-maroon pl-4 text-[13px]">
        <div className="flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
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
          <button
            type="button"
            onClick={() => setBannerOpen(false)}
            aria-label="Dismiss"
            className="shrink-0 p-0.5 text-text-3 transition-colors hover:text-text"
          >
            <IconClose width={14} height={14} />
          </button>
        </div>
      )}

      {/* Active section */}
      <section className="mb-12">
        <div className="eyebrow text-maroon">Step {meta.num} / 03</div>
        <h2 className="display mt-2 uppercase text-[clamp(26px,5vw,34px)]">
          {meta.title}
        </h2>
        <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-text-2">
          {meta.blurb}
        </p>
        <div className="mt-8">
          {step === 1 &&
            (you ? (
              <PersonSchedule person={you} />
            ) : (
              <div className="eyebrow">No one here yet.</div>
            ))}

          {step === 2 && (
            <div className="flex flex-col gap-8">
              {friends.length === 0 ? (
                <div className="border border-dashed border-border-mid bg-surface/40 px-6 py-12 text-center">
                  <div className="display mb-2 text-[22px] uppercase text-text-3">
                    Just you so far
                  </div>
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
                <AddFriend
                  defaultTimezone={you?.timezone ?? "UTC"}
                  onAdded={setNewFriendId}
                />
                <ShareButton label="Invite via link" />
              </div>
            </div>
          )}

          {step === 3 && <Results onAddFriends={() => setStep(2)} />}
        </div>
      </section>

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
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
              {step === 1
                ? "Next: friends"
                : friends.length === 0
                  ? "Skip to results"
                  : "See results"}
            </span>
            <IconArrowRight
              width={16}
              height={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>
        )}
      </div>

      <Toaster />
    </div>
  );
}
