/* Pizza-Effekt · Ristorante Pizzeria Italia
   Beim Scrollen durch den Abschnitt wird der Teig geworfen, belegt, gebacken
   und landet auf dem Teller. Keine Bibliotheken nötig. */
(function () {
  "use strict";
  var root = document.querySelector(".pzfx");
  if (!root) return;

  var track = root.querySelector(".pzfx-track");
  var stage = root.querySelector(".pzfx-stage");
  var pizza = root.querySelector(".pzfx-pizza");
  var disc = root.querySelector(".pzfx-disc");
  var shadow = root.querySelector(".pzfx-shadow");
  var plate = root.querySelector(".pzfx-plate");
  var layers = disc.querySelectorAll("img");
  var flies = root.querySelectorAll(".pzfx-fly");
  var steps = root.querySelectorAll(".pzfx-step");
  var words = root.querySelectorAll(".pzfx-word span");
  var dots = root.querySelectorAll(".pzfx-dots i");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Posen über den Fortschritt p (0 = Abschnitt beginnt, 1 = Ende)
  // y: Anteil der Bühnenhöhe, rx: Neigung in Grad, s: Größe, st: Belag-Stufe 0–3, land: Teller
  var KEYS = [
    { p: 0.00, y: 0,     rx: 0,  s: 1.0,  st: 0, land: 0 },
    { p: 0.10, y: 0,     rx: 0,  s: 1.0,  st: 0, land: 0 },
    { p: 0.30, y: -0.02, rx: 56, s: 0.92, st: 1, land: 0 },
    { p: 0.50, y: 0,     rx: 34, s: 0.98, st: 2, land: 0 },
    { p: 0.70, y: 0,     rx: 14, s: 1.04, st: 3, land: 0 },
    { p: 0.88, y: 0.02,  rx: 0,  s: 0.86, st: 3, land: 1 },
    { p: 1.00, y: 0.02,  rx: 0,  s: 0.86, st: 3, land: 1 }
  ];
  // Welcher Text wann sichtbar ist (Mitte jedes Schritts)
  var STEP_AT = [0.05, 0.30, 0.50, 0.70, 0.94];

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function isPhone() { return innerWidth <= 760; }

  function progress() {
    var r = track.getBoundingClientRect();
    var h = r.height - stage.clientHeight;
    return h > 0 ? clamp(-r.top / h, 0, 1) : 0;
  }

  function target(p) {
    for (var i = 0; i < KEYS.length - 1; i++) {
      var A = KEYS[i], B = KEYS[i + 1];
      if (p <= B.p) {
        var raw = clamp((p - A.p) / (B.p - A.p), 0, 1), t = ease(raw), o = {};
        ["y", "rx", "s", "st", "land"].forEach(function (k) { o[k] = lerp(A[k], B[k], t); });
        // Wurfbogen nach oben, außer beim Landen
        o.arc = B.land && !A.land ? 0 : (A.st !== B.st ? Math.sin(Math.PI * raw) : 0);
        return o;
      }
    }
    var L = KEYS[KEYS.length - 1];
    return { y: L.y, rx: L.rx, s: L.s, st: L.st, land: L.land, arc: 0 };
  }

  var cur = null, last = performance.now(), idle = 0, visible = true;

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { rootMargin: "200px" }).observe(root);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible) return;

    var p = progress();
    var T = target(p);
    if (!cur) cur = T;
    var k = 1 - Math.pow(0.0006, dt);
    for (var key in T) cur[key] = lerp(cur[key], T[key], k);
    if (!reduce) idle += dt * 6;

    var stageH = stage.clientHeight;
    var size = isPhone() ? Math.min(innerWidth * 0.78, stageH * 0.42) : Math.min(innerWidth * 0.4, stageH * 0.6);
    root.style.setProperty("--pzfx-size", size.toFixed(1) + "px");

    // Drehung: Scroll + leichtes Kreisen, zur Landung auf dem kürzesten Weg nach 0
    var spin = (p * 900 + idle) % 360;
    if (spin > 180) spin -= 360;
    spin *= 1 - cur.land;

    var lift = cur.arc * stageH * (isPhone() ? 0.1 : 0.15);
    var baseY = isPhone() ? -stageH * 0.14 : 0;          // auf dem Handy über dem Text
    var baseX = isPhone() ? 0 : innerWidth * 0.08;        // am Desktop etwas rechts vom Text
    var ty = baseY + cur.y * stageH - lift;
    pizza.style.transform = "translate(" + baseX.toFixed(1) + "px," + ty.toFixed(1) + "px)";
    disc.style.transform = "rotateX(" + cur.rx.toFixed(2) + "deg) rotateZ(" + spin.toFixed(2) + "deg) scale(" + cur.s.toFixed(4) + ")";

    var flat = Math.cos(cur.rx * Math.PI / 180), sh = cur.s * (1 - cur.arc * 0.25);
    shadow.style.transform = "translateY(" + (lift * 0.9 + size * 0.06).toFixed(1) + "px) scale(" + sh.toFixed(3) + "," + (sh * flat).toFixed(3) + ")";
    shadow.style.opacity = ((1 - cur.arc * 0.6) * (1 - cur.land * 0.8)).toFixed(3);

    plate.style.opacity = clamp(cur.land * 1.4, 0, 1).toFixed(3);
    plate.style.transform = "translate(" + baseX.toFixed(1) + "px," + (baseY + 0.02 * stageH).toFixed(1) + "px) scale(" + lerp(0.8, 1, cur.land).toFixed(3) + ")";

    for (var i = 0; i < layers.length; i++) {
      layers[i].style.opacity = i === 0 ? 1 : clamp(cur.st - (i - 1), 0, 1).toFixed(3);
    }

    // Zutaten fliegen kurz vor ihrer Stufe auf die Pizza
    var cx = stage.clientWidth / 2 + baseX, cy = stageH / 2 + ty;
    for (var f = 0; f < flies.length; f++) {
      var el = flies[f], st = +el.getAttribute("data-stage");
      var from = el.getAttribute("data-from").split(",");
      var fx = +from[0], fy = +from[1];
      var q = clamp((cur.st - (st - 1)) * 1.15, 0, 1), e = ease(q);
      var w = size * (el.getAttribute("data-kind") === "basil" ? 0.22 : 0.26);
      var px = lerp(cx + fx * innerWidth * 0.55, cx + fx * size * 0.12, e) - w / 2;
      var py = lerp(cy + fy * stageH * 0.55, cy + fy * size * 0.12, e) - w / 2;
      el.style.width = w.toFixed(1) + "px";
      el.style.opacity = (q > 0 && q < 1 ? clamp(Math.sin(Math.PI * q) * 1.4, 0, 1) : 0).toFixed(3);
      el.style.transform = "translate(" + px.toFixed(1) + "px," + py.toFixed(1) + "px) rotate(" + (fx * 220 * (1 - e) + f * 40).toFixed(1) + "deg) scale(" + lerp(1.1, 0.5, e).toFixed(3) + ")";
    }

    // Texte und Hintergrundwörter: der nächstgelegene Schritt ist sichtbar
    var active = 0, best = 9;
    for (var s = 0; s < STEP_AT.length; s++) {
      var d = Math.abs(p - STEP_AT[s]);
      if (d < best) { best = d; active = s; }
    }
    for (var j = 0; j < steps.length; j++) {
      var o = clamp(1 - Math.abs(p - STEP_AT[j]) / 0.1, 0, 1);
      if ((j === 0 && p < STEP_AT[0]) || (j === steps.length - 1 && p > STEP_AT[j])) o = 1;
      steps[j].style.opacity = o.toFixed(3);
      steps[j].style.transform = "translateY(" + ((1 - o) * 24).toFixed(1) + "px)";
      steps[j].style.visibility = o > 0.02 ? "visible" : "hidden";
      if (words[j]) words[j].style.opacity = o.toFixed(3);
      if (dots[j]) dots[j].className = j === active ? "is-on" : "";
    }
  }
  requestAnimationFrame(frame);
})();
