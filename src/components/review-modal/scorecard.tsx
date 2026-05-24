import type { SectionTally } from "@/lib/checklist/tally";

interface ScorecardProps {
  tally: SectionTally;
}

interface TileProps {
  count: number;
  label: string;
  bg: string;
  text: string;
}

function Tile({ count, label, bg, text }: TileProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg p-4 ${bg}`}>
      <span className={`text-3xl font-bold ${text}`}>{count}</span>
      <span className={`text-xs font-medium mt-1 ${text} opacity-80`}>{label}</span>
    </div>
  );
}

export function Scorecard({ tally }: ScorecardProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <Tile count={tally.yes} label="Yes" bg="bg-[#e6f8fb]" text="text-[#05B4C9]" />
      <Tile count={tally.no} label="No / Flagged" bg="bg-red-50" text="text-red-600" />
      <Tile count={tally.na} label="N/A" bg="bg-slate-100" text="text-slate-500" />
      <Tile count={tally.unanswered} label="Unanswered" bg="bg-amber-50" text="text-amber-600" />
    </div>
  );
}
