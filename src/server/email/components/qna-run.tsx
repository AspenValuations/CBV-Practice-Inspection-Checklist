import React from "react";
import { COLORS, FONT_STACK } from "./primitives";
import type { Block } from "../blocks";

type RunBlock = Extract<Block, { kind: "run" }>;

export function QnaRun({ block }: { block: RunBlock }) {
  const label = block.label === "N/A" ? "N/A" : "Yes";
  const text =
    block.count === 1
      ? `Q${block.fromQ} · Answered ${label}`
      : `Q${block.fromQ}–Q${block.toQ} · All answered ${label}`;

  return (
    <tr>
      <td style={{ padding: "5px 0", borderBottom: `1px solid ${COLORS.greyLight}` }}>
        <p style={{
          margin: 0,
          fontFamily: FONT_STACK,
          fontSize: 12,
          color: COLORS.muted,
          fontStyle: "italic",
        }}>
          {text}
        </p>
      </td>
    </tr>
  );
}
