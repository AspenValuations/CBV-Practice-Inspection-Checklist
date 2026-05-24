import React from "react";
import { COLORS, FONT_STACK } from "./primitives";
import type { SectionTally } from "@/lib/checklist/tally";

interface ScorecardEmailProps {
  tally: SectionTally;
  inactiveCount: number;
}

interface TileProps { count: number; label: string; bg: string; text: string; }

function Tile({ count, label, bg, text }: TileProps) {
  return (
    <td width="25%" style={{ width: "25%", padding: "12px 8px", textAlign: "center",
      backgroundColor: bg }}>
      <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 28, fontWeight: 700, color: text }}>
        {count}
      </p>
      <p style={{ margin: "2px 0 0 0", fontFamily: FONT_STACK, fontSize: 10, color: text, opacity: 0.8 }}>
        {label}
      </p>
    </td>
  );
}

export function ScorecardEmail({ tally, inactiveCount }: ScorecardEmailProps) {
  return (
    <>
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation"
        style={{ width: "100%", marginBottom: 8 }}>
        <tr>
          <Tile count={tally.yes} label="Yes" bg="#e6f8fb" text={COLORS.teal} />
          <Tile count={tally.no} label="No / Flagged" bg={COLORS.redLight} text={COLORS.red} />
          <Tile count={tally.na} label="N/A" bg={COLORS.greyLight} text={COLORS.muted} />
          <Tile count={tally.unanswered} label="Unanswered" bg={COLORS.amberLight} text="#92400e" />
        </tr>
      </table>
      {inactiveCount > 0 && (
        <p style={{ margin: "0 0 16px 0", fontFamily: FONT_STACK, fontSize: 11, color: COLORS.muted,
          textAlign: "center" }}>
          {tally.totalActive} active questions — {inactiveCount} excluded based on engagement profile
        </p>
      )}
    </>
  );
}
