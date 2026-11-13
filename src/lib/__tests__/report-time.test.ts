import { describe, it, expect } from "vitest";
import { formatReportIsoDate, formatReportLongDate, formatReportTime } from "../report-time";

describe("report-time (America/Edmonton)", () => {
  it("summer instant uses MDT (UTC-6)", () => {
    const d = new Date("2026-05-24T15:00:00Z");
    expect(formatReportLongDate(d)).toBe("May 24, 2026");
    expect(formatReportTime(d)).toBe("9:00 AM");
  });

  it("winter evening in MT stays on the MT date even after UTC midnight (MST, UTC-7)", () => {
    const d = new Date("2026-11-14T03:30:00Z");
    expect(formatReportIsoDate(d)).toBe("2026-11-13");
    expect(formatReportLongDate(d)).toBe("November 13, 2026");
    expect(formatReportTime(d)).toBe("8:30 PM");
  });

  it("midnight and noon use 12-hour clock", () => {
    expect(formatReportTime(new Date("2026-01-01T07:00:00Z"))).toBe("12:00 AM");
    expect(formatReportTime(new Date("2026-07-01T18:05:00Z"))).toBe("12:05 PM");
  });

  it("output is plain ASCII (no narrow no-break space)", () => {
    expect(formatReportTime(new Date("2026-05-24T15:00:00Z"))).toMatch(/^[\x20-\x7E]+$/);
  });
});
