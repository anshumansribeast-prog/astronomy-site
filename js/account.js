/* ===================================================================
   account.js — who's signed in, everywhere on the site.

   Two jobs, both driven by the same GET /api/auth/me:
     1. A small "Sign in" / "Hi, {name}" pill in the header nav on
        EVERY page (#navAccount).
     2. The full sign-in/sign-up form or signed-in panel, but only on
        account.html (#accountPage) — same self-detecting pattern
        chat.js uses for beast.html, so this script is safe to include
        on every page without needing per-page markup to match.

   THE RULE THIS FILE FOLLOWS, AND WHY: the browser is never told the
   session token — it lives only in an httpOnly cookie the browser
   attaches by itself. This file only ever ASKS the server "who am I?"
   and draws the answer. A login check here is decoration; the check
   that matters always happens server-side, on every request.
   =================================================================== */

(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const navSlot = $("navAccount");
  const pageSlot = $("accountPage");
  if (!navSlot && !pageSlot) return; // shouldn't happen, but nothing to do

  let current = null; // { username } or null
  const listeners = [];

  window.AstroAccount = {
    get user() { return current; },
    onChange(fn) { listeners.push(fn); fn(current); },
    refresh: load,
    displayName // shared with other pages (e.g. Beast's greeting) so the
                // "everyone but the admin shows as Commander" rule lives
                // in exactly one place
  };

  function setUser(user) {
    current = user;
    renderNav();
    if (pageSlot) renderPage();
    listeners.forEach(fn => fn(current));
  }

  async function api(path, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options && options.headers) },
      credentials: "same-origin", // lets the session cookie ride along
      signal: controller.signal
    }).finally(() => clearTimeout(timer));

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((json && json.error && json.error.message) || `Request failed (${res.status})`);
    }
    return json.data;
  }

  async function load() {
    try {
      const data = await api("/api/auth/me");
      setUser(data.user);
    } catch {
      // No server reachable (e.g. viewing the static files directly,
      // no `npm start` running) — degrade to "signed out", not a crash.
      setUser(null);
      if (pageSlot) renderNoServer();
    }
  }

  /* Everyone except the real admin (isAdmin, set server-side) is shown
     as "Commander" rather than their real typed username — a fun rank
     rather than a security feature; the actual username is still what
     signs them in and is never hidden from the server itself. */
  function displayName(user) {
    return user.isAdmin ? user.username : "Commander";
  }

  /* ---- header pill, every page ---- */

  function renderNav() {
    if (!navSlot) return;
    navSlot.replaceChildren();

    const link = document.createElement("a");
    link.href = "account.html";
    // textContent only, never innerHTML — a username is untrusted text
    // and must never be parsed as markup (that's how stored XSS happens).
    link.textContent = current ? `Hi, ${displayName(current)}` : "Sign in";
    navSlot.append(link);
  }

  /* ---- full panel, account.html only ---- */

  function renderPage() {
    pageSlot.replaceChildren();
    if (current) renderSignedIn(); else renderSignedOut();
  }

  function renderSignedIn() {
    const who = document.createElement("p");
    who.className = "who";
    who.append("Signed in as ");
    const name = document.createElement("strong");
    name.textContent = displayName(current);
    who.append(name);

    const note = document.createElement("p");
    note.className = "panel-hint";
    note.textContent = "You're signed in. Beast will know you're here when you chat.";

    const out = document.createElement("button");
    out.className = "btn btn-quiet";
    out.textContent = "Sign out";
    out.addEventListener("click", async () => {
      out.disabled = true;
      try {
        await api("/api/auth/logout", { method: "POST" });
        setUser(null);
      } catch (err) {
        showError(err.message);
        out.disabled = false;
      }
    });

    pageSlot.append(who, note, out);
  }

  function renderSignedOut() {
    const form = document.createElement("form");
    form.className = "account-form";
    form.noValidate = true;

    const user = field("Username", "text", "username");
    const pass = field("Password", "password", "current-password");

    const actions = document.createElement("div");
    actions.className = "actions";

    const signIn = document.createElement("button");
    signIn.className = "btn btn-primary";
    signIn.type = "submit";
    signIn.textContent = "Sign in";

    const signUp = document.createElement("button");
    signUp.className = "btn btn-quiet";
    signUp.type = "button";
    signUp.textContent = "Create account";

    actions.append(signIn, signUp);

    const msg = document.createElement("p");
    msg.className = "form-msg";
    msg.setAttribute("role", "status");

    const hint = document.createElement("p");
    hint.className = "panel-hint";
    hint.textContent = "You don't need an account to use this site — it just lets Beast remember your name.";

    const submit = async (path) => {
      msg.className = "form-msg";
      msg.textContent = "…";
      signIn.disabled = signUp.disabled = true;

      try {
        const data = await api(path, {
          method: "POST",
          body: JSON.stringify({ username: user.input.value, password: pass.input.value })
        });
        pass.input.value = "";
        setUser(data.user);
      } catch (err) {
        msg.className = "form-msg is-error";
        msg.textContent = err.message;
        signIn.disabled = signUp.disabled = false;
      }
    };

    form.addEventListener("submit", e => { e.preventDefault(); submit("/api/auth/login"); });
    signUp.addEventListener("click", () => submit("/api/auth/register"));

    form.append(user.wrap, pass.wrap, actions, msg, hint);
    pageSlot.append(form);
  }

  function field(labelText, type, autocomplete) {
    const wrap = document.createElement("label");
    wrap.className = "field";
    wrap.textContent = labelText;

    const input = document.createElement("input");
    input.type = type;
    input.autocomplete = autocomplete;
    input.required = true;
    if (type === "password") input.minLength = 8;

    wrap.append(input);
    return { wrap, input };
  }

  function showError(message) {
    const msg = document.createElement("p");
    msg.className = "form-msg is-error";
    msg.textContent = message;
    pageSlot.append(msg);
  }

  function renderNoServer() {
    pageSlot.replaceChildren();
    const p = document.createElement("p");
    p.className = "panel-hint";
    p.textContent = "Accounts need the site's server running (npm start), not just opening the files directly.";
    pageSlot.append(p);
  }

  load();
})();
