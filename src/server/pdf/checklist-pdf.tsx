import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { sections } from "@/lib/checklist/data";
import { formatDate } from "@/lib/engagement";
import type { Submission } from "@/lib/checklist/types";
import { styles } from "./styles";

function answerLabel(value: string): string {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return "N/A";
}

interface Props {
  data: Submission;
}

export function ChecklistPdf({ data }: Props) {
  return (
    <Document title="CBV Practice Inspection Checklist" author="Aspen Valuations">
      <Page size="LETTER" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header} fixed>
          <Text style={styles.headerTitle}>CBV Practice Inspection Checklist</Text>
          <Text style={styles.headerSubtitle}>
            Aspen Valuations — Completed Submission
          </Text>
        </View>

        {/* Preparer block */}
        <View style={styles.preparerBlock}>
          <Text style={styles.preparerTitle}>Basic Information</Text>
          <View style={styles.preparerRow}>
            <Text style={styles.preparerLabel}>Preparer&apos;s Name:</Text>
            <Text style={styles.preparerValue}>{data.preparer.name}</Text>
          </View>
          <View style={styles.preparerRow}>
            <Text style={styles.preparerLabel}>Reviewer&apos;s Name:</Text>
            <Text style={styles.preparerValue}>{data.preparer.reviewerName}</Text>
          </View>
          <View style={styles.preparerRow}>
            <Text style={styles.preparerLabel}>Completion Date:</Text>
            <Text style={styles.preparerValue}>
              {formatDate(data.preparer.completionDate)}
            </Text>
          </View>
          <View style={styles.preparerRow}>
            <Text style={styles.preparerLabel}>Valuation Date:</Text>
            <Text style={styles.preparerValue}>
              {formatDate(data.preparer.valuationDate)}
            </Text>
          </View>
          <View style={styles.preparerRow}>
            <Text style={styles.preparerLabel}>Engagement Name:</Text>
            <Text style={styles.preparerValue}>{data.preparer.engagementName}</Text>
          </View>
          <View style={styles.preparerRow}>
            <Text style={styles.preparerLabel}>Recipient Email:</Text>
            <Text style={styles.preparerValue}>{data.preparer.recipientEmail}</Text>
          </View>
        </View>

        {/* Questions */}
        {sections.map((section) => (
          <View key={section.title} wrap={false}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.questions.map((q) => {
              const entry = data.answers[q.id];
              if (!entry) return null;
              const answerStyle =
                entry.value === "yes"
                  ? styles.answerYes
                  : entry.value === "no"
                    ? styles.answerNo
                    : styles.answerNA;
              return (
                <View key={q.id} style={styles.questionRow} wrap={false}>
                  <Text style={styles.questionText}>
                    <Text style={styles.questionNum}>Q{q.number}. </Text>
                    {q.text}
                  </Text>
                  {q.bullets?.map((b, i) => (
                    <Text key={i} style={styles.bulletItem}>
                      &bull; {b}
                    </Text>
                  ))}
                  <View style={styles.answerLine}>
                    <Text style={styles.answerLabel}>Answer:</Text>
                    <Text style={answerStyle}>{answerLabel(entry.value)}</Text>
                  </View>
                  {entry.note && (
                    <Text style={styles.noteLine}>Note: {entry.note}</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {/* Footer */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
        <View style={styles.footer} fixed>
          <Text>Aspen Valuations — CBV Practice Inspection Checklist</Text>
          <Text>Confidential — Internal Use Only</Text>
        </View>
      </Page>
    </Document>
  );
}
