/* ===================================================================
   moon.js — moon phases, calculated rather than looked up.

   THE MATHS
   The Moon takes 29.530588853 days to go from one new moon to the
   next. That number is called the synodic month. If you know the
   exact time of ONE new moon, you can work out the phase on any
   other date — past or future — by measuring how far through the
   cycle that date falls.

   Our reference new moon: 6 January 2000, 18:14 UTC.

   This is a good approximation, accurate to within several hours.
   The Moon's real orbit wobbles slightly, so professional almanacs
   use a much longer formula. For seeing the shape of tonight's
   Moon, this is plenty.
   =================================================================== */

var SYNODIC_DAYS = 29.530588853;
var MS_PER_DAY   = 86400000;
var SYNODIC_MS   = SYNODIC_DAYS * MS_PER_DAY;
var REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);   // months are 0-based!

/* How far through the cycle is this date? Returns 0 to 1,
   where 0 = new moon, 0.5 = full moon. */
function moonPhaseFraction(date) {
  var elapsed = date.getTime() - REF_NEW_MOON;
  var frac = (elapsed % SYNODIC_MS) / SYNODIC_MS;
  // The % operator keeps the sign of the left-hand side, so dates
  // before the year 2000 come out negative. Push them positive.
  return frac < 0 ? frac + 1 : frac;
}

/* What fraction of the disc is lit? 0 = none, 1 = full. */
function moonIllumination(frac) {
  return (1 - Math.cos(2 * Math.PI * frac)) / 2;
}

function moonAgeDays(frac) {
  return frac * SYNODIC_DAYS;
}

function moonPhaseName(frac) {
  var age = moonAgeDays(frac);
  if (age < 1.85)  return "New Moon";
  if (age < 5.54)  return "Waxing Crescent";
  if (age < 9.23)  return "First Quarter";
  if (age < 12.92) return "Waxing Gibbous";
  if (age < 16.61) return "Full Moon";
  if (age < 20.30) return "Waning Gibbous";
  if (age < 23.99) return "Last Quarter";
  if (age < 27.68) return "Waning Crescent";
  return "New Moon";
}

/* When is the next moment the cycle sits at `target`?
   target 0 = new moon, 0.5 = full moon. */
function nextPhaseDate(from, target) {
  var cycles = (from.getTime() - REF_NEW_MOON) / SYNODIC_MS;
  var n = Math.ceil(cycles - target) + target;
  return new Date(REF_NEW_MOON + n * SYNODIC_MS);
}

/* -------------------------------------------------------------------
   DRAWING THE PHASE

   The Moon is a sphere lit from one side, so the boundary between
   light and dark (the "terminator") is a circle seen at an angle —
   which looks like an ellipse. Its width shrinks to nothing at the
   quarter phases, which is why a half-moon has a straight edge.

   So the lit shape = half a circle + half an ellipse.
   ------------------------------------------------------------------- */
function moonPathData(frac) {
  var R = 50;
  // How wide the terminator ellipse is, and which way it bulges.
  var d = R * Math.cos(2 * Math.PI * frac);
  var rx = Math.abs(d);
  var waxing = frac < 0.5;                 // is the Moon filling up?

  // Outer limb: right semicircle when waxing, left when waning.
  var limbSweep = waxing ? 1 : 0;
  // Terminator bulge direction flips at the quarters.
  var termSweep = waxing ? (d > 0 ? 0 : 1) : (d > 0 ? 1 : 0);

  return "M 50 0" +
         " A 50 50 0 0 " + limbSweep + " 50 100" +
         " A " + rx.toFixed(3) + " 50 0 0 " + termSweep + " 50 0 Z";
}

/* Build a complete moon SVG. `size` is just for the viewBox scaling. */
function moonSVG(date, detailed) {
  var frac = moonPhaseFraction(date);
  var lit  = moonIllumination(frac);
  // Unique id per call so multiple moons on one page don't clash
  var uid  = "m" + Math.round(frac * 1e6) + "_" + (detailed ? "big" : "sm");

  var craters = "";
  if (detailed) {
    // Rough stand-ins for the big dark maria you can see by eye
    var spots = [[38,34,11],[60,30,7],[30,58,9],[56,62,12],[70,52,6],[46,20,5],[24,42,5]];
    craters = spots.map(function (s) {
      return '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] +
             '" fill="rgba(120,128,160,.34)"/>';
    }).join("");
  }

  return '' +
  '<svg viewBox="0 0 100 100" role="img" aria-label="' + moonPhaseName(frac) +
  ', ' + Math.round(lit * 100) + ' percent lit">' +
    '<defs>' +
      '<clipPath id="clip_' + uid + '"><path d="' + moonPathData(frac) + '"/></clipPath>' +
      '<radialGradient id="grad_' + uid + '" cx="38%" cy="34%">' +
        '<stop offset="0%" stop-color="#ffffff"/>' +
        '<stop offset="70%" stop-color="#e2e6f2"/>' +
        '<stop offset="100%" stop-color="#aab0c6"/>' +
      '</radialGradient>' +
    '</defs>' +
    // the unlit disc, faintly visible (real "earthshine")
    '<circle cx="50" cy="50" r="50" fill="#141834"/>' +
    '<circle cx="50" cy="50" r="50" fill="none" stroke="rgba(160,180,255,.18)" stroke-width="1"/>' +
    // the lit part
    '<path d="' + moonPathData(frac) + '" fill="url(#grad_' + uid + ')"/>' +
    '<g clip-path="url(#clip_' + uid + ')">' + craters + '</g>' +
  '</svg>';
}

(function () {
  "use strict";

  var disc     = document.getElementById("moonDisc");
  if (!disc) return;

  var picker   = document.getElementById("moonDate");
  var todayBtn = document.getElementById("moonToday");
  var nameEl   = document.getElementById("moonPhaseName");
  var illumEl  = document.getElementById("moonIllum");
  var statsEl  = document.getElementById("moonStats");
  var calEl    = document.getElementById("moonCalendar");
  var calTitle = document.getElementById("calTitle");

  function fmt(d) {
    return d.toLocaleDateString(undefined, {
      weekday: "short", day: "numeric", month: "long", year: "numeric"
    });
  }

  /* Format a Date as YYYY-MM-DD for the <input type="date"> box.
     Careful: toISOString() converts to UTC first, which can shift the
     day by one. So build the string from the local parts instead. */
  function toInputValue(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function render(date) {
    var frac = moonPhaseFraction(date);
    var lit  = moonIllumination(frac);
    var age  = moonAgeDays(frac);
    var isToday = toInputValue(date) === toInputValue(new Date());

    disc.innerHTML = moonSVG(date, true);
    nameEl.textContent = moonPhaseName(frac);
    illumEl.textContent = Math.round(lit * 100) + "% illuminated";

    var nextNew  = nextPhaseDate(date, 0);
    var nextFull = nextPhaseDate(date, 0.5);

    statsEl.innerHTML =
      row("Date", (isToday ? "Today · " : "") + fmt(date)) +
      row("Phase", moonPhaseName(frac)) +
      row("Illumination", (lit * 100).toFixed(1) + "%") +
      row("Age of Moon", age.toFixed(1) + " days into the cycle") +
      row("Direction", frac < 0.5 ? "Waxing — growing each night" : "Waning — shrinking each night") +
      row("Next full moon", fmt(nextFull)) +
      row("Next new moon", fmt(nextNew));

    buildCalendar(date);
  }

  function row(k, v) {
    return '<li><span class="k">' + k + '</span><span class="v">' + v + '</span></li>';
  }

  /* A month grid of small moons. */
  function buildCalendar(date) {
    var year = date.getFullYear(), month = date.getMonth();
    var first = new Date(year, month, 1);
    // Day 0 of the *next* month is the last day of this one
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var startDow = first.getDay();          // 0 = Sunday

    calTitle.textContent = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    var html = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
      .map(function (d) { return '<div class="dow">' + d + '</div>'; }).join("");

    // Blank cells so the 1st lands under the right weekday
    for (var b = 0; b < startDow; b++) html += "<div></div>";

    var todayKey = toInputValue(new Date());
    var selKey = toInputValue(date);

    for (var day = 1; day <= daysInMonth; day++) {
      // Use midday, not midnight, so the phase shown is the one you'd
      // see that day rather than one teetering on the boundary.
      var d = new Date(year, month, day, 12);
      var key = toInputValue(d);
      var cls = "moon-cell" + (key === selKey || key === todayKey ? " today" : "");
      html += '<div class="' + cls + '" data-date="' + key + '" role="button" tabindex="0" ' +
              'title="' + moonPhaseName(moonPhaseFraction(d)) + '">' +
                '<div class="d">' + day + '</div>' + moonSVG(d, false) +
              '</div>';
    }

    calEl.innerHTML = html;
  }

  /* ---- events ---- */
  calEl.addEventListener("click", function (e) {
    var cell = e.target.closest(".moon-cell");
    if (!cell) return;
    picker.value = cell.dataset.date;
    render(parseInputDate(cell.dataset.date));
  });

  /* "2026-07-27" fed to new Date() is read as UTC, which can land on
     the previous day in some time zones. Split it and build a local
     date instead — a classic and very annoying JavaScript trap. */
  function parseInputDate(value) {
    var p = value.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
  }

  picker.addEventListener("change", function () {
    if (picker.value) render(parseInputDate(picker.value));
  });

  todayBtn.addEventListener("click", function () {
    var now = new Date();
    picker.value = toInputValue(now);
    render(now);
  });

  /* ---- start on today ---- */
  var start = new Date();
  picker.value = toInputValue(start);
  render(start);
})();
