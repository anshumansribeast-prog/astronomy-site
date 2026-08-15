/* ===================================================================
   chat.js — Beast, the astronomy chat assistant.

   Beast answers using the SAME data every other page on this site
   renders from: PLANETS (planets.js), CONSTELLATIONS
   (constellations.js), FACTS (facts.js), and the real moon-phase
   maths in moon.js. None of that is duplicated here — if a number on
   the planets page changes, Beast's answer changes with it, because
   it reads the very same array.

   Beast lives on its own page (beast.html) rather than floating over
   every page as a corner popup — it used to be a self-injecting
   floating widget, but that meant it covered page content everywhere
   you went even when you didn't want it open. Now this script only
   renders anything if it finds beast.html's #beastChat container;
   on every other page it's a harmless no-op.
   =================================================================== */

(function () {
  "use strict";

  var container = document.getElementById("beastChat");
  if (!container) return; // not on beast.html — nothing to do

  /* Word-boundary matching, not plain .includes() — otherwise short
     keywords like "star" would fire on "start". Same trick chat.js
     uses in the cosmos-v2 project. */
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function hasWord(lower, phrase) {
    return new RegExp("\\b" + escapeRegExp(phrase) + "\\b").test(lower);
  }

  /* ---------------- build the chat area ---------------- */
  container.className = "beast-page";
  container.innerHTML =
    '<div class="beast-log" id="beastLog"></div>' +
    '<form class="beast-form" id="beastForm">' +
      '<input type="text" id="beastInput" placeholder="Ask Beast something…" autocomplete="off">' +
      '<button type="submit" class="btn btn-primary beast-send">Send</button>' +
    '</form>';

  var log = container.querySelector("#beastLog");
  var form = container.querySelector("#beastForm");
  var input = container.querySelector("#beastInput");

  function addMessage(text, from, imageUrl) {
    var bubble = document.createElement("div");
    bubble.className = "beast-bubble beast-" + from;
    bubble.textContent = text;
    if (imageUrl) {
      var img = document.createElement("img");
      img.src = imageUrl;
      img.alt = "NASA Astronomy Picture of the Day";
      img.className = "beast-apod-img";
      bubble.appendChild(img);
    }
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }

  function addTextNode(parent, text) {
    var parts = String(text).split("\n");
    parts.forEach(function (part, i) {
      if (i > 0) parent.appendChild(document.createElement("br"));
      parent.appendChild(document.createTextNode(part));
    });
  }

  function showThinking() {
    var thinking = document.createElement("div");
    thinking.className = "beast-bubble beast-bot beast-thinking";
    thinking.textContent = "Thinking…";
    log.appendChild(thinking);
    log.scrollTop = log.scrollHeight;
    return thinking;
  }

  var chatHistory = [];

  function greet(user, learnedLine) {
    var name = user && window.AstroAccount ? window.AstroAccount.displayName(user) : null;
    var learnBit = learnedLine ? " " + learnedLine : " I study something new about the sky every day.";
    var hello = name
      ? "Hey " + name + "!" + learnBit + " Today's NASA picture is below. Ask me about a planet, a constellation, the Moon, or say 'fact'."
      : "Hey, I'm Beast!" + learnBit + " Today's NASA picture is below. Ask me about a planet, a constellation, the Moon, or say 'fact'.";
    addMessage(hello, "bot");
  }

  function loadDailyLearning(user) {
    fetch("/api/beast/learned")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var summary = data && (data.summary || (data.data && data.data.summary));
        greet(user, summary || null);
        input.focus();
        showTodaysApod(false);
        scheduleApodMidnightRefresh();
      })
      .catch(function () {
        greet(user, null);
        input.focus();
        showTodaysApod(false);
        scheduleApodMidnightRefresh();
      });
  }

  loadDailyLearning(window.AstroAccount ? window.AstroAccount.user : null);

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

  /* Someone who names a planet AND a specific field ("how far is Mars",
     "how many moons does Jupiter have") gets a longer answer about just
     that field, with an Earth comparison where that's meaningful, instead
     of the generic planetReply() summary. Ask a bare planet name and you
     still get the summary — this only kicks in on top of a field word. */
  function findEarth() {
    if (typeof PLANETS === "undefined") return null;
    return PLANETS.find(function (p) { return p.name === "Earth"; });
  }
  var FIELD_QUERIES = [
    { keys: ["diameter", "size", "big", "large", "wide"], detail: function (p) {
      var earth = findEarth();
      var cmp = "";
      if (earth && p.name !== "Earth") {
        cmp = p.diameter >= earth.diameter
          ? " — about " + (p.diameter / earth.diameter).toFixed(1) + "x wider than Earth."
          : " — about " + (earth.diameter / p.diameter).toFixed(1) + "x narrower than Earth.";
      }
      return p.name + " is " + p.diameter.toLocaleString() + " km across" + cmp;
    } },
    { keys: ["distance", "far", "away", "close"], detail: function (p) {
      return p.name + " orbits about " + p.distanceKm.toLocaleString() +
        " million km from the Sun on average (" + p.distanceAu + " AU — " +
        p.distanceAu + "x Earth's distance from the Sun).";
    } },
    { keys: ["moon", "moons"], detail: function (p) {
      return p.moons === 0
        ? p.name + " has no confirmed moons."
        : p.name + " has " + p.moons.toLocaleString() + " confirmed moon" + (p.moons === 1 ? "" : "s") + ".";
    } },
    { keys: ["year", "years", "orbit", "orbital period"], detail: function (p) {
      return "A year on " + p.name + " (one full orbit of the Sun) takes " + p.year + ".";
    } },
    { keys: ["day", "days", "rotation", "spin", "rotate"], detail: function (p) {
      return "A day on " + p.name + " (one full spin) takes " + p.day + ".";
    } },
    { keys: ["temperature", "temp", "hot", "cold"], detail: function (p) {
      return "Surface temperatures on " + p.name + " range " + p.temp + ".";
    } },
    { keys: ["gravity", "weight", "heavy"], detail: function (p) {
      var earthG = 9.8;
      var g = parseFloat(p.gravity);
      var cmp = p.name !== "Earth" && !isNaN(g)
        ? " — about " + (g / earthG).toFixed(1) + "x Earth's gravity."
        : "";
      return "Gravity on " + p.name + " is " + p.gravity + cmp;
    } },
    { keys: ["type", "rocky", "gas giant", "made of"], detail: function (p) {
      var article = /^[aeiou]/i.test(p.type) ? "an" : "a";
      return p.name + " is " + article + " " + p.type + " planet (" + p.tag + ").";
    } }
  ];
  function fieldReply(p, lower) {
    var hit = FIELD_QUERIES.find(function (fq) {
      return fq.keys.some(function (k) { return hasWord(lower, k); });
    });
    return hit ? hit.detail(p) : null;
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

  /* Real-data lookups first (accurate, instant, match this site's own
     numbers) — Ollama only runs for what none of those cover. Returns
     a string if one of the fixed rules matched, or null if the caller
     should fall through to askOllama().
  */
  function ruleReply(text) {
    var lower = text.toLowerCase();

    var planet = findPlanet(lower);
    if (planet) return fieldReply(planet, lower) || planetReply(planet);

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
    return hit ? hit.reply : null;
  }

  /* Beast's brain for open questions the fixed rules above don't cover.
     Calls /api/beast on this same server, which proxies to Ollama on the
     host. Fails silently (returns null) when Ollama is offline so the
     DEFAULT_REPLY still applies.
  */
  var BEAST_SERVER_URL = "/api/beast";
  // Generous: Ollama unloads an idle model and has to reload it into
  // memory on the next request, which alone can take 10+ seconds on this
  // laptop's CPU before the actual answer even starts generating.
  var OLLAMA_TIMEOUT_MS = 30000;

  function askOllama(text) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, OLLAMA_TIMEOUT_MS);

    return fetch(BEAST_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: chatHistory.slice(-6) }),
      signal: controller.signal
    })
      .then(function (resp) {
        if (!resp.ok) throw new Error("Beast server HTTP " + resp.status);
        return resp.json();
      })
      .then(function (data) {
        var reply = (data.reply || (data.data && data.data.reply) || "").trim();
        return reply || null;
      })
      .catch(function () { return null; })
      .finally(function () { clearTimeout(timer); });
  }

  /* ---------------- live NASA data: Astronomy Picture of the Day ----------------
     Real API call, unlike everything else above (which reads this site's own
     baked-in data). NASA's APOD endpoint allows CORS and works straight from
     the browser with no server involved. DEMO_KEY is NASA's shared public key
     (30 req/hour, 50/day per IP) — fine for a small site; swap in a free
     personal key from https://api.nasa.gov/ if that limit ever gets hit.

     Cached in localStorage by calendar date so the same picture stays up all
     day, then refreshes automatically after midnight or when you hit Refresh.
  */
  var NASA_API_KEY = "DEMO_KEY";
  var NASA_APOD_BASE = "https://api.nasa.gov/planetary/apod?api_key=" + NASA_API_KEY;
  var NASA_TIMEOUT_MS = 15000;
  var APOD_CACHE_KEY = "cosmos_beast_apod_v1";

  var apodBubbleEl = null;
  var apodDateShown = null;
  var apodLoading = false;
  var apodMidnightTimer = null;

  var APOD_PHRASES = ["picture of the day", "photo of the day", "apod", "space picture", "nasa picture", "today's picture"];
  var APOD_REFRESH_PHRASES = ["refresh picture", "refresh apod", "new picture", "update picture", "reload picture"];

  function pad2(n) { return n < 10 ? "0" + n : String(n); }

  function todayDateString() {
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function isApodRequest(lower) {
    return APOD_PHRASES.some(function (phrase) { return hasWord(lower, phrase); });
  }

  function isApodRefreshRequest(lower) {
    return APOD_REFRESH_PHRASES.some(function (phrase) { return hasWord(lower, phrase); });
  }

  function readApodCache() {
    try {
      var raw = localStorage.getItem(APOD_CACHE_KEY);
      if (!raw) return null;
      var cached = JSON.parse(raw);
      if (cached && cached.date === todayDateString()) return cached;
    } catch (err) { /* private browsing / quota */ }
    return null;
  }

  function writeApodCache(result) {
    try {
      localStorage.setItem(APOD_CACHE_KEY, JSON.stringify({
        date: result.date || todayDateString(),
        text: result.text,
        image: result.image || null
      }));
    } catch (err) { /* ignore */ }
  }

  function parseApodResponse(data) {
    var text = (data.title || "NASA's Astronomy Picture of the Day") +
      (data.date ? " (" + data.date + ")" : "") + "\n" +
      (data.explanation || "");
    var image = data.media_type === "image" ? (data.url || data.hdurl) : null;
    if (data.media_type === "video") text += "\nToday's is a video — see it at " + data.url;
    return { date: data.date || todayDateString(), text: text, image: image };
  }

  function fetchApodFromNasa(date) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, NASA_TIMEOUT_MS);
    var url = NASA_APOD_BASE + "&date=" + encodeURIComponent(date || todayDateString());

    return fetch(url, { signal: controller.signal })
      .then(function (resp) {
        if (!resp.ok) throw new Error("NASA HTTP " + resp.status);
        return resp.json();
      })
      .then(parseApodResponse)
      .catch(function () {
        return {
          date: date || todayDateString(),
          text: "Couldn't reach NASA's picture-of-the-day service right now — try again in a bit.",
          image: null
        };
      })
      .finally(function () { clearTimeout(timer); });
  }

  function fetchApod(forceRefresh) {
    if (!forceRefresh) {
      var cached = readApodCache();
      if (cached) return Promise.resolve(cached);
    }
    return fetchApodFromNasa(todayDateString()).then(function (result) {
      writeApodCache(result);
      return result;
    });
  }

  function renderApodBubble(result) {
    if (!apodBubbleEl) {
      apodBubbleEl = document.createElement("div");
      apodBubbleEl.className = "beast-bubble beast-bot beast-apod-card";
      log.appendChild(apodBubbleEl);
    }

    apodBubbleEl.replaceChildren();

    var head = document.createElement("div");
    head.className = "beast-apod-head";

    var label = document.createElement("span");
    label.className = "beast-apod-label";
    label.textContent = "Picture of the day · " + (result.date || todayDateString());

    var refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.className = "beast-apod-refresh";
    refreshBtn.textContent = "Refresh";
    refreshBtn.addEventListener("click", function () {
      showTodaysApod(true);
    });

    head.append(label, refreshBtn);
    apodBubbleEl.appendChild(head);

    var body = document.createElement("div");
    body.className = "beast-apod-body";
    addTextNode(body, result.text);
    apodBubbleEl.appendChild(body);

    if (result.image) {
      var img = document.createElement("img");
      img.src = result.image;
      img.alt = "NASA Astronomy Picture of the Day";
      img.className = "beast-apod-img";
      img.loading = "lazy";
      apodBubbleEl.appendChild(img);
    }

    apodDateShown = result.date || todayDateString();
    log.scrollTop = log.scrollHeight;
  }

  function showTodaysApod(forceRefresh) {
    if (apodLoading) return Promise.resolve();
    apodLoading = true;

    if (!forceRefresh && apodBubbleEl && apodDateShown === todayDateString()) {
      apodLoading = false;
      return Promise.resolve();
    }

    var thinking = apodBubbleEl ? null : showThinking();

    return fetchApod(forceRefresh).then(function (result) {
      if (thinking) thinking.remove();
      renderApodBubble(result);
    }).finally(function () {
      apodLoading = false;
    });
  }

  function msUntilNextMidnight() {
    var now = new Date();
    var next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return Math.max(1000, next.getTime() - now.getTime() + 1000);
  }

  function scheduleApodMidnightRefresh() {
    if (apodMidnightTimer) clearTimeout(apodMidnightTimer);
    apodMidnightTimer = setTimeout(function () {
      showTodaysApod(true).finally(scheduleApodMidnightRefresh);
    }, msUntilNextMidnight());
  }

  function maybeRefreshApodForNewDay() {
    if (apodDateShown !== todayDateString()) showTodaysApod(true);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") maybeRefreshApodForNewDay();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    chatHistory.push({ role: "user", content: text });
    input.value = "";
    var lower = text.toLowerCase();

    if (isApodRequest(lower) || isApodRefreshRequest(lower)) {
      showTodaysApod(isApodRefreshRequest(lower));
      return;
    }

    var reply = ruleReply(text);
    if (reply) {
      addMessage(reply, "bot");
      chatHistory.push({ role: "assistant", content: reply });
      return;
    }

    var thinking = showThinking();
    askOllama(text).then(function (ollamaReply) {
      thinking.remove();
      var finalReply = ollamaReply || DEFAULT_REPLY;
      addMessage(finalReply, "bot");
      chatHistory.push({ role: "assistant", content: finalReply });
    });
  });
})();
