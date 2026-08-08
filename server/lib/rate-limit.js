/* ===================================================================
   lib/rate-limit.js — how many times, how fast.

   In-memory sliding-window limiter. Known limitations (same as
   cosmos-v2's): resets on restart, counts per IP (so a shared network
   looks like one visitor and a multi-IP attacker looks like many),
   and multiple server instances wouldn't share counts. Right-sized for
   a small site; a real high-traffic deploy would use a shared store.
   =================================================================== */

const hits = new Map();

/**
 * @returns {{allowed: boolean, retryAfterSeconds: number}}
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const cutoff = now - windowMs;

  const recent = (hits.get(key) || []).filter(t => t > cutoff);

  if (recent.length >= limit) {
    const oldest = recent[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    hits.set(key, recent);
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) sweep(cutoff);

  return { allowed: true, retryAfterSeconds: 0 };
}

function sweep(cutoff) {
  for (const [key, times] of hits) {
    const kept = times.filter(t => t > cutoff);
    if (kept.length === 0) hits.delete(key);
    else hits.set(key, kept);
  }
}

export function resetRateLimits() {
  hits.clear();
}

// req.socket.remoteAddress is the only value here a visitor cannot
// forge — headers like X-Forwarded-For can be, so this only trusts
// that header if a proxy this server actually runs behind sets it.
export function clientKey(req) {
  return req.socket?.remoteAddress || "unknown";
}
