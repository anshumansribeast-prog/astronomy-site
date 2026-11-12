import assert from "node:assert/strict";
import {
  BEAST_PERSONA,
  ADA_PERSONA,
  BEAST_SITE,
  ADA_SITE,
  normalizePage,
  cosmosPagePerspective,
  semicolonPagePerspective,
  buildAdaSystemPrompt,
} from "../server/lib/personas.js";
import {
  planetCatalog,
  constellationCatalog,
  lookupSiteAnswer,
  relevantSiteNotes,
} from "../server/lib/site-knowledge.js";
import { buildSystemPrompt } from "../server/services/beast-brain.js";

assert.match(BEAST_PERSONA, /Beast/);
assert.match(BEAST_PERSONA, /astronomy/i);
assert.match(BEAST_PERSONA, /cosmos\.punah\.pro/);
assert.match(BEAST_PERSONA, /you are not a coding tutor/i);
assert.doesNotMatch(BEAST_PERSONA, /You are Ada/);
assert.equal(BEAST_SITE, "https://cosmos.punah.pro");

assert.match(ADA_PERSONA, /Ada/);
assert.match(ADA_PERSONA, /coding tutor/i);
assert.match(ADA_PERSONA, /semicolon\.punah\.pro/);
assert.match(ADA_PERSONA, /Python/);
assert.doesNotMatch(ADA_PERSONA, /NASA fact-sheet/);
assert.equal(ADA_SITE, "https://semicolon.punah.pro");

assert.equal(normalizePage("/planets.html"), "planets");
assert.equal(normalizePage("pages/lesson.html?id=3"), "lesson");
assert.equal(normalizePage("/"), "home");

assert.match(cosmosPagePerspective("quiz.html"), /do not recite the multiple-choice/i);
assert.match(cosmosPagePerspective("planets.html"), /NASA fact-sheet/);
assert.match(semicolonPagePerspective("/pages/learn.html"), /track/i);
assert.match(buildAdaSystemPrompt({ page: "playground", visitorName: "AnshX" }), /AnshX/);
assert.match(buildAdaSystemPrompt({ page: "playground" }), /Practice/);

const planets = planetCatalog();
assert.equal(planets.length, 8);
const venus = planets.find((p) => p.name === "Venus");
assert.equal(venus.diameter, 12104);
assert.match(venus.temp, /465/);

const orion = constellationCatalog().find((c) => c.name === "Orion");
assert.ok(orion.find.toLowerCase().includes("belt"));

const venusNote = lookupSiteAnswer("How hot is Venus?");
assert.match(venusNote, /Venus/);
assert.match(venusNote, /465/);
assert.doesNotMatch(venusNote, /distanceKm/);
assert.match(lookupSiteAnswer("Where is Orion?"), /Orion/);

const planetNotes = relevantSiteNotes("How wide is Jupiter?", "planets.html");
assert.match(planetNotes, /Jupiter/);
assert.match(planetNotes, /142984/);

const quizNotes = relevantSiteNotes("what is the hottest planet?", "quiz.html");
assert.match(quizNotes, /do not list the four options/i);

const brain = {
  day: "2026-11-12",
  moon_phase: "Waxing Crescent, about 20% lit",
  daily_fact: "A light-year is a distance.",
  apod_title: "Test APOD",
  apod_summary: "A nebula.",
};
const stubDb = { prepare() { return { all() { return []; } }; } };
const prompt = buildSystemPrompt(stubDb, brain, "Anshuman", {
  page: "planets.html",
  message: "Tell me about Saturn",
});
assert.match(prompt, /Beast/);
assert.match(prompt, /Planets page/);
assert.match(prompt, /Saturn/);
assert.match(prompt, /Anshuman/);
assert.doesNotMatch(prompt, /Ada, the coding tutor/);

console.log("Persona training: all tests passed");
