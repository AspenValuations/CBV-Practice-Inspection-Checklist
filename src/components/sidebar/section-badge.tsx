import { CheckCircle2 } from "lucide-react";
import type { SectionTally } from "@/lib/checklist/tally";

interface SectionBadgeProps {
  stats: Pick<SectionTally, "no" | "unanswered" | "totalActive">;
  compact?: boolean;
}

export function SectionBadge({ stats, compact = false }: SectionBadgeProps) {
  const { no, unanswered, totalActive } = stats;

  if (totalActive === 0) {
    return (
      <span className="text-slate-400 text-xs font-medium" aria-label="No active questions">
        —
      </span>
    );
  }

  if (no > 0) {
    return (
      <span
        className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold"
        aria-label={`${no} no answer${no === 1 ? "" : "s"}`}
      >
        {compact ? no : `${no} No`}
      </span>
    );
  }

  if (unanswered === 0) {
    return (
      <CheckCircle2
        className="h-4 w-4 text-[#05B4C9]"
        aria-label="All questions answered"
      />
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"
      aria-label={`${unanswered} unanswered`}
    >
      {compact ? unanswered : `${unanswered}`}
    </span>
  );
}
