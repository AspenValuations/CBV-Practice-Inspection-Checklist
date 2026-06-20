import { describe, it, expect, beforeEach, vi } from "vitest";
import { hashPayload, isDuplicate, _resetDedupe } from "../dedupe";

describe("hashPayload", () => {
  it("produces identical hashes for objects with reordered keys (top-level)", () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { z: 3, y: 2, x: 1 };
    expect(hashPayload(a)).toBe(hashPayload(b));
  });

  it("produces identical hashes for nested objects with reordered keys", () => {
    const a = {
      preparer: { name: "A", recipientEmails: ["x@y.z"], engagementName: "E" },
      answers: { q1: { value: "yes" }, q2: { value: "no", note: "n" } },
    };
    const b = {
      answers: { q2: { note: "n", value: "no" }, q1: { value: "yes" } },
      preparer: { engagementName: "E", recipientEmails: ["x@y.z"], name: "A" },
    };
    expect(hashPayload(a)).toBe(hashPayload(b));
  });

  it("produces different hashes for different values", () => {
    expect(hashPayload({ x: 1 })).not.toBe(hashPayload({ x: 2 }));
  });

  it("preserves array order (arrays are not sorted)", () => {
    expect(hashPayload({ list: [1, 2, 3] })).not.toBe(
      hashPayload({ list: [3, 2, 1] }),
    );
  });

  it("normalises Date to its ISO string", () => {
    const d = new Date("2026-05-10T00:00:00Z");
    expect(hashPayload({ at: d })).toBe(
      hashPayload({ at: new Date(d.toISOString()) }),
    );
  });

  it("does not throw on null / primitive / undefined-valued fields", () => {
    expect(() => hashPayload(null)).not.toThrow();
    expect(() => hashPayload(42)).not.toThrow();
    expect(() => hashPayload("string")).not.toThrow();
    expect(() => hashPayload({ a: undefined, b: null })).not.toThrow();
  });
});

describe("isDuplicate", () => {
  beforeEach(() => {
    _resetDedupe();
  });

  it("returns false on first sighting, true on the second", () => {
    const h = "abc123";
    expect(isDuplicate(h)).toBe(false);
    expect(isDuplicate(h)).toBe(true);
  });

  it("treats different hashes independently", () => {
    expect(isDuplicate("h1")).toBe(false);
    expect(isDuplicate("h2")).toBe(false);
    expect(isDuplicate("h1")).toBe(true);
    expect(isDuplicate("h2")).toBe(true);
  });

  it("expires entries after the TTL", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      expect(isDuplicate("ttl-test")).toBe(false);
      vi.setSystemTime(new Date("2026-01-01T00:01:01Z")); // +61s, > 60s TTL
      expect(isDuplicate("ttl-test")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("evicts the oldest entry when the cap is reached", () => {
    // MAX_SIZE = 64; insert 64, then a 65th should evict the first.
    for (let i = 0; i < 64; i++) {
      expect(isDuplicate(`k${i}`)).toBe(false);
    }
    expect(isDuplicate("k64")).toBe(false);
    // k0 was the oldest; should be gone.
    expect(isDuplicate("k0")).toBe(false);
  });
});
