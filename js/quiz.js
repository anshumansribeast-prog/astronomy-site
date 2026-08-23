/* ===================================================================
   quiz.js — the levelled astronomy quiz.

   FOUR LEVELS, EACH LOCKED UNTIL YOU EARN IT

     1  Stargazer      easy       things you can see with your eyes
     2  Observer       medium     things you need to think about
     3  Sky Navigator  hard       things you need to have read about
     4  Astronomer     expert     things astronomers actually study

   You must score 75% or better to pass a level and unlock the next.
   Your highest rank is remembered and shown across the whole site.

   WHY 75% AND NOT 100%
   A perfect score means one unlucky guess blocks you forever, which
   stops being a challenge and starts being a wall. 75% is the pass mark.

   WHERE PROGRESS IS STORED
   localStorage — a small box of text your browser keeps for this site
   only. It survives closing the tab. It does NOT follow you to another
   device, because that would need a server and an account. Cosmos v2
   is where that becomes possible.
   =================================================================== */

var QUIZ_LEVELS = [
  {
    id: 1,
    name: "Stargazer",
    tier: "Easy",
    rank: "Stargazer",
    blurb: "Things you can work out by looking up.",
    colour: "#2dd4bf",
    questions: [
      { q: "Which planet is the hottest in the solar system?", options: ["Mercury", "Venus", "Mars", "Jupiter"], answer: 1, why: "Venus — even though Mercury sits closer to the Sun. Venus's thick carbon-dioxide atmosphere traps heat, holding the surface near 465 °C day and night." },
      { q: "How long does sunlight take to reach Earth?", options: ["8 seconds", "8 minutes 20 seconds", "8 hours", "Instantly"], answer: 1, why: "About 8 minutes 20 seconds. If the Sun vanished right now, we would not know for over eight minutes." },
      { q: "Which is the largest planet in the solar system?", options: ["Saturn", "Neptune", "Jupiter", "Uranus"], answer: 2, why: "Jupiter. It is so large that every other planet in the solar system would fit inside it with room to spare." },
      { q: "Which planet is famous for its bright ring system?", options: ["Jupiter", "Saturn", "Mars", "Venus"], answer: 1, why: "Saturn. All four giant planets have rings, but Saturn's are by far the brightest — mostly chunks of water ice." },
      { q: "What is the closest star to Earth?", options: ["Sirius", "Proxima Centauri", "Polaris", "The Sun"], answer: 3, why: "The Sun. It is easy to forget the Sun is a star at all — it just happens to be extremely close. Proxima Centauri is the closest one after it." },
      { q: "What is the Milky Way?", options: ["A cloud of gas inside the solar system", "The galaxy our solar system lives in", "Another name for the Andromeda galaxy", "The band of planets around the Sun"], answer: 1, why: "Our galaxy. When you see that pale band across a dark sky, you are looking edge-on through the disc of the galaxy you live in." },
      { q: "Why can't sound travel through space?", options: ["Space is too cold", "There is almost no matter for the sound to travel through", "Sound moves too slowly to cross the distance", "Gravity absorbs the sound"], answer: 1, why: "Sound is a vibration passed from particle to particle. Space is very nearly empty, so there is nothing to pass the vibration along." },
      { q: "Roughly how long does the Moon take to orbit the Earth?", options: ["About a week", "About a month", "About six months", "About a year"], answer: 1, why: "About a month — 27.3 days to go round once. The word 'month' comes from 'moon' for exactly this reason." },
      { q: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", "Earth", "Mars"], answer: 1, why: "Mercury. Venus is next, and it is the one that looks brightest in our sky." },
      { q: "What do we call the streak of light when a space rock burns in Earth's air?", options: ["Asteroid", "Comet", "Meteor", "Satellite"], answer: 2, why: "A meteor is the streak. The rock in space is a meteoroid; if it hits the ground it is a meteorite." }
    ]
  },
  {
    id: 2,
    name: "Observer",
    tier: "Medium",
    rank: "Observer",
    blurb: "Things that need a moment's thought.",
    colour: "#60a5fa",
    questions: [
      { q: "What does a light-year measure?", options: ["Time", "Brightness", "Distance", "Mass"], answer: 2, why: "Distance — how far light travels in one year, about 9.46 trillion km. The word 'year' in it fools almost everyone the first time." },
      { q: "Why do we always see the same side of the Moon?", options: ["The Moon does not rotate at all", "The Moon rotates exactly once per orbit — it is tidally locked", "The far side is always in shadow", "The Earth's atmosphere hides the other side"], answer: 1, why: "It is tidally locked: one rotation per orbit. The Moon does spin — it just spins at exactly the rate that keeps one face towards us." },
      { q: "Roughly how old is the universe?", options: ["4.5 billion years", "13.8 billion years", "100 billion years", "500 million years"], answer: 1, why: "About 13.8 billion years. Earth is much younger at roughly 4.5 billion — our planet has only been here for the last third of the story." },
      { q: "What is the brightest star in Earth's night sky?", options: ["Polaris", "Betelgeuse", "Sirius", "Vega"], answer: 2, why: "Sirius, in Canis Major. Polaris is famous for sitting almost due north, not for being bright — it is only the 48th brightest." },
      { q: "What is an astronomical unit (AU)?", options: ["The distance from the Earth to the Moon", "The average distance from the Earth to the Sun", "The diameter of the solar system", "One light-year divided by a thousand"], answer: 1, why: "The average Earth–Sun distance, about 150 million km. It is a handy ruler for measuring inside the solar system." },
      { q: "What gives Mars its red colour?", options: ["Red vegetation", "Iron oxide — rust — in the surface dust", "The way sunlight bends in its atmosphere", "Constant volcanic fire"], answer: 1, why: "Iron oxide. Mars is quite literally rusty: iron in the surface dust has reacted with oxygen over billions of years." },
      { q: "Which planet has the most confirmed moons?", options: ["Jupiter", "Saturn", "Neptune", "Uranus"], answer: 1, why: "Saturn, with over 270 confirmed. It overtook Jupiter recently — and the number keeps climbing as surveys find smaller ones." },
      { q: "What is a comet mostly made of?", options: ["Solid iron", "Ice, dust and rock", "Burning gas", "Compressed air"], answer: 1, why: "Ice, dust and rock — often called a dirty snowball. The tail appears when the Sun heats it and the ice turns straight to gas." },
      { q: "What is an exoplanet?", options: ["A planet that used to be a moon", "A planet orbiting a star other than the Sun", "A planet without an atmosphere", "A failed star"], answer: 1, why: "A planet around another star. Thousands are confirmed. They are named with the star plus a letter, starting at b." },
      { q: "Why do distant galaxies look redder than nearby ones?", options: ["They are made of red stars", "Expanding space stretches their light", "Dust in the Milky Way paints them red", "Telescopes add a red filter"], answer: 1, why: "Redshift. As space expands, the wavelength of travelling light stretches. Farther galaxies recede faster, so they look redder." }
    ]
  },
  {
    id: 3,
    name: "Sky Navigator",
    tier: "Hard",
    rank: "Sky Navigator",
    blurb: "Things you need to have read about.",
    colour: "#a78bfa",
    questions: [
      { q: "What is Jupiter's Great Red Spot?", options: ["A vast crater", "A storm larger than Earth that has raged for centuries", "A red desert on the surface", "The shadow of a large moon"], answer: 1, why: "A storm — an anticyclone wide enough to swallow Earth, observed for at least 190 years and probably far longer. It has been visibly shrinking." },
      { q: "What is a parsec?", options: ["About 3.26 light-years", "The same as one light-year", "A unit of time used in space travel", "The distance light travels in a second"], answer: 0, why: "About 3.26 light-years. It comes from parallax: the distance at which a star appears to shift by one arcsecond as Earth orbits." },
      { q: "What actually powers the Sun?", options: ["Burning gas, like a fire", "Nuclear fusion of hydrogen into helium", "Friction from its rotation", "Radioactive decay of heavy metals"], answer: 1, why: "Fusion. Hydrogen nuclei are pressed together into helium, and the tiny difference in mass is released as energy. Burning would have used up the Sun long ago." },
      { q: "What is the event horizon of a black hole?", options: ["The solid surface of the black hole", "The boundary beyond which nothing, not even light, can escape", "The ring of glowing gas around it", "The point where time stops entirely"], answer: 1, why: "A boundary, not a surface — there is nothing physical there. It simply marks where escape would require travelling faster than light." },
      { q: "What is unusual about Venus's rotation?", options: ["It does not rotate", "It rotates backwards compared with most planets", "It rotates faster than any other planet", "Its rotation speed changes every year"], answer: 1, why: "It spins retrograde — backwards — so on Venus the Sun would rise in the west. It also spins so slowly that its day is longer than its year." },
      { q: "The redshift of distant galaxies is evidence for what?", options: ["That galaxies are made of red stars", "That the universe is expanding", "That light slows down over distance", "That the galaxies are unusually hot"], answer: 1, why: "Expansion. Light from receding galaxies is stretched to longer, redder wavelengths — and the further away they are, the faster they recede." },
      { q: "What is the Kuiper Belt?", options: ["A ring of asteroids between Mars and Jupiter", "A region of icy bodies beyond Neptune's orbit", "The dust ring around Saturn", "A band of comets inside Mercury's orbit"], answer: 1, why: "A doughnut-shaped region of icy bodies past Neptune. Pluto lives there. The asteroid belt between Mars and Jupiter is a different thing entirely." },
      { q: "Roughly how long does energy from the Sun's core take to reach its surface?", options: ["8 minutes", "About a day", "Tens of thousands of years", "One year"], answer: 2, why: "Tens of thousands of years. Energy bounces between particles in a slow random walk. The famous 8 minutes is only the trip from surface to Earth." },
      { q: "What is the Summer Triangle?", options: ["Three planets lined up in June", "The bright stars Altair, Vega and Deneb", "A NASA mission to the Sun", "The three belts of Orion"], answer: 1, why: "Altair (Aquila), Vega (Lyra) and Deneb (Cygnus). On northern summer nights they are the easiest bright landmark after the Moon." },
      { q: "Where is Sagittarius A*?", options: ["At the centre of the Sun", "At the centre of the Milky Way", "Next to Jupiter", "In the Andromeda galaxy only"], answer: 1, why: "It is the Milky Way's central supermassive black hole, about four million solar masses, in the direction of the constellation Sagittarius." }
    ]
  },
  {
    id: 4,
    name: "Astronomer",
    tier: "Expert",
    rank: "Astronomer",
    blurb: "Things astronomers genuinely study. Earn this one.",
    colour: "#fbbf24",
    questions: [
      { q: "What is the cosmic microwave background?", options: ["Radio noise from distant galaxies", "Leftover light from about 380,000 years after the Big Bang", "Microwaves given off by the Milky Way's core", "Interference from Earth's atmosphere"], answer: 1, why: "The oldest light there is. When the universe cooled enough for atoms to form, light could finally travel freely — and it is still arriving, stretched into microwaves." },
      { q: "The Chandrasekhar limit, about 1.4 solar masses, is the maximum mass of what?", options: ["A neutron star", "A white dwarf", "A red giant", "A black hole"], answer: 1, why: "A white dwarf. Above it, electron degeneracy pressure cannot hold the star up and it collapses — which is what triggers a Type Ia supernova." },
      { q: "What does it mean for a star to be on the main sequence?", options: ["It is the brightest star in its galaxy", "It is fusing hydrogen into helium in its core", "It is about to become a supernova", "It has no planets orbiting it"], answer: 1, why: "Core hydrogen fusion. It is the long stable middle of a star's life — the Sun is about halfway through its own roughly 10-billion-year run." },
      { q: "What does the Hubble constant describe?", options: ["The mass of the observable universe", "The current rate at which the universe is expanding", "The brightness of the Hubble Space Telescope's mirror", "The maximum age a star can reach"], answer: 1, why: "The expansion rate. Different measurement methods still disagree on its exact value — an unresolved problem astronomers call the Hubble tension." },
      { q: "A typical neutron star is roughly what size?", options: ["About the size of the Moon", "About 20 km across", "About the size of Earth", "About the size of the Sun"], answer: 1, why: "Around 20 km — a city. It packs more mass than the Sun into that space, so a sugar-cube of it would weigh about as much as a mountain." },
      { q: "What is stellar parallax used to measure?", options: ["The temperature of a star", "The distance to relatively nearby stars", "The chemical make-up of a star", "How fast a star is spinning"], answer: 1, why: "Distance. As Earth moves around the Sun, nearby stars appear to shift slightly against far ones. The size of that shift gives the distance directly." },
      { q: "What is a star's habitable zone?", options: ["The region where the star's magnetic field is strongest", "The orbital range where liquid water could exist on a surface", "The area cleared of asteroids", "The zone where the star's light is brightest"], answer: 1, why: "Where liquid water is possible — sometimes called the Goldilocks zone. It is a rough guide, not a guarantee: atmosphere matters enormously too." },
      { q: "What triggers a Type Ia supernova?", options: ["A massive star running out of fuel and collapsing", "A white dwarf pulling in enough matter to pass its mass limit", "Two neutron stars colliding", "A black hole tearing apart a nearby planet"], answer: 1, why: "A white dwarf tipping past the Chandrasekhar limit. Because they all detonate at nearly the same mass, they shine with nearly the same brightness — which makes them standard candles for measuring cosmic distances." },
      { q: "About how much of the universe is ordinary atoms (baryonic matter)?", options: ["About 95%", "About 50%", "About 5%", "About 0.001%"], answer: 2, why: "Only around 5%. The rest is dark matter and dark energy. Stars, planets and people are the rounding error." },
      { q: "Why does JWST observe in infrared?", options: ["Infrared is brighter than visible light", "The first galaxies are redshifted into infrared, and dust is more transparent there", "Its mirror cannot reflect blue light", "Infrared cameras are cheaper"], answer: 1, why: "Expansion stretches ancient light into infrared, and infrared slips through dust that hides star-forming regions in visible light." }
    ]
  }
];

var QUIZ_PASS_MARK = 0.75;
var QUIZ_STORE = "cosmos_quiz_progress_v1";

/* -------------------------------------------------------------------
   Progress storage.

   Wrapped in try/catch because localStorage throws in private-browsing
   mode in some browsers. A quiz that crashes because someone opened an
   incognito window is a worse bug than a quiz that forgets your score.
   ------------------------------------------------------------------- */
function quizLoadProgress() {
  try {
    var raw = localStorage.getItem(QUIZ_STORE);
    if (!raw) return { unlocked: 1, best: {}, rank: null };
    var parsed = JSON.parse(raw);
    return {
      unlocked: parsed.unlocked || 1,
      best: parsed.best || {},
      rank: parsed.rank || null
    };
  } catch (e) {
    return { unlocked: 1, best: {}, rank: null };
  }
}

function quizSaveProgress(p) {
  try {
    localStorage.setItem(QUIZ_STORE, JSON.stringify(p));
  } catch (e) {
    /* Storage blocked. The quiz still works for this session. */
  }
}

function quizCurrentRank() {
  return quizLoadProgress().rank;
}

(function () {
  "use strict";

  var levelGrid  = document.getElementById("levelGrid");
  if (!levelGrid) return;

  var stage      = document.getElementById("quizStage");
  var chooser    = document.getElementById("levelChooser");
  var rankBanner = document.getElementById("rankBanner");
  var titleEl    = document.getElementById("qLevelTitle");
  var barEl      = document.getElementById("qBar");
  var questionEl = document.getElementById("qQuestion");
  var optionsEl  = document.getElementById("qOptions");
  var explainEl  = document.getElementById("qExplain");
  var scoreEl    = document.getElementById("qScore");
  var nextBtn    = document.getElementById("qNext");
  var quitBtn    = document.getElementById("qQuit");
  var resultEl   = document.getElementById("qResult");

  var progress = quizLoadProgress();
  var level = null, current = 0, score = 0, answered = false;

  function renderRank() {
    if (progress.rank) {
      var lv = QUIZ_LEVELS.filter(function (l) { return l.rank === progress.rank; })[0];
      var colour = lv ? lv.colour : "#2dd4bf";
      rankBanner.innerHTML =
        '<div class="rank-card" style="--rank:' + colour + '">' +
          '<span class="rank-medal" aria-hidden="true">★</span>' +
          '<div><span class="rank-label">Your rank</span>' +
          '<strong class="rank-name">' + progress.rank + '</strong></div>' +
        '</div>';
    } else {
      rankBanner.innerHTML =
        '<div class="rank-card rank-card--none">' +
          '<span class="rank-medal" aria-hidden="true">☆</span>' +
          '<div><span class="rank-label">No rank yet</span>' +
          '<strong class="rank-name">Pass Level 1 to become a Stargazer</strong></div>' +
        '</div>';
    }
  }

  function renderLevels() {
    levelGrid.innerHTML = "";
    QUIZ_LEVELS.forEach(function (lv) {
      var unlocked = lv.id <= progress.unlocked;
      var best = progress.best[lv.id];
      var passed = typeof best === "number" && best / lv.questions.length >= QUIZ_PASS_MARK;
      var card = document.createElement(unlocked ? "button" : "div");
      card.className = "level-card" + (unlocked ? "" : " is-locked") + (passed ? " is-passed" : "");
      card.style.setProperty("--lv", lv.colour);
      if (unlocked) {
        card.type = "button";
        card.addEventListener("click", function () { startLevel(lv); });
      } else {
        card.setAttribute("aria-disabled", "true");
      }
      var status = !unlocked
        ? '<span class="level-status">🔒 Pass Level ' + (lv.id - 1) + ' to unlock</span>'
        : passed
          ? '<span class="level-status is-ok">✓ Passed — best ' + best + '/' + lv.questions.length + '</span>'
          : typeof best === "number"
            ? '<span class="level-status">Best so far ' + best + '/' + lv.questions.length + '</span>'
            : '<span class="level-status">Not attempted</span>';
      card.innerHTML =
        '<span class="level-num">' + lv.id + '</span>' +
        '<span class="level-tier">' + lv.tier + '</span>' +
        '<h3>' + lv.name + '</h3>' +
        '<p>' + lv.blurb + '</p>' +
        '<span class="level-meta">' + lv.questions.length + ' questions · pass ' +
          Math.ceil(lv.questions.length * QUIZ_PASS_MARK) + '/' + lv.questions.length + '</span>' +
        status;
      levelGrid.appendChild(card);
    });
  }

  function startLevel(lv) {
    level = lv; current = 0; score = 0;
    chooser.style.display = "none";
    resultEl.style.display = "none";
    stage.style.display = "";
    titleEl.textContent = "Level " + lv.id + " · " + lv.name;
    stage.style.setProperty("--lv", lv.colour);
    renderQuestion();
    stage.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderQuestion() {
    var item = level.questions[current];
    answered = false;
    questionEl.textContent = item.q;
    explainEl.classList.remove("show");
    explainEl.textContent = "";
    nextBtn.style.visibility = "hidden";
    barEl.style.width = (current / level.questions.length * 100) + "%";
    scoreEl.textContent = "Question " + (current + 1) + " of " + level.questions.length + " · score " + score;
    optionsEl.innerHTML = "";
    item.options.forEach(function (text, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "quiz-opt";
      b.textContent = text;
      b.addEventListener("click", function () { choose(i, b); });
      optionsEl.appendChild(b);
    });
  }

  function choose(i, button) {
    if (answered) return;
    answered = true;
    var item = level.questions[current];
    var buttons = optionsEl.querySelectorAll(".quiz-opt");
    for (var k = 0; k < buttons.length; k++) {
      buttons[k].disabled = true;
      if (k === item.answer) buttons[k].classList.add("correct");
    }
    if (i !== item.answer) button.classList.add("wrong");
    else score++;
    explainEl.textContent = item.why;
    explainEl.classList.add("show");
    scoreEl.textContent = "Question " + (current + 1) + " of " + level.questions.length + " · score " + score;
    nextBtn.textContent = current === level.questions.length - 1 ? "See your result →" : "Next question →";
    nextBtn.style.visibility = "visible";
    nextBtn.focus();
  }

  nextBtn.addEventListener("click", function () {
    current++;
    if (current < level.questions.length) renderQuestion();
    else finish();
  });

  quitBtn.addEventListener("click", backToLevels);

  function backToLevels() {
    stage.style.display = "none";
    resultEl.style.display = "none";
    chooser.style.display = "";
    renderRank();
    renderLevels();
    chooser.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function finish() {
    var total = level.questions.length;
    var need = Math.ceil(total * QUIZ_PASS_MARK);
    var passed = score >= need;
    barEl.style.width = "100%";
    stage.style.display = "none";
    var prevBest = progress.best[level.id];
    if (typeof prevBest !== "number" || score > prevBest) progress.best[level.id] = score;
    var newRank = false;
    if (passed) {
      if (level.id + 1 > progress.unlocked && level.id < QUIZ_LEVELS.length) progress.unlocked = level.id + 1;
      var earnedIndex = QUIZ_LEVELS.map(function (l) { return l.rank; }).indexOf(level.rank);
      var currentIndex = QUIZ_LEVELS.map(function (l) { return l.rank; }).indexOf(progress.rank);
      if (earnedIndex > currentIndex) { progress.rank = level.rank; newRank = true; }
    }
    quizSaveProgress(progress);

    var isFinal = level.id === QUIZ_LEVELS.length;
    var head, body;
    if (passed && newRank && isFinal) {
      head = "You are an Astronomer.";
      body = "Top level, cleared. That is the highest rank Cosmos gives, and you earned it by clearing all 10 questions in the hardest level.";
    } else if (passed && newRank) {
      head = "Level passed — you are now a " + level.rank + ".";
      body = "Level " + (level.id + 1) + " is unlocked. The questions get harder from here.";
    } else if (passed) {
      head = "Passed again — " + score + " out of " + total + ".";
      body = "You already hold a rank at or above this level, so nothing changed. Still counts.";
    } else {
      head = "Not this time — " + score + " out of " + total + ".";
      body = "You needed " + need + ". Read the explanations, then try again. Nothing is lost and there is no limit on attempts.";
    }

    resultEl.innerHTML =
      '<div class="quiz-result-card' + (passed ? " is-pass" : " is-fail") + '" style="--lv:' + level.colour + '">' +
        '<span class="result-score">' + score + '<small>/' + total + '</small></span>' +
        '<h3>' + head + '</h3>' +
        '<p>' + body + '</p>' +
        (passed && newRank ? '<div class="rank-award">★ ' + level.rank + '</div>' : '') +
        '<div class="result-actions">' +
          '<button class="btn btn-primary" id="qRetry">Try this level again</button>' +
          '<button class="btn" id="qBack">Back to levels</button>' +
        '</div>' +
      '</div>';
    resultEl.style.display = "";
    resultEl.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("qRetry").addEventListener("click", function () { startLevel(level); });
    document.getElementById("qBack").addEventListener("click", backToLevels);
  }

  var resetBtn = document.getElementById("qReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (!window.confirm("Reset all quiz progress? Your rank and unlocked levels will be cleared.")) return;
      progress = { unlocked: 1, best: {}, rank: null };
      quizSaveProgress(progress);
      renderRank();
      renderLevels();
    });
  }

  renderRank();
  renderLevels();
})();
