import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { Submission } from "@/lib/checklist/types";
import { createElement } from "react";
import type { ReactElement } from "react";
import { ChecklistPdf } from "./checklist-pdf";

export async function renderChecklistPdf(data: Submission): Promise<Buffer> {
  try {
    const element = createElement(
      ChecklistPdf,
      { data },
    ) as unknown as ReactElement<DocumentProps>;
    const uint8 = await renderToBuffer(element);
    return Buffer.from(uint8);
  } catch (err) {
    throw new Error(
      `PDF generation failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
