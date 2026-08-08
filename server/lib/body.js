/* ===================================================================
   lib/body.js — reading what the browser sent, safely.

   Caps the body at MAX_BODY_BYTES so an endless stream of junk from an
   untrusted connection can't be politely appended to a string forever
   until the process runs out of memory.
   =================================================================== */

export const MAX_BODY_BYTES = 8 * 1024; // a login/signup body is a few hundred bytes

/* Returns { ok: true, value } or { ok: false, code, message } — a
   result, not a throw, because bad input from a stranger is expected,
   not exceptional. */
export function readJsonBody(req) {
  return new Promise(resolve => {
    const type = (req.headers["content-type"] || "").split(";")[0].trim();
    if (type !== "application/json") {
      return resolve({
        ok: false,
        code: "bad_content_type",
        message: "Send Content-Type: application/json"
      });
    }

    const chunks = [];
    let size = 0;
    let finished = false;
    let refused = false;

    const done = result => {
      if (finished) return;
      finished = true;
      resolve(result);
    };

    req.on("data", chunk => {
      size += chunk.length;

      if (refused) {
        if (size > MAX_BODY_BYTES * 20) req.destroy();
        return;
      }

      if (size > MAX_BODY_BYTES) {
        refused = true;
        chunks.length = 0;
        return done({
          ok: false,
          code: "body_too_large",
          message: `Body must be under ${MAX_BODY_BYTES} bytes.`
        });
      }

      chunks.push(chunk);
    });

    req.on("end", () => {
      if (refused) return;

      const raw = Buffer.concat(chunks).toString("utf8");

      if (raw.trim() === "") {
        return done({ ok: false, code: "empty_body", message: "Body is empty." });
      }

      let value;
      try {
        value = JSON.parse(raw);
      } catch {
        return done({ ok: false, code: "bad_json", message: "Body is not valid JSON." });
      }

      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return done({ ok: false, code: "bad_json", message: "Body must be a JSON object." });
      }

      done({ ok: true, value });
    });

    req.on("error", () => {
      done({ ok: false, code: "bad_request", message: "Could not read the request body." });
    });
  });
}
