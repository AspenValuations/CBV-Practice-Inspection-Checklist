import React from "react";
import { COLORS, FONT_STACK } from "./primitives";

interface SignatureBlockProps {
  reviewerName: string;
}

export function SignatureBlock({ reviewerName }: SignatureBlockProps) {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation"
      style={{ width: "100%", borderTop: `1px solid ${COLORS.greyLight}`, paddingTop: 20, marginTop: 20 }}>
      <tr>
        <td width="50%" style={{ width: "50%", verticalAlign: "top", padding: "12px 0" }}>
          <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 10, color: COLORS.muted,
            textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Completed by
          </p>
          <p style={{ margin: "4px 0 0 0", fontFamily: FONT_STACK, fontSize: 13,
            fontWeight: 600, color: COLORS.text }}>
            {reviewerName}
          </p>
          <p style={{ margin: "2px 0 0 0", fontFamily: FONT_STACK, fontSize: 11,
            color: COLORS.muted }}>
            Reviewer · Aspen Valuations
          </p>
        </td>
        <td width="50%" style={{ width: "50%", verticalAlign: "top", padding: "12px 0 12px 16px",
          borderLeft: `1px solid ${COLORS.greyLight}` }}>
          <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 10, color: COLORS.muted,
            textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Retention (PS 130)
          </p>
          <p style={{ margin: "4px 0 0 0", fontFamily: FONT_STACK, fontSize: 11,
            color: COLORS.muted, lineHeight: "1.5" }}>
            Save this email to the client file. PS 130 requires a minimum 5-year retention of all
            working papers, including this checklist.
          </p>
        </td>
      </tr>
    </table>
  );
}
