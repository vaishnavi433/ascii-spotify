/* ASCII INK — fine duotone ASCII rendering for this theme.
   renderer + home plate (poster) + in-card ASCII on hover */

(function () {
  const RAMP = "  ..--~~++**##%@";
  const BAYER = [
     0,32, 8,40, 2,34,10,42, 48,16,56,24,50,18,58,26, 12,44, 4,36,14,46, 6,38, 60,28,52,20,62,30,54,22,
     3,35,11,43, 1,33, 9,41, 51,19,59,27,49,17,57,25, 15,47, 7,39,13,45, 5,37, 63,31,55,23,61,29,53,21];
  const PLATE_FONT = 7, PLATE_LH = 1;
  const CARD_FONT = 4.2, CARD_LH = 1;
  const VINYL_FONT = 5.5;
  const ROTATE_MS = 11000;

  /* ─── settings ────────────────────────────────────────── */
  const DEFAULTS = { plate: true, vinyl: true, adapt: true, motion: true, palette: "paper-ink", grain: true };
  const PALETTES = {
    "paper-ink":    { label: "Studio",            paper: "#F4F2E9", paper2: "#EFEDE2", paper3: "#E4E1D2", ink: "#15150E", spot: "#009E5A" },
    "newsprint":    { label: "Morning Edition",   paper: "#EAE7DE", paper2: "#E3E0D5", paper3: "#D8D4C6", ink: "#23221F", spot: "#A6624A" },
    "riso-blue":    { label: "Neon Dusk",         paper: "#F3F1E6", paper2: "#ECEAE0", paper3: "#E2DFCE", ink: "#20306E", spot: "#E6447D" },
    "riso-red":     { label: "After Hours",       paper: "#F6F0E3", paper2: "#EFE8D9", paper3: "#E5DCC8", ink: "#271E1C", spot: "#C73E2E" },
    "forest":       { label: "Forest Floor",      paper: "#EDF0E2", paper2: "#E6EAD8", paper3: "#DBE0CA", ink: "#212B22", spot: "#C77F2A" },
    "night-press":  { label: "Midnight Press",    paper: "#1C1B19", paper2: "#242320", paper3: "#2E2C28", ink: "#EEECE2", spot: "#E3D456" }
  };
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  };

  let settings = Object.assign({}, DEFAULTS);

  const store = () => window.Spicetify && Spicetify.LocalStorage
    ? Spicetify.LocalStorage
    : { get: (k) => localStorage.getItem(k), set: (k, v) => localStorage.setItem(k, v) };

  function loadSettings() {
    try {
      const raw = store().get("ascii-theme:settings");
      if (raw) settings = Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (e) {}
  }
  function saveSettings() {
    try { store().set("ascii-theme:settings", JSON.stringify(settings)); } catch (e) {}
  }
  function applyPalette() {
    const p = PALETTES[settings.palette] || PALETTES["paper-ink"];
    const el = document.documentElement.style;
    const raw = {
      "--paper": p.paper, "--paper-2": p.paper2, "--paper-3": p.paper3,
      "--ink": p.ink, "--spot": p.spot
    };
    for (const k in raw) el.setProperty(k, raw[k]);
    el.setProperty("--ink-70", rgba(p.ink, .70));
    el.setProperty("--ink-45", rgba(p.ink, .45));
    el.setProperty("--ink-22", rgba(p.ink, .22));
    el.setProperty("--rule", rgba(p.ink, .14));
    el.setProperty("--rule-2", rgba(p.ink, .30));
    el.setProperty("--spot-tint", rgba(p.spot, .10));
    const encore = {
      "--text-base": p.ink, "--text-subdued": rgba(p.ink, .45), "--text-numeric-base": p.ink,
      "--background-base": p.paper, "--background-elevated": p.paper2,
      "--background-base-high": p.ink, "--background-highlight": p.spot,
      "--card-background": p.paper, "--liberty-foreground": p.spot,
      "--background-brand-base": p.spot, "--primary-button-background": p.ink,
      "--primary-button-text-base": p.paper, "--focus-outline": "1px solid " + p.spot
    };
    for (const k in encore) el.setProperty(k, encore[k]);
  }
  function applySettings() {
    if (plate) plate.classList.toggle("ascii-disabled", !settings.plate);
    if (vinyl) vinyl.classList.toggle("ascii-disabled", !settings.vinyl);
    document.body.classList.toggle("ascii-motion-off", !settings.motion);
    document.body.classList.toggle("ascii-grain-off", !settings.grain);
  }

  function registerSettings() {
    const M = window.Spicetify && Spicetify.Menu;
    if (!M || !M.Item || !M.SubMenu) { menuState = "api-missing"; return false; }
    if (!window.Spicetify.React || !window.Spicetify.ReactDOM) { menuState = "waiting-react"; return false; }
    try {
      const add = (label, key, after) => new M.Item(label, settings[key], (it) => {
        settings[key] = !!it.isEnabled;
        saveSettings();
        after && after(settings[key]);
      });
      const sub = new M.SubMenu("ASCII EDITION", [
        add("ASCII plate", "plate", () => applySettings()),
        add("Vinyl turntable", "vinyl", () => applySettings()),
        add("Auto-tune art", "adapt", () => {
          if (!plate) return;
          plate.dataset.src = "";
          drawPlate();
          const vd = vinyl && vinyl.querySelector("pre");
          if (vd) { vd.dataset.src = ""; drawVinyl(); }
        }),
        add("Paper grain", "grain", () => applySettings()),
        add("Motion", "motion", () => applySettings())
      ]);
      sub.register();
      try {
        const names = Object.keys(PALETTES);
        const paletteItems = names.map((name) => new M.Item(
          PALETTES[name].label, settings.palette === name, (it) => {
            if (!it.isEnabled) return;
            settings.palette = name;
            applyPalette();
            saveSettings();
            names.forEach((n, i) => paletteItems[i].setState(n === name));
          }
        ));
        paletteMenuState = "ok";
        new M.SubMenu("ASCII EDITION · MOOD", paletteItems).register();
      } catch (pe) { paletteMenuState = "threw:" + pe.message; }
      menuState = "registered";
      return true;
    } catch (e) { menuState = "threw:" + e.message; return false; }
  }

  let plate = null, masthead = null, spread = null, vinyl = null,
      fig = 0, timer = null, clock = null, playWatch = null, mounted = false, menuState = "pending", paletteMenuState = "pending";
  const cache = new Map();

  const loadClean = (url) => new Promise((ok, no) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => ok(im);
    im.onerror = no;
    im.src = url;
  });

  /* ordered-dither halftone, ink density mapped through a light-biased ramp */
  function render(im, cols, rows, opt) {
    const o = opt || {};
    const cv = document.createElement("canvas");
    cv.width = cols; cv.height = rows;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    cx.drawImage(im, 0, 0, cols, rows);
    const px = cx.getImageData(0, 0, cols, rows).data;

    const lum = new Float32Array(cols * rows);
    const sorted = new Float32Array(lum.length);
    for (let i = 0; i < lum.length; i++) {
      const v = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
      lum[i] = v;
      sorted[i] = v;
    }
    sorted.sort();
    const lo = sorted[Math.floor(sorted.length * 0.04)];
    const hi = sorted[Math.floor(sorted.length * 0.98)];
    const span = Math.max(0.1, hi - lo);
    const gamma = o.gamma || 1.6, bias = o.bias == null ? 0.045 : o.bias, spread = o.spread == null ? 0.12 : o.spread;

    let out = "";
    for (let y = 0; y < rows; y++) {
      let run = "", spot = null;
      for (let x = 0; x < cols; x++) {
        let v = (lum[y * cols + x] - lo) / span;
        v = v < 0 ? 0 : v > 1 ? 1 : v;
        v = Math.pow(v, gamma);
        v = (v - bias) * 1.05;
        v += (BAYER[(y & 7) * 8 + (x & 7)] / 64 - 0.47) * spread;
        const ch = RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1))))];
        const isSpot = !!o.spot && v > 0.985 && ch !== " ";
        if (isSpot !== spot) {
          if (run) out += spot ? "<span>" + run + "</span>" : run;
          run = ""; spot = isSpot;
        }
        run += ch;
      }
      if (run) out += spot ? "<span>" + run + "</span>" : run;
      if (y < rows - 1) out += "\n";
    }
    return out;
  }

  /* per-cover art direction: adjust contrast for bright/dark covers */
  function tune(im) {
    const c = document.createElement("canvas");
    c.width = 24; c.height = 24;
    const x = c.getContext("2d");
    x.drawImage(im, 0, 0, 24, 24);
    const d = x.getImageData(0, 0, 24, 24).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const mean = sum / (24 * 24) / 255;
    return mean < 0.32
      ? { gamma: 1.7, bias: 0.03, spread: 0.12, ink: "dark" }
      : mean < 0.5
        ? { gamma: 1.6, bias: 0.045, spread: 0.12, ink: "mid" }
        : { gamma: 1.35, bias: 0.02, spread: 0.12, ink: "light" };
  }

  const grid = (w, h, fontPx, lhPx) => [
    Math.max(8, Math.floor(w / (fontPx * 0.602))),
    Math.max(6, Math.floor(h / (fontPx * lhPx)))
  ];

  function paint(url, cols, rows, opt) {
    const key = url + "|" + cols + "x" + rows;
    if (cache.has(key)) return cache.get(key);
    loadClean(url).then((im) => {
      const o = opt && opt.tune ? Object.assign({}, opt, opt.tune(im)) : opt;
      const html = render(im, cols, rows, o);
      cache.set(key, html);
      if (o && o.done) o.done(html);
      else
        document.querySelectorAll('pre.ascii-live-pre[data-key="' + key + '"]')
          .forEach((p) => { p.innerHTML = html; });
    }).catch(() => {});
    return null;
  }

  /* ─── in-card ASCII ──────────────────────────────────── */
  function wrapCard(img) {
    if (img.dataset.asciiWrapped) return;
    const box = img.closest(".main-cardImage-imageWrapper");
    const card = img.closest('[data-encore-id="card"]');
    if (!box || !card) return;
    img.dataset.asciiWrapped = "1";

    const pre = document.createElement("pre");
    pre.className = "ascii-live-pre";
    box.appendChild(pre);
    card.classList.add("ascii-live-wrap");

    const draw = () => {
      const url = (img.currentSrc || img.src || "").split("?")[0];
      if (!/scdn\.co/.test(url)) return;
      const r = box.getBoundingClientRect();
      if (r.width < 40) return;
      const g = grid(r.width, r.height, CARD_FONT, CARD_LH);
      pre.dataset.key = url + "|" + g[0] + "x" + g[1];
      const html = paint(url, g[0], g[1], { tune });
      if (html) pre.innerHTML = html;
      else pre.innerHTML = Array.from({ length: g[1] }, () => " ".repeat(g[0])).join("\n");
    };

    if (img.complete && img.naturalWidth) draw();
    else img.addEventListener("load", draw, { once: true });
  }

  const scanCards = () => {
    const imgs = document.querySelectorAll(".main-cardImage-image");
    for (const im of imgs) {
      if (im.dataset.asciiWrapped) continue;
      const r = im.getBoundingClientRect();
      if (r.top < window.innerHeight + 400 && r.bottom > -400) wrapCard(im);
    }
  };

  /* ─── home plate ─────────────────────────────────────── */
  const covers = () => {
    const list = [];
    const np = document.querySelector('[data-testid="now-playing-widget"] img');
    const nps = np ? (np.currentSrc || np.src || "") : "";
    if (nps && /scdn\.co/.test(nps)) list.push(nps.split("?")[0]);
    document.querySelectorAll('[data-testid="home-page"] img').forEach((im) => {
      const u = (im.currentSrc || im.src || "").split("?")[0];
      if (/scdn\.co/.test(u) && list.indexOf(u) < 0) list.push(u);
    });
    return list;
  };

  function caption(url) {
    const w = document.querySelector('[data-testid="now-playing-widget"]');
    const npImg = w && w.querySelector("img");
    const npUrl = npImg ? (npImg.currentSrc || npImg.src || "").split("?")[0] : null;
    if (w && url === npUrl) {
      const txt = [...w.querySelectorAll('[data-encore-id="text"]')]
        .map((e) => e.textContent.trim()).filter(Boolean);
      return [txt[0] || "UNTITLED", txt[1] || ""];
    }
    for (const c of document.querySelectorAll('[data-testid="home-page"] [data-encore-id="card"]')) {
      const im = c.querySelector("img");
      if (!im) continue;
      if ((im.currentSrc || im.src || "").split("?")[0] !== url) continue;
      const ti = c.querySelector('[data-encore-id="cardTitle"]');
      const su = c.querySelector('[data-encore-id="cardSubtitle"]');
      return [(ti && ti.textContent.trim()) || "UNTITLED", (su && su.textContent.trim()) || ""];
    }
    return ["UNTITLED", ""];
  }

  const stamp = () => {
    const d = new Date(), p = (n) => (n < 10 ? "0" : "") + n;
    return d.getFullYear() + "." + p(d.getMonth() + 1) + "." + p(d.getDate()) +
      " · " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  };

  const plateCols = () => {
    const f = plate && plate.querySelector(".ascii-plate-frame");
    const p = plate && plate.querySelector("pre");
    if (!f || !p) return 96;
    const font = parseFloat(getComputedStyle(p).fontSize) || PLATE_FONT;
    const w = f.clientWidth - 24;
    return Math.max(48, Math.min(150, Math.floor(w / (font * 0.602))));
  };

  const plateRowsFor = (cols, ar) => Math.max(24, Math.round(cols * ar * 0.6 / PLATE_LH));

  function drawPlate() {
    const list = covers();
    if (!list.length || !plate) return;
    let pick = list[Math.floor(Math.random() * list.length)];
    if (pick === plate.dataset.src && list.length > 1)
      pick = list[(list.indexOf(pick) + 1) % list.length];
    if (pick === plate.dataset.src) return;
    plate.dataset.src = pick;

    const pre = plate.querySelector("pre");
    const cols = plateCols();
    const blank = (n) => Array.from({ length: n }, () => " ".repeat(cols)).join("\n");
    pre.innerHTML = blank(plateRowsFor(cols, 1));

    loadClean(pick).then((im) => {
      if (!plate) return;
      const t = settings.adapt ? tune(im) : {};
      const rows = plateRowsFor(cols, im.naturalHeight / im.naturalWidth);
      pre.innerHTML = render(im, cols, rows, t);
      pre.dataset.ink = t.ink || "";
      pre.classList.remove("ascii-wipe");
      void pre.offsetWidth;
      pre.classList.add("ascii-wipe");
      fig++;
      const c = caption(pick);
      plate.querySelector(".ascii-fig").textContent = "Fig. " + (fig < 10 ? "0" : "") + fig;
      plate.querySelector(".ascii-title").textContent = c[0].toUpperCase();
      plate.querySelector(".ascii-artist").textContent = c[1].toUpperCase();
      plate.querySelector(".ascii-dim").textContent = cols + "×" + rows + " · live";
      cache.set(pick + "|" + cols + "x" + rows, pre.innerHTML);
    }).catch(() => {});
  }

  /* the turntable: round plate that follows the now-playing track */
  function drawVinyl() {
    if (!vinyl) return;
    const vd = vinyl.querySelector("pre");
    const np = document.querySelector('[data-testid="now-playing-widget"]');
    const img = np && np.querySelector("img");
    const url = img ? (img.currentSrc || img.src || "").split("?")[0] : "";
    if (url && /scdn\.co/.test(url)) {
      if (vd.dataset.src !== url) {
        vd.dataset.src = url;
        const g = grid(vd.clientWidth, vd.clientHeight, VINYL_FONT, 1);
        const opt = { done: (h) => { if (vd.dataset.src === url) vd.innerHTML = h; } };
        if (settings.adapt) opt.tune = tune;
        const html = paint(url, g[0], g[1], opt);
        if (html) vd.innerHTML = html;
      }
      vinyl.classList.add("has-signal");
      const txt = np ? [...np.querySelectorAll('[data-encore-id="text"]')]
        .map((e) => e.textContent.trim()).filter(Boolean) : [];
      vinyl.querySelector(".ascii-vtitle").textContent = (txt[0] || "UNTITLED").toUpperCase();
      vinyl.querySelector(".ascii-vartist").textContent = (txt[1] || "").toUpperCase();
    } else {
      vd.dataset.src = "";
      vd.innerHTML = "";
      vinyl.classList.remove("has-signal");
      vinyl.querySelector(".ascii-vtitle").textContent = "NO SIGNAL";
      vinyl.querySelector(".ascii-vartist").textContent = "";
    }
  }

  function mount() {
    const home = document.querySelector('[data-testid="home-page"]');
    if (!home) return;
    if (!masthead || !masthead.isConnected) {
      masthead = document.createElement("header");
      masthead.className = "ascii-masthead";
      masthead.innerHTML =
        "<b>SPOTIFY &middot; ASCII EDITION</b>" +
        "<i>Risograph &middot; two inks &middot; live plate</i>" +
        "<u>&#8470; 01 &middot; <span class='ascii-clock'>" + stamp() + "</span></u>";
      home.insertBefore(masthead, home.firstChild);
    }
    if (!plate || !plate.isConnected) {
      plate = document.createElement("figure");
      plate.className = "ascii-plate";
      plate.innerHTML =
        '<div class="ascii-plate-frame"><pre></pre></div>' +
        "<figcaption>" +
          '<b class="ascii-fig">Fig. 00</b>' +
          '<span class="ascii-title">&mdash;</span>' +
          '<span class="ascii-artist"></span>' +
          '<u class="ascii-dim">&mdash;</u>' +
        "</figcaption>";
      masthead.after(plate);
      const frame = plate.querySelector(".ascii-plate-frame");
      frame.setAttribute("tabindex", "0");
      frame.setAttribute("role", "button");
      frame.setAttribute("aria-label", "Re-roll the ASCII plate");
      frame.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        plate.classList.remove("ascii-rolled");
        void plate.offsetWidth;
        plate.classList.add("ascii-rolled");
        plate.dataset.src = "";
        drawPlate();
      });
      frame.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); frame.click(); }
      });
      drawPlate();
    }
    applySettings();
    if (!vinyl || !vinyl.isConnected) {
      vinyl = document.createElement("figure");
      vinyl.className = "ascii-vinyl";
      vinyl.title = "Now spinning";
      vinyl.innerHTML =
        '<div class="ascii-vinyl-deck">' +
          '<div class="ascii-vinyl-disc"><pre></pre></div>' +
          '<div class="ascii-vinyl-arm"></div>' +
        "</div>" +
        "<figcaption>" +
          '<b class="ascii-side">SIDE A</b>' +
          '<span class="ascii-vtitle">NO SIGNAL</span>' +
          '<span class="ascii-vartist"></span>' +
          '<u class="ascii-rpm">33&frac13; RPM &middot; LIVE CUT</u>' +
        "</figcaption>";
      if (!spread || !spread.isConnected) {
        spread = document.createElement("div");
        spread.className = "ascii-spread";
        masthead.after(spread);
      }
      spread.append(plate, vinyl);
      drawVinyl();
    }
    applySettings();
    if (!timer) timer = setInterval(drawPlate, ROTATE_MS);
    if (!playWatch) playWatch = setInterval(() => {
      const b = document.querySelector('[data-testid="control-button-playpause"]');
      const playing = b && /^(pause)/i.test(b.getAttribute("aria-label") || "");
      if (plate) plate.classList.toggle("is-playing", !!playing);
      if (vinyl) vinyl.classList.toggle("is-playing", !!playing);
      drawVinyl();
    }, 900);
    if (!clock) clock = setInterval(() => {
      const c = document.querySelector(".ascii-clock");
      if (c) c.textContent = stamp();
    }, 1000);
    setTimeout(() => {
      const f = plate && plate.querySelector(".ascii-plate-frame");
      const p = plate && plate.querySelector("pre");
      if (!f || !p) return;
      const cols = (p.textContent.split("\n")[0] || "").length;
      const want = plateCols();
      if (Math.abs(cols - want) > 6) { plate.dataset.src = ""; drawPlate(); }
    }, 600);
    mounted = true;
    scanCards();
  }

  function unmount() {
    if (timer) { clearInterval(timer); timer = null; }
    if (clock) { clearInterval(clock); clock = null; }
    if (playWatch) { clearInterval(playWatch); playWatch = null; }
    if (masthead && masthead.isConnected) masthead.remove();
    if (spread && spread.isConnected) spread.remove();
    masthead = plate = spread = vinyl = null;
    mounted = false;
  }

  function buildMoodButton() {
    const av = document.querySelector('[data-testid="user-widget-link"]');
    const right = av && av.closest(".main-globalNav-contentRight");
    if (!right || document.querySelector(".ascii-mood-btn")) return;
    const btn = document.createElement("button");
    btn.className = "ascii-mood-btn";
    btn.setAttribute("aria-label", "Choose mood");
    btn.title = "Choose mood";
    btn.textContent = "◍";
    const anchor = av.closest(".main-globalNav-navLink");
    right.insertBefore(btn, anchor || right.firstChild);

    const pop = document.createElement("div");
    pop.className = "ascii-mood-pop";
    const title = document.createElement("div");
    title.className = "ascii-mood-pop-title";
    title.textContent = "MOOD";
    pop.appendChild(title);
    const rows = [];
    Object.keys(PALETTES).forEach((name) => {
      const p = PALETTES[name];
      const row = document.createElement("button");
      row.className = "ascii-mood-row" + (settings.palette === name ? " is-on" : "");
      const sw = document.createElement("span");
      sw.className = "ascii-mood-swatch";
      sw.style.background = p.spot;
      const lb = document.createElement("span");
      lb.className = "ascii-mood-name";
      lb.textContent = p.label;
      const mk = document.createElement("span");
      mk.className = "ascii-mood-check";
      mk.textContent = "✓";
      row.appendChild(sw); row.appendChild(lb); row.appendChild(mk);
      row.addEventListener("click", () => {
        settings.palette = name;
        applyPalette();
        saveSettings();
        rows.forEach((r) => r.classList.toggle("is-on", r === row));
        pop.classList.remove("ascii-open");
      });
      rows.push(row);
      pop.appendChild(row);
    });
    const place = () => {
      const r = btn.getBoundingClientRect();
      pop.style.top = (r.bottom + 8) + "px";
      pop.style.right = Math.max(8, window.innerWidth - r.right) + "px";
    };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = pop.classList.contains("ascii-open");
      if (!open) place();
      pop.classList.toggle("ascii-open", !open);
    });
    document.addEventListener("click", () => pop.classList.remove("ascii-open"));
    document.body.appendChild(pop);
  }

  loadSettings();
  applyPalette();
  const moodWatch = setInterval(() => {
    if (document.querySelector('[data-testid="user-widget-link"]')) {
      buildMoodButton();
      clearInterval(moodWatch);
    }
  }, 500);
  setTimeout(() => clearInterval(moodWatch), 20000);
  if (!registerSettings()) {
    const regRetry = setInterval(() => {
      if (registerSettings()) clearInterval(regRetry);
    }, 1000);
    setTimeout(() => clearInterval(regRetry), 30000);
  }
  Object.defineProperty(window, "__asciiMenuState", { value: () => menuState, configurable: true });
  try { Object.defineProperty(window, "__asciiPaletteMenuState", { value: () => paletteMenuState, configurable: true }); } catch (e) {}

  const view = document.querySelector(".Root__main-view");
  if (view) {
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      setTimeout(() => {
        queued = false;
        const home = document.querySelector('[data-testid="home-page"]');
        if (home && !mounted) mount();
        else if (!home && mounted) unmount();
        else if (home && mounted && plate && !plate.isConnected) mount();
        scanCards();
      }, 140);
    }).observe(view, { childList: true, subtree: false });
  }

  let lastPlateW = 0;
  window.addEventListener("resize", () => {
    const f = plate && plate.querySelector(".ascii-plate-frame");
    if (!f) return;
    const w = f.clientWidth;
    if (Math.abs(w - lastPlateW) < 8) return;
    lastPlateW = w;
    plate.dataset.src = "";
    drawPlate();
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-testid="control-button-playpause"], .main-playButton-PlayButton');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const h = document.createElement("div");
    h.className = "ascii-heart";
    h.textContent = ["♡", "♥", "‹"][Math.floor(Math.random() * 3)];
    h.style.left = (r.left + r.width / 2 - 6) + "px";
    h.style.top = (r.top - 4) + "px";
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 950);
  });

  const boot = setInterval(() => {
    if (document.querySelector('[data-testid="home-page"]')) {
      clearInterval(boot);
      mount();
    }
  }, 350);
  setTimeout(() => clearInterval(boot), 15000);

  const nudge = setInterval(scanCards, 2000);
  setTimeout(() => clearInterval(nudge), 30000);
})();