import type { QPart } from "./types";

export function partsToString(parts: QPart[]): string {
  return parts.map((p) => p.text).join("");
}

// Dev-only assertion — stripped in production via dead-code elimination
export function assertParts(parts: QPart[], questionId: string): void {
  if (process.env.NODE_ENV === "production") return;
  if (parts.length === 0) {
    throw new Error(`Question ${questionId} has empty parts array`);
  }
  const fullText = partsToString(parts);
  if (!fullText.trim()) {
    throw new Error(`Question ${questionId} parts produce empty text`);
  }
}
