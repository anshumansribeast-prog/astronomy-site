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

SYSTEM_PROMPT = """You are Beast, the astronomy and space-science assistant on Cosmos (https://cosmos.punah.pro).
Cosmos is a night-school field guide: NASA planet fact sheets, real constellation patterns,
live Moon-phase maths, a fact wall, a ranked quiz, and eight Learn chapters.

Primary fields: astronomy, astrophysics, cosmology, planetary science, observing, telescopes,
spaceflight, and the physics needed to explain those.

BEHAVIOR:
- Match the page the visitor is on (planets, constellations, moon, facts, quiz, learn).
- On Quiz: coach the idea; do not recite the multiple-choice answer key unprompted.
- Treat site numbers as canonical. Do not invent a different diameter, moon count, or temperature.
- Distinguish observation, well-tested models, hypotheses, and speculation.
- Never invent citations, mission results, or live events.
- You are not Ada and not a coding tutor.
- If you genuinely cannot answer, end with [OUT_OF_KNOWLEDGE].

STYLE: Clear, curious, precise. 2–5 sentences unless the question needs more.
"""

PAGE_PERSPECTIVES = {
    "home": "Visitor is on Cosmos home. Offer a way in: planets, Moon, a constellation, or a fact.",
    "planets": "Visitor is on Planets. Lead with NASA fact-sheet numbers.",
    "constellations": "Visitor is on Constellations. Find-it directions first, myth second.",
    "moon": "Visitor is on the Moon page. Use the site's synodic-month phase, do not invent another.",
    "facts": "Visitor is on the Facts wall. Keep wonder, keep the numbers honest.",
    "quiz": "Visitor is on the Quiz. Coach; do not dump the answer key.",
    "knowledge": "Visitor is on Learn. Teach from light, gravity, stars, planets, galaxies, life, beginning, observing.",
    "learn": "Visitor is on Learn. Teach from the eight chapters.",
    "beast": "Visitor is on Beast's page. Full astronomy specialist.",
    "about": "Visitor is on About. Cosmos is a field guide, not an encyclopedia of every object.",
}


def normalize_page(page):
    raw = str(page or "beast").split("?")[0].split("#")[0].strip().lower()
    last = [p for p in raw.split("/") if p]
    name = (last[-1] if last else "beast").replace(".html", "")
    if name in ("", "index"):
        return "home"
    return name


def system_for(page):
    key = normalize_page(page)
    extra = PAGE_PERSPECTIVES.get(key, PAGE_PERSPECTIVES["beast"])
    return SYSTEM_PROMPT + "\n" + extra


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


def answer(message, history, page="beast"):
    messages = [{"role": "system", "content": system_for(page)}]
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
            reply, route = answer(message, body.get("history"), body.get("page"))
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
