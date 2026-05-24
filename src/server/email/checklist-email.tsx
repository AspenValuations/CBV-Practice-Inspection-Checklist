import React from "react";
import { Html, Head, Body } from "@react-email/components";
import { COLORS, FONT_STACK } from "./components/primitives";
import { Header } from "./components/header";
import { EngagementGrid } from "./components/engagement-grid";
import { ScorecardEmail } from "./components/scorecard-email";
import { StatusBannerEmail } from "./components/status-banner-email";
import { FlaggedItemsEmail } from "./components/flagged-items-email";
import { SignatureBlock } from "./components/signature-block";
import { Footer } from "./components/footer";
import { InfoNote } from "./components/info-note";
import { QnaSection } from "./components/qna-section";
import type { PrepareInfo, Gates } from "@/lib/checklist/types";
import type { SectionTally } from "@/lib/checklist/tally";
import type { Flag } from "@/lib/checklist/flags";
import type { SectionBlocks } from "./blocks";

export interface ChecklistEmailProps {
  preparer: PrepareInfo;
  gates: Gates;
  tally: SectionTally;
  flags: Flag[];
  inactiveCount: number;
  submittedAt: Date;
  sectionBlocks: SectionBlocks[];
}

export function ChecklistEmail({
  preparer,
  gates,
  tally,
  flags,
  inactiveCount,
  submittedAt,
  sectionBlocks,
}: ChecklistEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="x-apple-disable-message-reformatting" content="" />
        {/* MSO 120 DPI fix */}
        {"<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->"}
      </Head>
      <Body
        style={{
          fontFamily: FONT_STACK,
          backgroundColor: "#f4f4f4",
          margin: 0,
          padding: 0,
        }}
      >
        {/* Outer 100%-width table */}
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          role="presentation"
          style={{ width: "100%", backgroundColor: "#f4f4f4" }}
        >
          <tr>
            <td align="center" style={{ padding: "20px 0" }}>
              {/* 640px container */}
              <table
                width={640}
                cellPadding={0}
                cellSpacing={0}
                role="presentation"
                style={{ width: 640, backgroundColor: COLORS.white, borderRadius: 8,
                  overflow: "hidden" }}
              >
                {/* HEADER */}
                <tr>
                  <td>
                    <Header reviewerName={preparer.reviewerName} submittedAt={submittedAt} />
                  </td>
                </tr>

                {/* PART 1 — Summary */}
                <tr>
                  <td style={{ padding: "24px 32px" }}>
                    <p style={{ margin: "0 0 16px 0", fontFamily: FONT_STACK, fontSize: 14,
                      fontWeight: 700, color: COLORS.green }}>
                      Part 1 — Submission Summary
                    </p>

                    <EngagementGrid preparer={preparer} gates={gates} />
                    <ScorecardEmail tally={tally} inactiveCount={inactiveCount} />
                    <StatusBannerEmail flagCount={flags.length} />
                    {flags.length > 0 && <FlaggedItemsEmail flags={flags} />}
                    <SignatureBlock reviewerName={preparer.reviewerName} />
                  </td>
                </tr>

                {/* Teal divider */}
                <tr>
                  <td
                    height={4}
                    bgcolor={COLORS.teal}
                    style={{ height: 4, backgroundColor: COLORS.teal }}
                  />
                </tr>

                {/* PART 2 — Full Q&A record */}
                <tr>
                  <td style={{ padding: "24px 32px" }}>
                    <p style={{ margin: "0 0 12px 0", fontFamily: FONT_STACK, fontSize: 14,
                      fontWeight: 700, color: COLORS.green }}>
                      Part 2 — Complete Q&amp;A Record
                    </p>
                    <InfoNote />
                    {sectionBlocks.map((sb, i) => (
                      <QnaSection key={i} sectionBlocks={sb} />
                    ))}
                  </td>
                </tr>

                {/* FOOTER */}
                <tr>
                  <td>
                    <Footer submittedAt={submittedAt} />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </Body>
    </Html>
  );
}
