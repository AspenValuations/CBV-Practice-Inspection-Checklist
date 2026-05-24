import React from "react";
import { COLORS, FONT_STACK } from "./primitives";
import type { Block } from "../blocks";

type ExclusionBlock = Extract<Block, { kind: "exclusion" }>;

export function QnaExclusion({ block }: { block: ExclusionBlock }) {
  const qList = block.qNumbers.map((n) => `Q${n}`).join(", ");

  return (
    <tr>
      <td style={{
        padding: "8px 12px",
        backgroundColor: COLORS.greyLight,
        borderBottom: `1px solid #E5E7EB`,
        color: COLORS.muted,
      }}>
        <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 11, color: COLORS.muted }}>
          <span style={{ fontWeight: 600 }}>Not applicable — excluded</span>
          {" "}({qList})
        </p>
        <p style={{
          margin: "2px 0 0 0",
          fontFamily: FONT_STACK,
          fontSize: 11,
          color: COLORS.muted,
          fontStyle: "italic",
        }}>
          {block.gateReason}
        </p>
      </td>
    </tr>
  );
}
