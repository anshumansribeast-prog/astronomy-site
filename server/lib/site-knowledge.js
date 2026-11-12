/* ===================================================================
   site-knowledge.js — Beast trains from the same files the pages render.

   Planets, constellations, facts, and Learn chapters are read from disk.
   That way a NASA number change on the Planets page is what Beast cites.
   =================================================================== */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePage } from "./personas.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function quoted(block, key) {
  const m = block.match(new RegExp(key + ':\\s*"([^"]+)"'));
  return m ? m[1] : "";
}

function number(block, key) {
  const m = block.match(new RegExp(key + ":\\s*(-?[0-9]+(?:\\.[0-9]+)?)"));
  return m ? Number(m[1]) : null;
}

function splitNamedObjects(source) {
  return source.split(/\n\s*\{\s*\n\s*name:\s*/).slice(1).map((part) => {
    const name = (part.match(/^"([^"]+)"/) || [])[1];
    return { name, body: 'name: "' + part };
  }).filter((p) => p.name);
}

let cache = null;

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function load() {
  if (cache) return cache;

  const planets = splitNamedObjects(read("js/planets.js")).map(({ name, body }) => {
    const factsBlock = (body.match(/facts:\s*\[([\s\S]*?)\]/) || [, ""])[1];
    const facts = [...factsBlock.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    return {
      name,
      tag: quoted(body, "tag"),
      type: quoted(body, "type"),
      diameter: number(body, "diameter"),
      distanceKm: number(body, "distanceKm"),
      distanceAu: number(body, "distanceAu"),
      year: quoted(body, "year"),
      day: quoted(body, "day"),
      moons: number(body, "moons"),
      temp: quoted(body, "temp"),
      gravity: quoted(body, "gravity"),
      highlight: quoted(body, "highlight"),
      facts: facts.slice(0, 4),
    };
  }).filter((p) => p.diameter && p.highlight);

  const constellations = splitNamedObjects(read("js/constellations.js")).map(({ name, body }) => ({
    name,
    latin: quoted(body, "latin"),
    season: quoted(body, "season"),
    hemisphere: quoted(body, "hemisphere"),
    brightest: quoted(body, "brightest"),
    find: quoted(body, "find"),
    myth: quoted(body, "myth"),
  })).filter((c) => c.find);

  const facts = [...read("js/facts.js").matchAll(/\{\s*cat:\s*"([^"]+)",\s*text:\s*"([^"]+)"\s*\}/g)]
    .map((m) => ({ cat: m[1], text: m[2] }));

  const lessons = [...read("knowledge.html").matchAll(
    /<article class="lesson card reveal" id="([^"]+)">([\s\S]*?)<\/article>/g
  )].map((m) => ({
    id: m[1],
    title: (m[2].match(/<h3>([\s\S]*?)<\/h3>/) || [, ""])[1].replace(/<[^>]+>/g, "").trim(),
    text: stripTags(m[2]).slice(0, 700),
  }));

  cache = { planets, constellations, facts, lessons };
  return cache;
}

export function planetCatalog() {
  return load().planets;
}

export function constellationCatalog() {
  return load().constellations;
}

function compactPlanetLine(p) {
  return (
    p.name + ": " + p.tag + ", " + p.diameter + " km across, " +
    p.distanceAu + " AU, year " + p.year + ", day " + p.day + ", " +
    (p.moons === 0 ? "no moons" : p.moons + " moons") + ", " + p.temp +
    ", g=" + p.gravity + ". " + p.highlight
  );
}

function scoreHaystack(q, haystack) {
  const words = q.split(/\s+/).filter((w) => w.length > 3);
  let score = 0;
  for (const w of words) {
    if (haystack.includes(w)) score += 1;
  }
  return score;
}

export function lookupSiteAnswer(message) {
  const q = " " + String(message || "").toLowerCase().replace(/[^a-z0-9. ]/g, " ").replace(/\s+/g, " ") + " ";
  const { planets, constellations, facts } = load();

  for (const p of planets) {
    if (q.includes(" " + p.name.toLowerCase() + " ")) {
      const extra = p.facts[0] ? " " + p.facts[0] : "";
      return compactPlanetLine(p) + extra;
    }
  }
  for (const c of constellations) {
    if (q.includes(" " + c.name.toLowerCase() + " ")) {
      return c.name + " (" + c.latin + ") — " + c.season + ", " +
        c.hemisphere.toLowerCase() + " skies. Brightest: " + c.brightest +
        ". Find it: " + c.find;
    }
  }

  let best = null;
  let bestScore = 0;
  for (const f of facts) {
    const score = scoreHaystack(q, (" " + f.cat + " " + f.text).toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      best = "(" + f.cat + ") " + f.text;
    }
  }
  if (best && bestScore >= 2) return best;
  return null;
}

export function relevantSiteNotes(message, page) {
  const { planets, constellations, facts, lessons } = load();
  const q = String(message || "").toLowerCase();
  const room = normalizePage(page);
  const lines = [];

  lines.push("Planet fact sheets (NASA numbers used on /planets.html):");
  for (const p of planets) lines.push("- " + compactPlanetLine(p));

  const namedConstellations = constellations.filter((c) => q.includes(c.name.toLowerCase()));
  const constellationSet = namedConstellations.length
    ? namedConstellations
    : (room === "constellations" ? constellations : []);
  if (constellationSet.length) {
    lines.push("Constellation notes:");
    for (const c of constellationSet.slice(0, 8)) {
      lines.push("- " + c.name + " (" + c.latin + "), " + c.season + ", " +
        c.hemisphere + ". Brightest " + c.brightest + ". " + c.find);
    }
  }

  if (room === "knowledge" || room === "learn" || /light|gravity|galaxy|big bang|redshift|observe/.test(q)) {
    lines.push("Learn chapters:");
    for (const lesson of lessons) {
      if (room === "knowledge" || room === "learn" || q.includes(lesson.id) ||
          q.includes(lesson.title.toLowerCase().slice(0, 12))) {
        lines.push("- " + lesson.title + ": " + lesson.text.slice(0, 280));
      }
    }
  }

  const factHits = facts
    .map((f) => ({ f, score: scoreHaystack(q, (f.cat + " " + f.text).toLowerCase()) }))
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  if (factHits.length) {
    lines.push("Matching fact-wall notes:");
    for (const hit of factHits) lines.push("- (" + hit.f.cat + ") " + hit.f.text);
  }

  if (room === "quiz") {
    lines.push("Quiz coach note: explain the science; do not list the four options' correct index.");
  }

  const text = lines.join("\n");
  return text.length > 4500 ? text.slice(0, 4500) + "\n…" : text;
}
