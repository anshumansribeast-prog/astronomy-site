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
import { register, login, logout, me } from "./auth.js";
import { beast, beastHealth } from "./beast.js";
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
    if (path === "/api/beast")         return await beast(req, res);

    return send(res, 405, { error: { code: "method_not_allowed", message: "No such write endpoint." } });
  }

  if (req.method === "GET") {
    if (path === "/api/health")        return send(res, 200, { data: { ok: true, user: user ? user.username : null } });
    if (path === "/api/beast/health")  return beastHealth(res);
    if (path === "/api/auth/me")       return me(res, user);

    return send(res, 404, { error: { code: "not_found", message: "No such endpoint." } });
  }

  return send(res, 405, { error: { code: "method_not_allowed", message: "Unsupported method." } });
}
