/* ===================================================================
   services/beast-brain.js — Beast's daily learning on the server.

   Each calendar day Beast refreshes: NASA's picture-of-the-day,
   tonight's moon phase, and one fact from the site's fact wall.
   Conversations with visitors are remembered and folded into later
   replies. All of this lives in SQLite so it survives restarts when
   ASTRO_DATA_DIR is set.
   =================================================================== */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FACTS_PATH = join(here, "..", "..", "js", "facts.js");

const NASA_API_KEY = process.env.NASA_API_KEY || "DEMO_KEY";
const SYNODIC_MS = 29.530588853 * 86400000;
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

const BASE_PROMPT =
  "You are Beast, a friendly astronomy chat widget on a website called Cosmos. " +
  "Answer in 1-2 short plain sentences, no markdown or lists. " +
  "Use what you learned today and recent visitor conversations when relevant.";

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function hashDay(day) {
  let h = 0;
  for (let i = 0; i < day.length; i++) h = (h * 31 + day.charCodeAt(i)) >>> 0;
  return h;
}

function moonPhaseFor(date) {
  const elapsed = date.getTime() - REF_NEW_MOON;
  let frac = (elapsed % SYNODIC_MS) / SYNODIC_MS;
  if (frac < 0) frac += 1;
  const age = frac * 29.530588853;
  const illum = Math.round((1 - Math.cos(2 * Math.PI * frac)) / 2 * 100);

  let name = "New Moon";
  if (age < 1.85) name = "New Moon";
  else if (age < 5.54) name = "Waxing Crescent";
  else if (age < 9.23) name = "First Quarter";
  else if (age < 12.92) name = "Waxing Gibbous";
  else if (age < 16.61) name = "Full Moon";
  else if (age < 20.30) name = "Waning Gibbous";
  else if (age < 23.99) name = "Last Quarter";
  else name = "Waning Crescent";

  return `${name}, about ${illum}% lit`;
}

function pickDailyFact(day) {
  try {
    const raw = readFileSync(FACTS_PATH, "utf8");
    const facts = [...raw.matchAll(/text:\s*"([^"]+)"/g)].map(m => m[1]);
    if (!facts.length) return null;
    return facts[hashDay(day) % facts.length];
  } catch {
    return "The observable universe is about 93 billion light-years across.";
  }
}

async function fetchApod(day) {
  const url =
    `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${day}`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!resp.ok) return { title: null, summary: null };
    const data = await resp.json();
    const title = data.title || null;
    const summary = (data.explanation || "").slice(0, 400);
    return { title, summary };
  } catch {
    return { title: null, summary: null };
  }
}

export function getTodayBrain(db) {
  return db.prepare(
    "SELECT day, apod_title, apod_summary, moon_phase, daily_fact, refreshed_at FROM beast_brain_days WHERE day = ?"
  ).get(todayKey());
}

export function getRecentMemories(db, limit = 5) {
  return db.prepare(
    `SELECT question, answer FROM beast_memories
     ORDER BY created_at DESC LIMIT ?`
  ).all(limit);
}

export async function ensureTodayBrain(db) {
  const day = todayKey();
  const existing = getTodayBrain(db);
  if (existing) return existing;

  const apod = await fetchApod(day);
  const moon = moonPhaseFor(new Date());
  const fact = pickDailyFact(day);

  db.prepare(
    `INSERT INTO beast_brain_days (day, apod_title, apod_summary, moon_phase, daily_fact)
     VALUES (?, ?, ?, ?, ?)`
  ).run(day, apod.title, apod.summary, moon, fact);

  console.log(`  Beast learned today's sky: ${apod.title || "no APOD"}, ${moon}`);
  return getTodayBrain(db);
}

export function rememberConversation(db, question, answer) {
  const q = question.slice(0, 500);
  const a = answer.slice(0, 500);
  db.prepare(
    "INSERT INTO beast_memories (learned_on, question, answer) VALUES (?, ?, ?)"
  ).run(todayKey(), q, a);

  const count = db.prepare("SELECT COUNT(*) AS n FROM beast_memories").get().n;
  if (count > 100) {
    db.prepare(
      `DELETE FROM beast_memories WHERE id IN (
         SELECT id FROM beast_memories ORDER BY created_at ASC LIMIT ?
       )`
    ).run(count - 100);
  }
}

export function buildSystemPrompt(db, brain, visitorName) {
  const parts = [BASE_PROMPT, `Today is ${brain.day}.`];

  if (visitorName) {
    parts.push(`The visitor's name is ${visitorName}. Use it naturally when greeting them.`);
  }

  if (brain.moon_phase) {
    parts.push(`Tonight's Moon: ${brain.moon_phase}.`);
  }
  if (brain.daily_fact) {
    parts.push(`Fact studied today: ${brain.daily_fact}`);
  }
  if (brain.apod_title) {
    parts.push(`NASA picture of the day — ${brain.apod_title}: ${brain.apod_summary || ""}`);
  }

  const memories = getRecentMemories(db, 5);
  if (memories.length) {
    const lines = memories.map(m => `Visitor asked "${m.question}" — you answered "${m.answer}"`);
    parts.push("Recent visitor conversations you remember:\n" + lines.join("\n"));
  }

  return parts.join("\n");
}

export function learnedSummary(brain) {
  const bits = [];
  if (brain.apod_title) bits.push(`NASA's picture today: ${brain.apod_title}`);
  if (brain.moon_phase) bits.push(`the Moon is a ${brain.moon_phase}`);
  if (brain.daily_fact) bits.push(`a new fact about space`);
  if (!bits.length) return "I'm studying the sky.";
  return "Today I learned about " + bits.join(", ") + ".";
}
