import React from "react";
import { COLORS, FONT_STACK } from "./primitives";
import type { Block } from "../blocks";
import type { QPart } from "@/lib/checklist/types";

type NoBlock = Extract<Block, { kind: "no" }>;

function PartsText({ parts }: { parts: QPart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.bold ? (
          <strong key={i} style={{ fontWeight: 700 }}>{p.text}</strong>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

export function QnaNo({ block }: { block: NoBlock }) {
  return (
    <tr>
      <td style={{
        padding: "10px 12px",
        backgroundColor: "#FEF2F2",
        borderLeft: `4px solid ${COLORS.red}`,
        borderBottom: `1px solid #FECACA`,
        verticalAlign: "top",
      }}>
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
          <tr>
            <td width={28} style={{ width: 28, verticalAlign: "top", paddingRight: 8, paddingTop: 1 }}>
              <span style={{
                display: "inline-block",
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: COLORS.red,
                color: COLORS.white,
                textAlign: "center",
                lineHeight: "20px",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: FONT_STACK,
              }}>
                {block.qNumber}
              </span>
            </td>
            <td style={{ verticalAlign: "top" }}>
              <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 12, color: COLORS.text }}>
                <PartsText parts={block.parts} />
              </p>
              <p style={{
                margin: "4px 0 0 0",
                fontFamily: FONT_STACK,
                fontSize: 10,
                fontWeight: 700,
                color: COLORS.white,
                backgroundColor: COLORS.red,
                display: "inline-block",
                padding: "1px 6px",
                borderRadius: 3,
              }}>
                NO
              </p>
              {block.note && (
                <p style={{
                  margin: "4px 0 0 0",
                  fontFamily: FONT_STACK,
                  fontSize: 11,
                  color: COLORS.muted,
                  fontStyle: "italic",
                }}>
                  Note: {block.note}
                </p>
              )}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}
