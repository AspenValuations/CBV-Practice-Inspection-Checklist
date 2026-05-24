import React from "react";
import { COLORS, FONT_STACK } from "./primitives";
import { format } from "date-fns";

interface HeaderProps {
  reviewerName: string;
  submittedAt: Date;
}

export function Header({ reviewerName, submittedAt }: HeaderProps) {
  const dateStr = format(submittedAt, "MMMM d, yyyy");
  const timeStr = format(submittedAt, "h:mm a");

  return (
    <table width={640} cellPadding={0} cellSpacing={0} role="presentation"
      style={{ width: "100%", backgroundColor: COLORS.green }}>
      <tr>
        {/* Left: branding */}
        <td style={{ padding: "24px 32px", verticalAlign: "top" }}>
          <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 20, fontWeight: 700,
            letterSpacing: "0.08em", color: COLORS.white }}>
            ASPEN VALUATIONS
          </p>
          <p style={{ margin: "2px 0 0 0", fontFamily: FONT_STACK, fontSize: 11,
            color: COLORS.teal, fontStyle: "italic" }}>
            Know Your Worth
          </p>
          <p style={{ margin: "10px 0 0 0", fontFamily: FONT_STACK, fontSize: 13,
            fontWeight: 600, color: COLORS.white }}>
            CBV Practice Inspection Checklist
          </p>
          <p style={{ margin: "4px 0 0 0", fontFamily: FONT_STACK, fontSize: 10,
            color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>
            PS 100 · PS 110 · PS 120 · PS 130
          </p>
        </td>
        {/* Right: meta */}
        <td style={{ padding: "24px 32px", verticalAlign: "top", textAlign: "right" }}>
          <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
            Submitted
          </p>
          <p style={{ margin: "2px 0 0 0", fontFamily: FONT_STACK, fontSize: 13,
            fontWeight: 600, color: COLORS.white }}>
            {dateStr}
          </p>
          <p style={{ margin: "2px 0 0 0", fontFamily: FONT_STACK, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
            {timeStr} MT
          </p>
          <p style={{ margin: "10px 0 0 0", fontFamily: FONT_STACK, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
            Reviewer
          </p>
          <p style={{ margin: "2px 0 0 0", fontFamily: FONT_STACK, fontSize: 12,
            fontWeight: 600, color: COLORS.white }}>
            {reviewerName}
          </p>
        </td>
      </tr>
    </table>
  );
}
