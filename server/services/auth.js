/* ===================================================================
   services/auth.js — accounts, passwords and sessions.

   Ported from cosmos-v2's server/services/auth.js, which is the one
   file in that project marked "do not invent cryptography here" — so
   this keeps its logic rather than writing a new version. scrypt
   (node:crypto, built in, RFC 7914) instead of bcrypt/argon2: no npm
   install, no C++ build tools needed on a Windows laptop, and a
   correctly-used scrypt beats a badly configured argon2 anyway.
   =================================================================== */

import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

// N is the work factor; these cost about a tenth of a second and 16MB
// per guess. Stored inside each hash so N can be raised later without
// breaking existing passwords.
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, SCRYPT.keylen, {
    N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p
  });

  return [
    "scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p,
    salt.toString("base64"), key.toString("base64")
  ].join("$");
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, N, r, p, saltB64, keyB64] = String(stored).split("$");
    if (scheme !== "scrypt") return false;

    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(keyB64, "base64");

    const actual = await scryptAsync(password, salt, expected.length, {
      N: Number(N), r: Number(r), p: Number(p)
    });

    // timingSafeEqual, not ===, so a wrong guess never takes
    // measurably longer to reject than any other wrong guess.
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false; // a malformed hash means nobody logs in as that user, never "let them in"
  }
}

/* ---- validation --------------------------------------------------- */

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,16}$/;

export function validateUsername(raw) {
  const value = typeof raw === "string" ? raw.trim() : "";

  if (!USERNAME_RE.test(value)) {
    return {
      ok: false,
      code: "bad_username",
      message: "Username must be 3–16 characters: letters, numbers, - or _ only."
    };
  }
  return { ok: true, value };
}

// Length beats punctuation (NIST-style guidance) — require length,
// allow everything, don't force symbols people just append "1!" to.
export function validatePassword(raw) {
  const value = typeof raw === "string" ? raw : "";

  if (value.length < 8) {
    return { ok: false, code: "weak_password", message: "Password must be at least 8 characters." };
  }
  if (value.length > 200) {
    return { ok: false, code: "bad_password", message: "Password must be under 200 characters." };
  }
  return { ok: true, value };
}

/* ---- accounts ----------------------------------------------------- */

export async function registerUser(db, username, password) {
  const u = validateUsername(username);
  if (!u.ok) return u;

  const p = validatePassword(password);
  if (!p.ok) return p;

  const password_hash = await hashPassword(p.value);

  try {
    const { lastInsertRowid } = db.prepare(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)"
    ).run(u.value, password_hash);

    return { ok: true, user: { id: Number(lastInsertRowid), username: u.value } };
  } catch (err) {
    // Let the UNIQUE constraint decide whether the name is taken —
    // SELECT-then-INSERT has a race condition under concurrent signup.
    if (String(err.message).includes("UNIQUE")) {
      return { ok: false, code: "username_taken", message: "That username is already taken." };
    }
    throw err;
  }
}

// A hash of nothing anyone can log in as, used purely to burn time so
// "no such user" and "wrong password" take equally long to reject.
const DUMMY_HASH_PROMISE = hashPassword(randomBytes(32).toString("hex"));

export async function loginUser(db, username, password) {
  const row = db.prepare(
    "SELECT id, username, password_hash FROM users WHERE username = ?"
  ).get(typeof username === "string" ? username.trim() : "");

  if (!row) {
    await verifyPassword(String(password ?? ""), await DUMMY_HASH_PROMISE);
    return { ok: false, code: "bad_credentials", message: "Username or password is incorrect." };
  }

  const valid = await verifyPassword(String(password ?? ""), row.password_hash);
  if (!valid) {
    return { ok: false, code: "bad_credentials", message: "Username or password is incorrect." };
  }

  return { ok: true, user: { id: row.id, username: row.username } };
}

/* ---- sessions ----------------------------------------------------- */

export const SESSION_DAYS = 14;
export const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;

// Hashing a session token is a different job from hashing a password —
// this one can be fast. The token is already 32 random bytes, so
// guessing is off the table; SHA-256 just ensures a stolen DB has no
// usable tokens in it.
const hashToken = token => createHash("sha256").update(token).digest("hex");

export function createSession(db, userId) {
  const token = randomBytes(32).toString("base64url");

  db.prepare(`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (?, ?, datetime('now', ?))
  `).run(hashToken(token), userId, `+${SESSION_DAYS} days`);

  return token;
}

export function userForToken(db, token) {
  if (!token) return null;

  const row = db.prepare(`
    SELECT users.id, users.username
      FROM sessions
      JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ?
       AND sessions.expires_at > datetime('now')
  `).get(hashToken(token));

  return row || null;
}

export function destroySession(db, token) {
  if (!token) return;
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}

export function purgeExpiredSessions(db) {
  const { changes } = db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
  return changes;
}
