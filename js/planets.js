/* ===================================================================
   planets.js — the eight planets.

   All the information lives in one array of objects (PLANETS).
   The page is then *generated* from that array. This is a much better
   habit than hand-typing eight nearly identical blocks of HTML: fix
   the template once and all eight cards get the fix.

   Figures are from NASA's planetary fact sheets. Moon counts are
   confirmed moons and genuinely do change — new small moons are
   discovered every few years.
   =================================================================== */

var PLANETS = [
  {
    name: "Mercury",
    css: "p-mercury",
    tag: "Terrestrial",
    type: "rocky",
    diameter: 4879,
    distanceKm: 57.9,
    distanceAu: 0.39,
    year: "88 Earth days",
    day: "59 Earth days",
    moons: 0,
    temp: "−173 °C to 427 °C",
    gravity: "3.7 m/s²",
    highlight: "The smallest planet, and the fastest — it laps the Sun four times a year.",
    facts: [
      "Has almost no atmosphere, so heat escapes instantly. The gap between its day and night temperatures is the largest of any planet.",
      "Despite being closest to the Sun, it is not the hottest — Venus is, because Venus traps heat.",
      "Its surface is covered in craters, much like our Moon, because there is no weather to erode them."
    ]
  },
  {
    name: "Venus",
    css: "p-venus",
    tag: "Terrestrial",
    type: "rocky",
    diameter: 12104,
    distanceKm: 108.2,
    distanceAu: 0.72,
    year: "225 Earth days",
    day: "243 Earth days",
    moons: 0,
    temp: "465 °C (nearly constant)",
    gravity: "8.9 m/s²",
    highlight: "The hottest planet in the solar system, and it spins backwards.",
    facts: [
      "A day on Venus is longer than its year — it rotates once in 243 days but orbits in 225.",
      "It rotates in the opposite direction to almost every other planet, so the Sun rises in the west.",
      "Its thick carbon-dioxide atmosphere presses down 92 times harder than Earth's air — like being 900 m underwater."
    ]
  },
  {
    name: "Earth",
    css: "p-earth",
    tag: "Terrestrial",
    type: "rocky",
    diameter: 12756,
    distanceKm: 149.6,
    distanceAu: 1.00,
    year: "365.25 days",
    day: "23 hours 56 minutes",
    moons: 1,
    temp: "−88 °C to 58 °C",
    gravity: "9.8 m/s²",
    highlight: "The only place in the universe where life is confirmed to exist.",
    facts: [
      "The only planet whose surface holds liquid water — which is why the search for life elsewhere follows the water.",
      "Its magnetic field deflects the solar wind. Without it, the atmosphere would slowly be stripped away, as happened to Mars.",
      "That extra quarter-day in its year is exactly why we add a leap day every four years."
    ]
  },
  {
    name: "Mars",
    css: "p-mars",
    tag: "Terrestrial",
    type: "rocky",
    diameter: 6792,
    distanceKm: 227.9,
    distanceAu: 1.52,
    year: "687 Earth days",
    day: "24 hours 37 minutes",
    moons: 2,
    temp: "−153 °C to 20 °C",
    gravity: "3.7 m/s²",
    highlight: "Home to Olympus Mons — the tallest volcano in the solar system.",
    facts: [
      "Olympus Mons rises about 22 km, nearly three times the height of Mount Everest.",
      "It looks red because its soil is rich in iron oxide — the same chemistry as rust.",
      "Its two moons, Phobos and Deimos, are tiny and lumpy — most likely captured asteroids."
    ]
  },
  {
    name: "Jupiter",
    css: "p-jupiter",
    tag: "Gas giant",
    type: "gas",
    diameter: 142984,
    distanceKm: 778.6,
    distanceAu: 5.20,
    year: "11.9 Earth years",
    day: "9 hours 56 minutes",
    moons: 97,
    temp: "−145 °C (cloud tops)",
    gravity: "24.8 m/s²",
    highlight: "More massive than every other planet in the solar system combined.",
    facts: [
      "The Great Red Spot is a storm wider than Earth that has been observed for at least 190 years.",
      "It spins so fast — one rotation in under 10 hours — that it bulges visibly at its equator.",
      "Its gravity shields the inner planets, pulling in or flinging away comets that might otherwise hit us."
    ]
  },
  {
    name: "Saturn",
    css: "p-saturn",
    tag: "Gas giant",
    type: "gas",
    diameter: 120536,
    distanceKm: 1433.5,
    distanceAu: 9.58,
    year: "29.4 Earth years",
    day: "10 hours 42 minutes",
    moons: 274,
    temp: "−178 °C (cloud tops)",
    gravity: "10.4 m/s²",
    highlight: "Less dense than water — given a big enough ocean, it would float.",
    facts: [
      "Its rings are made of billions of chunks of ice and rock, from grain-sized to house-sized.",
      "The rings are enormous but astonishingly thin — often only about 10 metres top to bottom.",
      "It has more confirmed moons than any other planet; 128 new ones were announced in 2025 alone."
    ]
  },
  {
    name: "Uranus",
    css: "p-uranus",
    tag: "Ice giant",
    type: "ice",
    diameter: 51118,
    distanceKm: 2872.5,
    distanceAu: 19.20,
    year: "84 Earth years",
    day: "17 hours 14 minutes",
    moons: 28,
    temp: "−224 °C",
    gravity: "8.7 m/s²",
    highlight: "Orbits tipped on its side, so its poles take turns facing the Sun.",
    facts: [
      "Its axis is tilted about 98°, probably knocked over by an enormous ancient collision.",
      "Each pole gets roughly 21 years of continuous sunlight, then 21 years of darkness.",
      "It is the coldest planet, dipping to −224 °C — colder even than Neptune, which is further out."
    ]
  },
  {
    name: "Neptune",
    css: "p-neptune",
    tag: "Ice giant",
    type: "ice",
    diameter: 49528,
    distanceKm: 4495.1,
    distanceAu: 30.05,
    year: "164.8 Earth years",
    day: "16 hours 6 minutes",
    moons: 16,
    temp: "−214 °C",
    gravity: "11.2 m/s²",
    highlight: "The windiest place we know of — gusts reach 2,100 km/h.",
    facts: [
      "It was found using mathematics before anyone saw it: astronomers predicted its position from wobbles in Uranus's orbit.",
      "Its winds are the fastest in the solar system, over 2,000 km/h — faster than the speed of sound on Earth.",
      "Only one spacecraft has ever visited: Voyager 2, in 1989."
    ]
  }
];

(function () {
  "use strict";

  var grid     = document.getElementById("planetGrid");
  var search   = document.getElementById("planetSearch");
  var empty    = document.getElementById("planetEmpty");
  var scaleBtn = document.getElementById("scaleToggle");
  var scaleNote= document.getElementById("scaleNote");
  var chips    = document.querySelectorAll("[data-filter]");
  if (!grid) return;

  var toScale = false;      // is the true-scale view switched on?
  var filter  = "all";      // which type chip is active

  var JUPITER = 142984;     // biggest planet — everything scales against it

  /* Work out how wide a planet should be drawn, in pixels. */
  function sizeFor(p) {
    if (toScale) {
      // True proportions. Mercury ends up genuinely tiny — that's the point.
      return Math.max(3, (p.diameter / JUPITER) * 170);
    }
    // Comfortable view: square-rooting compresses the huge range so
    // every planet is visible, while keeping them in the right order.
    var t = Math.sqrt(p.diameter / JUPITER);       // 0.18 → 1.0
    return 78 + t * 74;                            // roughly 92px → 152px
  }

  function applySizes() {
    PLANETS.forEach(function (p, i) {
      var body = grid.querySelector('[data-index="' + i + '"] .planet-body');
      if (body) body.style.setProperty("--size", sizeFor(p) + "px");
    });
  }

  /* Build the HTML for one planet card. */
  function cardHTML(p, i) {
    var factList = p.facts.map(function (f) {
      return "<li style='margin-bottom:.5rem;'>" + f + "</li>";
    }).join("");

    return '' +
    '<article class="planet-card" data-index="' + i + '" data-type="' + p.type + '"' +
    '         tabindex="0" role="button" aria-expanded="false">' +
      '<div class="planet-stage">' +
        '<div class="planet-body ' + p.css + '" aria-hidden="true"></div>' +
      '</div>' +
      '<h3 class="planet-name">' + p.name + '</h3>' +
      '<div class="planet-tag">' + p.tag + '</div>' +
      '<p style="font-size:.92rem; margin-bottom:0;">' + p.highlight + '</p>' +

      '<div class="planet-details">' +
        '<div>' +
          '<ul class="stat-list">' +
            row("Diameter",        p.diameter.toLocaleString() + " km") +
            row("Distance from Sun", p.distanceKm.toLocaleString() + " million km (" + p.distanceAu + " AU)") +
            row("Orbital period",  p.year) +
            row("Length of day",   p.day) +
            row("Moons",           p.moons === 0 ? "None" : p.moons.toLocaleString()) +
            row("Temperature",     p.temp) +
            row("Surface gravity", p.gravity) +
          '</ul>' +
          '<div class="fact-note">' +
            '<strong>Key facts</strong>' +
            '<ul style="margin:.6rem 0 0; padding-left:1.1rem;">' + factList + '</ul>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<p class="planet-hint">Click to see the numbers ↓</p>' +
    '</article>';
  }

  function row(key, value) {
    return '<li><span class="k">' + key + '</span><span class="v">' + value + '</span></li>';
  }

  /* ---- render everything once ---- */
  grid.innerHTML = PLANETS.map(cardHTML).join("");
  applySizes();

  /* ---- expand / collapse ---- */
  function toggleCard(card) {
    var open = card.getAttribute("aria-expanded") === "true";
    card.setAttribute("aria-expanded", open ? "false" : "true");
    card.querySelector(".planet-hint").textContent =
      open ? "Click to see the numbers ↓" : "Click to close ↑";
  }

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".planet-card");
    if (card) toggleCard(card);
  });

  // Keyboard users should get the same behaviour as mouse users.
  grid.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest(".planet-card");
    if (!card) return;
    e.preventDefault();               // stop Space from scrolling the page
    toggleCard(card);
  });

  /* ---- search + filter ---- */
  function refine() {
    var q = (search ? search.value : "").trim().toLowerCase();
    var shown = 0;

    PLANETS.forEach(function (p, i) {
      var card = grid.querySelector('[data-index="' + i + '"]');
      // Search across name, tag and the highlight sentence
      var haystack = (p.name + " " + p.tag + " " + p.highlight).toLowerCase();
      var matchText = q === "" || haystack.indexOf(q) !== -1;
      var matchType = filter === "all" || p.type === filter;
      var show = matchText && matchType;

      card.style.display = show ? "" : "none";
      if (show) shown++;
    });

    if (empty) empty.classList.toggle("show", shown === 0);
  }

  if (search) search.addEventListener("input", refine);

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      chip.setAttribute("aria-pressed", "true");
      filter = chip.dataset.filter;
      refine();
    });
  });

  /* ---- to-scale toggle ---- */
  if (scaleBtn) {
    scaleBtn.addEventListener("click", function () {
      toScale = !toScale;
      scaleBtn.setAttribute("aria-pressed", toScale ? "true" : "false");
      scaleBtn.textContent = toScale ? "↔ Showing true scale" : "↔ Show true scale";
      scaleNote.innerHTML = toScale
        ? "Now sized by real diameter, relative to Jupiter. Mercury is that speck. " +
          "<strong>Distances are still not to scale</strong> — if they were, Neptune would be about 400 screens to the right."
        : "Sizes are adjusted so every planet stays visible — <strong>not to scale</strong>. " +
          "Press the button above to see the real proportions.";
      applySizes();
    });
  }
})();
