import type { ConclusionType } from "@/lib/checklist/types";

const LABELS: Record<ConclusionType, string> = {
  comprehensive: "Comprehensive",
  estimate: "Estimate",
  calculation: "Calculation",
  ivs_standard: "IVS Standard Report",
};

interface ConclusionBadgeProps {
  conclusionType: ConclusionType | null;
}

export function ConclusionBadge({ conclusionType }: ConclusionBadgeProps) {
  if (!conclusionType) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">Conclusion type:</span>
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#05B4C9] text-white">
        {LABELS[conclusionType]}
      </span>
    </div>
  );
}
