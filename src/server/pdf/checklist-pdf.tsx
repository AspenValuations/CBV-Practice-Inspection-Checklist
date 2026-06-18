import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { sections } from "@/lib/checklist/data";
import { partsToString } from "@/lib/checklist/bolding";
import { tallyAll } from "@/lib/checklist/tally";
import { buildFlaggedItems } from "@/lib/checklist/flags";
import { computeInactiveSet } from "@/lib/checklist/gates";
import type { PrepareInfo, Gates } from "@/lib/checklist/types";

const DG = "#1A322F";
const RED = "#dc2626";
const GREEN = "#166534";
const AMBER = "#92400e";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    paddingTop: 36,
    paddingBottom: 44,
    paddingLeft: 44,
    paddingRight: 44,
    color: "#111827",
  },
  hdrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: DG,
    borderBottomStyle: "solid",
    marginBottom: 14,
  },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", color: DG },
  subtitle: { fontSize: 7.5, color: "#6b7280", marginTop: 2 },
  hdrOrg: { fontSize: 7.5, color: "#6b7280" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  infoCell: { width: "50%", flexDirection: "row", marginBottom: 3 },
  infoLbl: { width: 85, fontSize: 7.5, color: "#6b7280" },
  infoVal: { flex: 1, fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  scoreRow: { flexDirection: "row", marginBottom: 12 },
  scoreBox: { flex: 1, paddingVertical: 5, paddingHorizontal: 6, borderRadius: 3, alignItems: "center", marginRight: 6 },
  scoreBoxLast: { flex: 1, paddingVertical: 5, paddingHorizontal: 6, borderRadius: 3, alignItems: "center" },
  scoreNum: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  scoreLbl: { fontSize: 6.5, color: "#6b7280", marginTop: 1 },
  boxY: { backgroundColor: "#dcfce7" },
  boxN: { backgroundColor: "#fee2e2" },
  boxNa: { backgroundColor: "#fef9c3" },
  boxU: { backgroundColor: "#f1f5f9" },
  numY: { color: GREEN },
  numN: { color: RED },
  numNa: { color: AMBER },
  numU: { color: "#64748b" },
  flagsWrap: {
    borderLeftWidth: 3,
    borderLeftColor: RED,
    borderLeftStyle: "solid",
    paddingLeft: 8,
    marginBottom: 12,
  },
  flagHdr: { fontSize: 9, fontFamily: "Helvetica-Bold", color: RED, marginBottom: 3 },
  flagText: { fontSize: 7.5, color: "#7f1d1d", marginBottom: 2 },
  flagNote: { fontSize: 7, color: "#9f1239", fontStyle: "italic", paddingLeft: 10, marginBottom: 2 },
  secTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    backgroundColor: DG,
    paddingVertical: 3,
    paddingHorizontal: 7,
    marginTop: 8,
    marginBottom: 2,
  },
  qRow: {
    flexDirection: "row",
    paddingVertical: 1.5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    borderBottomStyle: "solid",
  },
  qNum: { width: 24, fontSize: 7.5, color: "#9ca3af" },
  qTxt: { flex: 1, fontSize: 7.5, paddingRight: 4 },
  qAns: { width: 48, textAlign: "right", fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  qNote: { fontSize: 7, color: "#4b5563", fontStyle: "italic", marginLeft: 24, marginBottom: 1 },
  ansY: { color: GREEN },
  ansN: { color: RED },
  ansNa: { color: AMBER },
  ansBlank: { color: "#9ca3af", fontFamily: "Helvetica" },
  ansExcl: { color: "#d1d5db", fontFamily: "Helvetica", fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
    paddingTop: 4,
  },
  footerTxt: { fontSize: 6.5, color: "#9ca3af" },
});

export interface ChecklistPdfProps {
  preparer: PrepareInfo;
  gates: Gates | null;
  answers: Record<string, { value?: string; note?: string } | undefined>;
  generatedAt: Date;
}

function fmtDate(d: unknown): string {
  if (!d) return "—";
  try {
    return new Date(d as string).toLocaleDateString("en-CA");
  } catch {
    return "—";
  }
}

function qAnsStyle(value: string | undefined, excluded: boolean) {
  if (excluded) return s.ansExcl;
  if (value === "yes") return s.ansY;
  if (value === "no") return s.ansN;
  if (value === "na") return s.ansNa;
  return s.ansBlank;
}

function qAnsText(value: string | undefined, excluded: boolean): string {
  if (excluded) return "Excluded";
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  if (value === "na") return "N/A";
  return "—";
}

export function ChecklistPdf({ preparer, gates, answers, generatedAt }: ChecklistPdfProps) {
  const inactive = computeInactiveSet(gates);
  const tally = tallyAll(sections, answers, inactive);
  const flags = buildFlaggedItems(sections, answers, gates, inactive);

  const scoreItems = [
    { count: tally.yes, label: "Yes", box: s.boxY, num: s.numY, last: false },
    { count: tally.no, label: "No", box: s.boxN, num: s.numN, last: false },
    { count: tally.na, label: "N/A", box: s.boxNa, num: s.numNa, last: false },
    { count: tally.unanswered, label: "Unanswered", box: s.boxU, num: s.numU, last: true },
  ];

  return (
    <Document title={`CBV Checklist — ${preparer.engagementName}`} author="Aspen Valuations">
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.hdrRow}>
          <View>
            <Text style={s.title}>CBV Practice Inspection Checklist</Text>
            <Text style={s.subtitle}>Effective 2026-01-01 · CBV Institute</Text>
          </View>
          <Text style={s.hdrOrg}>Aspen Valuations</Text>
        </View>

        {/* Engagement info */}
        <View style={s.infoGrid}>
          <View style={s.infoCell}>
            <Text style={s.infoLbl}>Engagement:</Text>
            <Text style={s.infoVal}>{preparer.engagementName || "—"}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLbl}>Preparer:</Text>
            <Text style={s.infoVal}>{preparer.name || "—"}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLbl}>Reviewer:</Text>
            <Text style={s.infoVal}>{preparer.reviewerName || "—"}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLbl}>Completion Date:</Text>
            <Text style={s.infoVal}>{fmtDate(preparer.completionDate)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLbl}>Valuation Date:</Text>
            <Text style={s.infoVal}>{fmtDate(preparer.valuationDate)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLbl}>Generated:</Text>
            <Text style={s.infoVal}>{fmtDate(generatedAt)}</Text>
          </View>
        </View>

        {/* Scorecard */}
        <View style={s.scoreRow}>
          {scoreItems.map(({ count, label, box, num, last }) => (
            <View key={label} style={[last ? s.scoreBoxLast : s.scoreBox, box]}>
              <Text style={[s.scoreNum, num]}>{count}</Text>
              <Text style={s.scoreLbl}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Flagged items */}
        {flags.length > 0 && (
          <View style={s.flagsWrap}>
            <Text style={s.flagHdr}>
              {flags.length} Flagged Item{flags.length !== 1 ? "s" : ""}
            </Text>
            {flags.map((f, i) => (
              <View key={i}>
                <Text style={s.flagText}>
                  {f.qNumber != null ? `Q${f.qNumber}. ` : ""}
                  {f.parts ? partsToString(f.parts) : f.actionLine}
                </Text>
                {f.note ? <Text style={s.flagNote}>{f.note}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Q&A log */}
        {sections.map((section) => (
          <View key={section.title}>
            <Text style={s.secTitle}>{section.title}</Text>
            {section.questions.map((q) => {
              const excl = inactive.has(q.id);
              const entry = answers[q.id];
              const val = entry?.value;
              return (
                <View key={q.id}>
                  <View style={s.qRow}>
                    <Text style={s.qNum}>Q{q.number}</Text>
                    <Text style={s.qTxt}>{partsToString(q.parts)}</Text>
                    <Text style={[s.qAns, qAnsStyle(val, excl)]}>
                      {qAnsText(val, excl)}
                    </Text>
                  </View>
                  {!excl && val === "no" && entry?.note ? (
                    <Text style={s.qNote}>{entry.note}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}

        {/* Footer — fixed on every page */}
        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>
            CBV Practice Inspection Checklist · Aspen Valuations · Confidential
          </Text>
          <Text
            style={s.footerTxt}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
