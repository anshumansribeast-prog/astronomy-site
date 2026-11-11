"""Beast's brain — astronomy/space specialist for Cosmos.
Bridges the Beast chat widget (js/chat.js) to the backend AI.

Runs the upgraded `beast-astronomy` Ollama model locally, with an
OpenAI-compatible API provider as the production backend.

Run locally:  py beast_server.py
"""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib import request as urlreq
from urllib.error import HTTPError, URLError

HOST = os.environ.get("BEAST_HOST", "0.0.0.0")
PORT = int(os.environ.get("BEAST_PORT", "8422"))

# Cloud provider (production)
AI_API_URL   = os.environ.get("BEAST_AI_API_URL", os.environ.get("AI_API_URL", "")).strip()
AI_API_KEY   = os.environ.get("BEAST_AI_API_KEY", os.environ.get("AI_API_KEY", "")).strip()
AI_MODEL     = os.environ.get("BEAST_AI_MODEL", os.environ.get("AI_MODEL", "openai/gpt-oss-120b")).strip()
FALLBACK_API_URL = os.environ.get("BEAST_FALLBACK_API_URL", "").strip()
FALLBACK_API_KEY = os.environ.get("BEAST_FALLBACK_API_KEY", "").strip()
FALLBACK_MODEL   = os.environ.get("BEAST_FALLBACK_MODEL", "").strip()

# Local Ollama (development / when no cloud key is configured)
OLLAMA_URL   = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "beast-astronomy:latest"

HISTORY_TURNS     = 12
MAX_MESSAGE_CHARS = 12000

SYSTEM_PROMPT = """You are Beast, the specialist AI assistant for Cosmos, an astronomy and space-learning website.
Your primary expertise is astronomy, astrophysics, cosmology, planetary science, space science,
observational astronomy, telescopes, stellar evolution, galaxies, black holes, exoplanets, the
Solar System, cosmological models, gravitational physics, rockets, spacecraft, and major space missions.

BEHAVIOR:
- Be a genuine conversational assistant: remember the conversation and answer follow-ups.
- Explain from beginner to advanced level depending on the question.
- Distinguish established observations, models, hypotheses, and speculation.
- Show equations when they materially help; define symbols and units.
- For numerical questions, reason carefully and state assumptions.
- Use Markdown: **bold** key terms, bullet lists, and ```code``` for calculations.
- Never invent observations, mission results, or citations.
- If you genuinely cannot answer, end with [OUT_OF_KNOWLEDGE].

STYLE: Clear, curious, precise, and encouraging. The goal is accurate understanding.
"""


def clip_history(history):
    out = []
    for turn in (history or [])[-HISTORY_TURNS:]:
        role = turn.get("role", "user")
        if role in ("beast", "bot", "model"):
            role = "assistant"
        if role not in ("user", "assistant"):
            continue
        content = str(turn.get("content", ""))[:6000].strip()
        if content:
            out.append({"role": role, "content": content})
    return out


def call_provider(messages, api_url, api_key, model):
    if not api_key or not api_url or not model:
        return None
    url = api_url.rstrip("/")
    if not url.endswith("/chat/completions"):
        url += "/chat/completions"
    payload = json.dumps({"model": model, "messages": messages, "temperature": 0.35}).encode()
    req = urlreq.Request(url, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer " + api_key,
    })
    with urlreq.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read())
    choices = data.get("choices") or []
    if not choices:
        return None
    return ((choices[0].get("message") or {}).get("content") or "").strip() or None


def call_ollama(message):
    """Local Ollama fallback for development."""
    req = urlreq.Request(
        OLLAMA_URL,
        data=json.dumps({
            "model": OLLAMA_MODEL,
            "prompt": message,
            "stream": False,
        }).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urlreq.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read()).get("response", "").strip()


def needs_fallback(reply):
    if not reply:
        return True
    text = reply.strip().lower()
    if "[out_of_knowledge]" in text:
        return True
    uncertainty = (
        "i don't know", "i do not know", "i can't answer that",
        "i cannot answer that", "i'm not sure", "i am not sure", "unable to answer",
    )
    return any(phrase in text for phrase in uncertainty)


def answer(message, history):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(clip_history(history))
    messages.append({"role": "user", "content": message})

    # 1. Try cloud provider
    if AI_API_URL and AI_API_KEY and AI_MODEL:
        try:
            reply = call_provider(messages, AI_API_URL, AI_API_KEY, AI_MODEL)
            if reply and not needs_fallback(reply):
                return reply, "primary"
        except (URLError, HTTPError, TimeoutError, ValueError, OSError):
            pass

    # 2. Try cloud fallback
    if FALLBACK_API_URL and FALLBACK_API_KEY and FALLBACK_MODEL:
        try:
            fallback = call_provider(messages, FALLBACK_API_URL, FALLBACK_API_KEY, FALLBACK_MODEL)
            if fallback:
                return fallback, "fallback"
        except (URLError, HTTPError, TimeoutError, ValueError, OSError):
            pass

    # 3. Local Ollama (beast-astronomy model)
    try:
        ollama_reply = call_ollama(message)
        if ollama_reply:
            return ollama_reply, "ollama"
    except (URLError, TimeoutError, ValueError, OSError):
        pass

    return None, "unavailable"


class BeastHandler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path in ("/api/health", "/api/beast/health", "/health"):
            configured = bool(AI_API_URL and AI_API_KEY and AI_MODEL)
            self._reply(200, {
                "ok": True,
                "service": "beast",
                "primary_configured": configured,
                "ollama_model": OLLAMA_MODEL,
            })
            return
        self._reply(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/api/beast":
            self._reply(404, {"error": "not found"})
            return
        try:
            length = min(int(self.headers.get("Content-Length", 0)), 200000)
        except ValueError:
            length = 0
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, TypeError):
            self._reply(400, {"error": "invalid JSON"})
            return
        message = str(body.get("message") or "").strip()[:MAX_MESSAGE_CHARS]
        if not message:
            self._reply(400, {"error": "empty message"})
            return
        try:
            reply, route = answer(message, body.get("history"))
        except (URLError, HTTPError, TimeoutError, ValueError, OSError):
            self._reply(502, {"error": "AI provider unavailable"})
            return
        if not reply:
            self._reply(502, {"error": "AI provider returned no answer"})
            return
        self._reply(200, {"reply": reply, "model": OLLAMA_MODEL if route == "ollama" else AI_MODEL, "route": route})

    def _reply(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        print("[beast]", fmt % args)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), BeastHandler)
    print(f"Beast listening on {HOST}:{PORT} (Ollama model: {OLLAMA_MODEL})")
    server.serve_forever()
