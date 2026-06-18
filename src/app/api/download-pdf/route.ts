export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createElement, type ReactElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { ChecklistPdf } from "@/server/pdf/checklist-pdf";
import type { Gates, PrepareInfo } from "@/lib/checklist/types";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const preparer = (b.preparer ?? {}) as PrepareInfo;
  const gates = (b.gates ?? null) as Gates | null;
  const answers = (b.answers ?? {}) as Record<string, { value?: string; note?: string }>;

  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      createElement(ChecklistPdf, {
        preparer,
        gates,
        answers,
        generatedAt: new Date(),
      }) as ReactElement<DocumentProps>,
    );
  } catch (err) {
    console.error("[download-pdf] render error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }

  const slug =
    ((preparer.engagementName ?? "") as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "checklist";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cbv-checklist-${slug}.pdf"`,
    },
  });
}
