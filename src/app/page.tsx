"use client";

import { useState } from "react";
import { useSession } from "@/context/SessionContext";
import { PersonSchedule } from "@/components/PersonSchedule";
import { AddFriend } from "@/components/AddFriend";
import { Results } from "@/components/Results";
import { StepNav, Step } from "@/components/StepNav";
import { ShareButton } from "@/components/ShareButton";
import { IconArrowLeft, IconArrowRight } from "@/components/Icons";

export default function Home() {
  const { session, ready, joinedFromLink } = useSession();
  const [step, setStep] = useState<Step>(1);

  if (!ready) {
    return (
      <div className="max-w-[780px] mx-auto px-5 py-8">
        <div className="text-text-3 text-sm">Loading…</div>
      </div>
    );
  }

  const you = session.people[0];
  const friends = session.people.slice(1);

  return (
    <div className="max-w-[780px] mx-auto px-5 py-8 pb-16">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-9">
        <div>
          <div className="text-[23px] font-semibold tracking-tight leading-none">
            Are<span className="text-maroon">You</span>FreeYet
            <span className="inline-block w-[6px] h-[6px] bg-maroon rounded-full ml-0.5 relative -top-[1px]" />
          </div>
          <div className="text-[13px] text-text-2 mt-1.5">
            Find time that works for everyone.
          </div>
        </div>
        <ShareButton />
      </div>

      {joinedFromLink && (
        <div className="bg-maroon-light text-maroon-dark border border-maroon-mid/40 rounded-card px-4 py-3 mb-6 text-[13px]">
          You&apos;ve opened a shared plan with {session.people.length}{" "}
          {session.people.length === 1 ? "person" : "people"}. Add yourself under{" "}
          <button
            type="button"
            onClick={() => setStep(2)}
            className="underline font-medium"
          >
            Friends
          </button>
          , then re-share the link.
        </div>
      )}

      <StepNav current={step} onChange={setStep} />

      {/* Step 1 — Your schedule */}
      {step === 1 && (
        <>
          <Card
            title="Your schedule"
            subtitle="Add your classes and commitments, or import a calendar."
          >
            {you ? (
              <PersonSchedule person={you} />
            ) : (
              <div className="text-text-3 text-sm">No one here yet.</div>
            )}
          </Card>
          <FooterNav next={{ label: "Add friends", onClick: () => setStep(2) }} />
        </>
      )}

      {/* Step 2 — Friends */}
      {step === 2 && (
        <>
          <Card
            title="Friends"
            subtitle="Add the people you want to find time with — enter their schedule, import their calendar, or send them the share link so they add themselves."
          >
            <div className="flex flex-col gap-3">
              {friends.length === 0 && (
                <div className="text-center py-6 text-text-3 text-sm">
                  No friends added yet.
                </div>
              )}
              {friends.map((f) => (
                <PersonSchedule key={f.id} person={f} removable />
              ))}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <AddFriend defaultTimezone={you?.timezone ?? "UTC"} />
                <ShareButton />
              </div>
            </div>
          </Card>
          <FooterNav
            back={{ label: "Back", onClick: () => setStep(1) }}
            next={{ label: "See results", onClick: () => setStep(3) }}
          />
        </>
      )}

      {/* Step 3 — Results */}
      {step === 3 && (
        <>
          <Card
            title="Results"
            subtitle="The overlap of everyone's schedules — the deeper the shade, the more people free."
          >
            <Results />
          </Card>
          <FooterNav back={{ label: "Back", onClick: () => setStep(2) }} />
        </>
      )}
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-card p-6 sm:p-7 mb-4 shadow-card">
      <div className="text-[17px] font-semibold tracking-tight mb-1">{title}</div>
      <div className="text-[13px] text-text-2 mb-6 leading-relaxed max-w-[56ch]">
        {subtitle}
      </div>
      {children}
    </div>
  );
}

function FooterNav({
  back,
  next,
}: {
  back?: { label: string; onClick: () => void };
  next?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex justify-between items-center gap-3">
      {back ? (
        <button
          type="button"
          onClick={back.onClick}
          className="inline-flex items-center gap-1.5 pl-3 pr-4 py-2 rounded-control border border-border-mid bg-surface text-sm font-medium text-text hover:border-maroon/40 hover:bg-maroon-light/40 transition-all active:scale-[0.98]"
        >
          <IconArrowLeft width={16} height={16} /> {back.label}
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button
          type="button"
          onClick={next.onClick}
          className="inline-flex items-center gap-1.5 pl-4 pr-3 py-2 rounded-control bg-maroon text-white font-medium text-sm shadow-sm hover:bg-maroon-dark transition-all active:scale-[0.98]"
        >
          {next.label} <IconArrowRight width={16} height={16} />
        </button>
      )}
    </div>
  );
}
