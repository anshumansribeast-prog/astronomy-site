/* Renders the knowledge account into every [data-knowledge-account] mount.
   Static numbers ship in knowledge-account-data.js. /api/knowledge-account
   refreshes them when the server is up. Helper learned/remaining moves in
   this browser as lessons get an "explain me this". */
(function () {
  "use strict";

  var NAME_KEY = "personaHelperName";
  var SEEN_KEY = "helperLessonsExplained";

  function readName() {
    try { return localStorage.getItem(NAME_KEY) || ""; } catch (err) { return ""; }
  }
  function writeName(name) {
    try { localStorage.setItem(NAME_KEY, name); } catch (err) {}
  }
  function readSeen() {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"); } catch (err) { return []; }
  }

  function withHelperProgress(account) {
    var copy = JSON.parse(JSON.stringify(account));
    var seen = readSeen();
    copy.personas.forEach(function (p) {
      if (p.id !== "helper") return;
      var custom = readName().trim();
      p.name = custom || p.defaultName || "Helper";
      var total = p.total || (p.lessons || []).length;
      var learned = seen.filter(function (id) { return (p.lessons || []).indexOf(id) !== -1; }).length;
      p.learned = learned;
      p.gained = learned;
      p.remaining = Math.max(0, total - learned);
      p.total = total;
    });
    copy.totalGained = copy.personas.reduce(function (s, p) { return s + p.gained; }, 0);
    copy.totalRemaining = copy.personas.reduce(function (s, p) { return s + p.remaining; }, 0);
    return copy;
  }

  function bar(persona) {
    var pct = persona.total ? Math.round((persona.learned / persona.total) * 100) : 0;
    var alias = persona.alsoKnownAs ? " <span class=\"ka-alias\">also " + persona.alsoKnownAs + "</span>" : "";
    return (
      '<li class="ka-row">' +
        '<div class="ka-name">' + persona.name + alias + "</div>" +
        '<div class="ka-meter" role="img" aria-label="' + persona.name + " " + persona.learned + " learned, " + persona.remaining + ' remaining">' +
          '<span style="width:' + pct + '%"></span>' +
        "</div>" +
        '<div class="ka-counts"><strong>' + persona.learned + "</strong> learned · <strong>" + persona.remaining + "</strong> still to learn</div>" +
      "</li>"
    );
  }

  function siteBlock(live, site) {
    var people = live.personas.filter(function (p) { return p.site === site.id; });
    if (!people.length) return "";
    var gained = people.reduce(function (s, p) { return s + p.gained; }, 0);
    var left = people.reduce(function (s, p) { return s + p.remaining; }, 0);
    return (
      '<section class="ka-site">' +
        "<h4>" + site.name + ' <a class="ka-site-link" href="' + site.href + '">account</a></h4>' +
        '<p class="ka-counts">This row: <strong>' + gained + "</strong> learned · <strong>" + left + "</strong> still to learn</p>" +
        '<ul class="ka-list">' + people.map(bar).join("") + "</ul>" +
      "</section>"
    );
  }

  function paint(root, account) {
    var live = withHelperProgress(account);
    var helper = live.personas.filter(function (p) { return p.id === "helper"; })[0];
    var sites = live.sites || [
      { id: "cosmos", name: "Cosmos", href: "/account.html" },
      { id: "semicolon", name: "Semicolon", href: "/semicolon/pages/account.html" }
    ];
    root.innerHTML =
      '<p class="eyebrow">Knowledge account</p>' +
      "<h3>Cosmos row and Semicolon row</h3>" +
      sites.map(function (site) { return siteBlock(live, site); }).join("") +
      '<p class="ka-total">Total knowledge gained: <strong>' + live.totalGained + "</strong>" +
        " · still to learn: <strong>" + live.totalRemaining + "</strong></p>" +
      '<form class="ka-name" data-ka-form>' +
        '<label>Helper name <input name="helperName" maxlength="24" autocomplete="off" placeholder="' +
          (helper && helper.defaultName ? helper.defaultName : "Henwin") +
          '" value="' + (readName() || "") + '"></label>' +
        '<button class="btn btn-ghost" type="submit">Save name</button>' +
      "</form>" +
      '<p class="ka-hint">Henwin, Switi, Mira, or any name. Both sites show Beast, Mira (Ada), and this helper.</p>';
    var form = root.querySelector("[data-ka-form]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input");
      writeName((input.value || "").trim());
      paint(root, account);
    });
  }

  function mounts() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-knowledge-account]"));
  }

  function show(account) {
    window.KNOWLEDGE_ACCOUNT = account;
    mounts().forEach(function (root) { paint(root, account); });
  }

  var seed = window.KNOWLEDGE_ACCOUNT;
  if (seed) show(seed);
  fetch("/api/knowledge-account")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (body) {
      var data = body && (body.data || body);
      if (data && data.personas) show(data);
    })
    .catch(function () {});

  window.KnowledgeAccount = {
    helperName: function () {
      var account = window.KNOWLEDGE_ACCOUNT;
      var helper = account && account.personas && account.personas.filter(function (p) { return p.id === "helper"; })[0];
      return readName().trim() || (helper && helper.defaultName) || "Henwin";
    },
    markExplained: function (lessonId) {
      if (!lessonId) return;
      var seen = readSeen();
      if (seen.indexOf(lessonId) === -1) seen.push(lessonId);
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (err) {}
      if (window.KNOWLEDGE_ACCOUNT) show(window.KNOWLEDGE_ACCOUNT);
    }
  };
})();
