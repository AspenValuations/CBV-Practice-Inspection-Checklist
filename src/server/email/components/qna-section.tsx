import React from "react";
import { COLORS, FONT_STACK } from "./primitives";
import { QnaRun } from "./qna-run";
import { QnaNo } from "./qna-no";
import { QnaExclusion } from "./qna-exclusion";
import type { SectionBlocks, Block } from "../blocks";

function BlockRow({ block }: { block: Block }) {
  if (block.kind === "run") return <QnaRun block={block} />;
  if (block.kind === "no") return <QnaNo block={block} />;
  return <QnaExclusion block={block} />;
}

export function QnaSection({ sectionBlocks }: { sectionBlocks: SectionBlocks }) {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation"
      style={{ width: "100%", marginBottom: 16 }}>
      <tr>
        <td style={{
          padding: "8px 0 6px 0",
          borderBottom: `2px solid ${COLORS.green}`,
          marginBottom: 8,
        }}>
          <p style={{
            margin: 0,
            fontFamily: FONT_STACK,
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.green,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            {sectionBlocks.title}
          </p>
        </td>
      </tr>
      {sectionBlocks.blocks.map((block, i) => (
        <BlockRow key={i} block={block} />
      ))}
    </table>
  );
}
