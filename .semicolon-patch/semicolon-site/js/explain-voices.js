/* Three voices when someone says "explain me this".
   Beast (he) is the existing astronomy reply.
   Mira (she) adds the coding-school way to hold the same idea.
   The helper — any name the visitor saves — slows it into steps. */
(function () {
  "use strict";

  var LESSONS = {
    light: {
      she: "Mira: put the speed in a variable, multiply by the seconds in a year, and print trillion kilometres — not billion.",
      steps: [
        "Light is late. The Sun you see is eight minutes old.",
        "A light-year is distance: about 9.46 trillion km.",
        "The desktop beside this lesson types that multiplication."
      ]
    },
    gravity: {
      she: "Mira: one number, 11, is escape speed from Earth in km/s. An orbit is the sideways case that keeps missing.",
      steps: [
        "Mass curves spacetime. Things follow the curve.",
        "Fall sideways fast enough and you miss the ground. That is an orbit.",
        "About 11 km/s leaves Earth entirely."
      ]
    },
    stars: {
      she: "Mira: the Sun’s fuel is a countdown, not a mystery. Halfway through about ten billion years.",
      steps: [
        "A star shines because hydrogen fuses into helium.",
        "Mass decides the ending: white dwarf, neutron star, or black hole.",
        "The iron in blood was made in those explosions."
      ]
    },
    "planets-idea": {
      she: "Mira: a list of four rocky names inside the frost line is the whole diagram.",
      steps: [
        "A spinning disc of gas and dust became the solar system.",
        "Inside the frost line, worlds stayed small and rocky.",
        "Past it, ice helped Jupiter, Saturn, Uranus, and Neptune grow."
      ]
    },
    galaxies: {
      she: "Mira: store the range as words if you will not do maths on it: 100 to 400 billion stars.",
      steps: [
        "The Milky Way is a barred spiral. We sit in a quiet suburb.",
        "The pale band is that disc seen edge-on.",
        "Most of the mass is dark matter: gravity we see, light we do not."
      ]
    },
    life: {
      she: "Mira: Venus at 465 °C is the counterexample. A habitable-zone check is not a life check.",
      steps: [
        "Earth is the only confirmed life.",
        "Water, a stable star, and chemistry that copies itself are the search list.",
        "Atmosphere can wreck a world that sits at a friendly distance."
      ]
    },
    beginning: {
      she: "Mira: 13.8 is the age in billions of years. Redshift is the stretch, not a colour filter you add by hand.",
      steps: [
        "Space has been expanding for about 13.8 billion years.",
        "Farther galaxies look redder because the light stretched.",
        "Most of the universe is dark matter and dark energy we can measure and not yet explain."
      ]
    },
    observe: {
      she: "Mira: 20 minutes is the wait. Write it down before you go outside so you do not check a bright phone.",
      steps: [
        "Give your eyes 20 to 30 minutes in the dark.",
        "Start with Orion’s belt, the Big Dipper, Scorpius, or Crux.",
        "Look slightly beside a faint object. That is averted vision."
      ]
    },
    "semicolon-story": {
      she: "Mira: I am the tutor this story is about. Three files — index.html, style.css, and script.js if you need a click — opened in a browser. That is Semicolon.",
      steps: [
        "Semicolon began as plain files, no framework and no build step.",
        "HTML is the structure, CSS is the look, JavaScript is the behaviour.",
        "Save the folder and open index.html. A blank page means a path or an unclosed tag."
      ]
    }
  };

  function helperName() {
    if (window.KnowledgeAccount) return window.KnowledgeAccount.helperName();
    return "Henwin";
  }

  function fromLesson(id) {
    var row = LESSONS[id];
    if (!row) return null;
    return [
      { who: "she", text: row.she },
      { who: "helper", text: helperName() + ": " + row.steps.map(function (s, i) { return (i + 1) + ". " + s; }).join(" ") }
    ];
  }

  function fromReply(reply) {
    var bits = String(reply || "").split("\n").map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 3);
    if (!bits.length) bits = ["Say which lesson or planet you want unpacked."];
    return [
      { who: "she", text: "Mira: hold the same fact in one sentence you could put in a comment above the code." },
      { who: "helper", text: helperName() + ": " + bits.map(function (s, i) { return (i + 1) + ". " + s; }).join(" ") }
    ];
  }

  function isExplain(text) {
    return /\bexplain me this\b|\bexplain this\b|\bexplain me\b/i.test(String(text || ""));
  }

  window.ExplainVoices = {
    lessons: LESSONS,
    isExplain: isExplain,
    forLesson: fromLesson,
    forChat: function (text, beastReply) {
      var id = (String(text || "").match(/light|gravity|stars|planets|galax|life|beginning|observ|semicolon|website/i) || [])[0];
      var key = {
        light: "light", gravity: "gravity", stars: "stars", planets: "planets-idea",
        galax: "galaxies", life: "life", beginning: "beginning", observ: "observe",
        semicolon: "semicolon-story", website: "semicolon-story"
      }[id ? id.toLowerCase() : ""] || null;
      if (key && LESSONS[key]) return fromLesson(key);
      return fromReply(beastReply);
    }
  };
})();
