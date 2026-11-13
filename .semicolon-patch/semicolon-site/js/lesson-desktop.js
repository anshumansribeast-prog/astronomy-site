/* Animated desktop beside every lesson code sample.
   Types the same source the reader is looking at, inside a window
   that plays like a short screen recording. */
(function () {
  "use strict";

  function reduced() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function mount(pre) {
    if (pre.dataset.deskReady) return;
    pre.dataset.deskReady = "1";
    var code = pre.querySelector("code");
    var text = (code ? code.textContent : pre.textContent).replace(/\s+$/, "");
    var lang = pre.getAttribute("data-lang") || "code";
    var stage = document.createElement("div");
    stage.className = "lesson-stage";
    pre.parentNode.insertBefore(stage, pre);
    stage.appendChild(pre);

    var video = document.createElement("div");
    video.className = "desk-video";
    video.setAttribute("role", "img");
    video.setAttribute("aria-label", "Desktop recording of this " + lang + " being typed");
    video.innerHTML =
      '<div class="desk-chrome">' +
        '<span class="desk-dot" aria-hidden="true"></span>' +
        '<span class="desk-title">Desktop · ' + lang + "</span>" +
        '<button type="button" class="desk-replay">Replay</button>' +
      "</div>" +
      '<pre class="desk-screen"><code></code><span class="desk-caret" aria-hidden="true"></span></pre>';
    stage.appendChild(video);

    var out = video.querySelector("code");
    var caret = video.querySelector(".desk-caret");
    var timer = null;

    function type() {
      if (timer) clearInterval(timer);
      if (reduced()) {
        out.textContent = text;
        caret.hidden = true;
        return;
      }
      caret.hidden = false;
      var i = 0;
      out.textContent = "";
      timer = setInterval(function () {
        i += text.length > 280 ? 3 : 1;
        out.textContent = text.slice(0, i);
        if (i >= text.length) {
          clearInterval(timer);
          timer = null;
        }
      }, 28);
    }

    video.querySelector(".desk-replay").addEventListener("click", type);
    type();
  }

  function tagLooseCode(root) {
    root.querySelectorAll("pre").forEach(function (pre) {
      if (pre.closest(".desk-video")) return;
      if (!pre.classList.contains("lesson-code")) pre.classList.add("lesson-code");
      if (!pre.getAttribute("data-lang")) pre.setAttribute("data-lang", "code");
    });
  }

  function scan() {
    var body = document.getElementById("lessonBody");
    if (body) tagLooseCode(body);
    document.querySelectorAll("pre.lesson-code").forEach(mount);
  }

  function explainButtons() {
    document.querySelectorAll("article.lesson").forEach(function (article) {
      if (article.querySelector(".explain-me")) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-ghost explain-me";
      btn.textContent = "Explain me this";
      var slot = document.createElement("div");
      slot.className = "explain-slot";
      slot.hidden = true;
      article.appendChild(btn);
      article.appendChild(slot);
      btn.addEventListener("click", function () {
        var voices = window.ExplainVoices && window.ExplainVoices.forLesson(article.id);
        if (!voices) return;
        slot.hidden = false;
        slot.innerHTML = voices.map(function (v) {
          return '<p class="explain-line explain-' + v.who + '">' + v.text.replace(/</g, "&lt;") + "</p>";
        }).join("");
        if (window.KnowledgeAccount) window.KnowledgeAccount.markExplained(article.id);
      });
    });
  }

  function start() {
    scan();
    explainButtons();
    var body = document.getElementById("lessonBody");
    if (body && window.MutationObserver) {
      new MutationObserver(function () { scan(); explainButtons(); }).observe(body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
