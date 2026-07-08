"use client";

import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export default function PillButton({ variant = "primary", className = "", children, ...rest }: Props) {
  const base =
    "w-full rounded-full py-4 px-6 text-lg font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
  const styles =
    variant === "primary"
      ? "bg-forest text-white shadow-soft hover:brightness-110"
      : "bg-white text-forest border-2 border-forest/20 hover:border-forest/40";
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
