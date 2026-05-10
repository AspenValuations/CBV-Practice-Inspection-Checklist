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

  it("explicit SMTP_SECURE=false overrides port-based default on 465", async () => {
    process.env["SMTP_PORT"] = "465";
    process.env["SMTP_SECURE"] = "false";
    const { getTransporter } = await import("../mailer");
    const t = getTransporter();
    const opts = (t as unknown as { options: Record<string, unknown> }).options;
    expect(opts.secure).toBe(false);
  });

  it("explicit SMTP_SECURE=true overrides port-based default on 587", async () => {
    process.env["SMTP_PORT"] = "587";
    process.env["SMTP_SECURE"] = "true";
    const { getTransporter } = await import("../mailer");
    const t = getTransporter();
    const opts = (t as unknown as { options: Record<string, unknown> }).options;
    expect(opts.secure).toBe(true);
  });

  it("enables pool when SMTP_POOL=true", async () => {
    process.env["SMTP_POOL"] = "true";
    const { getTransporter } = await import("../mailer");
    const t = getTransporter();
    const opts = (t as unknown as { options: Record<string, unknown> }).options;
    expect(opts.pool).toBe(true);
  });

  it("does NOT enable pool when SMTP_POOL unset", async () => {
    const { getTransporter } = await import("../mailer");
    const t = getTransporter();
    const opts = (t as unknown as { options: Record<string, unknown> }).options;
    expect(opts.pool).toBeFalsy();
  });

  it("wires auth, timeouts and TLS minVersion", async () => {
    const { getTransporter } = await import("../mailer");
    const t = getTransporter();
    const opts = (t as unknown as { options: Record<string, unknown> }).options;
    expect(opts.auth).toEqual({
      user: "smoke@example.com",
      pass: "abcdabcdabcdabcd",
    });
    expect(opts.connectionTimeout).toBe(8000);
    expect(opts.greetingTimeout).toBe(8000);
    expect(opts.socketTimeout).toBe(8000);
    expect(opts.tls).toEqual({ minVersion: "TLSv1.2" });
  });
});

describe("sendChecklistEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    setBaseEnv();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("uses EMAIL_FROM when set", async () => {
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

  it("falls back to SMTP_USER when EMAIL_FROM unset", async () => {
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

  it("propagates every field of SendArgs to sendMail", async () => {
    const { sendChecklistEmail, getTransporter } = await import("../mailer");
    const t = getTransporter();
    const sendMock = vi
      .spyOn(t, "sendMail")
      .mockResolvedValue({ messageId: "<id-123@local>" } as never);

    const pdf = Buffer.from("PDFDATA");
    const result = await sendChecklistEmail({
      to: "rcpt@example.com",
      subject: "the subject",
      html: "<h1>hello</h1>",
      text: "hello",
      attachments: [{ filename: "report.pdf", content: pdf }],
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const arg = sendMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg).toMatchObject({
      from: "smoke@example.com",
      to: "rcpt@example.com",
      subject: "the subject",
      html: "<h1>hello</h1>",
      text: "hello",
      attachments: [{ filename: "report.pdf", content: pdf }],
    });
    expect(result).toEqual({ messageId: "<id-123@local>" });
  });

  it("propagates errors from sendMail (no swallow)", async () => {
    const { sendChecklistEmail, getTransporter } = await import("../mailer");
    const t = getTransporter();
    const err = Object.assign(new Error("Invalid login"), { code: "EAUTH" });
    vi.spyOn(t, "sendMail").mockRejectedValue(err);

    await expect(
      sendChecklistEmail({
        to: "x@y.z",
        subject: "s",
        html: "<p>h</p>",
        text: "h",
        attachments: [],
      }),
    ).rejects.toMatchObject({ code: "EAUTH", message: "Invalid login" });
  });
});

describe("verifyTransport", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    setBaseEnv();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("resolves true when transporter.verify resolves", async () => {
    const { verifyTransport, getTransporter } = await import("../mailer");
    const t = getTransporter();
    vi.spyOn(t, "verify").mockResolvedValue(true as never);

    await expect(verifyTransport()).resolves.toBe(true);
  });

  it("propagates rejection from transporter.verify", async () => {
    const { verifyTransport, getTransporter } = await import("../mailer");
    const t = getTransporter();
    const err = Object.assign(new Error("connect ETIMEDOUT"), {
      code: "ETIMEDOUT",
    });
    vi.spyOn(t, "verify").mockRejectedValue(err);

    await expect(verifyTransport()).rejects.toMatchObject({
      code: "ETIMEDOUT",
    });
  });
});
