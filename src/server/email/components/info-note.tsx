import React from "react";
import { COLORS, FONT_STACK } from "./primitives";

export function InfoNote() {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation"
      style={{ width: "100%", marginBottom: 20 }}>
      <tr>
        <td style={{
          borderLeft: `4px solid ${COLORS.teal}`,
          backgroundColor: "#E6F8FA",
          padding: "12px 16px",
        }}>
          <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 12, color: COLORS.text }}>
            Complete compliance record for this engagement. Non-applicable questions excluded based
            on engagement profile above and noted inline for transparency.
          </p>
        </td>
      </tr>
    </table>
  );
}
