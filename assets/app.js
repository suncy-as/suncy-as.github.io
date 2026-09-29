/* VoiceClean demo page — player, waveform scrubber and visualisers. */
(function () {
  "use strict";

  var CONDITIONS = [
    { key: "raw", label: "耳内原始" },
    { key: "voiceclean", label: "VoiceClean 复原" },
    { key: "reference", label: "洁净参考" }
  ];
  var LABEL = {};
  CONDITIONS.forEach(function (c) { LABEL[c.key] = c.label; });

  var waves = window.VC_WAVEFORMS || {};
  var samples = (window.VC_SAMPLES && window.VC_SAMPLES.length) ? window.VC_SAMPLES.slice() : Object.keys(waves);

  /* ---------------------------------------------------------------- reveal */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ------------------------------------------------------ card spotlight */
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (ev) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (ev.clientX - r.left) + "px");
      card.style.setProperty("--my", (ev.clientY - r.top) + "px");
    });
  });

  /* ---------------------------------------------------------- hero canvas */
  (function heroArt() {
    var canvas = document.getElementById("heroCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var w = 0, h = 0, dpr = 1, visible = true, t0 = performance.now();
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dots = [];
    for (var i = 0; i < 44; i++) {
      dots.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + 0.4, s: Math.random() * 0.02 + 0.006, p: Math.random() * 6.28 });
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function glow(x, y, r, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(109,124,255," + a + ")");
      g.addColorStop(1, "rgba(109,124,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
    function wave(yBase, amp, k, speed, alpha, width, t) {
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(62,227,242," + (alpha * 0.15) + ")");
      grad.addColorStop(0.28, "rgba(62,227,242," + alpha + ")");
      grad.addColorStop(0.62, "rgba(109,124,255," + alpha + ")");
      grad.addColorStop(1, "rgba(178,113,255," + (alpha * 0.25) + ")");
      ctx.beginPath();
      for (var x = 0; x <= w; x += 3) {
        var n = x / w;
        var env = Math.sin(Math.PI * n) * 0.55 + 0.45;
        var y = yBase + Math.sin(n * k + t * speed) * amp * env
              + Math.sin(n * k * 2.7 - t * speed * 1.6) * amp * 0.24 * env;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = grad; ctx.lineWidth = width; ctx.lineCap = "round";
      ctx.shadowBlur = 16; ctx.shadowColor = "rgba(109,124,255,.5)";
      ctx.stroke(); ctx.shadowBlur = 0;
    }
    function frame(now) {
      if (!visible) { requestAnimationFrame(frame); return; }
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      glow(w * 0.66, h * 0.42, Math.min(w, h) * 0.62, 0.16);
      glow(w * 0.24, h * 0.72, Math.min(w, h) * 0.5, 0.1);
      var mid = h * 0.5;
      var n = 46, gap = 4;
      var bw = (w - gap * (n - 1)) / n;
      for (var i = 0; i < n; i++) {
        var a1 = Math.sin(i * 0.35 + t * 1.1) * 0.5 + 0.5;
        var a2 = Math.pow(Math.abs(Math.sin(i * 0.17 - t * 0.72)), 1.6);
        var v = 0.16 + 0.84 * (a1 * 0.55 + a2 * 0.45);
        var bh = v * h * 0.4;
        var bx = i * (bw + gap);
        var bg = ctx.createLinearGradient(0, mid - bh / 2, 0, mid + bh / 2);
        bg.addColorStop(0, "rgba(62,227,242,.15)");
        bg.addColorStop(0.5, "rgba(109,124,255,.26)");
        bg.addColorStop(1, "rgba(178,113,255,.13)");
        ctx.fillStyle = bg;
        roundRect(ctx, bx, mid - bh / 2, bw, bh, Math.min(bw / 2, 3));
        ctx.fill();
      }
      wave(mid - h * 0.1, h * 0.075, 5.2, 1.35, 0.5, 1.3, t);
      wave(mid, h * 0.13, 3.4, 0.9, 0.95, 2.0, t);
      wave(mid + h * 0.11, h * 0.06, 7.0, 1.7, 0.35, 1.1, t);
      dots.forEach(function (d) {
        var x = ((d.x + t * d.s) % 1) * w;
        var y = d.y * h + Math.sin(t * 0.6 + d.p) * 12;
        ctx.beginPath();
        ctx.arc(x, y, d.r, 0, 6.2832);
        ctx.fillStyle = "rgba(200,215,255,.32)";
        ctx.fill();
      });
      if (reduce) return;
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener("resize", resize);
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible = e.isIntersecting; });
    }).observe(canvas);
    requestAnimationFrame(frame);
  })();

  /* ------------------------------------------------------------- the player */
  if (!samples.length) return;

  var tabsEl = document.getElementById("sampleTabs");
  var segEl = document.getElementById("condSeg");
  var segInd = segEl.querySelector(".seg-ind");
  var segBtns = Array.prototype.slice.call(segEl.querySelectorAll("button"));
  var loopBtn = document.getElementById("loopBtn");
  var playBtn = document.getElementById("playBtn");
  var playRing = document.getElementById("playRing");
  var scrub = document.getElementById("scrub");
  var scrubBase = document.getElementById("scrubBase");
  var scrubFill = document.getElementById("scrubFill");
  var scrubHead = document.getElementById("scrubHead");
  var nowLabel = document.getElementById("nowLabel");
  var tCur = document.getElementById("tCur");
  var tDur = document.getElementById("tDur");
  var spectrum = document.getElementById("spectrum");

  var BARS = 128;
  var SPARK = 22;
  var state = { sample: samples[0], cond: "raw", playing: false, loop: true };
  var cache = {};
  var srcMap = new WeakMap();
  var audioCtx = null, analyser = null, freqData = null, graphBroken = false;

  function el(sample, cond) {
    var bucket = cache[sample] || (cache[sample] = {});
    if (!bucket[cond]) {
      var key = sample + "_" + cond;
      var src = (window.VC_AUDIO && window.VC_AUDIO[key]) || ("assets/audio/" + key + ".wav");
      var a = new Audio(src);
      a.preload = "auto";
      a.loop = state.loop;
      bucket[cond] = a;
    }
    return bucket[cond];
  }
  function current() { return el(state.sample, state.cond); }

  /* tabs */
  samples.forEach(function (sample, i) {
    var btn = document.createElement("button");
    btn.className = "tab";
    btn.type = "button";
    btn.setAttribute("role", "tab");
    btn.dataset.sample = sample;
    btn.setAttribute("aria-selected", String(i === 0));
    var spark = waves[sample].voiceclean || waves[sample].raw || [];
    var step = Math.max(1, Math.floor(spark.length / SPARK));
    var bars = "";
    for (var k = 0; k < SPARK; k++) {
      var v = spark[Math.min(spark.length - 1, k * step)] || 0;
      bars += "<i style=\"height:" + Math.max(2, Math.round(v * 20)) + "px\"></i>";
    }
    btn.innerHTML = "<span class=\"tab-idx\">" + String(i + 1).padStart(2, "0") + "</span>" +
                    "<span class=\"tab-spark\">" + bars + "</span>";
    btn.addEventListener("click", function () { selectSample(sample); });
    tabsEl.appendChild(btn);
  });

  function markTabs() {
    Array.prototype.forEach.call(tabsEl.children, function (btn) {
      btn.setAttribute("aria-selected", String(btn.dataset.sample === state.sample));
    });
  }

  /* waveform scrubber */
  function buildScrub() {
    var env = (waves[state.sample] || {})[state.cond] || [];
    var html = "";
    for (var i = 0; i < BARS; i++) {
      var v = env.length ? env[Math.floor(i * env.length / BARS)] : 0.2;
      var h = Math.max(3, Math.round(v * 50));
      html += "<i style=\"height:" + h + "px\"></i>";
    }
    scrubBase.innerHTML = html;
    scrubFill.innerHTML = html;
  }

  /* segmented control */
  function markSeg() {
    segBtns.forEach(function (b) {
      b.setAttribute("aria-selected", String(b.dataset.cond === state.cond));
    });
    var active = segBtns.filter(function (b) { return b.dataset.cond === state.cond; })[0];
    if (active) {
      segInd.style.width = active.offsetWidth + "px";
      segInd.style.transform = "translateX(" + (active.offsetLeft - 4) + "px)";
    }
    nowLabel.textContent = LABEL[state.cond];
  }
  segBtns.forEach(function (b) {
    b.addEventListener("click", function () { selectCond(b.dataset.cond); });
  });

  function selectCond(cond) {
    if (cond === state.cond) return;
    var prev = current();
    var at = prev.currentTime || 0;
    var wasPlaying = !prev.paused && !prev.ended;
    state.cond = cond;
    var next = current();
    next.loop = state.loop;
    try {
      var d = next.duration;
      next.currentTime = (d && isFinite(d)) ? Math.min(at, Math.max(0, d - 0.02)) : at;
    } catch (e) { /* metadata not ready yet */ }
    if (wasPlaying) {
      next.play().catch(function () {});
      prev.pause();
      state.playing = true;
    }
    buildScrub();
    markSeg();
  }

  function selectSample(sample) {
    if (sample === state.sample) return;
    var prev = current();
    var wasPlaying = !prev.paused && !prev.ended;
    prev.pause();
    try { prev.currentTime = 0; } catch (e) {}
    state.sample = sample;
    var next = current();
    next.loop = state.loop;
    try { next.currentTime = 0; } catch (e) {}
    if (wasPlaying) { next.play().catch(function () {}); state.playing = true; }
    buildScrub();
    markTabs();
    markSeg();
    paint();
  }

  /* transport */
  playBtn.addEventListener("click", function () { toggle(); });

  function toggle() {
    var a = current();
    if (a.paused) {
      a.loop = state.loop;
      a.play().catch(function () {});
      state.playing = true;
      wireAudio(a);
    } else {
      a.pause();
      state.playing = false;
    }
    paint();
  }

  loopBtn.addEventListener("click", function () {
    state.loop = !state.loop;
    loopBtn.setAttribute("aria-pressed", String(state.loop));
    Object.keys(cache).forEach(function (s) {
      CONDITIONS.forEach(function (c) { if (cache[s][c.key]) cache[s][c.key].loop = state.loop; });
    });
  });

  function paint() {
    var a = current();
    var playing = !a.paused && !a.ended;
    state.playing = playing;
    playBtn.classList.toggle("is-playing", playing);
    playBtn.setAttribute("aria-label", playing ? "暂停" : "播放");
  }

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  /* progress */
  function progress() {
    var a;
    try { a = current(); } catch (e) { requestAnimationFrame(progress); return; }
    var d = (isFinite(a.duration) && a.duration > 0) ? a.duration : 2;
    var p = Math.max(0, Math.min(1, (a.currentTime || 0) / d));
    var pct = p * 100;
    scrubFill.style.setProperty("--p", pct + "%");
    playRing.style.setProperty("--p", pct);
    if (!dragging) {
      scrubHead.style.left = pct + "%";
      scrubHead.style.transform = "translateX(-1px)";
    }
    tCur.textContent = fmt(a.currentTime);
    tDur.textContent = fmt(d);
    scrub.setAttribute("aria-valuenow", String(Math.round(pct)));
    paint();
    requestAnimationFrame(progress);
  }

  /* seeking */
  var dragging = false;
  function seekFromEvent(ev) {
    var r = scrub.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
    var a = current();
    var d = (isFinite(a.duration) && a.duration > 0) ? a.duration : 2;
    try { a.currentTime = ratio * d; } catch (e) {}
    scrubHead.style.left = (ratio * 100) + "%";
  }
  scrub.addEventListener("pointerdown", function (ev) {
    dragging = true;
    scrub.classList.add("is-drag");
    scrub.setPointerCapture && scrub.setPointerCapture(ev.pointerId);
    seekFromEvent(ev);
  });
  scrub.addEventListener("pointermove", function (ev) {
    if (dragging) { seekFromEvent(ev); return; }
    var r = scrub.getBoundingClientRect();
    scrubHead.style.left = Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100)) + "%";
  });
  function endDrag() { dragging = false; scrub.classList.remove("is-drag"); }
  scrub.addEventListener("pointerup", endDrag);
  scrub.addEventListener("pointercancel", endDrag);
  scrub.addEventListener("pointerleave", function () { if (!dragging) { /* keep head at progress */ } });
  scrub.addEventListener("keydown", function (ev) {
    var a = current();
    if (ev.key === "ArrowRight") { a.currentTime = Math.min((a.currentTime || 0) + 0.1, a.duration || 2); ev.preventDefault(); }
    if (ev.key === "ArrowLeft") { a.currentTime = Math.max((a.currentTime || 0) - 0.1, 0); ev.preventDefault(); }
    if (ev.key === " " || ev.key === "Enter") { toggle(); ev.preventDefault(); }
  });

  /* -------------------------------------------------------- audio visual */
  function wireAudio(a) {
    if (graphBroken || srcMap.has(a)) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { graphBroken = true; return; }
    try {
      if (!audioCtx) {
        audioCtx = new AC();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        analyser.minDecibels = -92;
        analyser.connect(audioCtx.destination);
        freqData = new Uint8Array(analyser.frequencyBinCount);
      }
      var resume = audioCtx.state === "running" ? Promise.resolve() : audioCtx.resume();
      resume.then(function () {
        if (audioCtx.state !== "running" || srcMap.has(a)) return;
        try {
          var src = audioCtx.createMediaElementSource(a);
          src.connect(analyser);
          srcMap.set(a, src);
        } catch (e) { /* fall back to the decorative visualiser */ }
      }).catch(function () { graphBroken = true; });
    } catch (e) { graphBroken = true; }
  }

  var sctx = spectrum.getContext("2d");
  var sw = 0, sh = 0, sdpr = 1;
  var NBARS = 58;
  var levels = new Float32Array(NBARS);
  var phase = 0;

  function sizeSpectrum() {
    sdpr = Math.min(window.devicePixelRatio || 1, 2);
    sw = spectrum.clientWidth; sh = spectrum.clientHeight;
    spectrum.width = Math.max(1, Math.round(sw * sdpr));
    spectrum.height = Math.max(1, Math.round(sh * sdpr));
    sctx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
  }

  function drawSpectrum() {
    requestAnimationFrame(drawSpectrum);
    if (!sw || !sh) return;
    var a;
    try { a = current(); } catch (e) { return; }
    var playing = !a.paused && !a.ended;

    var live = analyser && freqData && srcMap.has(a) && audioCtx && audioCtx.state === "running";
    if (live) {
      analyser.getByteFrequencyData(freqData);
    }
    phase += 0.045;

    var gap = 3;
    var bw = (sw - gap * (NBARS - 1)) / NBARS;
    var mid = sh / 2;
    sctx.clearRect(0, 0, sw, sh);

    var grad = sctx.createLinearGradient(0, 0, sw, 0);
    grad.addColorStop(0, "rgba(62,227,242,.95)");
    grad.addColorStop(0.5, "rgba(109,124,255,.95)");
    grad.addColorStop(1, "rgba(178,113,255,.95)");

    for (var i = 0; i < NBARS; i++) {
      var target;
      if (live) {
        var idx = Math.floor(Math.pow(i / NBARS, 1.7) * (freqData.length * 0.42)) + 2;
        target = Math.max(0, (freqData[idx] / 255) * 1.15);
        target = Math.pow(target, 1.15);
      } else {
        var env = playing
          ? (0.5 + 0.5 * Math.sin(i * 0.42 + phase * 2.1)) * (0.45 + 0.55 * Math.abs(Math.sin(i * 0.13 + phase * 0.8)))
          : 0.055;
        target = env * (playing ? 0.92 : 1);
      }
      levels[i] += (target - levels[i]) * (target > levels[i] ? 0.42 : 0.12);
      var hgt = Math.max(2, levels[i] * (sh * 0.8));
      var x = i * (bw + gap);
      var hh = hgt / 2;

      sctx.globalAlpha = 0.95;
      sctx.fillStyle = grad;
      roundRect(sctx, x, mid - hh, bw, hgt, Math.min(bw / 2, 2.4));
      sctx.fill();

      sctx.globalAlpha = 0.16;
      var rh = Math.min(hh * 0.55, sh * 0.16);
      roundRect(sctx, x, mid + hh + 3, bw, rh, Math.min(bw / 2, 2.2));
      sctx.fill();
    }
    sctx.globalAlpha = 1;
  }

  function roundRect(c, x, y, w, h, r) {
    if (h <= 0) h = 0.6;
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  /* ------------------------------------------------------------- lifecycle */
  window.addEventListener("resize", function () { sizeSpectrum(); markSeg(); });
  window.addEventListener("load", function () { markSeg(); });

  state.cond = "raw";
  buildScrub();
  markTabs();
  markSeg();
  sizeSpectrum();
  requestAnimationFrame(function () { markSeg(); });
  requestAnimationFrame(progress);
  requestAnimationFrame(drawSpectrum);
  paint();

  /* warm the remaining clips once the page is idle */
  function warm() {
    samples.forEach(function (s) {
      CONDITIONS.forEach(function (c) { if (s !== state.sample) el(s, c.key); });
    });
  }
  if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 4000 });
  else setTimeout(warm, 2200);
})();
