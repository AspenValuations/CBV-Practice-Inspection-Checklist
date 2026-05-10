import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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

describe("mailer transport wiring", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    setBaseEnv();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("defaults to Gmail SMTP host with secure=true on port 465", async () => {
    const { getTransporter } = await import("../mailer");
    const t = getTransporter();
    // nodemailer Transporter exposes options via .options
    const opts = (t as unknown as { options: Record<string, unknown> }).options;
    expect(opts.host).toBe("smtp.gmail.com");
    expect(opts.port).toBe(465);
    expect(opts.secure).toBe(true);
  });

  it("returns the same transporter on repeated calls (singleton)", async () => {
    const { getTransporter } = await import("../mailer");
    const a = getTransporter();
    const b = getTransporter();
    expect(a).toBe(b);
  });

  it("auto-flips secure to false on port 587 when SMTP_SECURE unset", async () => {
    process.env["SMTP_PORT"] = "587";
    const { getTransporter } = await import("../mailer");
    const t = getTransporter();
    const opts = (t as unknown as { options: Record<string, unknown> }).options;
    expect(opts.port).toBe(587);
    expect(opts.secure).toBe(false);
  });

  it("explicit SMTP_SECURE overrides port-based default", async () => {
    process.env["SMTP_PORT"] = "465";
    process.env["SMTP_SECURE"] = "false";
    const { getTransporter } = await import("../mailer");
    const t = getTransporter();
    const opts = (t as unknown as { options: Record<string, unknown> }).options;
    expect(opts.secure).toBe(false);
  });

  it("enables pool when SMTP_POOL=true", async () => {
    process.env["SMTP_POOL"] = "true";
    const { getTransporter } = await import("../mailer");
    const t = getTransporter();
    const opts = (t as unknown as { options: Record<string, unknown> }).options;
    expect(opts.pool).toBe(true);
  });

  it("sendChecklistEmail uses EMAIL_FROM when set, else SMTP_USER", async () => {
    process.env["EMAIL_FROM"] = "Aspen <inspections@aspenval.com>";
    const { sendChecklistEmail, getTransporter } = await import("../mailer");
    const t = getTransporter();
    const sendMock = vi
      .spyOn(t, "sendMail")
      .mockResolvedValue({ messageId: "<test@local>" } as never);

    await sendChecklistEmail({
      to: "rcpt@example.com",
      subject: "subj",
      html: "<p>h</p>",
      text: "h",
      attachments: [{ filename: "a.pdf", content: Buffer.from("pdf") }],
    });

    const callArg = sendMock.mock.calls[0]?.[0] as { from?: string };
    expect(callArg?.from).toBe("Aspen <inspections@aspenval.com>");
  });

  it("sendChecklistEmail falls back to SMTP_USER when EMAIL_FROM unset", async () => {
    const { sendChecklistEmail, getTransporter } = await import("../mailer");
    const t = getTransporter();
    const sendMock = vi
      .spyOn(t, "sendMail")
      .mockResolvedValue({ messageId: "<test@local>" } as never);

    await sendChecklistEmail({
      to: "rcpt@example.com",
      subject: "subj",
      html: "<p>h</p>",
      text: "h",
      attachments: [],
    });

    const callArg = sendMock.mock.calls[0]?.[0] as { from?: string };
    expect(callArg?.from).toBe("smoke@example.com");
  });
});
