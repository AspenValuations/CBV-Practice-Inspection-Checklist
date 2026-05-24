import { FlagItem } from "./flag-item";
import type { Flag } from "@/lib/checklist/flags";

interface FlaggedListProps {
  flags: Flag[];
}

export function FlaggedList({ flags }: FlaggedListProps) {
  if (flags.length === 0) return null;

  return (
    <div className="rounded-md border border-red-200 divide-y divide-red-100 bg-red-50/40">
      <p className="px-4 py-2 text-xs font-bold text-red-700 uppercase tracking-wide">
        Flagged items ({flags.length})
      </p>
      <div className="px-4">
        {flags.map((flag, i) => (
          <FlagItem key={flag.qId ?? `el-${i}`} flag={flag} index={i} />
        ))}
      </div>
    </div>
  );
}
