"use client";

import { useState } from "react";
import { shareOrCopy } from "@/lib/share";

interface Props {
  title: string;
  text: string;
  url?: string;
  label?: string;
  variant?: "pill" | "icon";
  className?: string;
}

export default function ShareButton({ title, text, url, label = "partager", variant = "pill", className = "" }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");

  const onClick = async () => {
    const result = await shareOrCopy({ title, text, url });
    if (result === "copied") {
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } else if (result === "shared") {
      setStatus("shared");
      setTimeout(() => setStatus("idle"), 1500);
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="partager"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-xl text-forest shadow-soft transition active:scale-95 ${className}`}
      >
        {status === "idle" ? "📤" : "✅"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-full border-2 border-forest/20 bg-white py-4 px-6 text-lg font-bold text-forest transition-all hover:border-forest/40 active:scale-[0.98] ${className}`}
    >
      {status === "copied" ? "✅ copié dans le presse-papiers" : status === "shared" ? "✅ partagé !" : `📤 ${label}`}
    </button>
  );
}
