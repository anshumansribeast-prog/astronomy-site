#!/usr/bin/env python3
"""Create Beast and Ada Ollama models from the collected Modelfiles.

Does not invent Windows paths. Run from the astronomy-site root:

  python3 tools/train-models.py
  python3 tools/train-models.py --loop   # rebuild + eval until stopped
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BEAST_FILE = ROOT / "Modelfile.beast"
ADA_FILE = ROOT / ".semicolon-patch" / "Modelfile.ada"
LOG = Path("/opt/cursor/artifacts/model-training.log")
if not LOG.parent.exists():
    LOG = ROOT / "training" / "model-training.log"


def log(msg: str) -> None:
    line = time.strftime("%Y-%m-%dT%H:%M:%SZ ", time.gmtime()) + msg
    print(line, flush=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def ollama(*args: str, timeout: int = 3600) -> subprocess.CompletedProcess:
    exe = shutil.which("ollama")
    if not exe:
        raise FileNotFoundError("ollama is not on PATH")
    return subprocess.run(
        [exe, *args],
        capture_output=True,
        text=True,
        timeout=timeout,
        cwd=str(ROOT),
    )


def create(name: str, modelfile: Path) -> bool:
    log("create %s from %s" % (name, modelfile))
    proc = ollama("create", name, "-f", str(modelfile))
    if proc.stdout:
        log(proc.stdout.strip()[-500:])
    if proc.returncode != 0:
        log("FAIL %s: %s" % (name, (proc.stderr or proc.stdout)[-800:]))
        return False
    log("READY %s" % name)
    return True


def ask(model: str, prompt: str) -> str:
    proc = ollama("run", model, prompt, timeout=180)
    if proc.returncode != 0:
        return ""
    return (proc.stdout or "").strip()


def eval_once() -> dict:
    fixtures = json.loads((ROOT / "training" / "eval-fixtures.json").read_text())
    results = []
    hits = 0
    for case in fixtures:
        reply = ask(case["model"], case["user"])
        ok = all(token.lower() in reply.lower() for token in case["must_include"])
        forbidden = case.get("must_not_include") or []
        if any(token.lower() in reply.lower() for token in forbidden):
            ok = False
        hits += int(ok)
        results.append({"id": case["id"], "ok": ok, "reply": reply[:400]})
        log("eval %s %s" % (case["id"], "PASS" if ok else "FAIL"))
    score = hits / max(len(fixtures), 1)
    return {"score": score, "hits": hits, "n": len(fixtures), "results": results}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--loop", action="store_true")
    parser.add_argument("--sleep", type=int, default=120)
    args = parser.parse_args()

    if not shutil.which("ollama"):
        log("ollama missing; install it before training")
        return 2

    round_no = 0
    best = -1.0
    while True:
        round_no += 1
        log("round %s" % round_no)
        beast_ok = create("beast-astronomy", BEAST_FILE)
        ada_ok = create("ada-tutor", ADA_FILE)
        if not (beast_ok and ada_ok):
            if not args.loop:
                return 1
            time.sleep(args.sleep)
            continue
        report = eval_once()
        log("score %.3f (%s/%s)" % (report["score"], report["hits"], report["n"]))
        (ROOT / "training" / "last-eval.json").write_text(json.dumps(report, indent=2) + "\n")
        if report["score"] > best:
            best = report["score"]
            log("new best %.3f" % best)
        if not args.loop:
            return 0 if report["score"] >= 0.5 else 1
        time.sleep(args.sleep)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        log("stopped by user")
        sys.exit(0)
