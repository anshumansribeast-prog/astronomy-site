#!/usr/bin/env python3
"""Held-out knowledge bar. These prompts are not the overnight 6 fixtures."""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAM = ROOT / "training" / "hard-exam.json"
OUT = Path("/opt/cursor/artifacts/hard-exam.json")
if not OUT.parent.exists():
    OUT = ROOT / "training" / "hard-exam-results.json"


def ask(model: str, prompt: str) -> str:
    exe = shutil.which("ollama")
    proc = subprocess.run(
        [exe, "run", model, prompt],
        capture_output=True,
        text=True,
        timeout=180,
    )
    return (proc.stdout or "").strip()


def main() -> int:
    cases = json.loads(EXAM.read_text())
    models = sys.argv[1:] or sorted({c["model"] for c in cases})
    rows = []
    for case in cases:
        if case["model"] not in models:
            continue
        reply = ask(case["model"], case["user"])
        ok = all(t.lower() in reply.lower() for t in case["must_include"])
        if any(t.lower() in reply.lower() for t in (case.get("must_not_include") or [])):
            ok = False
        rows.append({
            "id": case["id"],
            "model": case["model"],
            "ok": ok,
            "user": case["user"],
            "must_include": case["must_include"],
            "reply": reply[:600],
        })
        print("%s %s" % ("PASS" if ok else "FAIL", case["id"]), flush=True)
        print("  " + reply.replace("\n", " ")[:220], flush=True)

    by = {}
    for r in rows:
        by.setdefault(r["model"], {"hits": 0, "n": 0, "ids": []})
        by[r["model"]]["n"] += 1
        by[r["model"]]["hits"] += int(r["ok"])
        by[r["model"]]["ids"].append({"id": r["id"], "ok": r["ok"]})
    report = {"by_model": by, "results": rows}
    OUT.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(by, indent=2))
    print("wrote", OUT)
    # Fail the process if either specialist is under 70%.
    bad = [m for m, s in by.items() if s["n"] and (s["hits"] / s["n"]) < 0.7]
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
