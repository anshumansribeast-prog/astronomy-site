/* ===================================================================
   routes/api.js — the API endpoints.

     GET  /api/health
     POST /api/auth/register
     POST /api/auth/login
     POST /api/auth/logout
     GET  /api/auth/me

   Everything else this site knows (planets, constellations, facts,
   moon maths) already lives client-side in js/*.js — those never
   needed a server. Accounts are the one thing that genuinely does.
   =================================================================== */

import { send } from "../app.js";
import { register, login, logout, me, isAdmin } from "./auth.js";
import { beast, beastHealth, beastLearned, beastApod } from "./beast.js";
import { recordVisit, recordError, adminStats } from "./stats.js";
import { userForToken } from "../services/auth.js";
import { SESSION_COOKIE, parseCookies } from "../lib/cookies.js";

export async function handleApi(req, res, url, db) {
  const path = url.pathname;

  // Resolved once, here, so every route gets a real user or null —
  // no route reads the cookie itself or trusts a client-claimed identity.
  const user = userForToken(db, parseCookies(req.headers.cookie)[SESSION_COOKIE]);

  if (req.method === "POST") {
    if (path === "/api/auth/register") return await register(req, res, db);
    if (path === "/api/auth/login")    return await login(req, res, db);
    if (path === "/api/auth/logout")   return logout(req, res, db);
    if (path === "/api/beast")         return await beast(req, res, db);
    if (path === "/api/stats/visit")   return await recordVisit(req, res, db);
    if (path === "/api/stats/error")   return await recordError(req, res, db);

    return send(res, 405, { error: { code: "method_not_allowed", message: "No such write endpoint." } });
  }

  if (req.method === "GET") {
    if (path === "/api/health")        return send(res, 200, { data: { ok: true, user: user ? user.username : null } });
    if (path === "/api/beast/health")  return beastHealth(res);
    if (path === "/api/beast/learned") return await beastLearned(res, db);
    if (path === "/api/beast/apod")    return await beastApod(res, db);
    if (path === "/api/auth/me")       return me(res, user);

    // Admin-only: the session's isAdmin flag is decided by the server
    // (auth.js) from ADMIN_USERNAME — a visitor can't fake their way in.
    if (path === "/api/admin/stats") {
      if (!user || !isAdmin(user)) {
        return send(res, 403, { error: { code: "forbidden", message: "Admin access required." } });
      }
      return adminStats(res, db);
    }

    return send(res, 404, { error: { code: "not_found", message: "No such endpoint." } });
  }

  return send(res, 405, { error: { code: "method_not_allowed", message: "Unsupported method." } });
}
