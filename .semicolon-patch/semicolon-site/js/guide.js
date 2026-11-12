/* ===================================================================
   guide.js — Guide, the lesson companion.

   Not Ada. Ada is the AI chat. Guide is a written helper that reads
   the lesson currently on the page: headings, first paragraph, and
   the first code sample. Answers stay inside that lesson. If it does
   not know, it says so and points at Ada only as a last step.
   =================================================================== */

(function () {
  "use strict";

  function strip(html) {
    return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  function extractLessonGuide(html) {
    var headings = [...String(html || "").matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)]
      .map(function (m) { return strip(m[1]); })
      .filter(Boolean)
      .slice(0, 6);
    var firstP = strip((String(html || "").match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || "");
    var code = strip((String(html || "").match(/<code[^>]*>([\s\S]*?)<\/code>/i) || [])[1] || "");
    if (code.length > 80) code = code.slice(0, 77) + "…";
    return { headings: headings, summary: firstP.slice(0, 280), sample: code };
  }

  window.LessonGuide = { extractLessonGuide: extractLessonGuide };

  var mount = document.getElementById("lessonGuide");
  var bodyEl = document.getElementById("lessonBody");
  if (!mount || !bodyEl) return;

  function currentTrack() {
    return new URLSearchParams(window.location.search).get("track") || "";
  }

  function render() {
    var info = extractLessonGuide(bodyEl.innerHTML);
    var title = (document.getElementById("lessonTitle") || {}).textContent || "this lesson";
    var headingList = info.headings.length
      ? "<ol class=\"guide-steps\">" + info.headings.map(function (h) {
          return "<li>" + h.replace(/</g, "&lt;") + "</li>";
        }).join("") + "</ol>"
      : "<p class=\"guide-muted\">Read the lesson on the left, then try the code.</p>";
    var sample = info.sample
      ? "<p class=\"guide-try\"><strong>Try this</strong> <code>" +
        info.sample.replace(/</g, "&lt;") + "</code></p>"
      : "";
    var chips = (info.headings.slice(0, 3).concat(["I'm stuck", "What should I do next?"]))
      .map(function (label) {
        return "<button type=\"button\" class=\"guide-chip\" data-q=\"" +
          String(label).replace(/"/g, "&quot;") + "\">" + label.replace(/</g, "&lt;") + "</button>";
      }).join("");

    mount.innerHTML =
      '<div class="guide-badge">Guide · not Ada</div>' +
      "<h2 class=\"side-title\">This lesson</h2>" +
      "<p class=\"guide-lede\">" + (info.summary || title).replace(/</g, "&lt;") + "</p>" +
      headingList + sample +
      "<p class=\"guide-muted\">Ask about <em>this</em> lesson. Guide only uses what is written here.</p>" +
      "<div class=\"guide-chips\">" + chips + "</div>" +
      '<form class="guide-form" id="guideForm">' +
        '<label class="sr-only" for="guideInput">Ask Guide about this lesson</label>' +
        '<input id="guideInput" type="text" autocomplete="off" placeholder="Ask about this lesson…">' +
        '<button class="btn btn--primary btn--sm" type="submit">Ask</button>' +
      "</form>" +
      '<p class="guide-reply" id="guideReply" hidden></p>' +
      '<p class="guide-ada-hint">Need a conversation? <a href="ada.html">Ada</a> is the AI tutor. Guide stays with the lesson.</p>';
  }

  function answerFromLesson(question) {
    var q = " " + question.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ") + " ";
    var info = extractLessonGuide(bodyEl.innerHTML);
    if (/stuck|hard|confused|help/.test(q)) {
      return "Stay on this page. Read the next heading, type the sample, then check the error from the bottom up. Guide will not invent steps Ada might. If you want a back-and-forth chat, open Ada.";
    }
    if (/next|after|done/.test(q)) {
      var next = document.getElementById("nextLesson");
      if (next && next.getAttribute("href") && next.getAttribute("href") !== "#") {
        return "When this lesson's ideas make sense, use Next at the bottom. Do not skip the code in the middle.";
      }
      return "This looks like the end of the track. Go back to Learn and pick another.";
    }
    var hit = info.headings.find(function (h) {
      var words = h.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 3; });
      return words.some(function (w) { return q.indexOf(w) !== -1; });
    });
    if (hit) {
      return "This lesson covers “" + hit + "”. Read that heading on the left, then try the code under it. Guide does not replace the lesson text.";
    }
    if (typeof HELP_TOPICS !== "undefined") {
      var slug = currentTrack();
      var best = null;
      var bestScore = 0;
      HELP_TOPICS.forEach(function (topic) {
        var score = 0;
        topic.k.forEach(function (word) {
          if (q.indexOf(" " + word + " ") !== -1) score += 3;
          else if (q.indexOf(word) !== -1) score += 1;
        });
        if (slug && topic.link && String(topic.link.href).indexOf(slug) !== -1) score += 4;
        if (score > bestScore) { bestScore = score; best = topic; }
      });
      if (best && bestScore >= 3) {
        return strip(best.a.replace(/<br\s*\/?>/gi, " ")).slice(0, 360) +
          " That is from Semicolon's written notes, not Ada.";
      }
    }
    return "Guide only knows what this lesson wrote. Rephrase using a heading on the left, or ask Ada if you want a live tutor.";
  }

  function showAnswer(question) {
    var reply = document.getElementById("guideReply");
    var input = document.getElementById("guideInput");
    if (!reply) return;
    reply.hidden = false;
    reply.textContent = answerFromLesson(question);
    if (input) input.value = "";
  }

  render();
  mount.addEventListener("click", function (e) {
    var btn = e.target.closest(".guide-chip");
    if (!btn) return;
    showAnswer(btn.getAttribute("data-q") || "");
  });
  mount.addEventListener("submit", function (e) {
    if (e.target.id !== "guideForm") return;
    e.preventDefault();
    var input = document.getElementById("guideInput");
    var q = (input && input.value || "").trim();
    if (q) showAnswer(q);
  });
})();
