import type { Tag } from "@/lib/types";
import { TAG_STYLES } from "@/lib/tags";

export default function TagPill({ tag }: { tag: Tag }) {
  const s = TAG_STYLES[tag];
  if (!s) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span>{s.emoji}</span>
      {s.label}
    </span>
  );
}
