import React from "react";
import { COLORS, FONT_STACK } from "./primitives";

export function QnaPlaceholder() {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation"
      style={{ width: "100%" }}>
      <tr>
        <td style={{ padding: "24px 32px" }}>
          <p style={{ margin: "0 0 8px 0", fontFamily: FONT_STACK, fontSize: 14, fontWeight: 700,
            color: COLORS.green }}>
            Part 2 — Complete Q&amp;A Record
          </p>
          <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 12, color: COLORS.muted,
            fontStyle: "italic" }}>
            Full question-by-question log rendering below.
          </p>
        </td>
      </tr>
    </table>
  );
}
