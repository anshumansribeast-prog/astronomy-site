/* Beast AI architecture
   Every user question goes to the Beast backend. The browser is only the
   conversation UI; it does not decide which questions are "AI" questions.
*/
(function () {
  "use strict";

  var container = document.getElementById("beastChat");
  if (!container) return;

  container.className = "beast-page";
  container.innerHTML =
    '<div class="beast-log" id="beastLog" aria-live="polite"></div>' +
    '<form class="beast-form" id="beastForm">' +
      '<input type="text" id="beastInput" placeholder="Ask Beast anything about astronomy…" autocomplete="off" maxlength="12000" aria-label="Ask Beast a question">' +
      '<button type="submit" class="btn btn-primary beast-send">Send</button>' +
    '</form>';

  var log = document.getElementById("beastLog");
  var form = document.getElementById("beastForm");
  var input = document.getElementById("beastInput");
  var history = [];
  var busy = false;

  function addMessage(text, role) {
    var bubble = document.createElement("div");
    bubble.className = "beast-bubble beast-" + role;
    bubble.textContent = String(text || "");
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }

  function setBusy(value) {
    busy = value;
    input.disabled = value;
    form.querySelector("button").disabled = value;
  }

  function askBeast(message) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 45000);
    return fetch("/api/beast", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        message: message,
        history: history.slice(-12),
        visitor: null
      }),
      signal: controller.signal
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) throw new Error(data.error || ("Beast server HTTP " + response.status));
        var reply = (data.reply || (data.data && data.data.reply) || "").trim();
        if (!reply) throw new Error("Beast returned an empty answer");
        return reply;
      });
    }).finally(function () {
      clearTimeout(timer);
    });
  }

  addMessage("Hey! I'm Beast. Every question you send here goes through my AI backend. Ask me anything about astronomy.", "bot");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (busy) return;
    var message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";
    setBusy(true);
    var thinking = addMessage("Thinking…", "bot");

    askBeast(message).then(function (reply) {
      thinking.textContent = reply;
      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: reply });
    }).catch(function (error) {
      thinking.textContent = "I couldn't reach the Beast AI backend right now. Please try again.";
      console.error("Beast AI request failed:", error);
    }).finally(function () {
      setBusy(false);
      input.focus();
    });
  });
})();
