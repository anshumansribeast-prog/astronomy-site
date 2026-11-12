#!/usr/bin/env python3
"""Print Ada's written notes as JSON for the training collector."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".semicolon-patch"))
import ada_knowledge  # noqa: E402

print(json.dumps([
    {"keys": list(keys), "answer": ada_knowledge._fill(answer)}
    for keys, answer in ada_knowledge.TOPICS
]))
