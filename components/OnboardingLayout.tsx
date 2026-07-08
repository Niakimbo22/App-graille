"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "./ProgressBar";
import PillButton from "./PillButton";

interface Props {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  back?: string; // route de retour (sinon router.back())
}

export default function OnboardingLayout({
  step,
  total,
  title,
  subtitle,
  children,
  onContinue,
  continueLabel = "continuer",
  continueDisabled = false,
  back,
}: Props) {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-6 pt-5">
      <header className="mb-6 flex items-center gap-3">
        <button
          aria-label="retour"
          onClick={() => (back ? router.push(back) : router.back())}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl text-forest shadow-soft transition active:scale-95"
        >
          ←
        </button>
        <div className="flex-1">
          <ProgressBar step={step} total={total} />
        </div>
      </header>

      <div key={title} className="flex-1 animate-fade-up">
        <h1 className="text-3xl font-extrabold lowercase leading-tight text-forest">{title}</h1>
        {subtitle && <p className="mt-2 text-base text-black/50">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>

      {onContinue && (
        <div className="sticky bottom-0 pt-4">
          <PillButton onClick={onContinue} disabled={continueDisabled}>
            {continueLabel}
          </PillButton>
        </div>
      )}
    </div>
  );
}
