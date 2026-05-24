import { QuestionText } from "@/components/question-row/question-text";
import type { Flag } from "@/lib/checklist/flags";

interface FlagItemProps {
  flag: Flag;
  index: number;
}

export function FlagItem({ flag, index }: FlagItemProps) {
  if (flag.kind === "engagement-letter") {
    return (
      <div className="flex gap-3 py-3 border-b border-red-100 last:border-b-0">
        <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Engagement Letter</p>
          <p className="text-xs text-red-700 font-bold mt-1">{flag.actionLine}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-3 border-b border-red-100 last:border-b-0">
      <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">
          {flag.sectionTitle ? flag.sectionTitle.slice(0, 20) + "…" : "—"} · Q{flag.qNumber}
        </p>
        <p className="text-sm text-slate-800 leading-snug">
          {flag.parts && <QuestionText parts={flag.parts} />}
        </p>
        {flag.note && (
          <p className="text-xs text-slate-500 italic mt-1">Note: {flag.note}</p>
        )}
        <p className="text-xs text-red-700 font-bold mt-1">{flag.actionLine}</p>
      </div>
    </div>
  );
}
