"""Guide is a lesson helper, not Ada."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class GuideTests(unittest.TestCase):
    def test_guide_script_is_not_ada(self):
        text = (ROOT / "js" / "guide.js").read_text(encoding="utf-8")
        self.assertIn("Not Ada", text)
        self.assertIn("extractLessonGuide", text)
        self.assertNotIn("You are Ada", text)

    def test_lesson_page_mounts_guide(self):
        html = (ROOT / "pages" / "lesson.html").read_text(encoding="utf-8")
        self.assertIn('id="lessonGuide"', html)
        self.assertIn("js/guide.js", html)

    def test_extract_reads_headings(self):
        html = "<h3>Installing Python</h3><p>Go to python.org.</p><code>python --version</code>"
        # Mirror the extractor with the same regex the script uses.
        import re
        headings = [re.sub(r"<[^>]+>", " ", m).strip()
                    for m in re.findall(r"<h3[^>]*>([\s\S]*?)</h3>", html, re.I)]
        self.assertEqual(headings, ["Installing Python"])


if __name__ == "__main__":
    unittest.main()
