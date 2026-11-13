#!/usr/bin/env node
/* Collect Beast (Cosmos) and Ada (Semicolon) Q&A from the same files
   the sites teach with. Writes training/*.jsonl and rebuilds Modelfiles.
   --check  regenerate in memory and fail if committed files are stale. */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  planetCatalog,
  constellationCatalog,
  factCatalog,
  lessonCatalog,
} from "../server/lib/site-knowledge.js";
import {
  BEAST_PERSONA,
  ADA_PERSONA,
  cosmosPagePerspective,
  semicolonPagePerspective,
} from "../server/lib/personas.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");

function pair(id, site, page, user, assistant, gold = false) {
  return { id, site, page, user, assistant, gold: Boolean(gold) };
}

function beastCorpus() {
  const rows = [];
  rows.push(pair(
    "beast-identity", "cosmos", "beast",
    "Who are you?",
    "I'm Beast, the astronomy guide on Cosmos (cosmos.punah.pro). I answer from this site's NASA planet numbers, constellation find-it notes, Moon-phase maths, the fact wall, and the Learn chapters. Ada tutors coding on Semicolon — that's a different site.",
    true
  ));
  rows.push(pair(
    "beast-not-ada", "cosmos", "beast",
    "Can you debug my Python loop?",
    "That's Ada's job on Semicolon (semicolon.punah.pro) — she's the coding tutor. Here I'm Beast. If you looked up and wanted a sky answer, ask me a planet, a constellation, the Moon, or a fact.",
    true
  ));
  rows.push(pair(
    "beast-quiz-coach", "cosmos", "quiz",
    "What's the answer to the hottest-planet question?",
    "On the Quiz I coach the idea, not the option letter. Think atmosphere, not just distance from the Sun: a world can sit farther out than Mercury and still trap more heat. Check your choice against that, then read the why after you pick.",
    true
  ));

  for (const p of planetCatalog()) {
    const gold = true;
    const moons = p.moons === 0
      ? "no confirmed moons"
      : p.moons + (p.moons === 1 ? " confirmed moon" : " confirmed moons");
    rows.push(pair(
      "planet-" + p.name.toLowerCase() + "-numbers", "cosmos", "planets",
      "Tell me the numbers for " + p.name + ".",
      p.name + " is a " + p.tag.toLowerCase() + " world. Diameter " + p.diameter.toLocaleString() +
        " km, " + p.distanceAu + " AU from the Sun (" + p.distanceKm + " million km), year " +
        p.year + ", day " + p.day + ", " + moons + ", " + p.temp + ", gravity " + p.gravity +
        ". " + p.highlight + (p.facts[0] ? " " + p.facts[0] : ""),
      gold
    ));
    rows.push(pair(
      "planet-" + p.name.toLowerCase() + "-moons", "cosmos", "planets",
      "How many moons does " + p.name + " have?",
      p.name + " has " + moons + " on this site's NASA fact sheet.",
      true
    ));
    if (p.name === "Venus") {
      rows.push(pair(
        "planet-venus-temp", "cosmos", "planets",
        "Tell me the numbers for Venus.",
        "Venus is a terrestrial world. Diameter 12,104 km, 0.72 AU from the Sun (108.2 million km), year 225 Earth days, day 243 Earth days, no confirmed moons, 465 °C (nearly constant), gravity 8.9 m/s². The hottest planet in the solar system, and it spins backwards.",
        true
      ));
    }
  }

  for (const c of constellationCatalog()) {
    const gold = ["Orion", "Ursa Major", "Crux", "Scorpius"].includes(c.name);
    rows.push(pair(
      "constellation-" + c.name.toLowerCase().replace(/\s+/g, "-"), "cosmos", "constellations",
      "How do I find " + c.name + "?",
      c.name + " (" + c.latin + ") is best in " + c.season + ", " + c.hemisphere.toLowerCase() +
        " skies. Brightest: " + c.brightest + ". " + c.find,
      gold
    ));
  }

  factCatalog().forEach((f, i) => {
    rows.push(pair(
      "fact-" + i, "cosmos", "facts",
      "Give me a " + f.cat.toLowerCase() + " fact" + (i % 3 === 0 ? "." : " about space."),
      "(" + f.cat + ") " + f.text,
      i < 4
    ));
  });

  for (const lesson of lessonCatalog()) {
    rows.push(pair(
      "learn-" + lesson.id, "cosmos", "knowledge",
      "Teach me the Learn chapter on " + lesson.id + ".",
      lesson.title + ". " + lesson.text.slice(0, 420),
      ["gravity", "stars"].includes(lesson.id)
    ));
  }

  rows.push(pair(
    "beast-light-year", "cosmos", "facts",
    "What does a light-year measure?",
    "A light-year is distance, not time: how far light travels in one year, about 9.46 trillion km. Proxima Centauri is 4.24 light-years away.",
    true
  ));
  rows.push(pair(
    "beast-light-year-km", "cosmos", "facts",
    "How many kilometres is a light-year?",
    "About 9.46 trillion kilometres. Not billion — trillion. That is the distance light covers in one year.",
    true
  ));
  rows.push(pair(
    "beast-light-year-not-time", "cosmos", "facts",
    "Is a light-year a unit of time?",
    "No. A light-year is a unit of distance: about 9.46 trillion km.",
    true
  ));
  rows.push(pair(
    "beast-moon-maths", "cosmos", "moon",
    "How does this site know the Moon phase?",
    "Cosmos uses a synodic month of 29.530588853 days from a reference new moon at 6 January 2000, 18:14 UTC. That is good to within several hours — enough for tonight's shape, not a professional almanac.",
    true
  ));

  return rows;
}

function loadAdaTopics() {
  const dumped = spawnSync("python3", [join(root, "tools", "dump-ada-topics.py")], {
    encoding: "utf8",
  });
  if (dumped.status !== 0) {
    throw new Error("dump-ada-topics failed: " + (dumped.stderr || dumped.stdout));
  }
  return JSON.parse(dumped.stdout);
}

function adaCorpus() {
  const rows = [];
  rows.push(pair(
    "ada-identity", "semicolon", "ada",
    "Who are you?",
    "I'm Ada, the coding tutor on Semicolon (semicolon.punah.pro). I teach beginners in plain English — Python, HTML, CSS, JavaScript, Git, and how to read an error. Beast on Cosmos answers astronomy; I stay with code.",
    true
  ));
  rows.push(pair(
    "ada-not-beast", "semicolon", "ada",
    "How hot is Venus?",
    "That's a Cosmos question — Beast lives at cosmos.punah.pro. Short version: Venus is the hottest planet because of a thick carbon-dioxide atmosphere. Want to go back to code? Paste the line that broke.",
    true
  ));
  rows.push(pair(
    "ada-verify-first", "semicolon", "learn",
    "I installed Python. What now?",
    "Verify first. Always. Open a terminal and run python --version (or python3 --version). A version number means you are ready. 'Not recognised' means PATH is wrong — reinstall and tick Add Python to PATH on Windows. Then Your First Program on Semicolon, lesson 1.",
    true
  ));

  const topics = loadAdaTopics();
  topics.forEach((t, i) => {
    const ask = t.keys[0];
    const user = /error|traceback|not defined/i.test(ask)
      ? "What does this mean: " + ask + "?"
      : "Explain " + ask + " like I'm new.";
    rows.push(pair(
      "ada-topic-" + i, "semicolon", "lesson",
      user,
      t.answer.replace(/%\(name\)s/g, "AnshX"),
      i < 8 || t.keys.some(function (k) {
        return /^(html|css|git|javascript|function|list)$/i.test(k);
      })
    ));
  });

  rows.push(pair(
    "ada-playground", "semicolon", "playground",
    "Give me a tiny practice task.",
    "Print your name five times with a for loop. In Python: for i in range(5): print(\"AnshX\"). range(5) means 0,1,2,3,4 — five times, starting at zero. When that works, change it to range(1, 6) and watch the difference.",
    true
  ));

  return rows;
}

function dumpJsonl(path, rows) {
  const text = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  if (!check) writeFileSync(path, text);
  return text;
}

function escapeTriple(s) {
  return String(s).replace(/"""/g, "''");
}

function buildModelfile({ from, params, system, perspective, rows }) {
  const gold = rows.filter((r) => r.gold).slice(0, 48);
  const lines = [
    "FROM " + from,
    "",
    "PARAMETER temperature " + params.temperature,
    "PARAMETER top_p " + params.top_p,
    "",
    'SYSTEM """' + escapeTriple(system + "\n" + perspective) + '"""',
    "",
  ];
  for (const r of gold) {
    lines.push('MESSAGE user """' + escapeTriple(r.user) + '"""');
    lines.push('MESSAGE assistant """' + escapeTriple(r.assistant) + '"""');
    lines.push("");
  }
  return lines.join("\n");
}

function writeOrCheck(path, contents) {
  if (check) {
    const existing = readFileSync(path, "utf8");
    if (existing !== contents) {
      console.error("stale: " + path);
      process.exitCode = 1;
      return false;
    }
    return true;
  }
  writeFileSync(path, contents);
  return true;
}

mkdirSync(join(root, "training"), { recursive: true });
const beast = beastCorpus();
const ada = adaCorpus();
const beastJsonl = dumpJsonl(join(root, "training", "beast.jsonl"), beast);
const adaJsonl = dumpJsonl(join(root, "training", "ada.jsonl"), ada);

if (check) {
  const haveBeast = readFileSync(join(root, "training", "beast.jsonl"), "utf8");
  const haveAda = readFileSync(join(root, "training", "ada.jsonl"), "utf8");
  if (haveBeast !== beastJsonl) { console.error("stale: training/beast.jsonl"); process.exitCode = 1; }
  if (haveAda !== adaJsonl) { console.error("stale: training/ada.jsonl"); process.exitCode = 1; }
}

const beastFile = buildModelfile({
  from: "llama3.2:3b",
  params: { temperature: 0.35, top_p: 0.9 },
  system: BEAST_PERSONA,
  perspective: cosmosPagePerspective("beast"),
  rows: beast,
});
const adaFile = buildModelfile({
  from: "llama3.2:3b",
  params: { temperature: 0.35, top_p: 0.9 },
  system: ADA_PERSONA,
  perspective: semicolonPagePerspective("ada"),
  rows: ada,
});

writeOrCheck(join(root, "Modelfile.beast"), beastFile);
writeOrCheck(join(root, ".semicolon-patch", "Modelfile.ada"), adaFile);

const summary = {
  beast_examples: beast.length,
  beast_gold: beast.filter((r) => r.gold).length,
  ada_examples: ada.length,
  ada_gold: ada.filter((r) => r.gold).length,
  planets: planetCatalog().length,
  constellations: constellationCatalog().length,
};
if (summary.beast_examples < 40 || summary.ada_examples < 40) {
  console.error("corpus too small", summary);
  process.exit(1);
}
if (summary.planets !== 8) {
  console.error("expected 8 planets", summary);
  process.exit(1);
}

if (!check) {
  writeFileSync(join(root, "training", "summary.json"), JSON.stringify(summary, null, 2) + "\n");
} else {
  const have = JSON.parse(readFileSync(join(root, "training", "summary.json"), "utf8"));
  if (JSON.stringify(have) !== JSON.stringify(summary)) {
    console.error("stale: training/summary.json");
    process.exitCode = 1;
  }
}

if (process.exitCode) {
  console.error("Training corpus check failed. Run: node tools/collect-training-data.js");
  process.exit(process.exitCode);
}
console.log("Training corpus ready", summary);
