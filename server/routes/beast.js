/* ===================================================================
   routes/beast.js — Beast's Ollama brain on the server.

   Browser JS can't call Ollama directly (CORS). This proxies open
   questions to Ollama on the same host as the site container.
   =================================================================== */

import { send } from "../app.js";
import { readJsonBody } from "../lib/body.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
const SYSTEM_PROMPT =
  "You are Beast, a friendly astronomy chat widget on a website. " +
  "Answer in 1-2 short plain sentences, no markdown or lists.";

export function beastHealth(res) {
  return send(res, 200, { ok: true });
}

export async function beast(req, res) {
  const body = await readJsonBody(req);
  if (!body.ok) {
    const status = body.code === "body_too_large" ? 413 : 400;
    return send(res, status, { error: { code: body.code, message: body.message } });
  }

  const message = (body.value.message || "").trim();
  if (!message) {
    return send(res, 400, { error: { code: "empty_message", message: "Empty message." } });
  }

  try {
    const resp = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: message,
        system: SYSTEM_PROMPT,
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!resp.ok) throw new Error(`Ollama HTTP ${resp.status}`);

    const data = await resp.json();
    const reply = (data.response || "").trim();
    return send(res, 200, { reply: reply || "Hmm, I've got nothing - try rephrasing that?" });
  } catch {
    return send(res, 502, {
      error: { code: "ollama_unreachable", message: "Ollama isn't reachable on the server." },
    });
  }
}
