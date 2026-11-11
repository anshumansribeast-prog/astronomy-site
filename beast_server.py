"""Beast's brain — local HTTP server bridging Cosmos astronomy-site's
Beast chat widget (js/chat.js) to Ollama.
Powered by the custom trained `beast-astronomy` model.

Run: py beast_server.py
"""

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib import request as urlreq
from urllib.error import URLError

PORT = 8422
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "beast-astronomy:latest"


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
            self._reply(200, {
                "status": "online",
                "model": OLLAMA_MODEL,
                "server": "Cosmos Beast Astronomy Server"
            })
            return
        self.send_response(404)
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
                    "stream": False,
                }).encode(),
                headers={"Content-Type": "application/json"},
            )
            with urlreq.urlopen(req, timeout=120) as resp:
                reply = json.loads(resp.read()).get("response", "").strip()
        except (URLError, TimeoutError, ValueError) as err:
            self._reply(502, {"error": f"Ollama unreachable ({err}) - is Ollama running with '{OLLAMA_MODEL}'?"})
            return

        self._reply(200, {
            "reply": reply or "The cosmos is vast and silent on this — try asking another astronomical question!",
            "model": OLLAMA_MODEL
        })

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
    server = ThreadingHTTPServer(("localhost", PORT), BeastHandler)
    print(f"Beast server listening on http://localhost:{PORT} (Ollama model: {OLLAMA_MODEL})")
    server.serve_forever()
