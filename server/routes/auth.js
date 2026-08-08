/* ===================================================================
   routes/auth.js — register, log in, log out, who am I.

     POST /api/auth/register
     POST /api/auth/login
     POST /api/auth/logout
     GET  /api/auth/me
   =================================================================== */

import { send } from "../app.js";
import { readJsonBody } from "../lib/body.js";
import { rateLimit, clientKey } from "../lib/rate-limit.js";
import {
  registerUser, loginUser, createSession, destroySession, SESSION_SECONDS
} from "../services/auth.js";
import {
  SESSION_COOKIE, parseCookies, serializeSessionCookie, clearSessionCookie, isSecureRequest
} from "../lib/cookies.js";

// 5 tries / 15 min on both register and login — register too, or a
// script creates junk accounts overnight, each one costing real CPU
// since registering deliberately runs scrypt.
const AUTH_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

function tooMany(req, res, bucket) {
  const limit = rateLimit(`${bucket}:${clientKey(req)}`, AUTH_LIMIT);
  if (limit.allowed) return false;

  res.setHeader("Retry-After", String(limit.retryAfterSeconds));
  send(res, 429, {
    error: {
      code: "rate_limited",
      message: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`
    }
  });
  return true;
}

export async function register(req, res, db) {
  if (tooMany(req, res, "register")) return;

  const body = await readJsonBody(req);
  if (!body.ok) {
    const status = body.code === "body_too_large" ? 413 : 400;
    return send(res, status, { error: { code: body.code, message: body.message } });
  }

  const result = await registerUser(db, body.value.username, body.value.password);
  if (!result.ok) {
    const status = result.code === "username_taken" ? 409 : 400;
    return send(res, status, { error: { code: result.code, message: result.message } });
  }

  // Log them straight in — making someone retype the password they
  // just chose teaches nothing and just annoys everyone.
  startSession(req, res, db, result.user, 201);
}

export async function login(req, res, db) {
  if (tooMany(req, res, "login")) return;

  const body = await readJsonBody(req);
  if (!body.ok) {
    const status = body.code === "body_too_large" ? 413 : 400;
    return send(res, status, { error: { code: body.code, message: body.message } });
  }

  const result = await loginUser(db, body.value.username, body.value.password);
  if (!result.ok) {
    return send(res, 401, { error: { code: result.code, message: result.message } });
  }

  startSession(req, res, db, result.user, 200);
}

// POST, not GET — GET must never change state, or a browser/proxy
// prefetching a pasted link would log someone out just by looking at it.
export function logout(req, res, db) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];

  // Delete the session row first, then clear the cookie — otherwise a
  // copied token would still work even after "logging out" the browser.
  destroySession(db, token);

  res.setHeader("Set-Cookie", clearSessionCookie({ secure: isSecureRequest(req) }));
  send(res, 200, { data: { signed_out: true } });
}

// Not signed in is a normal answer (200, user: null), not a 401 — this
// endpoint is "who am I", which anyone is allowed to ask.
export function me(res, user) {
  send(res, 200, { data: { user: user ? { username: user.username } : null } });
}

function startSession(req, res, db, user, status) {
  const token = createSession(db, user.id);

  res.setHeader("Set-Cookie", serializeSessionCookie(token, {
    maxAgeSeconds: SESSION_SECONDS,
    secure: isSecureRequest(req)
  }));

  // Token goes in the cookie header only, never in the JSON body — the
  // browser handles it automatically and the page never needs to see it.
  send(res, status, { data: { user: { username: user.username } } });
}
