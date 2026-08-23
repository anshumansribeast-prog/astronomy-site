import os
import unittest

# Keep tests independent of production credentials.
os.environ.pop("BEAST_AI_API_KEY", None)
os.environ.pop("BEAST_FALLBACK_API_KEY", None)

import beast_server


class BeastRouterTests(unittest.TestCase):
    def test_normal_answer_does_not_fallback(self):
        self.assertFalse(beast_server.needs_fallback("The Sun is a G-type main-sequence star."))

    def test_explicit_unknown_marker_triggers_fallback(self):
        self.assertTrue(beast_server.needs_fallback("I cannot verify that. [OUT_OF_KNOWLEDGE]"))

    def test_uncertain_answer_triggers_fallback(self):
        self.assertTrue(beast_server.needs_fallback("I'm not sure about that fact."))

    def test_empty_answer_triggers_fallback(self):
        self.assertTrue(beast_server.needs_fallback(""))


if __name__ == "__main__":
    unittest.main()
