import { render } from "@react-email/render";
import { createElement } from "react";
import { ChecklistEmail } from "./checklist-email";
import type { ChecklistSection } from "@/lib/checklist/types";

export interface NoAnswer {
  sectionTitle: string;
  number: number;
  text: string;
}

export interface RenderEmailArgs {
  engagementName: string;
  preparerName: string;
  completionDate: string;
  noAnswers: NoAnswer[];
}

export function buildNoAnswersList(
  sections: ChecklistSection[],
  answers: Record<string, { value: string; note?: string }>,
): NoAnswer[] {
  const result: NoAnswer[] = [];
  for (const section of sections) {
    for (const q of section.questions) {
      const entry = answers[q.id];
      if (entry?.value === "no") {
        result.push({
          sectionTitle: section.title,
          number: q.number,
          text: q.text,
        });
      }
    }
  }
  return result;
}

export async function renderChecklistEmail(
  args: RenderEmailArgs,
): Promise<{ html: string; text: string }> {
  const element = createElement(ChecklistEmail, args);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { html, text };
}

export function buildEmailSubject(engagementName: string): string {
  return `Completed CBV Practice Inspection Checklist - ${engagementName}`;
}
