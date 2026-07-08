"use client";

import { ReactNode } from "react";

interface Props {
  selected: boolean;
  onClick: () => void;
  emoji?: string;
  title: string;
  subtitle?: string;
  bg?: string;
  children?: ReactNode;
}

export default function SelectCard({ selected, onClick, emoji, title, subtitle, bg }: Props) {
  return (
    <button
      onClick={onClick}
      style={bg && !selected ? { backgroundColor: bg } : undefined}
      className={`flex w-full items-center gap-4 rounded-3xl border-[3px] p-4 text-left transition-all active:scale-[0.98] ${
        selected
          ? "border-leaf bg-white shadow-glow"
          : "border-transparent bg-white shadow-soft"
      }`}
    >
      {emoji && <span className="text-3xl">{emoji}</span>}
      <span className="flex-1">
        <span className="block text-lg font-bold text-forest">{title}</span>
        {subtitle && <span className="block text-sm text-black/50">{subtitle}</span>}
      </span>
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-sm text-white transition ${
          selected ? "border-leaf bg-leaf" : "border-black/15"
        }`}
      >
        {selected ? "✓" : ""}
      </span>
    </button>
  );
}
