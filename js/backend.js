/* ===================================================================
   js/backend.js — the private /backend admin page.

   Gated by the site's real account system (see account.js): the
   server decides who's admin (one ADMIN_USERNAME env var, checked in
   server/routes/auth.js), never the client — this file only reads
   that already-authorized answer and decides what to draw.

   The chat panel here talks to backend_server.py, a local-only bridge
   on this laptop (localhost:8423, same shape as Ada's/Beast's bridges).
   That means it only works when /backend is opened FROM Anshuman's own
   laptop — from anywhere else it fails honestly instead of pretending
   to work, same as Ada and Beast already do.
   =================================================================== */
(function () {
  "use strict";

  const BACKEND_URL = "http://localhost:8423/api/backend";
  const HISTORY_LIMIT = 8;

  const pageSlot = document.getElementById("backendPage");
  if (!pageSlot) return; // not on backend.html

  const history = [];

  // Jarvis answers out loud here — the browser's own speech synthesis,
  // no extra server or audio streaming needed. Text still shows too
  // (so it's clear what was said, and works if speakers are off), but
  // every real reply from Jarvis is spoken, not just displayed.
  function speak(text) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel(); // don't overlap with a reply still talking
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  function renderSignedOut() {
    pageSlot.replaceChildren();
    pageSlot.className = "";
    const p = document.createElement("p");
    p.className = "panel-hint";
    p.textContent = "Sign in first.";
    const link = document.createElement("a");
    link.href = "account.html";
    link.className = "btn btn-primary";
    link.textContent = "Sign in";
    pageSlot.append(p, link);
  }

  function renderNotAuthorized(username) {
    pageSlot.replaceChildren();
    pageSlot.className = "";
    const p = document.createElement("p");
    p.className = "panel-hint";
    p.textContent = `Signed in as ${username}, but this account doesn't have access to /backend.`;
    pageSlot.append(p);
  }

  function renderAdmin() {
    pageSlot.replaceChildren();
    pageSlot.className = "beast-page";

    const log = document.createElement("div");
    log.className = "beast-log";
    log.id = "backendLog";

    const form = document.createElement("form");
    form.className = "beast-form";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Talk to Jarvis…";
    input.autocomplete = "off";

    // Speaking to Jarvis, not just typing — mic button uses the
    // browser's built-in speech recognition, same "no extra server"
    // approach as the speak() output side. Only added if the browser
    // actually supports it (Chrome/Brave/Edge do; not every browser
    // does), so this degrades to text-only rather than showing a
    // button that doesn't work.
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognizer = null;
    let mic = null;
    if (SpeechRecognitionCtor) {
      mic = document.createElement("button");
      mic.type = "button";
      mic.className = "btn btn-quiet beast-send";
      mic.textContent = "🎤";
      mic.setAttribute("aria-label", "Speak to Jarvis");
      mic.addEventListener("click", function () {
        if (recognizer) return; // already listening
        recognizer = new SpeechRecognitionCtor();
        recognizer.lang = "en-US";
        recognizer.interimResults = false;
        recognizer.maxAlternatives = 1;
        mic.textContent = "●";
        recognizer.onresult = function (e) {
          input.value = e.results[0][0].transcript;
          form.requestSubmit();
        };
        recognizer.onerror = recognizer.onend = function () {
          mic.textContent = "🎤";
          recognizer = null;
        };
        recognizer.start();
      });
    }

    const send = document.createElement("button");
    send.type = "submit";
    send.className = "btn btn-primary beast-send";
    send.textContent = "Send";
    form.append(input);
    if (mic) form.append(mic);
    form.append(send);

    pageSlot.append(log, form);

    function addBubble(text, kind) {
      const el = document.createElement("div");
      el.className = "beast-bubble beast-" + kind;
      el.textContent = text;
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      return el;
    }

    const greeting =
      "Jarvis here — you can also call me Friday. I only answer while backend_server.py is running on Anshuman's laptop and you're viewing this page from that same machine.";
    addBubble(greeting, "bot");
    speak(greeting);

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      addBubble(text, "user");
      history.push({ role: "user", content: text });
      input.value = "";
      input.disabled = true;
      send.disabled = true;
      const thinking = addBubble("Thinking…", "bot");
      thinking.classList.add("beast-thinking");

      try {
        const resp = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history: history.slice(-HISTORY_LIMIT) })
        });
        if (!resp.ok) throw new Error("bad status " + resp.status);
        const data = await resp.json();
        const reply = data.reply || "I didn't get that — try again?";
        thinking.textContent = reply;
        thinking.classList.remove("beast-thinking");
        history.push({ role: "assistant", content: data.reply || "" });
        speak(reply);
      } catch (err) {
        const offline =
          "Jarvis is offline — this only works while backend_server.py is running on Anshuman's laptop, " +
          "and only when you're viewing this page from that same machine.";
        thinking.textContent = offline;
        thinking.classList.remove("beast-thinking");
        speak(offline);
      } finally {
        input.disabled = false;
        send.disabled = false;
        input.focus();
      }
    });
  }

  if (!window.AstroAccount) return; // account.js didn't load — nothing to gate on

  window.AstroAccount.onChange(function (user) {
    if (!user) return renderSignedOut();
    if (!user.isAdmin) return renderNotAuthorized(user.username);
    renderAdmin();
  });
})();
