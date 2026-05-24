import { render } from "@react-email/render";
import { createElement } from "react";
import { ChecklistEmail } from "./checklist-email";
import { sections } from "@/lib/checklist/data";
import { computeInactiveSet } from "@/lib/checklist/gates";
import { tallyAll } from "@/lib/checklist/tally";
import { buildFlaggedItems } from "@/lib/checklist/flags";
import { buildBlocks } from "./blocks";
import { buildEmailSubject } from "./subject";
import type { PrepareInfo, Gates } from "@/lib/checklist/types";

export interface RenderEmailArgs {
  preparer: PrepareInfo;
  gates: Gates;
  answers: Record<string, { value?: string; note?: string } | undefined>;
  submittedAt: Date;
}

export async function renderChecklistEmail(
  args: RenderEmailArgs,
): Promise<{ html: string; text: string; subject: string }> {
  const { preparer, gates, answers, submittedAt } = args;

  const inactive = computeInactiveSet(gates);
  const tally = tallyAll(sections, answers as Record<string, { value?: string }>, inactive);
  const flags = buildFlaggedItems(
    sections,
    answers as Record<string, { value?: string; note?: string }>,
    gates,
    inactive,
  );
  const sectionBlocks = buildBlocks(
    sections,
    answers as Record<string, { value?: string; note?: string }>,
    gates,
    inactive,
  );

  const subject = buildEmailSubject({
    clientName: preparer.engagementName,
    submittedAt,
    flaggedCount: flags.length,
  });

  const element = createElement(ChecklistEmail, {
    preparer,
    gates,
    tally,
    flags,
    inactiveCount: inactive.size,
    submittedAt,
    sectionBlocks,
  });

  const html = await render(element);
  const text = await render(element, { plainText: true });

  return { html, text, subject };
}
