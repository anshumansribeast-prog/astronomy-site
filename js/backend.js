/* ===================================================================
   js/backend.js — the private /backend admin page.

   Gated by the site's real account system (see account.js): the
   server decides who's admin (one ADMIN_USERNAME env var, checked in
   server/routes/auth.js), never the client — this file only reads
   that already-authorized answer and decides what to draw.

   The chat panel here talks to backend_server.py, a local-only bridge
   on this laptop (localhost:8423, same shape as Ada's/Beast's bridges).
   That means it only works when /backend is opened FROM Anshuman's own
   laptop — from anywhere else it fails honestly instead of pretending
   to work, same as Ada and Beast already do.
   =================================================================== */
(function () {
  "use strict";

  const BACKEND_URL = "http://localhost:8423/api/backend";
  const HISTORY_LIMIT = 8;

  const pageSlot = document.getElementById("backendPage");
  if (!pageSlot) return; // not on backend.html

  const history = [];

  function renderSignedOut() {
    pageSlot.replaceChildren();
    pageSlot.className = "";
    const p = document.createElement("p");
    p.className = "panel-hint";
    p.textContent = "Sign in first.";
    const link = document.createElement("a");
    link.href = "account.html";
    link.className = "btn btn-primary";
    link.textContent = "Sign in";
    pageSlot.append(p, link);
  }

  function renderNotAuthorized(username) {
    pageSlot.replaceChildren();
    pageSlot.className = "";
    const p = document.createElement("p");
    p.className = "panel-hint";
    p.textContent = `Signed in as ${username}, but this account doesn't have access to /backend.`;
    pageSlot.append(p);
  }

  function renderAdmin() {
    pageSlot.replaceChildren();
    pageSlot.className = "beast-page";

    const log = document.createElement("div");
    log.className = "beast-log";
    log.id = "backendLog";

    const form = document.createElement("form");
    form.className = "beast-form";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Talk to Jarvis…";
    input.autocomplete = "off";
    const send = document.createElement("button");
    send.type = "submit";
    send.className = "btn btn-primary beast-send";
    send.textContent = "Send";
    form.append(input, send);

    pageSlot.append(log, form);

    function addBubble(text, kind) {
      const el = document.createElement("div");
      el.className = "beast-bubble beast-" + kind;
      el.textContent = text;
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      return el;
    }

    addBubble(
      "Jarvis here. I only answer while backend_server.py is running on Anshuman's laptop and you're viewing this page from that same machine.",
      "bot"
    );

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      addBubble(text, "user");
      history.push({ role: "user", content: text });
      input.value = "";
      input.disabled = true;
      send.disabled = true;
      const thinking = addBubble("Thinking…", "bot");
      thinking.classList.add("beast-thinking");

      try {
        const resp = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history: history.slice(-HISTORY_LIMIT) })
        });
        if (!resp.ok) throw new Error("bad status " + resp.status);
        const data = await resp.json();
        thinking.textContent = data.reply || "I didn't get that — try again?";
        thinking.classList.remove("beast-thinking");
        history.push({ role: "assistant", content: data.reply || "" });
      } catch (err) {
        thinking.textContent =
          "Jarvis is offline — this only works while backend_server.py is running on Anshuman's laptop, " +
          "and only when you're viewing this page from that same machine.";
        thinking.classList.remove("beast-thinking");
      } finally {
        input.disabled = false;
        send.disabled = false;
        input.focus();
      }
    });
  }

  if (!window.AstroAccount) return; // account.js didn't load — nothing to gate on

  window.AstroAccount.onChange(function (user) {
    if (!user) return renderSignedOut();
    if (!user.isAdmin) return renderNotAuthorized(user.username);
    renderAdmin();
  });
})();
