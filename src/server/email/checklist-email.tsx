import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
} from "@react-email/components";

interface NoAnswer {
  sectionTitle: string;
  number: number;
  text: string;
}

interface ChecklistEmailProps {
  engagementName: string;
  preparerName: string;
  reviewerName: string;
  completionDate: string; // formatted yyyy-MM-dd
  valuationDate: string;  // formatted yyyy-MM-dd
  noAnswers: NoAnswer[];
}

export function ChecklistEmail({
  engagementName,
  preparerName,
  reviewerName,
  completionDate,
  valuationDate,
  noAnswers,
}: ChecklistEmailProps) {
  const hasNoAnswers = noAnswers.length > 0;

  // Group noAnswers by sectionTitle preserving order
  const grouped: { title: string; questions: NoAnswer[] }[] = [];
  for (const item of noAnswers) {
    const last = grouped[grouped.length - 1];
    if (last && last.title === item.sectionTitle) {
      last.questions.push(item);
    } else {
      grouped.push({ title: item.sectionTitle, questions: [item] });
    }
  }

  return (
    <Html lang="en">
      <Head />
      <Body
        style={{
          fontFamily: "Arial, sans-serif",
          backgroundColor: "#f9fafb",
          margin: 0,
          padding: "20px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            maxWidth: "600px",
            margin: "0 auto",
            padding: "32px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <Heading
            as="h2"
            style={{
              color: "#1e3a5f",
              fontSize: "18px",
              marginBottom: "8px",
            }}
          >
            CBV Practice Inspection Checklist
          </Heading>
          <Text
            style={{
              color: "#6b7280",
              fontSize: "12px",
              marginTop: 0,
              marginBottom: "20px",
            }}
          >
            Aspen Valuations — Internal
          </Text>
          <Hr style={{ borderColor: "#e5e7eb", marginBottom: "20px" }} />

          {/* Preparer info */}
          <Section
            style={{
              backgroundColor: "#f3f4f6",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <Text style={{ margin: "2px 0", fontSize: "13px" }}>
              <strong>Preparer:</strong> {preparerName}
            </Text>
            <Text style={{ margin: "2px 0", fontSize: "13px" }}>
              <strong>Reviewer:</strong> {reviewerName}
            </Text>
            <Text style={{ margin: "2px 0", fontSize: "13px" }}>
              <strong>Engagement:</strong> {engagementName}
            </Text>
            <Text style={{ margin: "2px 0", fontSize: "13px" }}>
              <strong>Completion Date:</strong> {completionDate}
            </Text>
            <Text style={{ margin: "2px 0", fontSize: "13px" }}>
              <strong>Valuation Date:</strong> {valuationDate}
            </Text>
          </Section>

          {/* Body */}
          {!hasNoAnswers ? (
            <Text
              style={{
                fontSize: "14px",
                color: "#111827",
                lineHeight: "1.6",
              }}
            >
              Preparer has completed the CBV Practice Inspection Checklist for{" "}
              {engagementName}. No &quot;NO&quot; answer was selected.
            </Text>
          ) : (
            <>
              <Text
                style={{
                  fontSize: "14px",
                  color: "#111827",
                  lineHeight: "1.6",
                }}
              >
                Preparer has completed the CBV Practice Inspection Checklist for{" "}
                {engagementName}. Below are the questions with &quot;NO&quot;
                answer.
              </Text>
              {grouped.map((group) => (
                <Section key={group.title} style={{ marginTop: "16px" }}>
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: "12px",
                      color: "#1e3a5f",
                      textTransform: "uppercase",
                      margin: "0 0 6px 0",
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "4px",
                    }}
                  >
                    {group.title}
                  </Text>
                  {group.questions.map((q) => (
                    <Text
                      key={q.number}
                      style={{
                        fontSize: "13px",
                        color: "#374151",
                        margin: "4px 0 4px 12px",
                        lineHeight: "1.5",
                      }}
                    >
                      Q{q.number}. {q.text}
                    </Text>
                  ))}
                </Section>
              ))}
            </>
          )}

          <Hr
            style={{
              borderColor: "#e5e7eb",
              marginTop: "24px",
              marginBottom: "16px",
            }}
          />
          <Text style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>
            The completed CBV Practice Inspection Checklist is attached as a
            PDF.
          </Text>
          <Text
            style={{ fontSize: "11px", color: "#9ca3af", margin: "4px 0 0 0" }}
          >
            Aspen Valuations — Confidential, Internal Use Only
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
