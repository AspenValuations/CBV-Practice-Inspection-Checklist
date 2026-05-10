import { createHash } from "crypto";

const seen = new Map<string, number>();
const MAX_SIZE = 64;
const TTL_MS = 60_000;

// Recursively rebuild objects with sorted keys so the JSON encoding is
// deterministic regardless of property insertion order. Arrays preserve
// order; primitives + Date pass through unchanged.
function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonicalize);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) {
    out[k] = canonicalize(obj[k]);
  }
  return out;
}

export function hashPayload(obj: unknown): string {
  const str = JSON.stringify(canonicalize(obj));
  return createHash("sha256").update(str).digest("hex");
}

export function isDuplicate(hash: string): boolean {
  const now = Date.now();
  // Evict expired
  for (const [k, ts] of seen) {
    if (now - ts > TTL_MS) seen.delete(k);
  }
  if (seen.has(hash)) return true;
  // Evict LRU if full
  if (seen.size >= MAX_SIZE) {
    const firstKey = seen.keys().next().value;
    if (firstKey) seen.delete(firstKey);
  }
  seen.set(hash, now);
  return false;
}

// Test-only reset, kept exported because the dedupe map is module-level state.
export function _resetDedupe(): void {
  seen.clear();
}
