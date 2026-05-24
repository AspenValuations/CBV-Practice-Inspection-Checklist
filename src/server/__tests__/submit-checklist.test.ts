import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sections } from "@/lib/checklist/data";
import type { Submission } from "@/lib/checklist/types";
import { DEFAULT_GATES } from "@/lib/checklist/gates";

const ORIGINAL_ENV = { ...process.env };

function setBaseEnv() {
  process.env["SMTP_USER"] = "smoke@example.com";
  process.env["SMTP_PASS"] = "abcdabcdabcdabcd";
  process.env["BASIC_AUTH_USER"] = "u";
  process.env["BASIC_AUTH_PASS"] = "p";
  delete process.env["SMTP_HOST"];
  delete process.env["SMTP_PORT"];
  delete process.env["SMTP_SECURE"];
  delete process.env["SMTP_POOL"];
  delete process.env["EMAIL_FROM"];
}

function buildValidInput(overrides?: {
  engagementName?: string;
  noOnQuestionId?: string;
}): unknown {
  const answers: Record<string, { value: string; note?: string }> = {};
  for (const s of sections) {
    for (const q of s.questions) {
      answers[q.id] = { value: q.allowsNA ? "na" : "yes" };
    }
  }
  if (overrides?.noOnQuestionId) {
    answers[overrides.noOnQuestionId] = { value: "no" };
  }
  return {
    preparer: {
      name: "Alice",
      reviewerName: "Bob",
      engagementName: overrides?.engagementName ?? "Acme Corp",
      recipientEmail: "rcpt@example.com",
      completionDate: new Date("2026-05-10T00:00:00Z"),
      valuationDate: new Date("2026-04-30T00:00:00Z"),
    },
    // gates intentionally omitted — Zod fills in DEFAULT_GATES (all null)
    answers,
  };
}

describe("submitChecklist", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    setBaseEnv();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("returns validation error when input is malformed", async () => {
    const { submitChecklist } = await import("../submit-checklist");
    const result = await submitChecklist({ garbage: true });
    expect(result).toEqual({
      ok: false,
      error: "Validation failed. Please check all fields.",
    });
  });

  it("returns validation error for invalid recipient email", async () => {
    const input = buildValidInput() as { preparer: { recipientEmail: string } };
    input.preparer.recipientEmail = "not-an-email";
    const { submitChecklist } = await import("../submit-checklist");
    const result = await submitChecklist(input);
    expect(result).toEqual({
      ok: false,
      error: "Validation failed. Please check all fields.",
    });
  });

  it("happy path: renders email and sends without PDF attachment, returns ok", async () => {
    const sendSpy = vi.fn().mockResolvedValue({ messageId: "<id@local>" });
    vi.doMock("../mailer", () => ({
      sendChecklistEmail: sendSpy,
    }));

    const { submitChecklist } = await import("../submit-checklist");
    const result = await submitChecklist(
      buildValidInput({ engagementName: `Happy ${Date.now()}` }),
    );

    expect(result).toMatchObject({ ok: true });
    expect(sendSpy).toHaveBeenCalledTimes(1);
    const arg = sendSpy.mock.calls[0]?.[0] as {
      to: string;
      subject: string;
      attachments: unknown[];
      html: string;
      text: string;
    };
    expect(arg.to).toBe("rcpt@example.com");
    expect(arg.subject).toMatch(/CBV Practice Checklist/);
    expect(arg.attachments).toHaveLength(0); // no PDF
    expect(arg.html.length).toBeGreaterThan(0);
    expect(arg.text.length).toBeGreaterThan(0);
  });

  it("dedupe: second identical submit silently succeeds without re-sending", async () => {
    const sendSpy = vi.fn().mockResolvedValue({ messageId: "<id@local>" });
    vi.doMock("../mailer", () => ({ sendChecklistEmail: sendSpy }));

    const { submitChecklist } = await import("../submit-checklist");
    const dedupeName = `Dedupe ${Date.now()}`;
    const r1 = await submitChecklist(
      buildValidInput({ engagementName: dedupeName }),
    );
    const r2 = await submitChecklist(
      buildValidInput({ engagementName: dedupeName }),
    );

    expect(r1).toMatchObject({ ok: true });
    expect(r2).toMatchObject({ ok: true });
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it("returns SMTP error and logs sanitised fields when sendChecklistEmail throws", async () => {
    const smtpErr = Object.assign(new Error("Invalid login: 535-5.7.8"), {
      code: "EAUTH",
      command: "AUTH PLAIN",
      responseCode: 535,
      response: "535-5.7.8 Username and Password not accepted",
    });
    vi.doMock("../mailer", () => ({
      sendChecklistEmail: vi.fn().mockRejectedValue(smtpErr),
    }));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { submitChecklist } = await import("../submit-checklist");
    const result = await submitChecklist(
      buildValidInput({ engagementName: `Smtp-fail ${Date.now()}` }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Email delivery failed. Please retry.",
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      "[submitChecklist] SMTP send failed:",
      {
        code: "EAUTH",
        command: "AUTH PLAIN",
        responseCode: 535,
        response: "535-5.7.8 Username and Password not accepted",
        message: "Invalid login: 535-5.7.8",
      },
    );
    const loggedArg = consoleSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(loggedArg).not.toHaveProperty("stack");
    expect(JSON.stringify(loggedArg)).not.toContain("abcdabcdabcdabcd");
  });

  it("happy path: subject embeds the raw engagement name (not slug)", async () => {
    const sendSpy = vi.fn().mockResolvedValue({ messageId: "<id@local>" });
    vi.doMock("../mailer", () => ({ sendChecklistEmail: sendSpy }));

    const rawName = `Big Co. (Q1) ${Date.now()}`;
    const { submitChecklist } = await import("../submit-checklist");
    const result = await submitChecklist(
      buildValidInput({ engagementName: rawName }),
    );
    expect(result).toMatchObject({ ok: true });
    const arg = sendSpy.mock.calls[0]?.[0] as { subject: string };
    // Subject contains raw engagement name (not slugified) and the new format
    expect(arg.subject).toContain(rawName);
    expect(arg.subject).toContain("CBV Practice Checklist");
  });

  it("happy path with one 'no' answer: email body lists it", async () => {
    const sendSpy = vi.fn().mockResolvedValue({ messageId: "<id@local>" });
    vi.doMock("../mailer", () => ({ sendChecklistEmail: sendSpy }));

    const { submitChecklist } = await import("../submit-checklist");
    const result = await submitChecklist(
      buildValidInput({
        engagementName: `One-no ${Date.now()}`,
        noOnQuestionId: "q1",
      }),
    );
    expect(result).toMatchObject({ ok: true });
    const arg = sendSpy.mock.calls[0]?.[0] as { html: string; text: string; subject: string };
    // Subject should flag 1 item
    expect(arg.subject).toContain("1 item flagged");
    // HTML should contain Q1 in flagged items
    expect(arg.html).toContain("Q1");
  });
});

// Type guard: confirm Submission shape stays compatible (compile-time + runtime)
describe("Submission type", () => {
  it("can construct a valid Submission from sections walk", () => {
    const submission: Submission = {
      preparer: {
        name: "x",
        reviewerName: "y",
        engagementName: "z",
        recipientEmail: "a@b.c",
        completionDate: new Date(),
        valuationDate: new Date(),
      },
      gates: { ...DEFAULT_GATES },
      answers: Object.fromEntries(
        sections.flatMap((s) =>
          s.questions.map((q) => [
            q.id,
            { value: q.allowsNA ? ("na" as const) : ("yes" as const) },
          ]),
        ),
      ),
    };
    expect(Object.keys(submission.answers).length).toBe(83);
  });
});
