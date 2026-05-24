import React from "react";
import { COLORS, FONT_STACK } from "./primitives";
import { partsToString } from "@/lib/checklist/bolding";
import type { Flag } from "@/lib/checklist/flags";

interface FlaggedItemsEmailProps {
  flags: Flag[];
}

function FlagRow({ flag, index }: { flag: Flag; index: number }) {
  const label =
    flag.kind === "engagement-letter"
      ? "Engagement Letter"
      : `Q${flag.qNumber}`;
  const text =
    flag.kind === "engagement-letter"
      ? "No signed engagement letter obtained."
      : flag.parts
        ? partsToString(flag.parts)
        : "";

  return (
    <tr>
      <td style={{ padding: "10px 0", borderBottom: `1px solid ${COLORS.redLight}`,
        verticalAlign: "top" }}>
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
          <tr>
            <td width={32} style={{ width: 32, verticalAlign: "top", paddingRight: 10 }}>
              <span style={{ display: "inline-block", width: 22, height: 22,
                borderRadius: "50%", backgroundColor: COLORS.red, color: COLORS.white,
                textAlign: "center", lineHeight: "22px", fontSize: 11, fontWeight: 700,
                fontFamily: FONT_STACK }}>
                {index + 1}
              </span>
            </td>
            <td style={{ verticalAlign: "top" }}>
              <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 11, color: COLORS.muted }}>
                {label}
              </p>
              <p style={{ margin: "2px 0 0 0", fontFamily: FONT_STACK, fontSize: 13,
                color: COLORS.text }}>
                {text}
              </p>
              {flag.note && (
                <p style={{ margin: "3px 0 0 0", fontFamily: FONT_STACK, fontSize: 11,
                  color: COLORS.muted, fontStyle: "italic" }}>
                  Note: {flag.note}
                </p>
              )}
              <p style={{ margin: "4px 0 0 0", fontFamily: FONT_STACK, fontSize: 11,
                fontWeight: 700, color: COLORS.red }}>
                {flag.actionLine}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}

export function FlaggedItemsEmail({ flags }: FlaggedItemsEmailProps) {
  if (flags.length === 0) return null;

  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation"
      style={{ width: "100%", marginBottom: 20, border: `1px solid ${COLORS.redLight}`,
        borderRadius: 6 }}>
      <tr>
        <td bgcolor={COLORS.redLight} style={{ backgroundColor: COLORS.redLight, padding: "8px 16px" }}>
          <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 10, fontWeight: 700,
            color: COLORS.red, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Flagged Items ({flags.length})
          </p>
        </td>
      </tr>
      <tr>
        <td style={{ padding: "0 16px" }}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            {flags.map((flag, i) => (
              <FlagRow key={flag.qId ?? `el-${i}`} flag={flag} index={i} />
            ))}
          </table>
        </td>
      </tr>
    </table>
  );
}
