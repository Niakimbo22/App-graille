export default function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (step / total) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-leaf to-forest transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
