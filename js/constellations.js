/* ===================================================================
   constellations.js

   Each constellation stores its stars as [x, y, radius] inside a
   100 × 62 grid, plus a list of which stars to join with lines.
   The SVG is then built from those numbers — so the star patterns
   are real geometry, not pictures.

   Star sizes follow apparent brightness: the biggest dots are the
   ones you notice first with your own eyes.
   =================================================================== */

var CONSTELLATIONS = [
  {
    name: "Orion",
    latin: "The Hunter",
    season: "Winter",
    hemisphere: "Both",
    brightest: "Rigel (mag 0.13)",
    find: "Look for three bright stars in a short, straight, evenly spaced line — that's Orion's Belt, the easiest pattern in the whole sky to spot.",
    myth: "Orion was a giant huntsman who boasted that he could kill every animal on Earth. Gaia, the earth goddess, was not impressed, and sent a scorpion to stop him. Both were placed among the stars — and they were set on opposite sides of the sky, so that Orion sinks below the horizon as Scorpius rises. The hunter is still running from the scorpion, and always will be.",
    stars: [[38,14,1.9],[62,17,1.4],[58,32,1.3],[50,34,1.4],[42,36,1.3],[40,52,1.3],[64,50,2.0]],
    links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,2],[0,4]]
  },
  {
    name: "Ursa Major",
    latin: "The Great Bear",
    season: "Spring",
    hemisphere: "Northern",
    brightest: "Alioth (mag 1.76)",
    find: "The seven stars of the Big Dipper form a saucepan. Follow the two stars at the end of the pan away from the handle and you arrive at Polaris, the North Star.",
    myth: "Zeus fell in love with the nymph Callisto, and his wife Hera turned her into a bear in revenge. Years later Callisto's son Arcas met the bear while hunting and raised his spear, not knowing it was his mother. Zeus stopped the spear in mid-air and swept them both into the sky — Callisto as the Great Bear, Arcas as the Little Bear beside her.",
    stars: [[20,20,1.5],[22,32,1.5],[36,34,1.4],[38,24,1.1],[52,20,1.6],[65,16,1.5],[78,14,1.6]],
    links: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]]
  },
  {
    name: "Ursa Minor",
    latin: "The Little Bear",
    season: "All year",
    hemisphere: "Northern",
    brightest: "Polaris (mag 1.98)",
    find: "Polaris sits at the very tip of the handle. It barely moves all night — every other star appears to wheel around it, because it sits almost exactly above Earth's north pole.",
    myth: "The Little Bear is Arcas, Callisto's son, carried into the sky beside his mother. For sailors this was the single most valuable pattern in the heavens: because Polaris holds still while the sky turns, finding it tells you which way is north, anywhere in the northern hemisphere, on any clear night.",
    stars: [[14,14,1.7],[25,19,1.0],[36,25,1.0],[44,34,1.1],[57,40,1.1],[66,28,1.6],[62,15,1.3]],
    links: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]]
  },
  {
    name: "Cassiopeia",
    latin: "The Queen",
    season: "Autumn",
    hemisphere: "Northern",
    brightest: "Schedar (mag 2.24)",
    find: "Five bright stars in a clear W shape (or M, depending on the time of night). It sits opposite the Big Dipper across Polaris, so when one is high, the other is low.",
    myth: "Queen Cassiopeia boasted that she and her daughter Andromeda were more beautiful than the sea nymphs. Poseidon punished the insult by sending a sea monster to ravage her kingdom. Cassiopeia was tied to a chair and set spinning around the pole forever — which is why, for half of every night, she hangs upside down.",
    stars: [[16,20,1.5],[32,38,1.4],[48,18,1.5],[64,40,1.3],[80,22,1.2]],
    links: [[0,1],[1,2],[2,3],[3,4]]
  },
  {
    name: "Leo",
    latin: "The Lion",
    season: "Spring",
    hemisphere: "Both",
    brightest: "Regulus (mag 1.40)",
    find: "Find the backwards question mark — that's the lion's head and mane, called the Sickle. Regulus is the bright dot at its base, sitting almost exactly on the path the Sun follows.",
    myth: "The Nemean Lion had a hide no weapon could pierce. Heracles, sent to kill it as the first of his twelve labours, finally strangled it with his bare hands, then skinned it using the lion's own claws — the only thing sharp enough to cut it. He wore the pelt as armour ever after, and Zeus set the lion in the stars.",
    stars: [[28,44,1.9],[26,34,1.1],[30,24,1.5],[36,17,1.2],[44,14,1.1],[52,18,1.1],[68,24,1.4],[66,34,1.2],[82,36,1.6]],
    links: [[0,1],[1,2],[2,3],[3,4],[4,5],[0,7],[7,6],[6,8],[8,7],[2,6]]
  },
  {
    name: "Scorpius",
    latin: "The Scorpion",
    season: "Summer",
    hemisphere: "Southern",
    brightest: "Antares (mag 1.06)",
    find: "Look low in the south on a summer night for a long curving hook of stars. Antares glows distinctly red at its heart — its name means 'rival of Mars'.",
    myth: "This is the scorpion Gaia sent to bring down the boastful hunter Orion. It succeeded, and both were lifted into the sky — but placed at opposite ends, so they can never meet again. Watch through the year and you'll see it: as Scorpius climbs in the east, Orion is already setting in the west.",
    stars: [[26,12,1.3],[32,18,1.3],[28,24,1.2],[40,28,2.0],[46,34,1.2],[52,42,1.2],[58,48,1.2],[66,50,1.3],[74,46,1.2],[80,38,1.6],[84,32,1.3]],
    links: [[0,1],[1,2],[1,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10]]
  },
  {
    name: "Cygnus",
    latin: "The Swan",
    season: "Summer",
    hemisphere: "Northern",
    brightest: "Deneb (mag 1.25)",
    find: "Also called the Northern Cross. It flies straight down the glowing band of the Milky Way — from a dark site you can see the swan swimming in it.",
    myth: "Zeus took the form of a swan to approach Leda, Queen of Sparta. In another telling, it is Cygnus, who dived again and again into a river searching for the body of his friend Phaethon after the boy crashed the Sun's chariot. Apollo was so moved by his loyalty that he turned him into a swan and set him in the sky.",
    stars: [[50,10,1.9],[50,30,1.4],[50,54,1.4],[26,30,1.3],[74,28,1.3]],
    links: [[0,1],[1,2],[3,1],[1,4]]
  },
  {
    name: "Lyra",
    latin: "The Lyre",
    season: "Summer",
    hemisphere: "Northern",
    brightest: "Vega (mag 0.03)",
    find: "Vega is one of the brightest stars in the whole northern sky. Just beside it sits a small, neat parallelogram of four fainter stars — that's the body of the harp.",
    myth: "Orpheus played this lyre so beautifully that rivers changed course to listen. When his wife Eurydice died he walked into the underworld and played until even Hades wept, and was told he could lead her out — provided he never looked back. A step from daylight, he looked. She was gone. Zeus placed his lyre among the stars.",
    stars: [[30,14,2.0],[38,8,1.0],[40,20,1.1],[54,24,1.1],[58,38,1.1],[44,34,1.1]],
    links: [[0,1],[0,2],[2,3],[3,4],[4,5],[5,2]]
  },
  {
    name: "Taurus",
    latin: "The Bull",
    season: "Winter",
    hemisphere: "Both",
    brightest: "Aldebaran (mag 0.85)",
    find: "A wide V of stars makes the bull's face, with orange Aldebaran as its eye. Follow the horns up and to the right and you'll run into the Pleiades — a tight little cluster of blue stars.",
    myth: "Zeus disguised himself as a magnificent white bull to carry Princess Europa across the sea to Crete. Only the front half of the bull appears in the sky, because the rest is beneath the waves. The V-shaped face is a real star cluster called the Hyades — the closest open cluster to Earth, about 150 light-years away.",
    stars: [[42,34,2.0],[32,26,1.1],[24,20,1.1],[50,26,1.1],[58,18,1.1],[72,10,1.5],[54,36,1.0],[74,38,1.3]],
    links: [[0,1],[1,2],[0,3],[3,4],[4,5],[0,6],[6,7]]
  },
  {
    name: "Gemini",
    latin: "The Twins",
    season: "Winter",
    hemisphere: "Both",
    brightest: "Pollux (mag 1.14)",
    find: "Two bright stars sit close together — Castor and Pollux, the twins' heads — with two rough lines of fainter stars trailing down from them like bodies.",
    myth: "Castor and Pollux shared a mother but not a father: Pollux was the son of Zeus and immortal, Castor was not. When Castor was killed, Pollux was inconsolable and begged his father to let him die too. Zeus refused, but offered a compromise — the brothers would split immortality between them, spending alternate days in the heavens. He set them side by side in the sky.",
    stars: [[22,10,1.7],[40,12,1.9],[26,24,1.1],[44,26,1.2],[28,38,1.1],[48,38,1.2],[22,50,1.1],[36,50,1.1],[56,48,1.1],[66,44,1.0]],
    links: [[0,2],[2,4],[4,6],[4,7],[1,3],[3,5],[5,8],[8,9],[2,3]]
  },
  {
    name: "Perseus",
    latin: "The Hero",
    season: "Autumn",
    hemisphere: "Northern",
    brightest: "Mirfak (mag 1.79)",
    find: "Sits between Cassiopeia and Taurus. Watch the star Algol closely over a few nights — every 2.87 days it visibly dims, because a companion star passes in front of it.",
    myth: "Perseus killed the gorgon Medusa, whose gaze turned people to stone, by watching her reflection in his polished shield. Flying home with her head, he found Andromeda chained to a rock as a sacrifice to the sea monster, and turned the creature to stone. The star Algol is Medusa's severed head — and its name comes from the Arabic for 'the demon star', because ancient watchers noticed it winks.",
    stars: [[46,20,1.8],[56,12,1.1],[66,8,1.1],[34,32,1.7],[26,42,1.1],[20,52,1.1],[44,34,1.1],[50,46,1.1],[60,52,1.0]],
    links: [[0,1],[1,2],[0,3],[3,4],[4,5],[0,6],[6,7],[7,8]]
  },
  {
    name: "Crux",
    latin: "The Southern Cross",
    season: "Autumn (south)",
    hemisphere: "Southern",
    brightest: "Acrux (mag 0.76)",
    find: "The smallest constellation in the sky, but unmistakable. The long arm of the cross points almost exactly toward the south celestial pole — the southern equivalent of the North Star, which doesn't otherwise exist.",
    myth: "Crux has no Greek myth: it is too far south for the ancient Greeks to have seen it. To Aboriginal Australian peoples the dark cloud beside it forms the head of an emu in the sky, and its position through the year marks the emu breeding season. European sailors named it in the 1500s, and for centuries it was how ships found their way home across the southern oceans. It appears on the flags of Australia, New Zealand, Brazil and Samoa.",
    stars: [[48,52,1.9],[48,12,1.7],[66,30,1.7],[30,28,1.4],[42,38,0.9]],
    links: [[0,1],[2,3]]
  }
];

(function () {
  "use strict";

  var grid   = document.getElementById("conGrid");
  var search = document.getElementById("conSearch");
  var empty  = document.getElementById("conEmpty");
  var chips  = document.querySelectorAll("[data-season]");
  var modal  = document.getElementById("conModal");
  var panel  = document.getElementById("conModalBody");
  if (!grid) return;

  var season = "all";

  /* Build the SVG star map for one constellation. */
  function skyHTML(c, big) {
    var lines = c.links.map(function (pair) {
      var a = c.stars[pair[0]], b = c.stars[pair[1]];
      return '<line class="link" x1="' + a[0] + '" y1="' + a[1] +
             '" x2="' + b[0] + '" y2="' + b[1] + '"/>';
    }).join("");

    var dots = c.stars.map(function (s) {
      // A faint halo behind each star, then the star itself
      return '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + (s[2] * 2.6) +
             '" fill="rgba(190,215,255,.14)"/>' +
             '<circle class="star" cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '"/>';
    }).join("");

    // A handful of unrelated background stars for atmosphere.
    // Positions come from a fixed formula, not Math.random(), so the
    // pattern doesn't jump around every time the page re-renders.
    var scatter = "";
    for (var i = 0; i < 26; i++) {
      var x = (i * 37.7) % 100;
      var y = (i * 23.3) % 62;
      var r = 0.22 + ((i * 13) % 5) * 0.07;
      scatter += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) +
                 '" r="' + r.toFixed(2) + '" fill="rgba(255,255,255,.32)"/>';
    }

    return '<svg viewBox="0 0 100 62" role="img" aria-label="Star map of ' + c.name +
           '" style="' + (big ? "max-height:290px;" : "") + '">' +
           scatter + lines + dots + '</svg>';
  }

  function cardHTML(c, i) {
    return '' +
    '<article class="con-card" data-index="' + i + '" data-season="' + c.season +
    '" tabindex="0" role="button" aria-label="Read about ' + c.name + '">' +
      '<div class="con-sky">' + skyHTML(c, false) + '</div>' +
      '<div class="con-body">' +
        '<h3>' + c.name + '</h3>' +
        '<div class="con-latin">' + c.latin + '</div>' +
        '<div class="con-meta">' +
          '<span class="pill season">' + c.season + '</span>' +
          '<span class="pill">' + c.hemisphere + '</span>' +
          '<span class="pill">★ ' + c.brightest + '</span>' +
        '</div>' +
        '<p style="font-size:.9rem; margin-bottom:0; color:#7d86ae;">Click to read the myth →</p>' +
      '</div>' +
    '</article>';
  }

  grid.innerHTML = CONSTELLATIONS.map(cardHTML).join("");

  /* ---- modal ---- */
  var lastFocused = null;

  function openModal(i) {
    var c = CONSTELLATIONS[i];
    lastFocused = document.activeElement;

    panel.innerHTML =
      '<div class="con-sky" style="border-radius:14px; border:1px solid rgba(140,160,255,.2); margin-bottom:1.4rem;">' +
        skyHTML(c, true) +
      '</div>' +
      '<span class="eyebrow">' + c.hemisphere + ' sky · best in ' + c.season + '</span>' +
      '<h2 style="margin-bottom:.1rem;">' + c.name + '</h2>' +
      '<div class="con-latin" style="font-size:1.05rem; margin-bottom:1.2rem;">' + c.latin + '</div>' +
      '<h3 style="font-size:.8rem; letter-spacing:.16em; text-transform:uppercase; color:var(--teal);">The myth</h3>' +
      '<p class="myth">' + c.myth + '</p>' +
      '<h3 style="font-size:.8rem; letter-spacing:.16em; text-transform:uppercase; color:var(--teal); margin-top:1.6rem;">How to find it</h3>' +
      '<p style="margin-bottom:1.4rem;">' + c.find + '</p>' +
      '<ul class="stat-list">' +
        '<li><span class="k">Brightest star</span><span class="v">' + c.brightest + '</span></li>' +
        '<li><span class="k">Best viewing season</span><span class="v">' + c.season + '</span></li>' +
        '<li><span class="k">Hemisphere</span><span class="v">' + c.hemisphere + '</span></li>' +
        '<li><span class="k">Main stars charted</span><span class="v">' + c.stars.length + '</span></li>' +
      '</ul>';

    modal.classList.add("open");
    document.body.style.overflow = "hidden";     // stop the page behind scrolling
    modal.querySelector(".modal-close").focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();        // return focus where it was
  }

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".con-card");
    if (card) openModal(Number(card.dataset.index));
  });

  grid.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest(".con-card");
    if (!card) return;
    e.preventDefault();
    openModal(Number(card.dataset.index));
  });

  modal.addEventListener("click", function (e) {
    // Clicking the dark backdrop (but not the panel) closes it
    if (e.target === modal || e.target.closest(".modal-close")) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  /* ---- search + season filter ---- */
  function refine() {
    var q = (search ? search.value : "").trim().toLowerCase();
    var shown = 0;

    CONSTELLATIONS.forEach(function (c, i) {
      var card = grid.querySelector('[data-index="' + i + '"]');
      var haystack = (c.name + " " + c.latin + " " + c.brightest + " " +
                      c.hemisphere + " " + c.myth).toLowerCase();
      var matchText = q === "" || haystack.indexOf(q) !== -1;
      var matchSeason = season === "all" || c.season === "All year" ||
                        c.season.indexOf(season) === 0;
      var show = matchText && matchSeason;

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
      season = chip.dataset.season;
      refine();
    });
  });
})();
