/* ===================================================================
   facts.js — the fact wall and the quiz.

   Two data sets, two small features. Same pattern as the other
   pages: keep the content in an array, generate the HTML from it.
   =================================================================== */

var FACTS = [
  { cat: "Solar System", text: "A day on Venus lasts longer than a year on Venus. It rotates once every 243 Earth days but completes an orbit in 225." },
  { cat: "Solar System", text: "Saturn is less dense than water. If you could find an ocean large enough, the planet would float in it." },
  { cat: "Solar System", text: "Jupiter's Great Red Spot is a storm wider than Earth that has been observed continuously for at least 190 years." },
  { cat: "Solar System", text: "Olympus Mons on Mars stands about 22 km tall — nearly three times the height of Mount Everest." },
  { cat: "Solar System", text: "Uranus orbits tipped almost 98° on its side, so each pole gets around 21 years of unbroken sunlight followed by 21 years of night." },
  { cat: "Solar System", text: "Neptune was discovered with mathematics before anyone saw it — astronomers predicted its position from wobbles in Uranus's orbit." },
  { cat: "Solar System", text: "Mercury has the biggest temperature swing of any planet: from 427 °C in sunlight down to −173 °C at night." },
  { cat: "Solar System", text: "Saturn's rings are hundreds of thousands of kilometres wide but often only about 10 metres thick." },

  { cat: "Stars", text: "The Sun accounts for about 99.86% of all the mass in the solar system. Everything else is rounding error." },
  { cat: "Stars", text: "Light from the Sun takes 8 minutes 20 seconds to reach Earth. You are always seeing the Sun as it was in the past." },
  { cat: "Stars", text: "A teaspoon of neutron star material would weigh roughly a billion tonnes on Earth." },
  { cat: "Stars", text: "Betelgeuse is so large that if it replaced our Sun, its surface would extend past the orbit of Mars." },
  { cat: "Stars", text: "Every atom of iron in your blood was forged inside a star that exploded before the Sun existed. You are made of stellar debris." },
  { cat: "Stars", text: "The nearest star after the Sun, Proxima Centauri, is 4.24 light-years away — about 40 trillion kilometres." },
  { cat: "Stars", text: "Some stars visible tonight may have already died. Their light is still crossing space toward you." },

  { cat: "Galaxies", text: "There are more stars in the observable universe than grains of sand on every beach on Earth." },
  { cat: "Galaxies", text: "The Milky Way and the Andromeda galaxy are approaching each other and will merge in about 4.5 billion years." },
  { cat: "Galaxies", text: "The observable universe is about 93 billion light-years across, even though it is only 13.8 billion years old — because space itself expanded." },
  { cat: "Galaxies", text: "A supermassive black hole called Sagittarius A*, about 4 million times the Sun's mass, sits at the centre of our galaxy." },
  { cat: "Galaxies", text: "Our solar system takes roughly 225 million years to complete one orbit of the Milky Way. It has done about 20 laps since it formed." },
  { cat: "Galaxies", text: "Roughly 95% of the universe is dark matter and dark energy — things we can measure but cannot see or explain." },

  { cat: "Space Travel", text: "Voyager 1, launched in 1977, is now over 24 billion km from Earth and is the most distant human-made object." },
  { cat: "Space Travel", text: "The footprints left on the Moon by Apollo astronauts will likely last millions of years. There is no wind to erase them." },
  { cat: "Space Travel", text: "The International Space Station orbits Earth roughly every 90 minutes, so its crew sees about 16 sunrises a day." },
  { cat: "Space Travel", text: "Astronauts grow up to 5 cm taller in orbit as their spine decompresses without gravity — and shrink back on return." },
  { cat: "Space Travel", text: "The Apollo Guidance Computer had about 4 KB of memory. A modern phone has millions of times more." },
  { cat: "Space Travel", text: "In a vacuum there is no air to carry sound, so no explosion in space makes any noise at all." },

  { cat: "Extremes", text: "Neptune has the fastest winds in the solar system, reaching about 2,100 km/h." },
  { cat: "Extremes", text: "Nothing that crosses a black hole's event horizon can escape — not even light, which is why they are black." },
  { cat: "Extremes", text: "The coldest known place in the universe is the Boomerang Nebula at about −272 °C, colder than the leftover heat of the Big Bang." }
];

var QUIZ = [
  {
    q: "Which planet is the hottest in the solar system?",
    options: ["Mercury", "Venus", "Mars", "Jupiter"],
    answer: 1,
    why: "Venus — even though Mercury is closer to the Sun. Venus's thick carbon-dioxide atmosphere traps heat, holding the surface at about 465 °C day and night."
  },
  {
    q: "How long does sunlight take to reach Earth?",
    options: ["8 seconds", "8 minutes 20 seconds", "8 hours", "Instantly"],
    answer: 1,
    why: "About 8 minutes 20 seconds. If the Sun vanished right now, we wouldn't know for over eight minutes."
  },
  {
    q: "Why do we always see the same side of the Moon?",
    options: [
      "The Moon does not rotate",
      "The Moon rotates once per orbit — it is tidally locked",
      "Earth's atmosphere blocks the other side",
      "The far side is permanently dark"
    ],
    answer: 1,
    why: "It's tidally locked: it turns exactly once each orbit, so the same face stays pointed at us. The far side isn't dark — it gets just as much sunlight."
  },
  {
    q: "Which planet has the most confirmed moons?",
    options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    answer: 1,
    why: "Saturn, with 274 confirmed as of 2025 — it overtook Jupiter when 128 new ones were announced that year. These counts genuinely change."
  },
  {
    q: "What is a light-year a measure of?",
    options: ["Time", "Brightness", "Distance", "Temperature"],
    answer: 2,
    why: "Distance — how far light travels in one year, about 9.46 trillion km. The word 'year' in the name catches almost everyone out."
  },
  {
    q: "What causes the Moon's phases?",
    options: [
      "Earth's shadow falling on the Moon",
      "How much of the Moon's sunlit half faces Earth",
      "Clouds in Earth's atmosphere",
      "The Moon giving off less light some nights"
    ],
    answer: 1,
    why: "Half the Moon is always lit. What changes is how much of that lit half we can see from here. Earth's shadow only matters during a lunar eclipse."
  },
  {
    q: "Which of these is NOT a rocky planet?",
    options: ["Mercury", "Mars", "Neptune", "Venus"],
    answer: 2,
    why: "Neptune is an ice giant — mostly water, ammonia and methane with no solid surface to stand on."
  },
  {
    q: "Roughly how old is the universe?",
    options: ["4.5 billion years", "13.8 billion years", "100 million years", "500 billion years"],
    answer: 1,
    why: "About 13.8 billion years. Earth is much younger at 4.5 billion — so our planet has only been around for the last third of it."
  },
  {
    q: "What is the brightest star in the night sky?",
    options: ["Polaris", "Betelgeuse", "Sirius", "Vega"],
    answer: 2,
    why: "Sirius, in Canis Major. Polaris is famous for sitting still above the north pole, not for being bright — it's only about 48th brightest."
  },
  {
    q: "Why can't sound travel through space?",
    options: [
      "It is too cold",
      "There is no air or other medium to carry the vibrations",
      "Space is too large",
      "Gravity absorbs the sound"
    ],
    answer: 1,
    why: "Sound is a vibration passing through a material. A vacuum has almost no particles to pass it along, so there is nothing to carry the wave."
  }
];

(function () {
  "use strict";

  /* ================= FACT WALL ================= */
  var wall   = document.getElementById("factWall");
  var search = document.getElementById("factSearch");
  var empty  = document.getElementById("factEmpty");
  var chips  = document.querySelectorAll("[data-cat]");
  var cat    = "all";

  if (wall) {
    wall.innerHTML = FACTS.map(function (f, i) {
      return '<article class="card fact-card reveal visible" data-index="' + i + '">' +
               '<span class="num" aria-hidden="true">' + (i + 1) + '</span>' +
               '<span class="cat">' + f.cat + '</span>' +
               '<p>' + f.text + '</p>' +
             '</article>';
    }).join("");

    var refine = function () {
      var q = (search ? search.value : "").trim().toLowerCase();
      var shown = 0;

      FACTS.forEach(function (f, i) {
        var card = wall.querySelector('[data-index="' + i + '"]');
        var matchText = q === "" || (f.text + " " + f.cat).toLowerCase().indexOf(q) !== -1;
        var matchCat  = cat === "all" || f.cat === cat;
        var show = matchText && matchCat;
        card.style.display = show ? "" : "none";
        if (show) shown++;
      });

      if (empty) empty.classList.toggle("show", shown === 0);
    };

    if (search) search.addEventListener("input", refine);

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        cat = chip.dataset.cat;
        refine();
      });
    });
  }

  /* ================= QUIZ ================= */
  var quizBox = document.getElementById("quiz");
  if (!quizBox) return;

  var qEl       = document.getElementById("quizQuestion");
  var optsEl    = document.getElementById("quizOptions");
  var explainEl = document.getElementById("quizExplain");
  var scoreEl   = document.getElementById("quizScore");
  var nextBtn   = document.getElementById("quizNext");
  var barEl     = document.getElementById("quizBar");
  var stageEl   = document.getElementById("quizStage");
  var resultEl  = document.getElementById("quizResult");

  var current = 0;
  var score = 0;
  var answered = false;

  function showQuestion() {
    var item = QUIZ[current];
    answered = false;

    qEl.textContent = (current + 1) + ". " + item.q;
    explainEl.classList.remove("show");
    nextBtn.style.visibility = "hidden";
    scoreEl.textContent = "Question " + (current + 1) + " of " + QUIZ.length +
                          " · Score " + score;
    barEl.style.width = (current / QUIZ.length * 100) + "%";

    optsEl.innerHTML = item.options.map(function (opt, i) {
      return '<button class="quiz-opt" data-i="' + i + '">' + opt + '</button>';
    }).join("");
  }

  optsEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".quiz-opt");
    if (!btn || answered) return;       // ignore extra clicks on the same question
    answered = true;

    var chosen = Number(btn.dataset.i);
    var item = QUIZ[current];
    var correct = chosen === item.answer;
    if (correct) score++;

    // Lock every option, then colour the right one green and, if the
    // person got it wrong, their choice red.
    optsEl.querySelectorAll(".quiz-opt").forEach(function (b, i) {
      b.disabled = true;
      if (i === item.answer) b.classList.add("correct");
      else if (i === chosen) b.classList.add("wrong");
    });

    explainEl.innerHTML = (correct ? "<strong>Correct.</strong> " : "<strong>Not quite.</strong> ") + item.why;
    explainEl.classList.add("show");
    scoreEl.textContent = "Question " + (current + 1) + " of " + QUIZ.length +
                          " · Score " + score;
    nextBtn.style.visibility = "visible";
    nextBtn.textContent = current === QUIZ.length - 1 ? "See my score →" : "Next question →";
  });

  nextBtn.addEventListener("click", function () {
    current++;
    if (current < QUIZ.length) {
      showQuestion();
    } else {
      finish();
    }
  });

  function finish() {
    barEl.style.width = "100%";
    stageEl.style.display = "none";
    resultEl.style.display = "block";

    var pct = Math.round(score / QUIZ.length * 100);
    var verdict;
    if (pct === 100)     verdict = "Perfect. You could teach this.";
    else if (pct >= 80)  verdict = "Excellent — you clearly paid attention out there.";
    else if (pct >= 60)  verdict = "Solid. A second look at the facts wall will push you higher.";
    else if (pct >= 40)  verdict = "A decent start. Space is genuinely counter-intuitive.";
    else                 verdict = "Plenty left to discover — which is the fun part.";

    resultEl.innerHTML =
      '<div class="quiz-result">' +
        '<span class="eyebrow">Your result</span>' +
        '<div class="big-score">' + score + " / " + QUIZ.length + '</div>' +
        '<p style="font-size:1.05rem; margin-top:.6rem;">' + verdict + '</p>' +
        '<div class="btn-row" style="margin-top:1.4rem;">' +
          '<button class="btn btn-primary" id="quizRestart">Try again</button>' +
          '<a class="btn btn-ghost" href="planets.html">Go read about the planets</a>' +
        '</div>' +
      '</div>';

    document.getElementById("quizRestart").addEventListener("click", function () {
      current = 0;
      score = 0;
      stageEl.style.display = "";
      resultEl.style.display = "none";
      showQuestion();
    });
  }

  showQuestion();
})();
