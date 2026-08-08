/* ===================================================================
   lib/cookies.js — the browser's memory of who you are.

   httpOnly cookie, not localStorage: localStorage is readable by any
   JavaScript on the page (including a compromised library or an XSS
   bug), so a stolen token there means a stolen account. An httpOnly
   cookie is invisible to JavaScript entirely — it only ever travels
   between the browser and this server.
   =================================================================== */

export const SESSION_COOKIE = "astro_session";

export function parseCookies(header) {
  const out = {};
  if (!header) return out;

  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;

    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!name) continue;

    try {
      out[name] = decodeURIComponent(value);
    } catch {
      out[name] = value;
    }
  }
  return out;
}

export function serializeSessionCookie(token, { maxAgeSeconds, secure = false }) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAgeSeconds}`
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie({ secure = false } = {}) {
  const parts = [`${SESSION_COOKIE}=`, "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

// Behind a reverse proxy the last hop into this server is plain http
// even when the visitor is on https, so trust the env var (which
// can't be forged) over a header (which can) when both are available.
export function isSecureRequest(req) {
  if (process.env.COOKIE_SECURE === "1") return true;
  const proto = req.headers["x-forwarded-proto"];
  return typeof proto === "string" && proto.split(",")[0].trim() === "https";
}
