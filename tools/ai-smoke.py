#!/usr/bin/env python3
"""Safe CI smoke tests for Beast. No provider key is stored here."""
import json
import sys
from urllib.request import Request, urlopen

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8899").rstrip("/")


def get(path):
    with urlopen(BASE + path, timeout=15) as r:
        return json.loads(r.read().decode())


def ask(message, history=None):
    body = {"message": message, "history": history or []}
    req = Request(BASE + "/api/beast", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode())

health = get("/api/beast/health")
assert health.get("ok") is True, health
assert get("/api/beast/learned").get("learned") is not None, "daily brain unavailable"

if health.get("api"):
    questions = [
        "What is a black hole?",
        "Explain stellar fusion.",
        "What is the difference between a comet and an asteroid?",
        "What is dark matter?",
        "Explain Newton's second law.",
        "How do astronomers detect exoplanets?",
        "What is the difference between a solar and lunar eclipse?",
        "What is the Hubble constant?",
    ]
    for q in questions:
        result = ask(q)
        reply = (result.get("reply") or "").strip()
        assert len(reply) >= 20 and result.get("source") == "api", (q, result)
else:
    # CI has no secret provider key: verify the astronomy fallback is alive.
    for q in ["Venus", "Mars", "black hole", "Milky Way", "light year", "eclipse"]:
        result = ask(q)
        assert (result.get("reply") or "").strip() and result.get("source") == "notes", (q, result)

print("Beast AI smoke tests: PASS")
