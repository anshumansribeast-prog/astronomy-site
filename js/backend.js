/* ===================================================================
   js/backend.js — the private /backend admin page.

   A real backend console now, not a chat toy: it shows live site
   numbers from /api/admin/stats — visitors, top pages, Beast usage,
   accounts, and any errors visitors' browsers reported.

   Gated by the site's real account system (see account.js): the
   server decides who's admin (one ADMIN_USERNAME env var, checked in
   server/routes/auth.js), never the client — this file only reads
   that already-authorized answer and decides what to draw. The stats
   endpoint re-checks every request server-side and returns 403 to
   anyone else.
   =================================================================== */
(function () {
  "use strict";

  const pageSlot = document.getElementById("backendPage");
  if (!pageSlot) return; // not on backend.html

  /* ---- signed-out state -------------------------------------------- */
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

  /* ---- small render helpers ---------------------------------------- */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function card(label, value, sub) {
    const box = el("div", "card");
    box.style.padding = "1rem 1.2rem";
    box.append(el("span", "eyebrow", label));
    const valueEl = el("div", "", String(value));
    valueEl.style.cssText = "font-size:2rem;font-weight:700;line-height:1.2;";
    box.append(valueEl);
    if (sub) {
      const s = el("small", "", sub);
      s.style.opacity = ".7";
      box.append(s);
    }
    return box;
  }

  function listSection(title, rows) {
    const wrap = el("div", "card");
    wrap.style.padding = "1rem 1.2rem";
    const h = el("h3", "", title);
    h.style.marginBottom = ".6rem";
    wrap.append(h);
    if (!rows.length) {
      const empty = el("p", "", "Nothing yet.");
      empty.style.opacity = ".7";
      wrap.append(empty);
      return wrap;
    }
    const ul = el("ul");
    ul.style.paddingLeft = "1.1rem";
    rows.forEach(function (text) { ul.append(el("li", "", text)); });
    wrap.append(ul);
    return wrap;
  }

  /* ---- the dashboard ------------------------------------------------ */
  async function loadStats(box) {
    box.textContent = "Loading site stats…";
    try {
      const resp = await fetch("/api/admin/stats");
      if (resp.status === 403) { box.textContent = "Stats need admin access."; return; }
      if (!resp.ok) throw new Error("status " + resp.status);
      const { data } = await resp.json();
      drawStats(box, data);
    } catch {
      box.textContent = "Stats unavailable right now (server not reachable).";
    }
  }

  function drawStats(box, data) {
    box.replaceChildren();
    box.style.display = "grid";
    box.style.gap = "1rem";

    const cards = el("div", "grid grid-4");
    cards.append(
      card("Visitors today", data.visitors.today, "yesterday: " + data.visitors.yesterday),
      card("Page views all time", data.visitors.total),
      card("Beast messages today", data.beast.messages_today, "all time: " + data.beast.messages_total),
      card("Errors today", data.errors.today, "accounts: " + data.accounts.total)
    );
    box.append(cards);

    const lists = el("div", "grid grid-3");
    lists.append(
      listSection("Top pages",
        data.visitors.top_pages.map(function (p) {
          return p.page + " — " + p.views + " views";
        })),
      listSection("Recent errors",
        data.errors.recent.map(function (e) {
          return "[" + e.day + "] " + (e.page || "?") + ": " + e.message +
                 (e.source ? " (" + e.source + ":" + (e.line || "?") + ")" : "");
        })),
      listSection("Latest on Beast & signups",
        data.beast.recent_questions.map(function (q) { return "\u201C" + q.question + "\u201D"; })
          .concat(data.accounts.latest.map(function (u) { return "New account: " + u.username; })))
    );
    box.append(lists);
  }

  /* ---- the Semicolon panel -------------------------------------------
   One dashboard, both sites. This server proxies semicolon's own
   summary at /api/admin/semicolon — the shared token between the two
   servers never reaches this browser. */
  async function loadSemicolon(box) {
    box.replaceChildren();
    const head = el("h2", "", "Semicolon");
    head.style.margin = ".4rem 0 .2rem";
    box.append(head);

    try {
      const resp = await fetch("/api/admin/semicolon");
      if (!resp.ok) throw new Error("status " + resp.status);
      const payload = await resp.json();

      if (!payload.data) {
        box.append(el("p", "panel-hint", payload.note ||
          "Semicolon stats not configured."));
        return;
      }
      const d = payload.data;
      const cards = el("div", "grid grid-4");
      cards.append(
        card("Visitors today", d.visitors.today),
        card("Page views all time", d.visitors.total),
        card("Ada messages today", d.ada.messages_today, "all time: " + d.ada.messages_total),
        card("Errors today", d.errors.today)
      );
      box.append(cards);

      const lists = el("div", "grid grid-3");
      lists.append(
        listSection("Top pages",
          d.visitors.top_pages.map(function (p) { return p.page + " — " + p.views + " views"; })),
        listSection("Recent errors",
          d.errors.recent.map(function (e) {
            return "[" + e.day + "] " + (e.page || "?") + ": " + e.message;
          }))
      );
      box.append(lists);
    } catch (err) {
      box.append(el("p", "panel-hint",
        "Couldn't reach Semicolon's stats right now (" + err.message + ")."));
    }
  }

  function renderAdmin() {
    pageSlot.replaceChildren();
    pageSlot.className = "";

    const head = el("div", "section-head");
    head.append(el("span", "eyebrow", "Live"));
    head.append(el("h2", "", "Site overview"));
    pageSlot.append(head);

    const cosmosBox = el("div");
    pageSlot.append(cosmosBox);
    loadStats(cosmosBox);

    const semiBox = el("div");
    semiBox.style.marginTop = "2rem";
    pageSlot.append(semiBox);
    loadSemicolon(semiBox);
  }

  if (!window.AstroAccount) return; // account.js didn't load — nothing to gate on

  window.AstroAccount.onChange(function (user) {
    if (!user) return renderSignedOut();
    if (!user.isAdmin) return renderNotAuthorized(user.username);
    renderAdmin();
  });
})();
