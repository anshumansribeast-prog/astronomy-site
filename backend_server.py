"""Backend admin page's brain — a tiny local HTTP server bridging
astronomy-site's /backend chat panel (js/backend.js) to Ollama, same
idea as ada_server.py and beast_server.py. This one is Jarvis himself
(not a Beast/Ada persona): it reads Jarvis's own personal facts and
project knowledge from the jarvis/ project on this same laptop, and
keeps conversation history so it remembers earlier turns in the chat,
not just the latest message.

Run:  python backend_server.py     (needs `ollama serve` already running)

Only serves localhost. The /backend page is gated by a real account
check server-side (ADMIN_USERNAME in server/routes/auth.js), but this
bridge itself is unreachable from anywhere but THIS laptop regardless —
same limitation as Ada, Beast, and Jarvis Orb's bridges. No new
internet exposure here.
"""

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib import request as urlreq
from urllib.error import URLError

PORT = 8423
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"
FACTS_PATH = r"C:\Users\Anshu\jarvis\config\facts.json"
PROJECTS_PATH = r"C:\Users\Anshu\jarvis\config\projects.json"
BASE_SYSTEM_PROMPT = (
    "You are JARVIS, Anshuman's own assistant, talking to him on his "
    "site's private admin page - nobody else can reach this. Answer "
    "confidently and specifically, don't hedge or refuse unless truly "
    "unsafe. Keep replies short (2-4 plain sentences), no markdown."
)


def _load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def build_system_prompt():
    system_prompt = BASE_SYSTEM_PROMPT

    facts = _load_json(FACTS_PATH)
    if facts:
        system_prompt += " Known facts about Anshuman: " + "; ".join(
            f"their {k} is {v}" for k, v in facts.items()) + "."

    projects = _load_json(PROJECTS_PATH)
    if projects:
        system_prompt += " His coding projects: " + " ".join(
            f"{name} - {desc}" for name, desc in projects.items())

    return system_prompt


class BackendHandler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/backend":
            self.send_response(404)
            self._cors()
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except ValueError:
            body = {}
        message = (body.get("message") or "").strip()
        turns = body.get("history") or []

        if not message:
            self._reply(400, {"error": "empty message"})
            return

        prompt = ""
        for turn in turns[-8:]:
            role = "Anshuman" if turn.get("role") == "user" else "Jarvis"
            prompt += f"{role}: {turn.get('content', '')}\n"
        prompt += f"Anshuman: {message}\nJarvis:"

        try:
            req = urlreq.Request(
                OLLAMA_URL,
                data=json.dumps({
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "system": build_system_prompt(),
                    "stream": False,
                }).encode(),
                headers={"Content-Type": "application/json"},
            )
            with urlreq.urlopen(req, timeout=120) as resp:
                reply = json.loads(resp.read()).get("response", "").strip()
        except (URLError, TimeoutError, ValueError):
            self._reply(502, {"error": "Ollama isn't reachable - is `ollama serve` running?"})
            return

        self._reply(200, {"reply": reply or "I didn't catch that - try again?"})

    def _reply(self, status, payload):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        print("[backend]", fmt % args)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("localhost", PORT), BackendHandler)
    print(f"Backend admin server listening on http://localhost:{PORT} (Ollama model: {OLLAMA_MODEL})")
    server.serve_forever()
