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
    "I'm Beast, the astronomy guide on Cosmos (cosmos.punah.pro). I answer from this site's NASA planet numbers, constellation find-it notes, Moon-phase maths, the fact wall, and the Learn chapters. Mira tutors coding on Semicolon — that's a different site.",
    true
  ));
  rows.push(pair(
    "beast-not-ada", "cosmos", "beast",
    "Can you debug my Python loop?",
    "That's Mira's job on Semicolon (semicolon.punah.pro) — she's the coding tutor. Here I'm Beast. If you looked up and wanted a sky answer, ask me a planet, a constellation, the Moon, or a fact.",
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
  rows.push(pair(
    "beast-parsec", "cosmos", "facts",
    "What is a parsec?",
    "A parsec is about 3.26 light-years: the distance where a star shifts by one arcsecond as Earth orbits. Astronomers prefer it to light-years. A light-year itself is about 9.46 trillion km.",
    true
  ));
  rows.push(pair(
    "beast-pluto", "cosmos", "facts",
    "Why is Pluto a dwarf planet?",
    "Pluto was reclassified as a dwarf planet in 2006 because it has not cleared its neighbourhood of other icy bodies. It has five moons and a heart-shaped nitrogen glacier. Size alone was not the rule it broke.",
    true
  ));
  rows.push(pair(
    "beast-europa", "cosmos", "facts",
    "Does Europa have an ocean?",
    "Europa hides a salty ocean under ice, and Enceladus sprays ocean water from cracks at its pole. Both are places to look for life. That is not a confirmation of biology.",
    true
  ));
  rows.push(pair(
    "beast-escape", "cosmos", "knowledge",
    "What is escape speed from Earth?",
    "Escape speed from Earth is about 11 km/s. An orbit is falling and missing the ground. Go fast enough sideways and you never come down — that is a satellite.",
    true
  ));
  rows.push(pair(
    "beast-sun", "cosmos", "facts",
    "How far is the Sun, and how big is it compared with Earth?",
    "The Sun is about 150 million km away (1 AU). About 1.3 million Earths could fit inside it. The sunlight you see left the Sun about eight minutes ago.",
    true
  ));
  rows.push(pair(
    "beast-semicolon-boundary", "cosmos", "about",
    "How was Semicolon created?",
    "Semicolon is Mira's school, not a Cosmos chapter. It began as plain HTML, CSS, and JavaScript with no framework: a folder, index.html, a stylesheet, opened in a browser. I stay with the sky. Ask Mira how to build the page.",
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
    "I'm Mira, the coding tutor on Semicolon (semicolon.punah.pro). Earlier notes call me Ada; use Mira. I teach beginners in plain English — Python, HTML, CSS, JavaScript, Git, and how to read an error. Beast on Cosmos answers astronomy; I stay with code.",
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
  rows.push(pair(
    "mira-origin", "semicolon", "about",
    "Tell the story of how Semicolon was created.",
    "Semicolon started as a free coding school a beginner could finish: no framework and no build step. Anshuman wrote it the same way the first web lesson teaches — a folder of HTML for the words, CSS for the look, and JavaScript for clicks. I'm Mira, the tutor on that site. Beast on Cosmos keeps the sky.",
    true
  ));
  rows.push(pair(
    "mira-website", "semicolon", "lesson",
    "How do I create a website?",
    "Three files in one folder. index.html holds the structure: a title, a heading, a paragraph. style.css holds the look, linked from the head. script.js runs when someone clicks, if you need it. Save, then open index.html in a browser. If the page is blank, a tag is unclosed or the path is wrong — read the last line of the error, then the line it names.",
    true
  ));
  rows.push(pair(
    "mira-html-skeleton", "semicolon", "lesson",
    "Show me the smallest HTML page.",
    "Start with <!DOCTYPE html>, then html, head, and body. In the head: charset utf-8, a title, and <link rel=\"stylesheet\" href=\"style.css\">. In the body: one h1 and one p. That file is already a website. Tags describe structure, not colour.",
    true
  ));
  rows.push(pair(
    "mira-css-one-rule", "semicolon", "lesson",
    "How does CSS join that page?",
    "A rule is a selector and a declaration. body { font-family: sans-serif; } styles every body. The HTML link tag is what joins the stylesheet. If the rule does nothing, the href path does not match the file name.",
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

function accountRow(id, name, rows, extra) {
  const learned = rows.filter((r) => r.gold).length;
  const total = rows.length;
  return Object.assign({
    id: id,
    name: name,
    learned: learned,
    remaining: total - learned,
    gained: learned,
    total: total,
  }, extra || {});
}

const helperLessons = ["light", "gravity", "stars", "planets-idea", "galaxies", "life", "beginning", "observe", "semicolon-story"];
const account = {
  sites: [
    { id: "cosmos", name: "Cosmos", href: "/account.html" },
    { id: "semicolon", name: "Semicolon", href: "/semicolon/pages/account.html" },
  ],
  personas: [
    accountRow("beast", "Beast", beast, { site: "cosmos" }),
    accountRow("mira", "Mira", ada, { alsoKnownAs: "Ada", site: "semicolon" }),
    {
      id: "helper",
      name: "Helper",
      defaultName: "Henwin",
      learned: 0,
      remaining: helperLessons.length,
      gained: 0,
      total: helperLessons.length,
      lessons: helperLessons,
      renameable: true,
      site: "semicolon",
    },
  ],
};
account.totalGained = account.personas.reduce(function (sum, p) { return sum + p.gained; }, 0);
account.totalRemaining = account.personas.reduce(function (sum, p) { return sum + p.remaining; }, 0);

const summary = {
  beast_examples: beast.length,
  beast_gold: beast.filter((r) => r.gold).length,
  ada_examples: ada.length,
  ada_gold: ada.filter((r) => r.gold).length,
  planets: planetCatalog().length,
  constellations: constellationCatalog().length,
  total_gained: account.totalGained,
};
if (summary.beast_examples < 40 || summary.ada_examples < 40) {
  console.error("corpus too small", summary);
  process.exit(1);
}
if (summary.planets !== 8) {
  console.error("expected 8 planets", summary);
  process.exit(1);
}

const accountJson = JSON.stringify(account, null, 2) + "\n";
const accountJs = "window.KNOWLEDGE_ACCOUNT = " + JSON.stringify(account) + ";\n";
writeOrCheck(join(root, "training", "knowledge-account.json"), accountJson);
writeOrCheck(join(root, "js", "knowledge-account-data.js"), accountJs);

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
