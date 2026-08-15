/* ===================================================================
   lib/ollama.js — find a working Ollama and send a generate request.

   Inside Docker, 127.0.0.1 is the site container, not the host and not
   a sibling named "ollama". Try the compose service name, then the
   Docker host gateway, then localhost. Cache whichever one answers.
   =================================================================== */

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

function candidateGenerateUrls() {
  if (process.env.OLLAMA_URL) return [process.env.OLLAMA_URL];
  return [
    "http://ollama:11434/api/generate",
    "http://host.docker.internal:11434/api/generate",
    "http://172.17.0.1:11434/api/generate",
    "http://127.0.0.1:11434/api/generate",
  ];
}

function tagsUrl(generateUrl) {
  return generateUrl.replace(/\/api\/generate\/?$/, "/api/tags");
}

let cachedGenerateUrl = null;

async function tryFetch(url, options, timeoutMs) {
  const resp = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resp.ok) throw new Error(`Ollama HTTP ${resp.status} at ${url}`);
  return resp;
}

export async function pingOllama() {
  const urls = cachedGenerateUrl
    ? [cachedGenerateUrl, ...candidateGenerateUrls().filter((u) => u !== cachedGenerateUrl)]
    : candidateGenerateUrls();

  for (const generateUrl of urls) {
    try {
      const resp = await tryFetch(tagsUrl(generateUrl), { method: "GET" }, 2500);
      const data = await resp.json().catch(() => ({}));
      cachedGenerateUrl = generateUrl;
      const models = Array.isArray(data.models) ? data.models.map((m) => m.name) : [];
      return {
        ok: true,
        url: generateUrl,
        model: OLLAMA_MODEL,
        models,
        hasModel: models.some((name) => name === OLLAMA_MODEL || name.startsWith(OLLAMA_MODEL + ":") || name.startsWith(OLLAMA_MODEL.split(":")[0])),
      };
    } catch {
      /* try the next candidate */
    }
  }

  return { ok: false, url: null, model: OLLAMA_MODEL, models: [], hasModel: false };
}

export async function ollamaGenerate({ prompt, system }) {
  const urls = cachedGenerateUrl
    ? [cachedGenerateUrl, ...candidateGenerateUrls().filter((u) => u !== cachedGenerateUrl)]
    : candidateGenerateUrls();

  let lastError = null;
  for (const url of urls) {
    try {
      const resp = await tryFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          system,
          stream: false,
        }),
      }, 120_000);
      const data = await resp.json();
      cachedGenerateUrl = url;
      return data;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Ollama isn't reachable on the server.");
}

export { OLLAMA_MODEL };
