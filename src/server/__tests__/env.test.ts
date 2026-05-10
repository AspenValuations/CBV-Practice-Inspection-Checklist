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

async function reloadEnv() {
  vi.resetModules();
  return (await import("../env")).env;
}

describe("env schema", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    setBaseEnv();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe("defaults", () => {
    it("SMTP_HOST defaults to smtp.gmail.com", async () => {
      const env = await reloadEnv();
      expect(env.SMTP_HOST).toBe("smtp.gmail.com");
    });

    it("SMTP_PORT defaults to 465", async () => {
      const env = await reloadEnv();
      expect(env.SMTP_PORT).toBe(465);
    });

    it("SMTP_POOL defaults to false", async () => {
      const env = await reloadEnv();
      expect(env.SMTP_POOL).toBe(false);
    });

    it("SMTP_SECURE defaults to undefined (resolved at use site)", async () => {
      const env = await reloadEnv();
      expect(env.SMTP_SECURE).toBeUndefined();
    });

    it("EMAIL_FROM defaults to undefined", async () => {
      const env = await reloadEnv();
      expect(env.EMAIL_FROM).toBeUndefined();
    });
  });

  describe("envBool preprocess", () => {
    const truthy = ["true", "TRUE", "True", "1", "yes", "YES", "on", "ON"];
    for (const v of truthy) {
      it(`treats SMTP_POOL='${v}' as true`, async () => {
        process.env["SMTP_POOL"] = v;
        const env = await reloadEnv();
        expect(env.SMTP_POOL).toBe(true);
      });
    }

    const falsy = ["false", "FALSE", "0", "no", "NO", "off", "OFF", ""];
    for (const v of falsy) {
      it(`treats SMTP_POOL='${v}' as false`, async () => {
        process.env["SMTP_POOL"] = v;
        const env = await reloadEnv();
        expect(env.SMTP_POOL).toBe(false);
      });
    }

    it("trims surrounding whitespace before matching", async () => {
      process.env["SMTP_POOL"] = "  true  ";
      const env = await reloadEnv();
      expect(env.SMTP_POOL).toBe(true);
    });

    it("rejects an unrecognised string", async () => {
      process.env["SMTP_POOL"] = "maybe";
      vi.resetModules();
      await expect(import("../env")).rejects.toThrow(/SMTP_POOL/);
    });
  });

  describe("required fields", () => {
    it("rejects missing SMTP_USER", async () => {
      delete process.env["SMTP_USER"];
      vi.resetModules();
      await expect(import("../env")).rejects.toThrow(/SMTP_USER/);
    });

    it("rejects missing SMTP_PASS", async () => {
      delete process.env["SMTP_PASS"];
      vi.resetModules();
      await expect(import("../env")).rejects.toThrow(/SMTP_PASS/);
    });

    it("rejects malformed SMTP_USER (not an email)", async () => {
      process.env["SMTP_USER"] = "not-an-email";
      vi.resetModules();
      await expect(import("../env")).rejects.toThrow(/SMTP_USER/);
    });

    it("rejects empty-string SMTP_PASS", async () => {
      process.env["SMTP_PASS"] = "";
      vi.resetModules();
      await expect(import("../env")).rejects.toThrow(/SMTP_PASS/);
    });
  });

  describe("coercion", () => {
    it("coerces SMTP_PORT='587' to number 587", async () => {
      process.env["SMTP_PORT"] = "587";
      const env = await reloadEnv();
      expect(env.SMTP_PORT).toBe(587);
    });

    it("rejects non-numeric SMTP_PORT", async () => {
      process.env["SMTP_PORT"] = "abc";
      vi.resetModules();
      await expect(import("../env")).rejects.toThrow(/SMTP_PORT/);
    });

    it("rejects negative SMTP_PORT", async () => {
      process.env["SMTP_PORT"] = "-1";
      vi.resetModules();
      await expect(import("../env")).rejects.toThrow(/SMTP_PORT/);
    });

    it("rejects zero SMTP_PORT (must be positive)", async () => {
      process.env["SMTP_PORT"] = "0";
      vi.resetModules();
      await expect(import("../env")).rejects.toThrow(/SMTP_PORT/);
    });
  });
});
