import { notFound } from "next/navigation";
import { sections } from "@/lib/checklist/data";
import { formatDate } from "@/lib/engagement";
import { buildNoAnswersList, renderChecklistEmail } from "@/server/email/render";
import {
  buildSubmission,
  type FixtureName,
} from "../../../../scripts/fixtures/submissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PageProps {
  searchParams: Promise<{ case?: string }>;
}

export default async function PreviewEmailPage({ searchParams }: PageProps) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const requested = params.case === "empty" ? "empty" : "with-no";
  const fixture: FixtureName = requested;
  const submission = buildSubmission(fixture);

  const noAnswers = buildNoAnswersList(sections, submission.answers);
  const { html } = await renderChecklistEmail({
    engagementName: submission.preparer.engagementName,
    preparerName: submission.preparer.name,
    reviewerName: submission.preparer.reviewerName,
    completionDate: formatDate(submission.preparer.completionDate),
    valuationDate: formatDate(submission.preparer.valuationDate),
    noAnswers,
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "16px" }}>
      <h1 style={{ fontSize: "18px", margin: "0 0 8px 0" }}>
        Email preview ({fixture})
      </h1>
      <nav style={{ marginBottom: "12px", fontSize: "14px" }}>
        <a
          href="/preview-email?case=empty"
          style={{
            marginRight: "12px",
            fontWeight: fixture === "empty" ? "bold" : "normal",
          }}
        >
          empty (0 No)
        </a>
        <a
          href="/preview-email?case=with-no"
          style={{ fontWeight: fixture === "with-no" ? "bold" : "normal" }}
        >
          with-no (5 No across ≥3 sections)
        </a>
      </nav>
      <iframe
        srcDoc={html}
        style={{
          width: "100%",
          height: "calc(100vh - 120px)",
          border: "1px solid #e5e7eb",
          background: "#fff",
        }}
        title={`Email preview: ${fixture}`}
      />
    </div>
  );
}
