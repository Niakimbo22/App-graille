"use client";

import { useEffect, useState } from "react";
import PillButton from "@/components/PillButton";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as NavigatorStandalone).standalone === true
  );
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallAppButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [ios, setIos] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIOS());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const onClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    // pas d'invite native (iOS, Firefox…) : on explique comment faire
    setShowHelp((v) => !v);
  };

  return (
    <div>
      <PillButton variant="ghost" onClick={onClick}>
        📲 installer l&apos;application
      </PillButton>
      {showHelp && (
        <p className="mt-2 rounded-2xl bg-white p-3 text-center text-sm text-black/60 shadow-soft">
          {ios ? (
            <>
              appuie sur <strong>partager</strong> (le carré avec la flèche, en bas de Safari) puis
              <strong> « Sur l&apos;écran d&apos;accueil »</strong>.
            </>
          ) : (
            <>
              ouvre le <strong>menu de ton navigateur</strong> (⋮ ou ⋯) puis choisis
              <strong> « installer l&apos;application »</strong> ou
              <strong> « ajouter à l&apos;écran d&apos;accueil »</strong>.
            </>
          )}
        </p>
      )}
    </div>
  );
}
