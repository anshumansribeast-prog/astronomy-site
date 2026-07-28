/* ===================================================================
   starfield.js — the animated night sky behind every page.
   Draws onto a single <canvas id="starfield">.

   The idea: keep an array of star objects, then 60 times a second
   clear the canvas and redraw them all. That's how nearly all
   canvas animation works.
   =================================================================== */

(function () {
  "use strict";

  var canvas = document.getElementById("starfield");
  if (!canvas) return;                       // page has no starfield, stop
  var ctx = canvas.getContext("2d");

  // Does this person prefer less motion? (An OS accessibility setting.)
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var stars = [];
  var shootingStars = [];
  var width = 0, height = 0;
  var scrollY = 0;

  // Three depth layers. Nearer stars are bigger, brighter and drift
  // faster — that difference is what creates the illusion of depth.
  var LAYERS = [
    { count: 0.00022, size: 0.7, speed: 0.012, alpha: 0.55 },
    { count: 0.00012, size: 1.2, speed: 0.030, alpha: 0.75 },
    { count: 0.00005, size: 1.9, speed: 0.055, alpha: 1.00 }
  ];

  var TINTS = ["255,255,255", "200,215,255", "255,235,205", "215,200,255"];

  function build() {
    // Match the canvas's pixel buffer to the window, allowing for
    // high-DPI screens so the stars aren't blurry.
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars = [];
    LAYERS.forEach(function (layer, depth) {
      var n = Math.round(width * height * layer.count);
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * width,
          // Extra vertical room so parallax never exposes a blank edge
          y: Math.random() * height * 1.6,
          r: layer.size * (0.6 + Math.random() * 0.8),
          baseAlpha: layer.alpha * (0.45 + Math.random() * 0.55),
          speed: layer.speed,
          depth: depth,
          tint: TINTS[Math.floor(Math.random() * TINTS.length)],
          // Each star twinkles at its own pace and starting point,
          // otherwise they'd all pulse in unison and look fake.
          twinkleSpeed: 0.0006 + Math.random() * 0.0016,
          twinklePhase: Math.random() * Math.PI * 2
        });
      }
    });
  }

  function spawnShootingStar() {
    shootingStars.push({
      x: Math.random() * width * 0.85,
      y: Math.random() * height * 0.45,
      len: 90 + Math.random() * 130,
      speed: 7 + Math.random() * 6,
      angle: Math.PI / 5.2 + (Math.random() - 0.5) * 0.35,
      life: 1
    });
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];

      // Parallax: shift each star by the scroll position, scaled by
      // its layer. Nearer layers move more.
      var y = s.y - scrollY * s.speed;
      // Wrap around so stars re-enter from the other side forever
      y = ((y % (height * 1.6)) + height * 1.6) % (height * 1.6);
      if (y > height + 4) continue;          // off-screen, skip drawing

      var alpha = s.baseAlpha;
      if (!calm) {
        // sin() swings between -1 and 1; map it to a gentle 0.55–1.0
        var t = Math.sin(time * s.twinkleSpeed + s.twinklePhase);
        alpha *= 0.78 + t * 0.22;
      }

      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + s.tint + "," + alpha.toFixed(3) + ")";
      ctx.fill();

      // The brightest layer gets a soft halo
      if (s.depth === 2) {
        ctx.beginPath();
        ctx.arc(s.x, y, s.r * 3.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + s.tint + "," + (alpha * 0.10).toFixed(3) + ")";
        ctx.fill();
      }
    }

    // ---- shooting stars ----
    for (var j = shootingStars.length - 1; j >= 0; j--) {
      var m = shootingStars[j];
      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.life -= 0.012;

      if (m.life <= 0 || m.x > width + 200 || m.y > height + 200) {
        shootingStars.splice(j, 1);
        continue;
      }

      var tailX = m.x - Math.cos(m.angle) * m.len;
      var tailY = m.y - Math.sin(m.angle) * m.len;
      var grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
      grad.addColorStop(0, "rgba(255,255,255," + (m.life * 0.9).toFixed(3) + ")");
      grad.addColorStop(0.4, "rgba(170,200,255," + (m.life * 0.35).toFixed(3) + ")");
      grad.addColorStop(1, "rgba(170,200,255,0)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  // ---- wire it up ----
  build();
  requestAnimationFrame(draw);

  window.addEventListener("scroll", function () {
    scrollY = window.scrollY || window.pageYOffset;
  }, { passive: true });

  // Rebuilding on every resize pixel would be wasteful, so wait until
  // the user stops dragging for 200ms. This is called "debouncing".
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });

  if (!calm) {
    setInterval(function () {
      // Only sometimes, so they stay a surprise
      if (Math.random() < 0.45) spawnShootingStar();
    }, 4200);
  }
})();
