"""Beast's brain — a tiny local HTTP server bridging astronomy-site's
Beast chat widget (js/chat.js) to Ollama, the same local AI model Ada
and Jarvis use. A static site's browser JS can't reach Ollama directly
(it only listens on localhost with no CORS headers, and a JSON POST
triggers a CORS preflight Ollama doesn't answer), so this fills that
gap — same fix as Ada's ada_server.py, adapted for Beast.

Run:  python beast_server.py     (needs `ollama serve` already running)

This only serves localhost. Beast's AI fallback only answers while THIS
machine is running this script — it does not make it work for a real
visitor on the deployed site unless this computer is itself the public
server. Zero extra dependencies: stdlib only, same spirit as Cosmos v2's
server and ada_server.py.
"""

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib import request as urlreq
from urllib.error import URLError

PORT = 8422
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"
SYSTEM_PROMPT = (
    "You are Beast, a friendly astronomy chat widget on a website. "
    "Answer in 1-2 short plain sentences, no markdown or lists."
)


class BeastHandler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/beast":
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

        if not message:
            self._reply(400, {"error": "empty message"})
            return

        try:
            req = urlreq.Request(
                OLLAMA_URL,
                data=json.dumps({
                    "model": OLLAMA_MODEL,
                    "prompt": message,
                    "system": SYSTEM_PROMPT,
                    "stream": False,
                }).encode(),
                headers={"Content-Type": "application/json"},
            )
            with urlreq.urlopen(req, timeout=120) as resp:
                reply = json.loads(resp.read()).get("response", "").strip()
        except (URLError, TimeoutError, ValueError):
            self._reply(502, {"error": "Ollama isn't reachable - is `ollama serve` running?"})
            return

        self._reply(200, {"reply": reply or "Hmm, I've got nothing - try rephrasing that?"})

    def _reply(self, status, payload):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        print("[beast]", fmt % args)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("localhost", PORT), BeastHandler)
    print(f"Beast server listening on http://localhost:{PORT} (Ollama model: {OLLAMA_MODEL})")
    server.serve_forever()
