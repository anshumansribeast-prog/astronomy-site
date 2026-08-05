/* ===================================================================
   chat.js — Beast, the site-wide astronomy chat widget.

   Beast answers using the SAME data every other page on this site
   renders from: PLANETS (planets.js), CONSTELLATIONS
   (constellations.js), FACTS (facts.js), and the real moon-phase
   maths in moon.js. None of that is duplicated here — if a number on
   the planets page changes, Beast's answer changes with it, because
   it reads the very same array.

   Beast builds its own floating button + panel and appends them to
   <body> itself, so every page only needs one extra <script> tag —
   no HTML markup to keep in sync across eight pages by hand.
   =================================================================== */

(function () {
  "use strict";

  /* Word-boundary matching, not plain .includes() — otherwise short
     keywords like "star" would fire on "start". Same trick chat.js
     uses in the cosmos-v2 project. */
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function hasWord(lower, phrase) {
    return new RegExp("\\b" + escapeRegExp(phrase) + "\\b").test(lower);
  }

  /* ---------------- build the widget ---------------- */
  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.id = "beastToggle";
  toggle.className = "beast-toggle";
  toggle.setAttribute("aria-label", "Chat with Beast");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = '<span aria-hidden="true">💬</span>';

  var panel = document.createElement("div");
  panel.id = "beastPanel";
  panel.className = "beast-panel";
  panel.hidden = true;
  panel.innerHTML =
    '<div class="beast-head">' +
      '<div>' +
        '<span class="beast-title">Beast</span>' +
        '<span class="beast-sub">Ask about planets, stars, the Moon…</span>' +
      '</div>' +
      '<button type="button" class="beast-close" aria-label="Close chat">✕</button>' +
    '</div>' +
    '<div class="beast-log" id="beastLog"></div>' +
    '<form class="beast-form" id="beastForm">' +
      '<input type="text" id="beastInput" placeholder="Ask Beast something…" autocomplete="off">' +
      '<button type="submit" class="btn btn-primary beast-send">Send</button>' +
    '</form>';

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  var log = panel.querySelector("#beastLog");
  var form = panel.querySelector("#beastForm");
  var input = panel.querySelector("#beastInput");
  var closeBtn = panel.querySelector(".beast-close");

  function addMessage(text, from) {
    var bubble = document.createElement("div");
    bubble.className = "beast-bubble beast-" + from;
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    if (!log.children.length) {
      addMessage("Hey, I'm Beast! Ask me about a planet, a constellation, the Moon, or say 'fact' for something strange and true.", "bot");
    }
    input.focus();
  }
  function closePanel() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    if (panel.hidden) openPanel(); else closePanel();
  });
  closeBtn.addEventListener("click", closePanel);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) closePanel();
  });

  /* ---------------- real-data lookups ---------------- */

  /* Same PLANETS array planets.html renders its grid from. */
  function findPlanet(lower) {
    if (typeof PLANETS === "undefined") return null;
    return PLANETS.find(function (p) { return hasWord(lower, p.name.toLowerCase()); });
  }
  function planetReply(p) {
    var fact = p.facts[Math.floor(Math.random() * p.facts.length)];
    return p.name + " — " + p.highlight + "\n" +
      p.distanceKm.toLocaleString() + " million km from the Sun (" + p.distanceAu + " AU) · " +
      (p.moons === 0 ? "no moons" : p.moons.toLocaleString() + " moon" + (p.moons === 1 ? "" : "s")) +
      " · " + p.temp + "\n" + fact;
  }

  /* Same CONSTELLATIONS array constellations.html draws its star maps from. */
  function findConstellation(lower) {
    if (typeof CONSTELLATIONS === "undefined") return null;
    return CONSTELLATIONS.find(function (c) { return hasWord(lower, c.name.toLowerCase()); });
  }
  function constellationReply(c) {
    return c.name + " (" + c.latin + ") — best seen in " + c.season + ", " + c.hemisphere.toLowerCase() + " skies.\n" +
      "How to find it: " + c.find + "\n" + c.myth;
  }

  /* Same FACTS array facts.html builds its fact wall from. */
  function randomFact() {
    if (typeof FACTS === "undefined") return null;
    var f = FACTS[Math.floor(Math.random() * FACTS.length)];
    return "(" + f.cat + ") " + f.text;
  }

  /* Same synodic-month maths moon.html uses for tonight's real phase. */
  function moonReply() {
    if (typeof moonPhaseFraction !== "function") return "Check the Moon page for tonight's phase.";
    var frac = moonPhaseFraction(new Date());
    var name = moonPhaseName(frac);
    var illum = Math.round(moonIllumination(frac) * 100);
    return "Right now the Moon is a " + name + ", about " + illum + "% lit. See the Moon page for any other date.";
  }

  /* ---------------- general astronomy replies ---------------- */
  var REPLIES = [
    { match: ["your name", "who are you"], reply: "I'm Beast! I answer from the same real numbers this site is built on, not made-up ones." },
    { match: ["hi", "hello", "hey"], reply: "Hey! Ask me about a planet, a constellation, or say 'moon' or 'fact'." },
    { match: ["quiz"], reply: "Head to the Quiz page — four levels, Stargazer through Astronomer, or the shorter quiz on the Facts page." },
    { match: ["solar system"], reply: "Our solar system is the Sun plus everything held by its gravity: 8 planets, their moons, dwarf planets like Pluto, and countless asteroids and comets — formed about 4.6 billion years ago." },
    { match: ["black hole", "blackhole"], reply: "A black hole is a region of space where gravity is so strong that nothing, not even light, can escape. They form when a massive star runs out of fuel and collapses in on itself." },
    { match: ["comet"], reply: "Comets are icy leftovers from the early solar system. As they swing close to the Sun the ice heats up and streams away, forming the glowing tail you see pointing away from the Sun." },
    { match: ["asteroid"], reply: "Asteroids are rocky leftovers from the solar system's formation, too small to become planets. Most orbit in the asteroid belt, between Mars and Jupiter." },
    { match: ["meteor", "shooting star"], reply: "A meteor is the streak of light you see when a bit of space rock or dust burns up in Earth's atmosphere. A piece that survives to the ground is called a meteorite." },
    { match: ["galaxy", "milky way"], reply: "A galaxy is a huge collection of stars, gas, and dust held together by gravity. We live in the Milky Way, home to somewhere between 100 and 400 billion stars." },
    { match: ["star"], reply: "Stars are giant balls of gas — mostly hydrogen — held together by their own gravity. They shine because nuclear fusion in their core turns hydrogen into helium, releasing huge amounts of light and heat." },
    { match: ["light year", "lightyear"], reply: "A light year is a unit of distance, not time — how far light travels in one year, about 9.46 trillion km." },
    { match: ["eclipse"], reply: "A solar eclipse happens when the Moon passes between the Sun and Earth, blocking its light. A lunar eclipse happens when Earth passes between the Sun and Moon instead, casting Earth's shadow on the Moon." },
    { match: ["sun"], reply: "The Sun is a star — the closest one to Earth, about 150 million km away. About 1.3 million Earths could fit inside it, and its gravity holds the whole solar system in orbit." },
    { match: ["telescope"], reply: "Telescopes like Hubble and the James Webb Space Telescope collect far more light than an eye can, which is what lets them see objects that are impossibly faint and distant." },
    { match: ["nasa"], reply: "NASA is the USA's space agency — it's run missions from the Apollo Moon landings to the Mars rovers to the James Webb telescope. The planet numbers on this site come from NASA's own fact sheets." },
    { match: ["bye"], reply: "Clear skies!" }
  ];
  var DEFAULT_REPLY = "Not sure about that one — try a planet name, a constellation like 'Orion', 'moon', or 'fact'.";

  function botReply(text) {
    var lower = text.toLowerCase();

    var planet = findPlanet(lower);
    if (planet) return planetReply(planet);

    var constellation = findConstellation(lower);
    if (constellation) return constellationReply(constellation);

    if (hasWord(lower, "moon")) return moonReply();

    if (hasWord(lower, "fact") || hasWord(lower, "random")) {
      var f = randomFact();
      if (f) return f;
    }

    var hit = REPLIES.find(function (r) {
      return r.match.some(function (phrase) { return hasWord(lower, phrase); });
    });
    return hit ? hit.reply : DEFAULT_REPLY;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    input.value = "";
    addMessage(botReply(text), "bot");
  });
})();
