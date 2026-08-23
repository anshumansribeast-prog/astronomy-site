/* ===================================================================
   routes/beast.js — Beast's brain on the server.

   Uses beast-brain.js for daily learning and conversation memory,
   and an OpenAI-compatible API (Groq default) for live answers.
   Without AI_API_KEY the route answers from the site's own data so
   Beast is never silent.
   =================================================================== */

import { send } from "../app.js";
import { readJsonBody } from "../lib/body.js";
import {
  ensureTodayBrain,
  buildSystemPrompt,
  rememberConversation,
  getTodayBrain,
  learnedSummary,
} from "../services/beast-brain.js";
import { aiEnabled, pingAI, aiGenerate } from "../lib/ai.js";
import { getTodayBrain as brainRow } from "../services/beast-brain.js";

/* Server-side fallback: the same facts the rest of the site renders
   from, matched by keyword. Keeps Beast useful with no API key. */
const FALLBACK_TOPICS = [
  { keys: ["venus", "hottest"], reply: "Venus is the hottest planet — about 465 °C day and night. Its thick carbon-dioxide atmosphere traps heat, even though Mercury orbits closer to the Sun." },
  { keys: ["mercury"], reply: "Mercury is the smallest planet and the fastest — it laps the Sun in just 88 days. Its temperature swings from 427 °C in daylight to −173 °C at night." },
  { keys: ["mars", "red"], reply: "Mars looks red because its dust is rich in iron oxide — literally rust. It hosts Olympus Mons, a volcano about three times the height of Everest." },
  { keys: ["jupiter", "biggest", "largest planet"], reply: "Jupiter is the largest planet — every other planet would fit inside it. Its Great Red Spot is a storm wider than Earth, raging for at least 190 years." },
  { keys: ["saturn", "ring"], reply: "Saturn's rings are billions of chunks of ice and rock, hundreds of thousands of km wide yet often only ~10 metres thick. Saturn is also less dense than water." },
  { keys: ["uranus"], reply: "Uranus orbits tipped on its side (~98°), probably from an ancient collision. Each pole gets 21 years of sunlight then 21 years of night. It's the coldest planet at −224 °C." },
  { keys: ["neptune", "windiest"], reply: "Neptune has the fastest winds in the solar system — about 2,100 km/h. It was found by mathematics before anyone saw it, predicted from wobbles in Uranus's orbit." },
  { keys: ["sun"], reply: "The Sun holds 99.86% of the solar system's mass; about 1.3 million Earths would fit inside it. Sunlight takes 8 minutes 20 seconds to reach us." },
  { keys: ["moon", "luna"], reply: "The Moon is tidally locked, so we always see the same face. Apollo footprints will likely last millions of years — there's no wind to erase them." },
  { keys: ["black hole"], reply: "A black hole's event horizon marks where escape would need faster-than-light speed. Sagittarius A*, at our galaxy's centre, weighs about 4 million Suns." },
  { keys: ["galaxy", "milky way"], reply: "The Milky Way holds 100–400 billion stars, and Andromeda — 2.5 million light-years away — is closing in; we'll merge in about 4.5 billion years." },
  { keys: ["star", "stars"], reply: "Stars shine by fusing hydrogen into helium. Most are small red dwarfs that can burn for trillions of years — far longer than the universe has existed." },
  { keys: ["light year", "lightyear"], reply: "A light-year measures distance, not time — how far light travels in a year, about 9.46 trillion km. Proxima Centauri sits 4.24 of them away." },
  { keys: ["universe", "big bang"], reply: "The universe began 13.8 billion years ago and the observable part now spans ~93 billion light-years — space itself expanded, which is how the edge outran light." },
  { keys: ["telescope", "jwst", "webb", "hubble"], reply: "JWST sees infrared from L2, 1.5 million km away, letting it look through dust at the first galaxies. Hubble watches visible light from Earth orbit." },
  { keys: ["exoplanet", "alien planet"], reply: "Over 5,500 planets are confirmed around other stars. A few sit in their star's habitable zone where liquid water could exist." },
  { keys: ["comet"], reply: "Comets are icy leftovers from the solar system's birth. Near the Sun their ice sublimates into the glowing tail that always points away from the Sun." },
  { keys: ["asteroid", "meteor", "shooting star"], reply: "Asteroids are rocky leftovers, mostly between Mars and Jupiter. A meteor is the streak of light as one burns up in our air; a survivor on the ground is a meteorite." },
  { keys: ["eclipse"], reply: "A solar eclipse: the Moon crosses in front of the Sun. A lunar eclipse: Earth's shadow falls on the Moon. Ours are special because the Moon almost exactly covers the Sun." },
  { keys: ["quiz", "game"], reply: "Head to the Quiz page! Four levels from Stargazer to Astronomer, ten questions each — pass with 75% to unlock the next level." },
];

function fallbackReply(message) {
  const lower = " " + message.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ") + " ";
  let best = null;
  let bestScore = 0;
  for (const topic of FALLBACK_TOPICS) {
    let score = 0;
    for (const key of topic.keys) {
      if (lower.includes(" " + key + " ")) score += key.includes(" ") ? 4 : 3;
      else if (lower.includes(key)) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = topic; }
  }
  if (best && bestScore > 0) return best.reply;

  return "I'm running on my offline notes right now, but I can still talk planets, constellations, the Moon, black holes or telescopes — try me, or ask again when the live model is back.";
}

export async function beastHealth(res) {
  const ping = await pingAI();
  // Always 200: CI and uptime checks prove the route is wired.
  // `api` is the real live-model flag — false when no key is set.
  return send(res, 200, {
    ok: true,
    api: ping.ok && ping.configured,
    configured: ping.configured,
    model: ping.model,
    url: ping.url,
  });
}

export async function beastLearned(res, db) {
  await ensureTodayBrain(db);
  const brain = getTodayBrain(db);
  if (!brain) return send(res, 200, { learned: null, summary: "Beast is waking up…" });
  return send(res, 200, {
    learned: {
      day: brain.day,
      apod_title: brain.apod_title,
      moon_phase: brain.moon_phase,
      daily_fact: brain.daily_fact,
    },
    summary: learnedSummary(brain),
  });
}

/* Today's NASA picture, from the server's own cached daily brain.
   The client used to call api.nasa.gov directly with the public
   DEMO_KEY (30 requests/hour/IP — flaky); now every page shares the
   one server-side fetch and its SQLite cache. */
export async function beastApod(res, db) {
  await ensureTodayBrain(db);
  const brain = brainRow(db);
  if (!brain || !brain.apod_title) {
    return send(res, 200, {
      data: {
        date: brain ? brain.day : null,
        title: null,
        summary: null,
        url: null,
        note: "NASA's picture isn't in yet — usually arrives within a day.",
      },
    });
  }
  return send(res, 200, {
    data: {
      date: brain.day,
      title: brain.apod_title,
      summary: brain.apod_summary,
      url: brain.apod_url,
    },
  });
}

export async function beast(req, res, db) {
  const body = await readJsonBody(req);
  if (!body.ok) {
    const status = body.code === "body_too_large" ? 413 : 400;
    return send(res, status, { error: { code: body.code, message: body.message } });
  }

  const message = (body.value.message || "").trim();
  if (!message) {
    return send(res, 400, { error: { code: "empty_message", message: "Empty message." } });
  }

  const history = Array.isArray(body.value.history) ? body.value.history.slice(-6) : [];
  const visitor = (body.value.visitor || "").trim().slice(0, 64) || null;

  const brain = await ensureTodayBrain(db);

  if (!aiEnabled()) {
    const reply = fallbackReply(message);
    return send(res, 200, { reply, source: "notes" });
  }

  const system = buildSystemPrompt(db, brain, visitor);

  let prompt = "";
  for (const turn of history) {
    const role = turn.role === "user" ? "Visitor" : "Beast";
    prompt += `${role}: ${turn.content || ""}\n`;
  }
  prompt += `Visitor: ${message}\nBeast:`;

  try {
    const reply = await aiGenerate({ prompt, system });
    const final = reply || fallbackReply(message);
    rememberConversation(db, message, final);
    return send(res, 200, { reply: final, source: "api" });
  } catch (err) {
    // Silent failures here cost a whole debugging session (a retired
    // model id looked like "the notes are fine") — log it loudly.
    console.error("[beast] live model failed, answering from notes:", err.message);
    const reply = fallbackReply(message);
    return send(res, 200, { reply, source: "notes" });
  }
}
