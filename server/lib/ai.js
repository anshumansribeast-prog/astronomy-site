/* ===================================================================
   lib/ai.js — primary model plus conditional OpenAI second opinion.
   The OpenAI fallback is used only when Beast genuinely signals
   uncertainty or the primary provider fails. Secrets stay server-side.
   =================================================================== */

const AI_API_URL = (process.env.AI_API_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "openai/gpt-oss-120b";
const OPENAI_API_URL = (process.env.OPENAI_API_URL || "https://api.openai.com/v1/responses").replace(/\/+$/, "");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const OUT_OF_KNOWLEDGE = "[OUT_OF_KNOWLEDGE]";
const UNCERTAIN = /(?:^|\s)(?:i\s+(?:don't|do not)\s+know|i\s+(?:cannot|can't)\s+answer|i\s+(?:cannot|can't)\s+verify|not\s+enough\s+information|outside\s+my\s+knowledge|unknown\s+to\s+me)(?:\s|[.!?,]|$)/i;

export function aiEnabled() { return Boolean(AI_API_KEY); }

export function shouldFallback(text) {
  const value = String(text || "").trim();
  return value.includes(OUT_OF_KNOWLEDGE) || UNCERTAIN.test(value);
}

export async function pingAI() {
  if (!aiEnabled()) return { ok: false, configured: false, url: null, model: AI_MODEL };
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

async function openAiFallback({ prompt, system }) {
  if (!OPENAI_API_KEY) return null;
  const input = [
    system ? `${system}\n\nFallback rule: answer only when you genuinely know enough; never invent facts.` : "",
    prompt,
  ].filter(Boolean).join("\n\n");
  const resp = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + OPENAI_API_KEY },
    body: JSON.stringify({ model: OPENAI_MODEL, input, temperature: 0.2 }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!resp.ok) throw new Error(`OpenAI fallback HTTP ${resp.status}`);
  const data = await resp.json();
  return String(data.output_text || "").trim() || null;
}

export async function aiGenerate({ prompt, system }) {
  if (!aiEnabled()) throw new Error("AI_API_KEY isn't set on the server.");
  const primarySystem = `${system || ""}\n\nWhen you genuinely do not know enough to answer, begin with ${OUT_OF_KNOWLEDGE}. Do not use this marker for normal questions you can answer.`;
  const messages = [
    { role: "system", content: primarySystem },
    { role: "user", content: prompt },
  ];

  try {
    const resp = await fetch(AI_API_URL + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + AI_API_KEY },
      body: JSON.stringify({ model: AI_MODEL, messages, temperature: 0.6, max_tokens: 300 }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) throw new Error(`AI API HTTP ${resp.status}`);
    const data = await resp.json();
    const reply = String((((data.choices || [])[0] || {}).message || {}).content || "").trim();
    if (shouldFallback(reply)) {
      const fallback = await openAiFallback({ prompt, system });
      if (fallback) return "That's a good one — let me check that for you.\n\n" + fallback;
    }
    return reply;
  } catch (primaryError) {
    try {
      const fallback = await openAiFallback({ prompt, system });
      if (fallback) return "That's a good one — let me check that for you.\n\n" + fallback;
    } catch (fallbackError) {
      primaryError.fallbackError = fallbackError.message;
    }
    throw primaryError;
  }
}

export { AI_MODEL };
