import type { ChecklistSection, Gates, QPart } from "@/lib/checklist/types";
import { inactiveReason } from "@/lib/checklist/gates";

export type Block =
  | { kind: "run"; label: "Yes" | "N/A"; fromQ: number; toQ: number; count: number }
  | { kind: "no"; qId: string; qNumber: number; parts: QPart[]; note?: string }
  | { kind: "exclusion"; qNumbers: number[]; qIds: string[]; gateReason: string };

export interface SectionBlocks {
  title: string;
  blocks: Block[];
}

interface RunAccum {
  label: "Yes" | "N/A";
  fromQ: number;
  toQ: number;
  count: number;
}

interface ExclusionItem {
  qId: string;
  qNumber: number;
  gateReason: string;
}

function flushRun(run: RunAccum | null, out: Block[]): void {
  if (!run) return;
  out.push({ kind: "run", label: run.label, fromQ: run.fromQ, toQ: run.toQ, count: run.count });
}

function flushExclusions(buf: ExclusionItem[], out: Block[]): void {
  if (buf.length === 0) return;
  let i = 0;
  while (i < buf.length) {
    const reason = buf[i]!.gateReason;
    const qIds: string[] = [];
    const qNumbers: number[] = [];
    while (i < buf.length && buf[i]!.gateReason === reason) {
      qIds.push(buf[i]!.qId);
      qNumbers.push(buf[i]!.qNumber);
      i++;
    }
    out.push({ kind: "exclusion", qIds, qNumbers, gateReason: reason });
  }
}

export function buildBlocks(
  sections: ChecklistSection[],
  answers: Record<string, { value?: string; note?: string } | undefined>,
  gates: Gates | null,
  inactive: Set<string>,
): SectionBlocks[] {
  return sections.map((section) => {
    const blocks: Block[] = [];
    let run: RunAccum | null = null;
    let exclusionBuf: ExclusionItem[] = [];

    for (const q of section.questions) {
      const ans = answers[q.id];
      const value = ans?.value ?? "";
      const note = ans?.note;

      if (inactive.has(q.id)) {
        flushRun(run, blocks);
        run = null;
        const reason = inactiveReason(q.id, gates) ?? "Not applicable";
        exclusionBuf.push({ qId: q.id, qNumber: q.number, gateReason: reason });
      } else {
        flushExclusions(exclusionBuf, blocks);
        exclusionBuf = [];

        if (value === "no") {
          flushRun(run, blocks);
          run = null;
          blocks.push({
            kind: "no",
            qId: q.id,
            qNumber: q.number,
            parts: q.parts,
            ...(note ? { note } : {}),
          });
        } else {
          const label: "Yes" | "N/A" = value === "na" ? "N/A" : "Yes";
          if (run && run.label === label) {
            run.toQ = q.number;
            run.count++;
          } else {
            flushRun(run, blocks);
            run = { label, fromQ: q.number, toQ: q.number, count: 1 };
          }
        }
      }
    }

    flushRun(run, blocks);
    flushExclusions(exclusionBuf, blocks);

    return { title: section.title, blocks };
  });
}
