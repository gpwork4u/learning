/* 圖解手記 — 共用執行期
   - 主題切換、章節目錄與 scrollspy、上下頁
   - 圖版工具：FL.stepper / FL.svg / FL.softmax / FL.ticker / FL.inView */
(function () {
  "use strict";

  var FL = (window.FL = window.FL || {});
  var root = document.documentElement;

  /* ---------- 偏好 ---------- */
  var rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
  FL.reducedMotion = function () { return rmq.matches; };

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  /* ---------- 主題 ---------- */
  var saved = store("fl-theme");
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  /* ---------- 小工具 ---------- */
  var SVGNS = "http://www.w3.org/2000/svg";
  FL.svg = function (tag, attrs, parent) {
    var el = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) {
      if (k === "text") el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(el);
    return el;
  };
  FL.el = function (tag, attrs, parent) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "text") el.textContent = attrs[k];
      else if (k === "html") el.innerHTML = attrs[k];
      else if (k === "class") el.className = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(el);
    return el;
  };

  FL.softmax = function (arr, temperature) {
    var t = temperature == null ? 1 : Math.max(temperature, 1e-6);
    var max = -Infinity, i;
    for (i = 0; i < arr.length; i++) if (arr[i] / t > max) max = arr[i] / t;
    var exps = arr.map(function (x) { return Math.exp(x / t - max); });
    var sum = exps.reduce(function (a, b) { return a + b; }, 0);
    return exps.map(function (e) { return e / sum; });
  };

  FL.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  FL.lerp = function (a, b, t) { return a + (b - a) * t; };
  FL.fmt = function (v, d) { return Number(v).toFixed(d == null ? 2 : d); };

  /* 數字滾動（Ticker） */
  FL.ticker = function (el, to, opts) {
    opts = opts || {};
    var digits = opts.digits == null ? 2 : opts.digits;
    var from = parseFloat(el.dataset.v || el.textContent) || 0;
    el.dataset.v = to;
    if (FL.reducedMotion() || opts.instant) { el.textContent = FL.fmt(to, digits); return; }
    var dur = opts.duration || 500, t0 = performance.now();
    cancelAnimationFrame(el._tick);
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = FL.fmt(from + (to - from) * e, digits);
      if (p < 1) el._tick = requestAnimationFrame(step);
    })(t0);
  };

  /* 以 rAF 做 0→1 的補間，回傳 cancel 函式 */
  FL.tween = function (dur, onFrame, onDone) {
    if (FL.reducedMotion()) { onFrame(1); if (onDone) onDone(); return function () {}; }
    var t0 = performance.now(), id;
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      onFrame(1 - Math.pow(1 - p, 3));
      if (p < 1) id = requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    id = requestAnimationFrame(step);
    return function () { cancelAnimationFrame(id); };
  };

  FL.inView = function (el, cb, opts) {
    if (!("IntersectionObserver" in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { cb(); if (!(opts && opts.repeat)) io.disconnect(); }
      });
    }, { threshold: (opts && opts.threshold) || 0.35 });
    io.observe(el);
  };

  /* 讓 SVG path 以 Draw 效果出現：先無過渡地藏起整條線，下一拍再過渡到 0 */
  FL.drawIn = function (path, delay) {
    FL.drawReset(path);
    if (FL.reducedMotion()) return;
    var len = Math.ceil(path.getTotalLength ? path.getTotalLength() : 600) + 1;
    path.style.transition = "none";
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    path.getBoundingClientRect();
    path._draw = setTimeout(function () {
      requestAnimationFrame(function () {
        path.style.transition = "stroke-dashoffset var(--dur-draw) var(--ease-out)";
        path.style.strokeDashoffset = "0";
      });
    }, delay || 0);
  };
  /* 清掉 drawIn 留下的 inline 狀態，線條立即完整顯示 */
  FL.drawReset = function (path) {
    clearTimeout(path._draw);
    path.style.transition = path.style.strokeDasharray = path.style.strokeDashoffset = "";
  };

  /* ---------- 逐步播放器 ----------
     FL.stepper(plateEl, {
       steps: [{ narr: "HTML 字串" }, ...],
       render: function (index, info) {}   // 必須可冪等地渲染第 index 步
       autoplay: 2200                        // 每步毫秒數
     })
     圖版內需要的控制元素（皆為選用）：
       [data-step="prev"|"next"|"play"|"reset"]、.steps、.step-count、.plate-narr */
  FL.stepper = function (plate, cfg) {
    var steps = cfg.steps, n = steps.length, i = 0, timer = null;
    var narr = plate.querySelector(".plate-narr");
    var ticks = plate.querySelector(".steps");
    var count = plate.querySelector(".step-count");
    var btn = function (k) { return plate.querySelector('[data-step="' + k + '"]'); };
    var bPrev = btn("prev"), bNext = btn("next"), bPlay = btn("play"), bReset = btn("reset");

    if (ticks) {
      ticks.innerHTML = "";
      for (var k = 0; k < n; k++) FL.el("li", {}, ticks);
      ticks.setAttribute("aria-hidden", "true");
    }
    if (narr) narr.setAttribute("aria-live", "polite");

    function paint(dir) {
      cfg.render(i, { dir: dir || 0, step: steps[i] });
      if (narr && steps[i].narr != null) narr.innerHTML = steps[i].narr;
      if (ticks) Array.prototype.forEach.call(ticks.children, function (li, j) {
        li.className = j < i ? "done" : j === i ? "now" : "";
      });
      if (count) count.textContent = String(i + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
      if (bPrev) bPrev.disabled = i === 0;
      if (bNext) bNext.disabled = i === n - 1;
    }
    function go(j, dir) { i = FL.clamp(j, 0, n - 1); paint(dir); }
    function stop() {
      clearInterval(timer); timer = null;
      if (bPlay) { bPlay.setAttribute("aria-pressed", "false"); bPlay.querySelector(".lbl").textContent = "播放"; }
    }
    function play() {
      if (i === n - 1) go(0, -1);
      if (bPlay) { bPlay.setAttribute("aria-pressed", "true"); bPlay.querySelector(".lbl").textContent = "暫停"; }
      timer = setInterval(function () {
        if (i >= n - 1) { stop(); return; }
        go(i + 1, 1);
      }, cfg.autoplay || 2200);
    }
    if (bPrev) bPrev.addEventListener("click", function () { stop(); go(i - 1, -1); });
    if (bNext) bNext.addEventListener("click", function () { stop(); go(i + 1, 1); });
    if (bReset) bReset.addEventListener("click", function () { stop(); go(0, -1); });
    if (bPlay) bPlay.addEventListener("click", function () { timer ? stop() : play(); });

    plate.addEventListener("keydown", function (e) {
      if (e.target.matches("input, textarea, select")) return;
      if (e.key === "ArrowRight") { stop(); go(i + 1, 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { stop(); go(i - 1, -1); e.preventDefault(); }
    });

    paint(0);
    return { go: go, stop: stop, play: play, get index() { return i; } };
  };

  /* ---------- 頁面組裝 ---------- */
  function initThemeToggle() {
    var b = document.querySelector(".theme-toggle");
    if (!b) return;
    function label() { b.setAttribute("aria-label", currentTheme() === "dark" ? "切換為淺色主題" : "切換為深色主題"); }
    label();
    b.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store("fl-theme", next);
      label();
      document.dispatchEvent(new CustomEvent("fl:theme", { detail: next }));
    });
  }

  function initToc() {
    var toc = document.querySelector(".toc");
    var prose = document.querySelector(".prose");
    if (!toc || !prose) return;
    var heads = prose.querySelectorAll("h2[id]");
    heads.forEach(function (h) {
      var sec = h.querySelector(".sec");
      var title = Array.prototype.filter.call(h.childNodes, function (n) { return n !== sec; })
        .map(function (n) { return n.textContent; }).join("").trim();
      var li = FL.el("li", {}, toc);
      var a = FL.el("a", { href: "#" + h.id }, li);
      FL.el("span", { text: sec ? sec.textContent.replace("§", "").trim() : "" }, a);
      a.appendChild(document.createTextNode(title));
    });

    var figs = document.querySelector(".rail-figs");
    if (figs) prose.querySelectorAll(".plate[id]").forEach(function (p) {
      var fig = p.querySelector(".plate-fig"), t = p.querySelector(".plate-title");
      var li = FL.el("li", {}, figs);
      FL.el("a", { href: "#" + p.id, text: (fig ? fig.textContent : "") + "  " + (t ? t.textContent : "") }, li);
    });

    if (!("IntersectionObserver" in window)) return;
    var links = toc.querySelectorAll("a");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) {
          var on = l.getAttribute("href") === "#" + en.target.id;
          l.classList.toggle("is-active", on);
          if (on && l.scrollIntoView && window.innerWidth <= 960) {
            l.parentNode.parentNode.scrollTo({ left: l.offsetLeft - 16, behavior: "smooth" });
          }
        });
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    heads.forEach(function (h) { io.observe(h); });
  }

  function initPager() {
    var pager = document.querySelector(".pager[data-auto]");
    var cat = window.FL_CATALOG;
    var body = document.body;
    if (!pager || !cat) return;
    var track = cat.categories.filter(function (c) { return c.id === body.dataset.track; })[0];
    if (!track) return;
    var idx = track.chapters.findIndex(function (c) { return c.no === body.dataset.chapter; });
    var prev = track.chapters[idx - 1], next = track.chapters[idx + 1];
    function link(c, dir) {
      if (!c) { FL.el("span", { class: "pager-empty" }, pager); return; }
      var a = FL.el("a", { href: c.slug + ".html", rel: dir }, pager);
      FL.el("span", { class: "meta-label", text: (dir === "prev" ? "← 上一章 · " : "下一章 · ") + c.no + (dir === "next" ? " →" : "") }, a);
      FL.el("span", { class: "pg-title", text: c.title + " " + c.en }, a);
    }
    link(prev, "prev");
    if (next) link(next, "next");
    else {
      var a = FL.el("a", { href: "index.html" }, pager);
      FL.el("span", { class: "meta-label", text: "完成本分類 →" }, a);
      FL.el("span", { class: "pg-title", text: "回到 " + track.title + " 目錄" }, a);
    }
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () {
    initThemeToggle();
    initToc();
    initPager();
  });
})();
