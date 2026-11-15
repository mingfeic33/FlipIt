(() => {
  const $ = id => document.getElementById(id);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const shuffle = a => [...a].sort(() => Math.random() - .5);

  const ROUND = 30, WARMUPS = 3;
  const PICS = [
    { label: "Hoodie", src: "assets/targets/hoodie.jpg" },
    { label: "Grumpy", src: "assets/targets/grumpy.jpg" },
    { label: "Poncho", src: "assets/targets/poncho.jpg" },
    { label: "Sunny",  src: "assets/targets/sunny.jpg" },
  ];
  const FLIPS = { invert_mouse: "🖱️ Inverted mouse", mirror: "🪞 Mirror world", scramble: "⌨️ Scrambled keys", runaway: "🏃 Runaway buttons" };
  const COLORS = { RED:"#d8435f", GREEN:"#2fa877", BLUE:"#4a72e0", YELLOW:"#c99a1e", PURPLE:"#8a5ae6" };
  const WORDS = ["banana","gremlin","chaos","trojan","pizza","wobble","noodle"];
  const PASSWORDS = ["meow","taco","quack","bloop","pickle","oops"];
  const POOLS = { classic: ["stroop","type","prize","target"], everyday: ["drag","update","volume","password","captcha","target"] };
  const ROASTS = {
    warm:["Warm-up. Totally normal computer. For now.","Enjoy this. It won't last."],
    start:["Let's see how you handle a little chaos.","Your mouse works for me now.","Relax. It's only 30 seconds. Of pain."],
    miss:["Bold of you to click there.","That was not it. At all.","Your cursor is on a solo trip.","Confidence: high. Accuracy: none."],
    win:["Okay fine, you got that one.","Lucky. Pure luck.","Huh. Not bad. I'll fix that."],
    flip:["Fresh flip incoming. Enjoy.","Let's add another layer of suffering.","You looked comfortable. Fixed it."],
    idle:["Are you… thinking? In this economy?","Hello? The timer is still running.","Frozen like a deer in a flipped headlight."]
  };

  // ---------- settings ----------
  let mode = "everyday", targetSrc = PICS[0].src, targetName = PICS[0].label, muted = false;
  function getBest(){ try { return +localStorage.getItem("flipit_best") || 0; } catch { return 0; } }
  function setBest(v){ try { localStorage.setItem("flipit_best", v); } catch {} }
  function showBest(){ const b = getBest(); $("bestLine").textContent = b ? `Best score · ${b}` : ""; }
  showBest();

  document.querySelectorAll(".mode").forEach(b => b.addEventListener("click", () => { mode = b.dataset.mode; renderModes(); }));
  function renderModes(){ document.querySelectorAll(".mode").forEach(b => b.classList.toggle("sel", b.dataset.mode === mode)); }
  renderModes();

  function faceHTML(src){ return src === "rune" ? `<div class="rune"></div>` : `<img src="${src}" alt="">`; }
  function renderAvatars(){
    const box = $("avatars"); box.innerHTML = "";
    const opts = [...PICS, { label: "Rune", src: "rune" }];
    opts.forEach(o => {
      const b = document.createElement("button"); b.className = "av" + (o.src === targetSrc ? " sel" : "");
      b.innerHTML = `<div class="ring">${faceHTML(o.src)}</div>${o.label}`;
      b.addEventListener("click", () => { targetSrc = o.src; targetName = o.label; renderAvatars(); });
      box.appendChild(b);
    });
    const up = document.createElement("label"); up.className = "av"; up.style.cursor = "pointer";
    up.innerHTML = `<div class="ring"><div class="plus">+</div></div>Upload<input type="file" accept="image/*" hidden>`;
    up.querySelector("input").addEventListener("change", e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = c.height = 180;
        const s = Math.min(img.width, img.height);
        c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 180, 180);
        const src = c.toDataURL("image/jpeg", .85);
        PICS.push({ label: "Yours", src }); targetSrc = src; targetName = "Yours"; renderAvatars();
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(f);
    });
    box.appendChild(up);
  }
  renderAvatars();

  // ---------- audio ----------
  let actx = null;
  function ac(){
    if (muted) return null;
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  function tone({ type = "sine", f0, f1, f2, dur = .3, vol = .18, lp = null, vib = 0, delay = 0 }){
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f2) { o.frequency.exponentialRampToValueAtTime(f1, t + dur * .45); o.frequency.exponentialRampToValueAtTime(f2, t + dur); }
    else if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib; lg.gain.value = f0 * .08; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let node = o;
    if (lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; o.connect(f); node = f; }
    node.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur = .4, vol = .2, lp = 600, delay = 0){
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay, b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; f.type = "lowpass"; f.frequency.value = lp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f).connect(g).connect(c.destination); s.start(t);
  }
  const SOUNDS = [
    () => tone({ f0: 160, f1: 620, f2: 220, dur: .45, vib: 18 }),                          // boing
    () => tone({ f0: 320, f1: 1500, dur: .5, vib: 6, vol: .14 }),                          // slide whistle up
    () => tone({ f0: 1400, f1: 260, dur: .5, vib: 6, vol: .14 }),                          // slide whistle down
    () => { tone({ type: "sawtooth", f0: 520, f1: 300, dur: .16, lp: 1400 }); tone({ type: "sawtooth", f0: 500, f1: 280, dur: .16, lp: 1400, delay: .2 }); }, // quack quack
    () => tone({ type: "square", f0: 230, f1: 210, dur: .3, lp: 900, vol: .14 }),          // honk
    () => tone({ f0: 900, f1: 90, dur: .1, vol: .3 }),                                      // pop
    () => tone({ type: "sawtooth", f0: 95, f1: 55, dur: .5, lp: 380, vib: 28, vol: .3 }), // raspberry
    () => { tone({ f0: 1500, f1: 1900, dur: .08 }); tone({ f0: 1500, f1: 2100, dur: .08, delay: .1 }); }, // squeak squeak
    () => tone({ type: "square", f0: 1600, f1: 180, dur: .22, vol: .1 }),                  // pew
    () => [523, 659, 784].forEach((f, i) => tone({ type: "triangle", f0: f, dur: .18, delay: i * .08 })), // ta-da-ding
    () => tone({ type: "triangle", f0: 200, f1: 70, dur: .35, vol: .3 }),                  // bonk
    () => tone({ f0: 700, f1: 1300, f2: 600, dur: .35, vib: 30, vol: .12 }),               // warble
  ];
  $("soundBtn").addEventListener("click", () => {
    muted = !muted; $("soundBtn").textContent = muted ? "🔇 Sound off" : "🔊 Sound on";
    if (muted) Music.stop(); else if (inGame()) Music.start(S.phase === "flip" && S.running ? "flip" : "warm");
  });
  // ---------- background music (generated live, no files) ----------
  const Music = (() => {
    let gain = null, timer = null, step = 0, next = 0, tempo = 92, mode = "warm", playing = false;
    const PROG = [[57,60,64],[53,57,60],[48,52,55],[55,59,62]];        // Am  F  C  G
    const ARP  = [0,1,2,1, 2,1,0,1, 0,2,1,2, 1,2,0,2];
    const MELO = [76,null,74,null,72,null,71,72,null,null,69,null,71,null,72,74];
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    function voice(f, t, dur, type, vol, detune = 0) {
      const c = actx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = f; o.detune.value = detune;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(gain); o.start(t); o.stop(t + dur + .05);
    }
    let hatBuf = null;
    function hat(t, vol) {
      const c = actx;
      if (!hatBuf) { hatBuf = c.createBuffer(1, c.sampleRate * .05, c.sampleRate); const d = hatBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); }
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = hatBuf; f.type = "highpass"; f.frequency.value = 7000; g.gain.value = vol;
      s.connect(f).connect(g).connect(gain); s.start(t);
    }
    function schedule() {
      if (!actx) return;
      while (next < actx.currentTime + .15) {
        const s = step % 16, bar = Math.floor(step / 16) % 4, chord = PROG[bar], six = 60 / tempo / 4;
        const flip = mode === "flip";
        const idx = flip ? ARP[15 - s] : ARP[s];                       // the flipped part plays its arpeggio backwards
        const det = flip ? Math.sin(step * .55) * 40 : 0;               // and gets a warped, wobbly tape feel
        const m = chord[idx] + 12 + (s >= 8 ? 12 : 0);
        voice(mtof(m), next, .4, "triangle", .2, det);                  // music box
        voice(mtof(m + 12), next, .18, "sine", .05, det);               // sparkle
        if (s % 8 === 0) voice(mtof(chord[0] - 12), next, six * 7, "sine", .3);          // bass
        if (s === 0) chord.forEach(n => voice(mtof(n), next, six * 15, "sine", .045));     // soft pad
        if (bar % 2 === 1 && MELO[s]) voice(mtof(MELO[s] + (flip ? -12 : 0)), next, six * 2.5, flip ? "square" : "sine", flip ? .035 : .07, det);
        if (flip) { if (s % 2 === 0) hat(next, s % 4 === 0 ? .09 : .04); if (s % 4 === 0) voice(70, next, .12, "sine", .35); }
        next += six; step++;
      }
    }
    function start(m = "warm") {
      if (!musicOn) return;
      const c = ac(); if (!c) return;
      mode = m; tempo = m === "flip" ? 128 : 92;
      if (playing) return;
      gain = c.createGain(); gain.gain.setValueAtTime(0, c.currentTime); gain.gain.linearRampToValueAtTime(.55, c.currentTime + .6);
      gain.connect(c.destination);
      step = 0; next = c.currentTime + .08; playing = true;
      timer = setInterval(schedule, 25); schedule();
    }
    function setMode(m) { mode = m; tempo = m === "flip" ? 128 : 92; if (!playing) start(m); }
    function setTempo(t) { tempo = t; }
    function stop() {
      if (!playing) return; playing = false; clearInterval(timer);
      const g = gain; if (g && actx) { g.gain.cancelScheduledValues(actx.currentTime); g.gain.setValueAtTime(g.gain.value, actx.currentTime); g.gain.linearRampToValueAtTime(0, actx.currentTime + .4); setTimeout(() => g.disconnect(), 600); }
    }
    return { start, setMode, setTempo, stop, get mode() { return mode; } };
  })();
  let musicOn = true;
  function inGame() { return S && !S.ended && $("game").classList.contains("on"); }
  $("musicBtn").addEventListener("click", () => {
    musicOn = !musicOn; $("musicBtn").textContent = musicOn ? "🎵 Music on" : "🎵 Music off";
    if (!musicOn) Music.stop(); else if (inGame()) Music.start(S.phase === "flip" && S.running ? "flip" : "warm");
  });


  // ---------- keyboard toys ----------
  const ANIMALS = ["🐱","🐶","🐰","🐹","🐼","🐨","🦊","🐸","🐧","🐥","🦦","🐮","🐷","🦄","🐻","🐭","🦔","🐢","🐙","🦭","🐣","🐾"];
  function spawnAnimal(){
    const fx = $("fx");
    if (fx.children.length > 60) fx.firstChild.remove();
    const a = document.createElement("div"); a.className = "animal"; a.textContent = pick(ANIMALS);
    a.style.left = rand(6, 94) + "vw"; a.style.top = rand(10, 90) + "vh"; a.style.fontSize = rand(36, 64) + "px";
    fx.appendChild(a); setTimeout(() => a.remove(), 1900);
    tone({ f0: 1200, f1: 1800, dur: .07, vol: .06 });
  }
  let bowling = false;
  function bowl(){
    if (bowling) return; bowling = true;
    const fx = $("fx"), ball = document.createElement("div"); ball.className = "ball"; ball.innerHTML = "<i></i>";
    const x = rand(20, 80); ball.style.left = `calc(${x}vw - 39px)`; fx.appendChild(ball);
    noise(1.1, .25, 220);
    const drift = rand(-12, 12);
    const anim = ball.animate([
      { transform: "translateY(0) rotate(0deg)" },
      { transform: `translate(${drift}vw, calc(-50vh - 90px)) rotate(${pick([-1,1]) * 900}deg)` }
    ], { duration: 1100, easing: "cubic-bezier(.25,.6,.35,1)", fill: "forwards" });
    anim.onfinish = () => {
      const r = ball.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      noise(.5, .5, 2500); tone({ type: "triangle", f0: 300, f1: 120, dur: .3, vol: .2 });
      for (let i = 0; i < 7; i++) {
        const p = document.createElement("div"); p.className = "pin"; p.textContent = "🎳";
        p.style.left = cx + "px"; p.style.top = cy + "px";
        p.style.setProperty("--dx", rand(-180, 180) + "px"); p.style.setProperty("--dy", rand(-160, 60) + "px"); p.style.setProperty("--r", rand(-400, 400) + "deg");
        fx.appendChild(p); setTimeout(() => p.remove(), 1000);
      }
      ball.animate([{ opacity: 1 }, { opacity: 0, transform: ball.style.transform }], { duration: 300, fill: "forwards" });
      setTimeout(() => ball.remove(), 320);
      const lab = document.createElement("div"); lab.className = "bowl-label";
      lab.style.left = cx + "px"; lab.style.top = cy + "px";
      if (S && S.running && S.phase) {
        const dbl = Math.random() < .5, before = S.points;
        S.points = dbl ? S.points * 2 : Math.floor(S.points / 2);
        S.bowls++;
        lab.style.color = dbl ? "var(--good)" : "var(--bad)";
        lab.innerHTML = `${dbl ? "×2" : "÷2"}<small>${before} → ${S.points}</small>`;
        updatePts();
        if (dbl) [523, 659, 784, 1046].forEach((f, i) => tone({ type: "triangle", f0: f, dur: .2, delay: .1 + i * .07 }));
        else tone({ type: "sawtooth", f0: 300, f1: 90, dur: .7, lp: 900, vib: 5, delay: .1 });
        say(dbl ? (before ? "Double?! The gremlin objects." : "Doubled zero. Big brain move.") : "Halved. The ball has spoken.");
      } else {
        lab.style.color = "var(--gold)"; lab.innerHTML = `STRIKE<small>no score to bet yet</small>`;
      }
      fx.appendChild(lab); setTimeout(() => lab.remove(), 1450);
      setTimeout(() => { bowling = false; }, 500);
    };
  }

  // ---------- AI (Claude via the page's sample capability) ----------
  // `window.claude.use("sample")` is provided when FlipIt runs as a Claude artifact.
  // Anywhere else (GitHub Pages, localhost) it is missing, and the game falls back to the
  // rule-based gremlin automatically. To use your own backend, replace askAI() and the
  // sampleFn call in agentTurn() with requests to your server.
  let sampleFn = null, aiBlocked = false;
  if (window.claude && claude.use) {
    claude.use("sample").then(s => {
      sampleFn = s;
      if (s) $("aiNote").textContent = "AI gremlin is on: Claude picks your flips and roasts you live.";
    }).catch(() => {});
  }
  async function askAI(prompt, ms = 6000) {
    if (!sampleFn || aiBlocked) return null;
    try {
      const call = sampleFn(prompt, { modelTier: "quick", cache: false });
      const r = await Promise.race([call, new Promise((_, rej) => setTimeout(() => rej({ code: "timeout" }), ms))]);
      const m = (r && r.text || "").match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) : null;
    } catch (e) {
      if (e && (e.code === "not_granted" || e.code === "rate_limited")) aiBlocked = true;
      return null;
    }
  }
  const GREMLIN_RULES = `You are the Gremlin in FlipIt, a 30-second browser prank game where the player's controls get flipped while they do tiny everyday computer tasks. You are playful, cheeky and PG: no profanity, nothing about appearance or identity, just teasing about their gameplay. Keep roasts under 14 words.`;
  function statsText() {
    return `Mode: ${mode}. Elapsed ${Math.round(S.elapsed)}s of 30. Score: ${S.points}. Tasks done: ${S.tasks}. Missed clicks: ${S.misses}. Wrong keys: ${S.wrongKeys}. Bowling balls thrown: ${S.bowls}. Clicks: ${S.clicks}. Keys: ${S.keys}. Active flips: ${S.flips.join(", ") || "none"}. Current task: ${S.taskName}. Gremlin's moves: ${(S.agentLog || []).map(l => l.detail).join("; ") || "none"}.`;
  }
  function availableFlips() { return Object.keys(FLIPS).filter(f => !S.flips.includes(f)); }

  // ---------- state ----------
  let S = null, tickT = null;
  const arena = $("arena"), layer = $("layer"), fake = $("fake");

  function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.toggle("on", s.id === id));
    $("homeBtn").classList.toggle("hidden", id === "start");
  }
  function say(text) {
    const b = $("bubble"); b.textContent = text;
    b.classList.remove("new"); void b.offsetWidth; b.classList.add("new");
    if (S) S.lastSay = S.elapsed;
  }
  function updatePts(){ const p = $("pts"); p.textContent = S.points; p.classList.remove("bump"); void p.offsetWidth; p.classList.add("bump"); }
  function setPhase() {
    const ph = $("phase");
    if (S.phase === "warm") { ph.className = ""; ph.textContent = `Warm-up · ${Math.min(S.warmDone + 1, WARMUPS)} of ${WARMUPS}`; $("prog").style.width = (S.warmDone / WARMUPS * 100) + "%"; $("timer").textContent = "–"; }
    else { ph.className = "flip"; ph.textContent = "Flipped · survive"; }
  }

  // ---------- flips ----------
  const has = f => S && S.flips.includes(f);
  function applyFlip(f, roast, quiet) {
    if (!f || S.flips.includes(f) || !FLIPS[f]) f = heuristicFlip();
    if (!f) return;
    S.flips.push(f);
    const c = document.createElement("span"); c.className = "chip"; c.textContent = FLIPS[f]; $("chips").appendChild(c);
    if (f === "mirror") layer.classList.add("mirror");
    if (f === "scramble") { makeScramble(); typingHint(); if (!["type","password"].includes(S.taskName)) S.forceType = true; }
    if (f === "runaway") layer.querySelectorAll("[data-act]").forEach(el => el.classList.add("runaway"));
    if (!quiet || roast) say(roast || pick(ROASTS.flip));
    return f;
  }
  function heuristicFlip() {
    const av = availableFlips(); if (!av.length) return null;
    if (S.keys > S.clicks && av.includes("scramble")) return "scramble";
    const m = av.filter(f => f !== "scramble");
    return pick(m.length ? m : av);
  }
  function makeScramble() {
    const a = "abcdefghijklmnopqrstuvwxyz".split(""); let b;
    do { b = shuffle(a); } while (b.some((x, i) => x === a[i]));
    S.keymap = Object.fromEntries(a.map((x, i) => [x, b[i]]));
  }

  // ---------- helpers for challenges ----------
  function placeEl(el, x, y) { el.style.left = x + "%"; el.style.top = y + "%"; }
  function spots(n, minD = 24) {
    const out = []; let guard = 0;
    while (out.length < n && guard++ < 500) {
      const p = [rand(16, 84), rand(20, 80)];
      if (out.every(q => Math.hypot(q[0] - p[0], (q[1] - p[1]) * .7) > minD)) out.push(p);
    }
    while (out.length < n) out.push([rand(16, 84), rand(20, 80)]);
    return out;
  }
  function mk(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function actify(el, handler) { el.dataset.act = "1"; el._act = handler; el._dodges = 0; if (has("runaway")) el.classList.add("runaway"); return el; }
  function typingHint() {
    if (!S || !S.hintEl) return;
    S.hintEl.innerHTML = has("scramble") ? "⌨️ Keys are scrambled! Press around to find which key types each letter." : "just type, no need to click";
  }
  function setTask(html) { $("task").innerHTML = html; }
  function faceTarget(){ return targetSrc === "rune" ? null : targetSrc; }

  const CHALLENGES = {
    // ----- classic -----
    stroop() {
      const names = shuffle(Object.keys(COLORS)).slice(0, 4); let target = pick(names);
      const label = () => setTask(`Click the button that <u>says</u> <span style="color:${COLORS[pick(names.filter(n => n !== target))]}">${target}</span>`);
      label();
      S.info = () => ({ goal: `click the button whose label says ${target}` });
      S.changeGoal = () => { target = pick(names.filter(n => n !== target)); label(); return `switched the answer to ${target}`; };
      const bgs = shuffle(names);
      spots(4).forEach((p, i) => {
        const b = actify(mk("button", "obj cbtn", names[i]), () => names[i] === target ? done() : miss());
        b.style.background = COLORS[bgs[i] === names[i] ? bgs[(i + 1) % 4] : bgs[i]];
        placeEl(b, p[0], p[1]); layer.appendChild(b);
      });
    },
    type() {
      S.word = pick(WORDS); S.typed = 0;
      setTask(`Type the word <b>${S.word}</b>`);
      const box = mk("div", "obj wordbox", `<div class="w"></div><div class="hint">just type, no need to click</div>`);
      placeEl(box, 50, 48); layer.appendChild(box);
      S.hintEl = box.querySelector(".hint"); typingHint();
      S.info = () => ({ goal: `type the word "${S.word}"`, lettersTyped: S.typed, wordLength: S.word.length });
      S.renderTyped = () => box.querySelector(".w").innerHTML = [...S.word].map((ch, i) => `<span class="${i < S.typed ? "ok" : i === S.typed ? "no nextch" : "no"}">${ch}</span>`).join("");
      S.renderTyped();
    },
    prize() { popupTask("prize"); },
    target() {
      let hits = 0, need = 3;
      const src = faceTarget();
      const label = () => setTask(`Tap <b>${targetName}</b> ${need} times <span class="now">(${hits}/${need})</span>`);
      label();
      S.info = () => ({ goal: `tap the target ${need} times`, hits });
      S.changeGoal = () => { need++; label(); return `made you tap ${targetName} ${need} times`; };
      const t = actify(mk("div", "obj target", src ? `<img src="${src}" alt="">` : `<div class="rune"></div>`), () => {
        hits++; tone({ f0: 500 + hits * 200, f1: 900 + hits * 200, dur: .12, vol: .12 });
        label();
        if (hits >= need) return done();
        const [x, y] = spots(1)[0]; placeEl(t, x, y); t._dodges = 0;
      });
      const [x, y] = spots(1)[0]; placeEl(t, x, y); layer.appendChild(t);
    },
    // ----- everyday -----
    drag() {
      const src = faceTarget();
      const fname = src ? `${targetName.toLowerCase()}.png` : "homework.pdf", folderName = src ? "Memes" : "Homework";
      setTask(`Drag <b>${fname}</b> into the <b>${folderName}</b> folder`);
      const [a, b] = spots(2, 45);
      const folder = mk("div", "obj folder", `<div class="fic">📁</div><div class="fname">${folderName}</div>`);
      placeEl(folder, b[0], b[1]); layer.appendChild(folder);
      const file = mk("div", "obj file", `${src ? `<img src="${src}" alt="">` : `<div class="doc">📄</div>`}<div class="fname">${fname}</div>`);
      placeEl(file, a[0], a[1]); layer.appendChild(file);
      S.info = () => ({ goal: `drag ${fname} into the ${folderName} folder`, dragging: !!S.drag });
      S.changeGoal = () => {
        const fr = file.getBoundingClientRect(), ar = arena.getBoundingClientRect();
        const fx = (fr.left + fr.width / 2 - ar.left) / ar.width * 100;
        let nx = fx < 50 ? rand(70, 84) : rand(16, 30); if (has("mirror")) nx = 100 - nx;
        placeEl(folder, nx, rand(22, 78)); return "moved the folder";
      };
      const overFolder = (sx, sy) => { const r = folder.getBoundingClientRect(); return sx > r.left - 20 && sx < r.right + 20 && sy > r.top - 20 && sy < r.bottom + 20; };
      file.dataset.drag = "1";
      file._drag = {
        start() { file.classList.add("dragging"); tone({ f0: 600, f1: 800, dur: .06, vol: .08 }); },
        move(sx, sy, ax, ay) {
          const W = arena.clientWidth, H = arena.clientHeight;
          placeEl(file, (has("mirror") ? W - ax : ax) / W * 100, ay / H * 100);
          folder.classList.toggle("hot", overFolder(sx, sy));
        },
        drop(sx, sy) {
          file.classList.remove("dragging"); folder.classList.remove("hot");
          if (overFolder(sx, sy)) { tone({ f0: 300, f1: 120, dur: .15, vol: .2 }); done(); }
          else { miss(); }
        }
      };
    },
    update() { popupTask("update"); },
    volume() {
      let target = pick([20, 30, 40, 60, 70, 80]);
      let val = target < 50 ? pick([90, 100]) : pick([0, 10]);
      const box = mk("div", "obj card volume", `<div class="vtop">🔈 <span>Volume</span><span class="vval">${val}%</span> 🔊</div><div class="track"><div class="fill"></div><div class="knob"></div></div><div class="hint">drag the knob, then let go</div>`);
      placeEl(box, 50, 50); layer.appendChild(box);
      const track = box.querySelector(".track");
      const setVal = v => {
        val = Math.round(Math.max(0, Math.min(100, v)));
        box.querySelector(".fill").style.width = val + "%"; box.querySelector(".knob").style.left = val + "%";
        box.querySelector(".vval").textContent = val + "%";
        setTask(`Set the volume to <b>${target}%</b> <span class="now">(now ${val}%)</span>`);
      };
      setVal(val);
      S.info = () => ({ goal: `set volume to ${target}%`, currentVolume: val });
      S.changeGoal = () => {
        const opts = [10, 20, 30, 40, 60, 70, 80, 90].filter(v => Math.abs(v - val) >= 30 && v !== target);
        target = opts.length ? pick(opts) : (val > 50 ? 10 : 90); setVal(val); return `changed the volume goal to ${target}%`;
      };
      box.dataset.drag = "1";
      let last = -1;
      box._drag = {
        start(sx) { this.move(sx); },
        move(sx) {
          const r = track.getBoundingClientRect();
          let f = (sx - r.left) / r.width; if (has("mirror")) f = 1 - f;
          setVal(f * 100);
          if (Math.abs(val - last) >= 5) { last = val; tone({ f0: 200 + val * 8, dur: .05, vol: .05 + val / 1200 }); }
        },
        drop() {
          if (Math.abs(val - target) <= 4) done();
          else { miss(); if (S.elapsed - S.lastSay > 2) say(`${val}%? I said ${target}. Close-ish.`); }
        }
      };
    },
    password() {
      S.word = pick(PASSWORDS); S.typed = 0;
      setTask(`Log in. The password is <b>${S.word}</b>`);
      const src = faceTarget();
      const box = mk("div", "obj card login", `<div class="face">${src ? `<img src="${src}" alt="">` : `<div class="rune"></div>`}</div><div class="who">${targetName}</div><div class="field"></div><div class="hint">just type, no need to click</div>`);
      placeEl(box, 50, 50); layer.appendChild(box);
      S.hintEl = box.querySelector(".hint"); typingHint();
      S.info = () => ({ goal: `type the password "${S.word}"`, lettersTyped: S.typed, wordLength: S.word.length });
      S.renderTyped = () => box.querySelector(".field").innerHTML = "•".repeat(S.typed) + `<span class="caret"></span>`;
      S.renderTyped();
    },
    captcha() {
      setTask(`Prove you're human: tick <b>I'm not a robot</b>`);
      S.info = () => ({ goal: "tick the I'm not a robot checkbox" });
      const box = mk("div", "obj card captcha", `<span class="lbl">I'm not a robot</span><div class="logo2"><span>🤖</span>reCRAPTCHA</div>`);
      const cb = mk("button", "cb");
      const id = S.taskId;
      actify(cb, () => {
        if (cb.dataset.state) return; cb.dataset.state = "spin"; cb.classList.add("spin");
        setTimeout(() => {
          if (!S.running || S.taskId !== id) return;
          cb.classList.remove("spin"); cb.textContent = "✓"; tone({ type: "triangle", f0: 880, f1: 1320, dur: .15 });
          setTimeout(() => { if (S.running && S.taskId === id) done(); }, 300);
        }, 700);
      });
      box.prepend(cb);
      placeEl(box, ...spots(1)[0].map((v, i) => i ? v : Math.min(70, Math.max(30, v)))); layer.appendChild(box);
    }
  };
  function popupTask(kind) {
    const p = mk("div", "obj card popup");
    placeEl(p, rand(32, 68), rand(36, 64));
    if (kind === "prize") {
      setTask(`Close the pop-up with the <b>×</b>. Don't fall for it.`);
      p.innerHTML = `<div class="bar"><span>totally-legit.biz</span></div><div class="body"><h3>🎉 YOU WON!</h3><div>A free iPhone 47 Pro Max Ultra</div><div class="btns"></div></div>`;
    } else {
      setTask(`Close the update pop-up with the <b>×</b>`);
      p.innerHTML = `<div class="bar"><span>Software Update</span></div><div class="body"><h3>Restart now?</h3><div>47 updates are ready. This will only take 3 hours.</div><div class="btns"></div></div>`;
    }
    layer.appendChild(p);
    S.info = () => ({ goal: "close the pop-up with the small x (other buttons are traps)" });
    const x = actify(mk("button", "x", "×"), done); p.querySelector(".bar").appendChild(x);
    const btns = p.querySelector(".btns");
    const labels = kind === "prize" ? [["CLAIM NOW", "primary", "You clicked CLAIM. I'm genuinely worried about you."]] :
      [["Restart now", "primary", "Restarting… just kidding. Close it."], ["Remind me later", "second", "Later is not a close button."]];
    labels.forEach(([t, cls, msg]) => btns.appendChild(actify(mk("button", cls, t), () => { miss(); say(msg); })));
  }

  function nextChallenge() {
    layer.innerHTML = ""; S.word = null; S.renderTyped = null; S.hintEl = null; S.taskId++;
    S.info = null; S.changeGoal = null; S.shrunk = false; S.goalChanged = false; S.popupOn = false; S.taskStartAt = S.elapsed;
    let k;
    if (S.phase === "warm") k = S.warmOrder[S.warmDone];
    else if (S.forceType) { k = mode === "classic" ? "type" : "password"; S.forceType = false; }
    else k = pick(POOLS[mode].filter(c => c !== S.taskName));
    S.taskName = k;
    CHALLENGES[k]();
  }
  function done() {
    S.tasks++; S.points += 100; updatePts();
    const f = $("flash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
    S.missStreak = 0;
    if (S.phase === "warm") {
      S.warmDone++; setPhase();
      if (S.warmDone >= WARMUPS) return startFlipPhase();
      say(pick(["Easy, right? Enjoy it.", "Normal computer. Suspiciously normal.", "Good. Keep that confidence."]));
      return nextChallenge();
    }
    if (Math.random() < .5 && S.elapsed - S.lastSay > 3) say(pick(ROASTS.win));
    nextChallenge();
  }
  function miss() {
    S.misses++; S.missStreak++; S.missTimes.push(S.elapsed); S.points = Math.max(0, S.points - 10); $("pts").textContent = S.points;
    arena.classList.remove("shake"); void arena.offsetWidth; arena.classList.add("shake");
    if (S.missStreak >= 3 && S.elapsed - S.lastSay > 2.5) { say(pick(ROASTS.miss)); S.missStreak = 0; }
  }

  // ---------- fake cursor, clicks and drags ----------
  function fakePos(clientX, clientY) {
    const r = arena.getBoundingClientRect();
    let x = clientX - r.left, y = clientY - r.top;
    if (has("invert_mouse")) { x = r.width - x; y = r.height - y; }
    return { x, y, r, sx: r.left + x, sy: r.top + y };
  }
  arena.addEventListener("pointermove", e => {
    if (!S || !S.running) return;
    const p = fakePos(e.clientX, e.clientY);
    S.fx = p.x; S.fy = p.y; S.lastMove = S.elapsed;
    fake.style.display = "block"; fake.style.left = (p.x - 3) + "px"; fake.style.top = (p.y - 2) + "px";
    e._swirled = true; swirlAt(p.sx, p.sy);
    if (S.drag) { S.drag.move(p.sx, p.sy, p.x, p.y); return; }
    if (has("runaway")) {
      layer.querySelectorAll(".runaway").forEach(el => {
        if (el._dodges >= 3) return;
        const b = el.getBoundingClientRect();
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        if (Math.hypot(cx - p.sx, cy - p.sy) < Math.max(b.width, b.height) / 2 + 30) {
          el._dodges++;
          const [nx, ny] = spots(1)[0];
          placeEl(el.closest(".card") || el, nx, ny);
        }
      });
    }
  });
  arena.addEventListener("pointerleave", () => { fake.style.display = "none"; });
  arena.addEventListener("pointerdown", e => {
    if (!S || !S.running) return;
    e.preventDefault();
    grabFocus();
    const p = fakePos(e.clientX, e.clientY);
    S.clicks++;
    if (S.phase === "flip") S.clickPts.push({ t: S.elapsed, x: p.x / p.r.width, y: p.y / p.r.height });
    for (let i = 0; i < 3; i++) { lastEmit = null; swirlAt(p.sx, p.sy); }
    const el = document.elementFromPoint(p.sx, p.sy);
    const dragEl = el && el.closest && el.closest("[data-drag]");
    if (dragEl && layer.contains(dragEl)) { S.drag = dragEl._drag; S.drag.start(p.sx, p.sy, p.x, p.y); S.drag.move(p.sx, p.sy, p.x, p.y); return; }
    const act = el && el.closest && el.closest("[data-act]");
    if (act && layer.contains(act)) act._act();
    else if (el && el.closest && el.closest("[data-junk]")) tone({ type: "square", f0: 160, dur: .08, vol: .06 });
    else if (!["type", "password"].includes(S.taskName)) miss();
  });
  document.addEventListener("pointerup", e => {
    if (!S || !S.drag) return;
    const d = S.drag; S.drag = null;
    if (!S.running) return;
    const p = fakePos(e.clientX, e.clientY);
    d.drop(p.sx, p.sy);
  });

  // ---------- keyboard focus ----------
  // The game runs inside a frame: if focus leaves it, key presses never arrive.
  function grabFocus() { try { window.focus(); arena.focus({ preventScroll: true }); } catch {} $("focusWarn").classList.add("hidden"); }
  window.addEventListener("blur", () => { if (S && S.running) $("focusWarn").classList.remove("hidden"); });
  window.addEventListener("focus", () => $("focusWarn").classList.add("hidden"));

  // ---------- keyboard ----------
  const editable = el => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
  document.addEventListener("keydown", e => {
    if (editable(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === "Escape") { if (S && !S.ended && $("game").classList.contains("on")) { e.preventDefault(); endRound(true); } return; }
    if (k === " ") { e.preventDefault(); if (!e.repeat) bowl(); return; }
    if (k.length === 1 && /[a-z]/i.test(k)) {
      if (!e.repeat) pick(SOUNDS)();
      if (!S || !S.running) return;
      e.preventDefault(); S.keys++;
      if (!S.word) return;
      let ch = k.toLowerCase();
      if (has("scramble") && S.keymap) ch = S.keymap[ch];
      if (has("scramble") && S.hintEl) S.hintEl.innerHTML = `Keys are scrambled · you pressed <b>${k.toLowerCase()}</b> → it typed <b class="${ch === S.word[S.typed] ? "good" : "bad"}">${ch}</b>`;
      if (ch === S.word[S.typed]) {
        S.typed++; S.renderTyped && S.renderTyped();
        if (S.typed >= S.word.length) done();
      } else {
        S.wrongKeys++; miss();
        if (has("scramble") && S.wrongKeys % 4 === 0 && S.elapsed - S.lastSay > 3) say(`You pressed "${k}". I heard "${ch}". 😇`);
      }
      return;
    }
    if (e.repeat) return;
    if (S && S.running) { e.preventDefault(); S.keys++; }
    spawnAnimal();
  });
  document.addEventListener("keyup", e => { if (e.key === " " && !editable(e.target)) e.preventDefault(); });

  // ---------- cursor swirl ----------
  const sw = $("swirl"), sctx = sw.getContext("2d");
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SPARK = ["#f3cd78", "#ffe8b0", "#b9a2ff", "#ffffff"];
  let parts = [], lastEmit = null, swRaf = null;
  function sizeSwirl() { const d = window.devicePixelRatio || 1; sw.width = innerWidth * d; sw.height = innerHeight * d; sctx.setTransform(d, 0, 0, d, 0, 0); }
  sizeSwirl(); addEventListener("resize", sizeSwirl);
  function swirlAt(x, y) {
    if (reduce) return;
    const dist = lastEmit ? Math.hypot(x - lastEmit.x, y - lastEmit.y) : 99;
    const n = Math.min(4, 1 + Math.floor(dist / 10));
    lastEmit = { x, y };
    for (let i = 0; i < n; i++) parts.push({ cx: x, cy: y, a: Math.random() * 6.283, r: 1, vr: rand(.5, 1.3), va: rand(.1, .2) * (Math.random() < .5 ? -1 : 1), life: 1, decay: rand(.018, .03), size: rand(1.2, 2.8), c: pick(SPARK), star: Math.random() < .25 });
    if (parts.length > 260) parts.splice(0, parts.length - 260);
    if (!swRaf) swRaf = requestAnimationFrame(drawSwirl);
  }
  function drawStar(x, y, s) {
    sctx.beginPath();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; sctx.lineTo(x + Math.cos(a) * s * 2.6, y + Math.sin(a) * s * 2.6); sctx.lineTo(x + Math.cos(a + Math.PI / 4) * s * .7, y + Math.sin(a + Math.PI / 4) * s * .7); }
    sctx.closePath(); sctx.fill();
  }
  function drawSwirl() {
    sctx.clearRect(0, 0, innerWidth, innerHeight);
    sctx.globalCompositeOperation = "lighter";
    for (const p of parts) {
      p.a += p.va; p.r += p.vr; p.cy -= .25; p.life -= p.decay;
      const x = p.cx + Math.cos(p.a) * p.r, y = p.cy + Math.sin(p.a) * p.r;
      sctx.globalAlpha = Math.max(0, p.life); sctx.fillStyle = p.c; sctx.shadowColor = p.c; sctx.shadowBlur = 8;
      if (p.star) drawStar(x, y, p.size * p.life + .4); else { sctx.beginPath(); sctx.arc(x, y, p.size * p.life + .3, 0, 6.283); sctx.fill(); }
    }
    sctx.globalAlpha = 1; sctx.shadowBlur = 0;
    parts = parts.filter(p => p.life > 0);
    swRaf = parts.length ? requestAnimationFrame(drawSwirl) : null;
  }
  document.addEventListener("pointermove", e => {
    if (e._swirled) return;
    if (S && S.running && arena.contains(e.target)) return;
    swirlAt(e.clientX, e.clientY);
  });


  // ---------- gremlin agent ----------
  // Every few seconds the gremlin looks at the game state and acts through tools.
  // With AI on, Claude decides which tools to call; otherwise a rule-based gremlin uses the same tools.
  const POPUP_TITLES = ["Low battery", "Storage full", "Wi-Fi lost", "New message", "Printer online"];
  const POPUP_MSGS = ["Battery at 1%. Panic accordingly.", "Delete 400 photos of your lunch?", "Have you tried turning it off and on again?", "Mom: call me. Now.", "The printer is online. Nobody knows why."];
  const clampText = (t, n) => String(t == null ? "" : t).replace(/\s+/g, " ").trim().slice(0, n);
  function logMove(name, detail, ai, turn) {
    S.agentLog.push({ t: S.elapsed, name, detail, ai, turn });
    const g = $("gmove"); g.textContent = `${ai ? "🤖 AI gremlin" : "⚙️ rule gremlin"} · ${detail}`;
    g.classList.remove("new"); void g.offsetWidth; g.classList.add("new");
  }
  function spawnDecoy(title, msg) {
    const p = mk("div", "obj card popup decoy"); p.dataset.junk = "1";
    p.innerHTML = `<div class="bar"><span>System</span></div><div class="body"><h3></h3><div></div></div>`;
    p.querySelector("h3").textContent = title; p.querySelector(".body div").textContent = msg;
    p.querySelector(".bar").appendChild(actify(mk("button", "x", "×"), () => { p.remove(); S.popupOn = false; }));
    const [x, y] = spots(1)[0]; placeEl(p, x, y); layer.appendChild(p); S.popupOn = true;
    tone({ type: "triangle", f0: 660, f1: 990, dur: .12, vol: .1 });
    const id = S.taskId;
    setTimeout(() => { if (p.isConnected) { p.remove(); if (S.taskId === id) S.popupOn = false; } }, 7000);
  }
  function spawnGhosts(n) {
    const W = arena.clientWidth, H = arena.clientHeight;
    for (let i = 0; i < n; i++) {
      const g = fake.cloneNode(true); g.removeAttribute("id"); g.removeAttribute("style"); g.setAttribute("class", "ghostc");
      arena.appendChild(g);
      const frames = Array.from({ length: 7 }, () => ({ transform: `translate(${rand(0, W - 24)}px, ${rand(0, H - 24)}px)` }));
      g.animate(frames, { duration: 5000, easing: "ease-in-out", fill: "forwards" }).onfinish = () => g.remove();
    }
  }
  function taskObjects() { return [...layer.querySelectorAll(":scope > .obj:not(.decoy)")]; }

  function gremlinTools(turn, ai) {
    let mischief = 0, spoke = false;
    const live = () => S && S.running && S.phase === "flip" && S.agentTurn === turn;
    const guard = (name, cooldown) => {
      if (!live()) throw new Error("This turn is over.");
      if (mischief >= 2) throw new Error("Limit reached: at most 2 mischief tools per turn.");
      if (cooldown && S.elapsed - (S.cool[name] ?? -99) < cooldown) throw new Error(`${name} is cooling down, try something else.`);
    };
    const ok = (name, detail) => { mischief++; S.cool[name] = S.elapsed; logMove(name, detail, ai, turn); return "ok: " + detail; };
    const flips = availableFlips();
    return [
      { name: "apply_flip",
        description: "Add a control flip for the rest of the round. invert_mouse: the cursor moves opposite. mirror: the play area flips left-right. scramble: letter keys get remapped (brutal on typing tasks). runaway: clickable things dodge the cursor. Cooldown 6s.",
        inputSchema: { type: "object", properties: { flip: { type: "string", enum: flips.length ? flips : ["none_left"] } }, required: ["flip"] },
        execute({ flip }) { guard("apply_flip", 6); if (!availableFlips().includes(flip)) throw new Error("That flip isn't available."); applyFlip(flip, null, true); return ok("apply_flip", `cast ${FLIPS[flip]}`); } },
      { name: "spawn_popup",
        description: "Open a fake system pop-up on top of the play area. It blocks clicks until closed with its x, and vanishes after 7s. Only one at a time. Cooldown 7s.",
        inputSchema: { type: "object", properties: { title: { type: "string", description: "max 24 chars" }, message: { type: "string", description: "max 70 chars, funny, PG" } }, required: ["title", "message"] },
        execute({ title, message }) { guard("spawn_popup", 7); if (S.popupOn) throw new Error("A pop-up is already open."); const t = clampText(title, 24) || "Alert"; spawnDecoy(t, clampText(message, 70) || "Something happened."); return ok("spawn_popup", `popped up "${t}"`); } },
      { name: "move_target",
        description: "Teleport the current task's objects (buttons, target, file, folder, slider, login box) to new random spots. Cooldown 5s.",
        inputSchema: { type: "object", properties: {} },
        execute() { guard("move_target", 5); if (S.drag) throw new Error("The player is mid-drag; wait."); const objs = taskObjects(); if (!objs.length) throw new Error("Nothing to move."); const sp = spots(objs.length, 26); objs.forEach((o, i) => placeEl(o, sp[i][0], sp[i][1])); return ok("move_target", "teleported the task"); } },
      { name: "shrink_target",
        description: "Shrink the current task's objects to 65% size. Once per task.",
        inputSchema: { type: "object", properties: {} },
        execute() { guard("shrink_target", 0); if (S.shrunk) throw new Error("Already shrunk this task."); S.shrunk = true; taskObjects().forEach(o => o.style.scale = ".65"); return ok("shrink_target", "shrank the task"); } },
      { name: "change_goal",
        description: "Change the goal of the current task mid-way, e.g. a new volume target, a different correct button, one more required tap, or a moved folder. Works on volume, color-trick, target and drag tasks. Once per task. Best used right before the player finishes.",
        inputSchema: { type: "object", properties: {} },
        execute() { guard("change_goal", 0); if (S.goalChanged) throw new Error("Already changed this task's goal."); if (!S.changeGoal) throw new Error("This task's goal can't be changed."); S.goalChanged = true; return ok("change_goal", S.changeGoal()); } },
      { name: "ghost_cursors",
        description: "Release 1-3 decoy cursors that wander around the play area for 5s to confuse the player. Cooldown 8s.",
        inputSchema: { type: "object", properties: { count: { type: "integer", minimum: 1, maximum: 3 } }, required: ["count"] },
        execute({ count }) { guard("ghost_cursors", 8); const n = Math.max(1, Math.min(3, Math.round(+count || 2))); spawnGhosts(n); return ok("ghost_cursors", `released ${n} decoy cursor${n > 1 ? "s" : ""}`); } },
      { name: "roll_bowling_ball",
        description: "Roll the bowling ball: the player's score is randomly doubled or halved. Pure chaos. Cooldown 10s.",
        inputSchema: { type: "object", properties: {} },
        execute() { guard("roll_bowling_ball", 10); if (bowling) throw new Error("A ball is already rolling."); bowl(); return ok("roll_bowling_ball", "rolled the bowling ball"); } },
      { name: "say",
        description: "Say one short roast to the player (max 14 words, playful, PG). Use once per turn.",
        inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
        execute({ text }) { if (!live()) throw new Error("This turn is over."); if (spoke) throw new Error("Already spoke this turn."); spoke = true; say(clampText(text, 90)); return "said it"; } },
    ];
  }

  function agentState() {
    const cooling = Object.entries(S.cool).filter(([n, t]) => S.elapsed - t < ({ apply_flip: 6, spawn_popup: 7, move_target: 5, ghost_cursors: 8, roll_bowling_ball: 10 }[n] || 0)).map(([n]) => n);
    return {
      secondsLeft: Math.round(ROUND - S.elapsed), score: S.points, tasksDone: S.tasks, misses: S.misses,
      missesLast5s: S.missTimes.filter(t => S.elapsed - t < 5).length,
      currentTask: S.taskName, taskDetails: S.info ? S.info() : null, secondsOnThisTask: Math.round(S.elapsed - S.taskStartAt),
      goalAlreadyChanged: !!S.goalChanged, goalChangeable: !!S.changeGoal, alreadyShrunk: !!S.shrunk, popupOpen: !!S.popupOn,
      activeFlips: S.flips, availableFlips: availableFlips(), toolsCoolingDown: cooling,
      yourRecentMoves: S.agentLog.slice(-4).map(l => l.detail)
    };
  }
  function agentPrompt() {
    return `${GREMLIN_RULES}
You are now an AI agent controlling the gremlin. Each turn you read the game state and act by calling tools.
Rules for this turn: call at most 2 mischief tools, plus exactly one "say". Make "say" match what you just did or how the player is doing.
Strategy: chaotic but winnable. If the player is cruising (few recent misses, finishing tasks fast), escalate. If they're drowning (3+ misses in the last 5s), ease off: just roast them, or roll the bowling ball for drama. Fit the tool to the task: change_goal on a slider or target right before they finish, scramble during typing, runaway or move_target on clicking tasks, a pop-up when they're focused. Don't repeat your recent moves.
Game state: ${JSON.stringify(agentState())}
After calling your tools, reply with the single word: done.`;
  }
  function ruleGremlin(tools) {
    const T = Object.fromEntries(tools.map(t => [t.name, t]));
    const run = (n, input = {}) => { try { T[n].execute(input); return true; } catch { return false; } };
    const drowning = S.missTimes.filter(t => S.elapsed - t < 5).length >= 3;
    let opts;
    if (drowning) opts = [["roll_bowling_ball"]];
    else {
      opts = shuffle([["spawn_popup", { title: pick(POPUP_TITLES), message: pick(POPUP_MSGS) }], ["move_target"], ["ghost_cursors", { count: 2 }], ["change_goal"], ["shrink_target"]]);
      const f = heuristicFlip(); if (f && Math.random() < .5) opts.unshift(["apply_flip", { flip: f }]);
    }
    for (const [n, input] of opts) if (run(n, input)) break;
    run("say", { text: pick(drowning ? ROASTS.miss : ROASTS.flip) });
  }
  async function agentTurn() {
    if (!S || !S.running || S.phase !== "flip" || S.agentBusy) return;
    const me = S, turn = ++S.agentTurn; S.agentBusy = true;
    let usedAI = false;
    if (sampleFn && !aiBlocked) {
      try {
        await Promise.race([
          sampleFn(agentPrompt(), { modelTier: "quick", cache: false, tools: gremlinTools(turn, true) }),
          new Promise((_, rej) => setTimeout(() => rej({ code: "timeout" }), 9000))
        ]);
        usedAI = true;
      } catch (e) { if (e && (e.code === "not_granted" || e.code === "rate_limited")) aiBlocked = true; }
    }
    if (me !== S) return;
    const acted = S.agentLog.some(l => l.turn === turn);
    if (!acted && S.running && S.agentTurn === turn) ruleGremlin(gremlinTools(turn, false));
    S.agentTurn++;                       // late tool calls from this turn are now refused
    S.agentBusy = false;
    S.nextAgentAt = S.elapsed + (usedAI ? 2.5 : 4.5);
  }

  // ---------- round flow ----------
  function startGame() {
    clearInterval(tickT);
    if (document.activeElement) document.activeElement.blur();
    ac(); grabFocus();
    const pool = POOLS[mode];
    S = { running: true, phase: "warm", warmDone: 0, warmOrder: shuffle(pool.filter(t => t !== "target")).slice(0, WARMUPS),
          elapsed: 0, points: 0, tasks: 0, misses: 0, wrongKeys: 0, clicks: 0, keys: 0, bowls: 0, flips: [], taskName: "none", taskId: 0,
          trail: [], clickPts: [], fx: null, fy: null, lastSay: 0, lastMove: 0, missStreak: 0, stage: 0, pending: {}, drag: null,
          cool: {}, agentLog: [], agentBusy: false, agentTurn: 0, nextAgentAt: 4, missTimes: [], popupOn: false, info: null, changeGoal: null, taskStartAt: 0 };
    $("gmove").textContent = "";
    $("chips").innerHTML = ""; layer.classList.remove("mirror");
    $("timer").classList.remove("hot"); $("pts").textContent = "0";
    show("game"); setPhase();
    say(pick(ROASTS.warm));
    nextChallenge();
    Music.stop(); setTimeout(() => Music.start("warm"), 50);
  }

  async function startFlipPhase() {
    S.running = false; S.phase = "flip"; layer.innerHTML = ""; $("prog").style.width = "100%";
    setTask("Brace yourself…");
    const ov = mk("div", "overlay", `<div class="msg">That was too easy.</div><div class="msg2">Now everything is flipped for 30 seconds.</div>`);
    arena.appendChild(ov);
    const intro = askAI(`${GREMLIN_RULES}
The player just finished an easy warm-up and the flipped round is about to start. Pick the opening flip and write a short menacing-but-funny opener.
Allowed flips: ${JSON.stringify(["invert_mouse","mirror","runaway"])}
Reply with ONLY JSON: {"flip": "<one allowed flip>", "roast": "<opener>"}`, 4600);
    await new Promise(r => setTimeout(r, 1400));
    for (const n of [3, 2, 1]) {
      if (!S || S.phase !== "flip" || S.ended) return;
      ov.innerHTML = `<div class="big-n">${n}</div><div class="msg2">Esc ends it anytime</div>`;
      tone({ type: "triangle", f0: n === 1 ? 880 : 520, dur: .15, vol: .15 });
      await new Promise(r => setTimeout(r, 850));
    }
    ov.remove();
    if (S.ended) return;
    const first = await Promise.race([intro, new Promise(r => setTimeout(() => r(null), 300))]);
    setPhase();
    $("prog").style.width = "0%";
    S.running = true; S.t0 = performance.now(); S.elapsed = 0;
    Music.setMode("flip");
    const openers = ["invert_mouse", "mirror", "runaway"];
    nextChallenge();
    const opened = applyFlip(first && openers.includes(first.flip) ? first.flip : pick(openers), (first && first.roast) || pick(ROASTS.start));
    if (opened) logMove("apply_flip", `opened with ${FLIPS[opened]}`, !!first, 0);
    S.stage = 1;
    tickT = setInterval(tick, 100);
  }

  function tick() {
    S.elapsed = (performance.now() - S.t0) / 1000;
    const left = Math.max(0, ROUND - S.elapsed);
    $("timer").textContent = Math.ceil(left);
    $("timer").classList.toggle("hot", left <= 5);
    if (left <= 5 && !S.rush) { S.rush = true; Music.setTempo(168); }
    $("prog").style.width = (S.elapsed / ROUND * 100) + "%";
    if (S.fx != null) S.trail.push({ t: S.elapsed, x: S.fx / arena.clientWidth, y: S.fy / arena.clientHeight });
    // escalation floor: the round always gets harder, even if the gremlin is slow
    if (S.elapsed >= 12 && S.flips.length < 2 && !S.floor1) { S.floor1 = true; const f = applyFlip(null, null, true); if (f) logMove("apply_flip", `timer forced ${FLIPS[f]}`, false, -1); }
    if (S.elapsed >= 22 && S.flips.length < 3 && !S.floor2) { S.floor2 = true; const f = applyFlip(null, null, true); if (f) logMove("apply_flip", `timer forced ${FLIPS[f]}`, false, -1); }
    if (!S.agentBusy && S.elapsed >= S.nextAgentAt && left > 2) agentTurn();
    if (S.elapsed - S.lastMove > 4 && S.elapsed - S.lastSay > 5) say(pick(ROASTS.idle));
    if (left <= 0) endRound(false);
  }

  function stopRound() {
    if (!S) return;
    S.running = false; S.ended = true; S.drag = null; clearInterval(tickT);
    Music.stop();
    fake.style.display = "none"; layer.classList.remove("mirror"); layer.innerHTML = "";
    arena.querySelectorAll(".overlay,.ghostc").forEach(o => o.remove());
  }
  function endRound(panicked) {
    if (!S || S.ended) return;
    S.panicked = panicked; stopRound();
    if (S.points > getBest()) setBest(S.points);
    showBest(); showResults();
  }
  function goHome() { stopRound(); show("start"); }
  $("homeBtn").addEventListener("click", goHome);
  $("brandBtn").addEventListener("click", goHome);
  $("changeBtn").addEventListener("click", goHome);
  $("panic").addEventListener("click", () => S && !S.ended && endRound(true));
  $("startBtn").addEventListener("click", startGame);
  $("againBtn").addEventListener("click", startGame);
  $("replayBtn").addEventListener("click", playReplay);

  // ---------- results ----------
  function localDignity() { return Math.max(0, Math.min(10, Math.round(S.tasks * 1.4 - S.misses / 5 + 1))); }
  function localVerdict(d) {
    if (S.panicked) return "Hit the panic button. The gremlin will remember this.";
    if (d >= 8) return "Survived with suspicious ease. Are you secretly a mirror?";
    if (d >= 5) return "Shaky, but you made it out. Mostly intact.";
    if (d >= 2) return "Survived, barely. Your cursor needs a nap.";
    return "Total meltdown. The gremlin is framing this replay.";
  }
  async function showResults() {
    show("results");
    const secs = S.phase === "flip" ? Math.min(ROUND, Math.round(S.elapsed)) : 0;
    $("stats").innerHTML = [
      [S.points, "final score"], [S.tasks, "tasks done"], [S.misses, "misses"],
      [secs + "s", S.panicked ? "flipped, then panicked" : "flipped survived"], [S.flips.length, "flips stacked"], [S.bowls, "bowling balls"]
    ].map(([n, l]) => `<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("");
    $("verdict").textContent = "The gremlin is judging you…";
    $("dignity").innerHTML = `–<small> / 10</small>`;
    setShare(localDignity());
    playReplay();
    const ml = $("moves"); ml.innerHTML = "";
    if (!S.agentLog.length) { const li = document.createElement("li"); li.textContent = "The gremlin did nothing. Suspicious."; ml.appendChild(li); }
    S.agentLog.forEach(l => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="t">${l.t.toFixed(1)}s</span><span class="who">${l.ai ? "🤖" : "⚙️"}</span>`;
      li.appendChild(document.createTextNode(l.detail)); ml.appendChild(li);
    });
    const ai = await askAI(`${GREMLIN_RULES}
The round is over. Judge the player's run in one or two short, funny sentences, and give a dignity score 0-10.
Final stats: ${statsText()} ${S.panicked ? "They hit the PANIC button and quit early." : "They survived the full 30 seconds."}
Reply with ONLY JSON: {"verdict": "<1-2 sentences>", "dignity": <0-10 integer>}`, 8000);
    let d = localDignity(), v = localVerdict(d);
    if (ai && typeof ai.verdict === "string") { v = ai.verdict; if (Number.isFinite(+ai.dignity)) d = Math.max(0, Math.min(10, Math.round(+ai.dignity))); }
    $("verdict").textContent = v; $("dignity").innerHTML = `${d}<small> / 10</small>`;
    setShare(d);
  }
  function setShare(d) {
    $("shareText").value = `I scored ${S.points} in FlipIt (${mode} mode) 😈 ${S.tasks} tasks, ${S.misses} misses, ${S.bowls} bowling balls. Dignity: ${d}/10. Your turn.`;
  }
  $("copyBtn").addEventListener("click", async () => {
    const t = $("shareText");
    try { await navigator.clipboard.writeText(t.value); $("copyBtn").textContent = "Copied ✓"; }
    catch { t.select(); $("copyBtn").textContent = "Selected, press Ctrl/⌘+C"; }
    setTimeout(() => $("copyBtn").textContent = "Copy brag", 1800);
  });

  let rafId = null;
  function playReplay() {
    cancelAnimationFrame(rafId);
    const cv = $("replay"), ctx = cv.getContext("2d");
    const ratio = arena.clientWidth && arena.clientHeight ? arena.clientHeight / arena.clientWidth : .62;
    cv.width = 600; cv.height = Math.round(600 * ratio);
    const W = cv.width, H = cv.height, tr = S.trail, cl = S.clickPts;
    const dur = Math.max(1, S.elapsed), start = performance.now();
    function frame(now) {
      const t = Math.min(dur, (now - start) / 1000 * 3);
      ctx.fillStyle = "#0e0c22"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#b1abd2"; ctx.font = "600 13px Inter, sans-serif";
      ctx.fillText(`${t.toFixed(1)}s`, 10, 20);
      ctx.fillText(S.flips.filter((_, i) => t >= i * 10).map(f => FLIPS[f]).join("  "), 10, H - 10);
      ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      let prev = null;
      for (const p of tr) {
        if (p.t > t) break;
        if (prev) { ctx.strokeStyle = `rgba(185,162,255,${Math.max(.1, .95 - (t - p.t) / 6)})`; ctx.beginPath(); ctx.moveTo(prev.x * W, prev.y * H); ctx.lineTo(p.x * W, p.y * H); ctx.stroke(); }
        prev = p;
      }
      for (const c of cl) { if (c.t > t) break; ctx.fillStyle = "rgba(243,205,120,.95)"; ctx.beginPath(); ctx.arc(c.x * W, c.y * H, 5, 0, 7); ctx.fill(); }
      if (prev) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(prev.x * W, prev.y * H, 5, 0, 7); ctx.fill(); }
      if (!tr.length) { ctx.fillStyle = "#b1abd2"; ctx.textAlign = "center"; ctx.fillText("Nothing recorded. You never reached the flipped part.", W / 2, H / 2); ctx.textAlign = "left"; }
      if (t < dur) rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
  }
})();
