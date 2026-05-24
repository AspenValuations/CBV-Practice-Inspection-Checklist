interface ProgressBarProps {
  answered: number;
  total: number;
}

export function ProgressBar({ answered, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="px-3 py-3 border-b border-slate-200">
      <p className="text-xs text-slate-500 mb-1.5">
        <span className="font-semibold text-slate-700">{answered}</span> of{" "}
        <span className="font-semibold text-slate-700">{total}</span> answered
      </p>
      <div className="h-2 w-full rounded-full bg-[#1A322F]/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#05B4C9] transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${pct}% complete`}
        />
      </div>
    </div>
  );
}
