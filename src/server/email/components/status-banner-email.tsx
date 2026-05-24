import React from "react";
import { COLORS, FONT_STACK } from "./primitives";

interface StatusBannerEmailProps {
  flagCount: number;
}

export function StatusBannerEmail({ flagCount }: StatusBannerEmailProps) {
  const bg = flagCount > 0 ? COLORS.red : "#16a34a";
  const text =
    flagCount > 0
      ? `⚠ ${flagCount} item${flagCount === 1 ? "" : "s"} flagged — do not issue report until resolved or documented.`
      : "✓ All items satisfactory — safe to issue.";

  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation"
      style={{ width: "100%", marginBottom: 20 }}>
      <tr>
        <td bgcolor={bg}
          style={{ backgroundColor: bg, padding: "12px 16px", borderRadius: 6 }}>
          <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 13, fontWeight: 600,
            color: COLORS.white }}>
            {text}
          </p>
        </td>
      </tr>
    </table>
  );
}
