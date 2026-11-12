import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".semicolon-patch"))
sys.path.insert(0, str(ROOT))

import ada_page_training  # noqa: E402
import beast_server  # noqa: E402


class SitePersonaTests(unittest.TestCase):
    def test_ada_stays_a_coding_tutor(self):
        prompt = ada_page_training.system_prompt("pages/lesson.html", "AnshX")
        self.assertIn("coding tutor", prompt.lower())
        self.assertIn("semicolon.punah.pro", prompt)
        self.assertIn("lesson", prompt.lower())
        self.assertIn("AnshX", prompt)
        self.assertNotIn("NASA fact-sheet", prompt)

    def test_ada_playground_perspective(self):
        prompt = ada_page_training.system_prompt("/pages/playground.html")
        self.assertIn("Practice", prompt)

    def test_beast_stays_astronomy(self):
        prompt = beast_server.system_for("planets.html")
        self.assertIn("Beast", prompt)
        self.assertIn("cosmos.punah.pro", prompt)
        self.assertIn("Planets", prompt)
        self.assertIn("not ada", prompt.lower())

    def test_beast_quiz_does_not_spoil(self):
        prompt = beast_server.system_for("quiz")
        self.assertIn("answer key", prompt.lower())


if __name__ == "__main__":
    unittest.main()
