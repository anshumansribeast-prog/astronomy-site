/* ===================================================================
   app.js — the request handler.

   Does NOT start a server — index.js does that. Kept separate so this
   handler can be driven directly without binding to a port.
   =================================================================== */

import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { handleApi } from "./routes/api.js";

const here = dirname(fileURLToPath(import.meta.url));

// The astronomy-site static files (HTML/CSS/JS) live one level up from
// server/ — the same folder that used to be served by nginx alone.
const CLIENT_DIR = join(here, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon"
};

export function createApp(db) {
  return async function app(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");

    try {
      if (url.pathname.startsWith("/api/")) {
        // Never cache an API response — a cached /api/auth/me is the
        // answer to "who's logged in?" being handed to the next visitor.
        res.setHeader("Cache-Control", "no-store");
        return await handleApi(req, res, url, db);
      }

      return await serveStatic(url.pathname.slice(1), res);
    } catch (err) {
      console.error("Unhandled error:", err);
      send(res, 500, { error: { code: "internal", message: "Something went wrong." } });
    }
  };
}

async function serveStatic(rel, res) {
  if (rel === "" || rel.endsWith("/")) rel += "index.html";

  // Path traversal guard — without this, a request for
  // ../server/db/astronomy.db would happily hand back the database.
  const full = normalize(join(CLIENT_DIR, rel));
  if (!full.startsWith(normalize(CLIENT_DIR))) {
    return send(res, 403, { error: { code: "forbidden", message: "Nope." } });
  }

  try {
    const body = await readFile(full);
    const type = MIME[extname(full)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(body);
  } catch {
    try {
      const notFound = await readFile(join(CLIENT_DIR, "404.html"));
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(notFound);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    }
  }
}

// One helper for every JSON response, so the shape is always the
// same: { data } on success, { error } on failure.
export function send(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}
