import { format } from "date-fns";

interface BuildEmailSubjectArgs {
  clientName: string;
  submittedAt: Date;
  flaggedCount: number;
}

export function buildEmailSubject({
  clientName,
  submittedAt,
  flaggedCount,
}: BuildEmailSubjectArgs): string {
  const dateStr = format(submittedAt, "MMMM d, yyyy");
  const flagStr = flaggedCount === 0 ? "No items flagged" : `${flaggedCount} item${flaggedCount === 1 ? "" : "s"} flagged`;
  return `${clientName} — CBV Practice Checklist — ${dateStr} — ${flagStr}`;
}
