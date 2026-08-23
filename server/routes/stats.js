/* ===================================================================
   routes/stats.js — lightweight site analytics for the admin.

     POST /api/stats/visit   { page }        — one per page load
     POST /api/stats/error   { message, … }  — client errors
     GET  /api/admin/stats                   — the dashboard payload

   Privacy posture: no cookies set for tracking, no fingerprints, no
   IPs stored. Visits are a counter bump per (day, page); errors store
   only the message and where it happened. Enough to see how many
   people come and what breaks, nothing more.
   =================================================================== */

import { send } from "../app.js";
import { readJsonBody } from "../lib/body.js";
import { rateLimit, clientKey } from "../lib/rate-limit.js";

const MAX_ERRORS_KEPT = 500;

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function cleanPageName(raw) {
  const value = String(raw || "").trim();
  // Keep it to a bare file name so URLs can't inject junk or leak
  // query strings into the dashboard.
  const name = value.split("?")[0].split("/").pop().slice(0, 64);
  return /^[a-z0-9_-]+\.html$/i.test(name) ? name.toLowerCase() : "other";
}

export async function recordVisit(req, res, db) {
  const limit = rateLimit("visit:" + clientKey(req), { limit: 30, windowMs: 60_000 });
  if (!limit.allowed) {
    return send(res, 429, { error: { code: "rate_limited", message: "Too many visits too fast." } });
  }

  const body = await readJsonBody(req);
  if (!body.ok) return send(res, 400, { error: { code: body.code, message: body.message } });

  const page = cleanPageName(body.value.page);
  db.prepare(
    `INSERT INTO visit_days (day, page, views) VALUES (?, ?, 1)
     ON CONFLICT(day, page) DO UPDATE SET views = views + 1`
  ).run(todayKey(), page);

  return send(res, 200, { data: { counted: true } });
}

export async function recordError(req, res, db) {
  const limit = rateLimit("error:" + clientKey(req), { limit: 10, windowMs: 60_000 });
  if (!limit.allowed) {
    // Swallowed on purpose — an error flood shouldn't get a response.
    return send(res, 429, { error: { code: "rate_limited", message: "Too many errors too fast." } });
  }

  const body = await readJsonBody(req);
  if (!body.ok) return send(res, 400, { error: { code: body.code, message: body.message } });

  const message = String(body.value.message || "Unknown error").slice(0, 300);
  const source = String(body.value.source || "").slice(0, 200) || null;
  const line = Number.isFinite(Number(body.value.line)) ? Number(body.value.line) : null;
  const page = cleanPageName(body.value.page);

  db.prepare(
    "INSERT INTO client_errors (day, page, message, source, line) VALUES (?, ?, ?, ?, ?)"
  ).run(todayKey(), page, message, source, line);

  // Keep the table small: newest errors matter, a months-old stack
  // trace doesn't.
  db.prepare(
    `DELETE FROM client_errors WHERE id NOT IN (
       SELECT id FROM client_errors ORDER BY id DESC LIMIT ?
     )`
  ).run(MAX_ERRORS_KEPT);

  return send(res, 200, { data: { logged: true } });
}

/* The admin dashboard payload. Admin check happens in api.js from the
   session — this function only runs for isAdmin users. */
export function adminStats(res, db) {
  const today = todayKey();
  const yesterday = todayKey(new Date(Date.now() - 86_400_000));

  const scalar = (sql, ...params) => {
    const row = db.prepare(sql).get(...params);
    return row ? Object.values(row)[0] : 0;
  };

  const viewsToday = scalar(
    "SELECT COALESCE(SUM(views), 0) FROM visit_days WHERE day = ?", today
  );
  const viewsYesterday = scalar(
    "SELECT COALESCE(SUM(views), 0) FROM visit_days WHERE day = ?", yesterday
  );
  const viewsTotal = scalar("SELECT COALESCE(SUM(views), 0) FROM visit_days");

  const topPages = db.prepare(
    `SELECT page, SUM(views) AS views FROM visit_days
     GROUP BY page ORDER BY views DESC LIMIT 8`
  ).all();

  const last7 = db.prepare(
    `SELECT day, SUM(views) AS views FROM visit_days
     WHERE day >= ? GROUP BY day ORDER BY day ASC LIMIT 14`
  ).all(todayKey(new Date(Date.now() - 6 * 86_400_000)));

  const beastToday = scalar(
    "SELECT COUNT(*) FROM beast_memories WHERE learned_on = ?", today
  );
  const beastTotal = scalar("SELECT COUNT(*) FROM beast_memories");

  const recentQuestions = db.prepare(
    "SELECT question, answer, created_at FROM beast_memories ORDER BY id DESC LIMIT 5"
  ).all();

  const accounts = scalar("SELECT COUNT(*) FROM users");
  const latestAccounts = db.prepare(
    "SELECT username, created_at FROM users ORDER BY id DESC LIMIT 5"
  ).all();

  const errorsToday = scalar(
    "SELECT COUNT(*) FROM client_errors WHERE day = ?", today
  );
  const recentErrors = db.prepare(
    `SELECT day, page, message, source, line, created_at
     FROM client_errors ORDER BY id DESC LIMIT 10`
  ).all();

  return send(res, 200, {
    data: {
      generated_at: new Date().toISOString(),
      visitors: {
        today: viewsToday,
        yesterday: viewsYesterday,
        total: viewsTotal,
        top_pages: topPages,
        last7: last7,
      },
      beast: {
        messages_today: beastToday,
        messages_total: beastTotal,
        recent_questions: recentQuestions,
      },
      accounts: {
        total: accounts,
        latest: latestAccounts,
      },
      errors: {
        today: errorsToday,
        recent: recentErrors,
      },
    },
  });
}
