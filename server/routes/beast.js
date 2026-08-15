/* ===================================================================
   routes/beast.js — Beast's Ollama brain on the server.

   Uses beast-brain.js for daily learning and conversation memory.
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

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

export async function beastHealth(res) {
  return send(res, 200, { ok: true });
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

  const brain = await ensureTodayBrain(db);
  const system = buildSystemPrompt(db, brain);

  let prompt = "";
  for (const turn of history) {
    const role = turn.role === "user" ? "Visitor" : "Beast";
    prompt += `${role}: ${turn.content || ""}\n`;
  }
  prompt += `Visitor: ${message}\nBeast:`;

  try {
    const resp = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        system,
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!resp.ok) throw new Error(`Ollama HTTP ${resp.status}`);

    const data = await resp.json();
    const reply = (data.response || "").trim() || "Hmm, I've got nothing - try rephrasing that?";
    rememberConversation(db, message, reply);
    return send(res, 200, { reply });
  } catch {
    return send(res, 502, {
      error: { code: "ollama_unreachable", message: "Ollama isn't reachable on the server." },
    });
  }
}
