/* ===================================================================
   lib/ai.js — talk to any OpenAI-compatible chat API (Groq default).

   Replaces the old local-Ollama client: Beast now answers through a
   hosted model, so no model download or GPU is needed on the server.
   Configure with env vars:
     AI_API_KEY  — required to enable live answers
     AI_API_URL  — defaults to Groq's OpenAI-compatible endpoint
     AI_MODEL    — defaults to llama-3.3-70b-versatile
   =================================================================== */

const AI_API_URL = (process.env.AI_API_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
const AI_API_KEY = process.env.AI_API_KEY || "";
/* llama-3.3-70b-versatile was retired by Groq — this is a model the
   free tier actually serves today. Env var AI_MODEL still wins. */
const AI_MODEL = process.env.AI_MODEL || "openai/gpt-oss-120b";

export function aiEnabled() {
  return Boolean(AI_API_KEY);
}

export async function pingAI() {
  if (!aiEnabled()) {
    return { ok: false, configured: false, url: null, model: AI_MODEL };
  }
  try {
    const resp = await fetch(AI_API_URL + "/models", {
      headers: { Authorization: "Bearer " + AI_API_KEY },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: resp.ok, configured: true, url: AI_API_URL, model: AI_MODEL };
  } catch {
    return { ok: false, configured: true, url: AI_API_URL, model: AI_MODEL };
  }
}

export async function aiGenerate({ prompt, system }) {
  if (!aiEnabled()) throw new Error("AI_API_KEY isn't set on the server.");

  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const resp = await fetch(AI_API_URL + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + AI_API_KEY,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 300,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) throw new Error(`AI API HTTP ${resp.status}`);
  const data = await resp.json();
  const reply = ((data.choices || [])[0] || {}).message || {};
  return (reply.content || "").trim();
}

export { AI_MODEL };
