// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
/**
 * In-memory sliding-window limiter. Per process — good enough for a single
 * preview machine or a small deployment; swap for a shared store below the
 * marker if you run many replicas.
 */
export interface Limiter {
  /** Records a hit; returns true when allowed, false when over the limit. */
  hit(key: string, nowMs?: number): boolean;
}

export function createLimiter(opts: { windowMs: number; max: number }): Limiter {
  const hits = new Map<string, number[]>();
  return {
    hit(key, nowMs = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => nowMs - t < opts.windowMs);
      if (recent.length >= opts.max) {
        hits.set(key, recent);
        return false;
      }
      recent.push(nowMs);
      hits.set(key, recent);
      if (hits.size > 10_000) hits.clear(); // bounded memory; a reset is the safe failure
      return true;
    },
  };
}
// ─── @octiq-extend ─── your code below this line ───
