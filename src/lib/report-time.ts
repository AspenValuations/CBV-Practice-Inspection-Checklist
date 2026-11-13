/**
 * All report timestamps (email, PDF, filenames) are shown in Alberta Mountain Time,
 * regardless of the server's timezone (UTC on the host). DST (MST/MDT) is handled by
 * the IANA zone.
 */
export const REPORT_TIME_ZONE = "America/Edmonton";
export const REPORT_TIME_ZONE_LABEL = "MT";

type PartMap = Partial<Record<Intl.DateTimeFormatPartTypes, string>>;

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: REPORT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: REPORT_TIME_ZONE,
  month: "long",
});

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

function parts(date: Date): PartMap {
  const out: PartMap = {};
  for (const p of partsFormatter.formatToParts(date)) out[p.type] = p.value;
  return out;
}

/** "2026-05-24" in Mountain Time. */
export function formatReportIsoDate(value: Date | string | number): string {
  const p = parts(toDate(value));
  return `${p.year}-${p.month}-${p.day}`;
}

/** "May 24, 2026" in Mountain Time. */
export function formatReportLongDate(value: Date | string | number): string {
  const d = toDate(value);
  const p = parts(d);
  return `${monthFormatter.format(d)} ${Number(p.day)}, ${p.year}`;
}

/** "9:00 AM" in Mountain Time (plain ASCII space; avoids ICU's U+202F, which PDF fonts lack). */
export function formatReportTime(value: Date | string | number): string {
  const p = parts(toDate(value));
  return `${p.hour}:${p.minute} ${(p.dayPeriod ?? "").toUpperCase()}`;
}
