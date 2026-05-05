import { createHash } from "crypto";

const seen = new Map<string, number>();
const MAX_SIZE = 64;
const TTL_MS = 60_000;

export function hashPayload(obj: unknown): string {
  const str = JSON.stringify(obj, Object.keys(obj as object).sort());
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
