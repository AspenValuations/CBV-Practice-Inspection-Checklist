import React from "react";
import { COLORS, FONT_STACK } from "./primitives";
import { format } from "date-fns";
import type { PrepareInfo, Gates, ConclusionType } from "@/lib/checklist/types";

const CONCLUSION_LABELS: Record<ConclusionType, string> = {
  comprehensive: "Comprehensive",
  estimate: "Estimate",
  calculation: "Calculation",
  ivs_standard: "IVS Standard Report",
};

interface CellData { label: string; value: React.ReactNode; }

function GridCell({ label, value }: CellData) {
  return (
    <td width="33%" style={{ width: "33%", padding: "8px 12px", verticalAlign: "top",
      borderRight: `1px solid ${COLORS.greyLight}` }}>
      <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 9, fontWeight: 700,
        color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </p>
      <p style={{ margin: "3px 0 0 0", fontFamily: FONT_STACK, fontSize: 13,
        fontWeight: 600, color: COLORS.text }}>
        {value}
      </p>
    </td>
  );
}

interface EngagementGridProps {
  preparer: PrepareInfo;
  gates: Gates;
}

export function EngagementGrid({ preparer, gates }: EngagementGridProps) {
  const conclusionLabel = gates.g3ConclusionType
    ? CONCLUSION_LABELS[gates.g3ConclusionType]
    : "—";

  const conclusionCell = (
    <span style={{ display: "inline-block", backgroundColor: COLORS.teal, color: COLORS.white,
      padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {conclusionLabel}
    </span>
  );

  return (
    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation"
      style={{ width: "100%", border: `1px solid ${COLORS.greyLight}`, borderRadius: 6,
        marginBottom: 20, borderCollapse: "collapse" }}>
      <tr style={{ borderBottom: `1px solid ${COLORS.greyLight}` }}>
        <GridCell label="Preparer" value={preparer.name} />
        <GridCell label="Reviewer" value={preparer.reviewerName} />
        <GridCell label="Engagement" value={preparer.engagementName} />
      </tr>
      <tr>
        <GridCell label="Completion Date" value={format(preparer.completionDate, "yyyy-MM-dd")} />
        <GridCell label="Valuation Date" value={format(preparer.valuationDate, "yyyy-MM-dd")} />
        <td width="33%" style={{ width: "33%", padding: "8px 12px", verticalAlign: "top" }}>
          <p style={{ margin: 0, fontFamily: FONT_STACK, fontSize: 9, fontWeight: 700,
            color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Conclusion Type
          </p>
          <p style={{ margin: "5px 0 0 0" }}>{conclusionCell}</p>
        </td>
      </tr>
    </table>
  );
}
