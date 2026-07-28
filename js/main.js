/* ===================================================================
   main.js — behaviour shared by every page:
     1. mobile navigation menu
     2. marking the current page in the nav
     3. fade-in-on-scroll for anything with class="reveal"
     4. the rotating fact ticker on the home page
     5. the current year in the footer
   =================================================================== */

(function () {
  "use strict";

  /* ---- 1. MOBILE MENU ------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      // Tell screen readers whether the menu is open, not just sighted users
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "✕" : "☰";   // ✕ or ☰
    });

    // Tapping a link should close the menu behind you
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      }
    });
  }

  /* ---- 2. HIGHLIGHT THE CURRENT PAGE ----------------------------- */
  // location.pathname is like "/astronomy-site/planets.html".
  // Split on "/" and take the last piece to get the file name.
  var here = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    if (a.getAttribute("href") === here) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });

  /* ---- 3. REVEAL ON SCROLL --------------------------------------- */
  var revealables = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    // An IntersectionObserver tells you when an element scrolls into
    // view. Far cheaper than checking positions on every scroll event.
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);    // only animate once
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    revealables.forEach(function (el) { observer.observe(el); });
  } else {
    // Very old browser: just show everything rather than hiding it forever.
    revealables.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---- 4. FACT TICKER (home page) -------------------------------- */
  var tickerText = document.getElementById("tickerText");

  if (tickerText) {
    var TICKER_FACTS = [
      "A day on <b>Venus</b> is longer than its year — it spins once every 243 Earth days but orbits the Sun in 225.",
      "<b>Neutron stars</b> are so dense that a sugar-cube-sized piece would weigh about a billion tonnes on Earth.",
      "There are more <b>stars in the observable universe</b> than grains of sand on every beach on Earth.",
      "<b>Jupiter's</b> Great Red Spot is a storm that has been raging for at least 190 years — and is wider than Earth.",
      "Light from the <b>Sun</b> takes 8 minutes and 20 seconds to reach us. You always see the Sun as it was in the past.",
      "<b>Saturn</b> is less dense than water. Given a bathtub big enough, it would float.",
      "The footprints left on the <b>Moon</b> by Apollo astronauts will likely still be there in a million years — there is no wind to erase them.",
      "<b>Olympus Mons</b> on Mars is the tallest volcano in the solar system: about 22 km high, nearly three times Mount Everest.",
      "Every atom of <b>iron in your blood</b> was forged inside a star that exploded long before the Sun was born.",
      "<b>Voyager 1</b>, launched in 1977, is now over 24 billion km away — the most distant human-made object."
    ];

    var idx = 0;
    // Start somewhere random so repeat visitors don't always see fact #1
    idx = Math.floor(Math.random() * TICKER_FACTS.length);
    tickerText.innerHTML = TICKER_FACTS[idx];

    setInterval(function () {
      tickerText.style.opacity = "0";
      // Wait for the fade-out to finish before swapping the text,
      // otherwise the change is visible mid-fade and looks glitchy.
      setTimeout(function () {
        idx = (idx + 1) % TICKER_FACTS.length;
        tickerText.innerHTML = TICKER_FACTS[idx];
        tickerText.style.opacity = "1";
      }, 450);
    }, 7000);
  }

  /* ---- 5. FOOTER YEAR -------------------------------------------- */
  document.querySelectorAll(".js-year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
