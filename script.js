/* ═══════════════════════════════════════════════════════════
   LIONEL TELLEM PORTFOLIO — script.js
   Retro side-scrolling game, chiptune music, theme toggle
   Plain ES6 — no frameworks, no build step
═══════════════════════════════════════════════════════════ */

'use strict';

/* ══════════════ THEME TOGGLE ══════════════ */
(function initTheme() {
  const themes = ['dark', 'light', 'neon'];
  const body   = document.body;
  const btn    = document.getElementById('theme-btn');
  const saved  = localStorage.getItem('lt-theme') || 'dark';
  body.dataset.theme = saved;

  btn.addEventListener('click', () => {
    const cur  = body.dataset.theme;
    const next = themes[(themes.indexOf(cur) + 1) % themes.length];
    body.dataset.theme = next;
    localStorage.setItem('lt-theme', next);
    // re-draw game with new colours
    if (window.gameInstance) window.gameInstance.refreshTheme();
  });
})();

/* ══════════════ CHIPTUNE MUSIC (Web Audio API) ══════════════ */
(function initMusic() {
  const btn = document.getElementById('music-btn');
  let ctx   = null;
  let nodes = [];   // oscillators + gain nodes to stop
  let playing = false;

  /* The melody is an original repeating SNES-style loop.
     Frequencies are just pitches — this is not a Nintendo asset. */
  const BPM    = 140;
  const BEAT   = 60 / BPM;

  // Main melody: note name → frequency
  const NOTE = {
    C4:261.63, D4:293.66, E4:329.63, F4:349.23,
    G4:392.00, A4:440.00, B4:493.88,
    C5:523.25, D5:587.33, E5:659.25, G5:783.99,
    _:0  // rest
  };

  // Pattern: [note, beats]
  const melody = [
    ['E5',1],['E5',1],['_',1],['E5',1],
    ['_',1],['C5',1],['E5',1],['_',1],
    ['G5',2],['_',2],
    ['G4',2],['_',2],
    ['C5',1.5],['_',0.5],['G4',1.5],['_',0.5],
    ['E4',2],['_',1],
    ['A4',1],['_',0.5],['B4',1],['_',0.5],['A4',1],
    ['G4',1],['E5',1],['G5',1],
    ['A5',2],['F5',1],['G5',1],
    ['E5',2],['C5',1],['D5',1],['B4',2],['_',2],
  ];

  const bass = [
    ['C4',2],['G4',2],['E4',2],['A4',2],
    ['F4',2],['G4',2],['C4',2],['_',2],
    ['C4',2],['G4',2],['A4',2],['F4',2],
    ['C4',2],['G4',2],['C4',4],
  ];

  function playLoop(audioCtx, pattern, type, gainVal, delayNotes) {
    const totalBeats = pattern.reduce((s, [, b]) => s + b, 0);
    const startTime  = audioCtx.currentTime + 0.05;
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(gainVal, startTime);
    masterGain.connect(audioCtx.destination);
    nodes.push(masterGain);

    function schedulePass(passStart) {
      let t = passStart;
      for (const [noteName, beats] of pattern) {
        const dur = beats * BEAT;
        const freq = NOTE[noteName];
        if (freq > 0) {
          const osc  = audioCtx.createOscillator();
          const gn   = audioCtx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, t);
          gn.gain.setValueAtTime(gainVal, t);
          gn.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.9);
          osc.connect(gn);
          gn.connect(masterGain);
          osc.start(t);
          osc.stop(t + dur);
          nodes.push(osc, gn);
        }
        t += dur;
      }
      return passStart + totalBeats * BEAT;
    }

    // schedule 32 bars (enough for a long visit; we could schedule more dynamically)
    let cursor = startTime + (delayNotes || 0) * BEAT;
    for (let i = 0; i < 32; i++) {
      cursor = schedulePass(cursor);
    }
  }

  // square-wave pulse for percussion
  function playDrum(audioCtx) {
    const kick = [
      ['C4',1],['_',1],['_',1],['_',1],
      ['C4',1],['_',1],['C4',1],['_',1],
    ];
    playLoop(audioCtx, kick, 'square', 0.06, 0);
  }

  function start() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    playLoop(ctx, melody, 'square', 0.12, 0);
    playLoop(ctx, bass,   'triangle', 0.08, 0);
    playDrum(ctx);
    playing = true;
    btn.textContent = '🔇 Mute';
  }

  function stop() {
    if (ctx) {
      ctx.close();
      ctx = null;
    }
    nodes = [];
    playing = false;
    btn.textContent = '▶ Music';
  }

  btn.addEventListener('click', () => {
    if (!playing) start(); else stop();
  });
})();

/* ══════════════ GAME WORLD ══════════════ */
(function initGame() {
  const canvas = document.getElementById('game-canvas');
  const ctx    = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Stage definitions ──────────────────────────────────────
  const STAGES = [
    { id: 'about',    label: 'ABOUT ME',    xFrac: 0.20, cardId: 'card-about'    },
    { id: 'projects', label: 'PROJECTS',    xFrac: 0.40, cardId: 'card-projects' },
    { id: 'fun',      label: 'FINISH LINE', xFrac: 0.62, cardId: 'card-fun'      },
    { id: 'contact',  label: 'CONTACT',     xFrac: 0.82, cardId: 'card-contact'  },
  ];

  // ── World / scroll ──────────────────────────────────────────
  const WORLD_W = 1400;   // tighter world — stages are closer together
  let cameraX = 0;

  // ── Player ──────────────────────────────────────────────────
  const player = {
    x: 80,         // world-x
    y: 0,          // set on resize
    w: 18,
    h: 28,
    vy: 0,
    onGround: false,
    facing: 1,    // 1 = right, -1 = left
    frame: 0,
    frameTick: 0,
    running: false,
  };

  // ── AWS service names that rain down ──────────────────────
  const SERVICE_NAMES = [
    'IAM','S3','EC2','VPC','RDS','Lambda','CloudFront',
    'CloudTrail','GuardDuty','Macie','KMS','CloudWatch',
    'CloudFormation','Route 53','WAF','Config',
  ];

  const rainDrops = [];
  const MAX_DROPS = 14;

  function spawnDrop() {
    if (rainDrops.length >= MAX_DROPS) return;
    rainDrops.push({
      text: SERVICE_NAMES[Math.floor(Math.random() * SERVICE_NAMES.length)],
      x: Math.random() * canvas.width,
      y: -14,
      speed: 0.4 + Math.random() * 0.5,
      alpha: 0.18 + Math.random() * 0.22,
    });
  }

  // ── Clouds (canvas, for the game area) ──────────────────────
  const CLOUDS = Array.from({length: 7}, (_, i) => ({
    worldX: i * (WORLD_W / 6) + 100,
    y: 20 + Math.random() * 60,
    w: 60 + Math.random() * 50,
    h: 22 + Math.random() * 14,
    speed: 0.2 + Math.random() * 0.15,
  }));

  // ── Coins (collected when a stage fires) ────────────────────
  const coinPops = [];    // {x, y, life}

  // ── Stage flags ─────────────────────────────────────────────
  const triggered = {};
  let activeCardId = null;

  // ── Input state ─────────────────────────────────────────────
  const keys = { left: false, right: false };
  const SPEED = 2.2;
  const JUMP_V = -7;
  const GRAVITY = 0.38;

  // keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.left  = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ')
        && player.onGround) {
      player.vy = JUMP_V;
      player.onGround = false;
    }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.left  = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });

  // on-screen gamepad buttons
  const btnL = document.getElementById('btn-left');
  const btnR = document.getElementById('btn-right');
  // pad music / theme buttons (may be null if not in DOM yet — safe to ignore)
  const btnPadMusic = document.getElementById('pad-music-btn');
  const btnPadTheme = document.getElementById('pad-theme-btn');

  function pressLeft(down) {
    keys.left = down;
    btnL.classList.toggle('pressed', down);
  }
  function pressRight(down) {
    keys.right = down;
    btnR.classList.toggle('pressed', down);
  }

  btnL.addEventListener('pointerdown', e => { e.preventDefault(); pressLeft(true); });
  btnL.addEventListener('pointerup',   () => pressLeft(false));
  btnL.addEventListener('pointerleave',() => pressLeft(false));
  btnR.addEventListener('pointerdown', e => { e.preventDefault(); pressRight(true); });
  btnR.addEventListener('pointerup',   () => pressRight(false));
  btnR.addEventListener('pointerleave',() => pressRight(false));

  // Forward pad music/theme clicks to the real navbar buttons
  if (btnPadMusic) {
    btnPadMusic.addEventListener('click', () => {
      document.getElementById('music-btn').click();
      // mirror label
      const real = document.getElementById('music-btn');
      btnPadMusic.setAttribute('aria-label', real.textContent.trim());
    });
  }
  if (btnPadTheme) {
    btnPadTheme.addEventListener('click', () => {
      document.getElementById('theme-btn').click();
    });
  }

  // ── Card close buttons ───────────────────────────────────────
  document.querySelectorAll('.card-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.stage-card');
      card.hidden = true;
      activeCardId = null;
    });
  });

  // ── CSS variable helper ──────────────────────────────────────
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
        || getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  // cache colours (refreshed on theme change)
  let C = {};
  function refreshTheme() {
    C.sky1     = cssVar('--sky-top')   || '#1a237e';
    C.sky2     = cssVar('--sky-bot')   || '#0d47a1';
    C.ground   = cssVar('--ground')    || '#4e342e';
    C.grass    = cssVar('--grass')     || '#388e3c';
    C.pipe     = cssVar('--pipe')      || '#2e7d32';
    C.accent   = cssVar('--accent')    || '#f7c948';
    C.accent2  = cssVar('--accent-2')  || '#e83f3f';
    C.accent3  = cssVar('--accent3')   || '#4fc3f7';
    C.text     = cssVar('--text')      || '#e0e0ff';
    C.surface  = cssVar('--surface')   || '#1a1a3e';
    C.border   = cssVar('--border')    || '#3a3a7a';
  }
  refreshTheme();
  window.gameInstance = { refreshTheme };

  // ── Resize handler ───────────────────────────────────────────
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = Math.min(rect.width, 900);
    // Read the CSS-computed height (clamp handles responsive sizing)
    const cssH = parseFloat(getComputedStyle(canvas).height);
    canvas.height = (cssH && cssH > 0) ? cssH : 340;
    player.y = canvas.height - 60 - player.h;
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Ground height in canvas coords ──────────────────────────
  function groundY() { return canvas.height - 52; }

  // ── Stage world-x positions ──────────────────────────────────
  function stageWorldX(s) { return Math.floor(s.xFrac * WORLD_W); }

  // ── Helper: draw a pixelated rectangle ──────────────────────
  function pxRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  // ── Draw the retro runner character (original pixel art) ─────
  // Drawn on a 18×28 grid using coloured rectangles — fully original.
  function drawRunner(screenX, facing, frame) {
    ctx.save();
    const px = Math.round(screenX);
    const py = Math.round(player.y);
    const s = 2; // scale: each "pixel" = 2 canvas pixels
    const W = 9, H = 14; // native grid size

    if (facing === -1) {
      ctx.translate(px + player.w, py);
      ctx.scale(-1, 1);
      ctx.translate(0, 0);
    } else {
      ctx.translate(px, py);
    }

    // Sprite data: row, col, width, height (in native pixels), colour
    // HEAD
    pxRect(3*s,0,     3*s,s,  '#f5cba7'); // hat brim top
    pxRect(2*s,s,     5*s,s,  '#c0392b'); // hat
    pxRect(2*s,2*s,   5*s,s,  '#c0392b');
    pxRect(s,  3*s,   7*s,s,  '#f5cba7'); // face
    pxRect(s,  4*s,   7*s,s,  '#f5cba7');
    // eyes
    pxRect(2*s,3*s,   s,s,    '#2c3e50');
    pxRect(6*s,3*s,   s,s,    '#2c3e50');
    // moustache
    pxRect(2*s,4*s,   5*s,s,  '#a04000');
    // shirt (white bib)
    pxRect(2*s,5*s,   5*s,s,  '#ecf0f1');
    pxRect(2*s,6*s,   5*s,s,  '#ecf0f1');
    // bib number (tiny)
    pxRect(3*s,6*s,   3*s,s,  '#e74c3c');
    // shorts (red)
    pxRect(2*s,7*s,   5*s,s,  '#e74c3c');
    pxRect(2*s,8*s,   2*s,s,  '#e74c3c');
    pxRect(5*s,8*s,   2*s,s,  '#e74c3c');

    // legs — 2 frames
    if (frame % 2 === 0) {
      // stride A
      pxRect(2*s,9*s,  2*s,2*s, '#2c3e50'); // left leg
      pxRect(5*s,9*s,  2*s,2*s, '#2c3e50');
      pxRect(s,  11*s, 2*s,s,   '#e74c3c'); // left shoe
      pxRect(5*s,11*s, 3*s,s,   '#e74c3c'); // right shoe
    } else {
      // stride B
      pxRect(3*s,9*s,  2*s,2*s, '#2c3e50');
      pxRect(4*s,9*s,  2*s,2*s, '#2c3e50');
      pxRect(2*s,11*s, 3*s,s,   '#e74c3c');
      pxRect(4*s,11*s, 2*s,s,   '#e74c3c');
    }

    // arms — swing with legs
    if (frame % 2 === 0) {
      pxRect(s,  5*s,  s,2*s, '#f5cba7');  // left arm forward
      pxRect(7*s,6*s,  s,2*s, '#f5cba7');  // right arm back
    } else {
      pxRect(s,  6*s,  s,2*s, '#f5cba7');
      pxRect(7*s,5*s,  s,2*s, '#f5cba7');
    }

    ctx.restore();
  }

  // ── Draw a pixel cloud ───────────────────────────────────────
  function drawCloud(screenX, y, w, h) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    // blocky cloud: three stacked rectangles
    ctx.fillRect(Math.round(screenX + w*0.2), Math.round(y + h*0.5), w*0.6, h*0.5);
    ctx.fillRect(Math.round(screenX + w*0.1), Math.round(y + h*0.25), w*0.5, h*0.5);
    ctx.fillRect(Math.round(screenX + w*0.4), Math.round(y),          w*0.45,h*0.5);
    ctx.fillRect(Math.round(screenX),          Math.round(y + h*0.35),w*0.35,h*0.4);
  }

  // ── Draw a stage flag / sign ─────────────────────────────────
  function drawStageSign(worldX, label, reached) {
    const sx = worldX - cameraX;
    if (sx < -80 || sx > canvas.width + 80) return;

    const gY  = groundY();
    const poleH = 48;
    const signW = 72, signH = 22;

    // pole
    pxRect(sx - 2, gY - poleH, 4, poleH, reached ? C.accent : C.border);

    // sign box
    ctx.fillStyle = reached ? C.accent : C.surface;
    ctx.fillRect(sx - signW/2, gY - poleH - signH, signW, signH);
    ctx.strokeStyle = reached ? C.accent2 : C.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - signW/2, gY - poleH - signH, signW, signH);

    ctx.fillStyle = reached ? C.ground : C.text;
    ctx.font = `bold 6px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, sx, gY - poleH - signH/2);
  }

  // ── Draw finish-line tape ────────────────────────────────────
  function drawFinish(worldX) {
    const sx = worldX - cameraX;
    if (sx < -10 || sx > canvas.width + 10) return;
    const gY = groundY();
    for (let y = gY - 60; y < gY; y += 8) {
      ctx.fillStyle = (Math.floor(y/8) % 2 === 0) ? '#fff' : C.accent2;
      ctx.fillRect(sx - 2, y, 4, 8);
    }
  }

  // ── Coin pop sprite ──────────────────────────────────────────
  function spawnCoin(screenX, screenY) {
    coinPops.push({ x: screenX, y: screenY, life: 1.0 });
  }

  function updateCoins(dt) {
    for (let i = coinPops.length - 1; i >= 0; i--) {
      coinPops[i].life -= dt * 1.6;
      if (coinPops[i].life <= 0) coinPops.splice(i, 1);
    }
  }

  function drawCoins() {
    for (const c of coinPops) {
      const progress = 1 - c.life;
      const cy = c.y - progress * 60;
      const alpha = c.life;
      const scale = 0.5 + c.life * 0.8;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(c.x, cy);
      ctx.scale(scale, scale);
      // coin circle
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);
      ctx.restore();
    }
  }

  // ── Draw AWS service name rain ───────────────────────────────
  function updateRain(dt) {
    if (Math.random() < 0.015) spawnDrop();
    for (let i = rainDrops.length - 1; i >= 0; i--) {
      rainDrops[i].y += rainDrops[i].speed;
      if (rainDrops[i].y > canvas.height) rainDrops.splice(i, 1);
    }
  }

  function drawRain() {
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textBaseline = 'top';
    // In light theme the sky is pale blue — boost opacity and use a dark ink colour
    const isLight = document.body.dataset.theme === 'light';
    for (const d of rainDrops) {
      ctx.globalAlpha = isLight ? Math.min(d.alpha * 4.55, 0.92) : d.alpha;
      ctx.fillStyle   = isLight ? '#1a3a6b' : C.accent3;
      ctx.fillText(d.text, d.x, d.y);
    }
    ctx.globalAlpha = 1;
  }

  // ── Main update ──────────────────────────────────────────────
  let lastTime = null;

  function update(ts) {
    if (!lastTime) lastTime = ts;
    const dt = Math.min((ts - lastTime) / 1000, 0.1);   // seconds, capped
    lastTime = ts;

    if (prefersReducedMotion) return; // skip animation entirely in reduced-motion

    // ── movement ──
    player.running = false;
    if (keys.right) {
      player.x += SPEED * (dt * 60);
      player.facing = 1;
      player.running = true;
    }
    if (keys.left) {
      player.x -= SPEED * (dt * 60);
      player.facing = -1;
      player.running = true;
    }
    player.x = Math.max(0, Math.min(player.x, WORLD_W - player.w));

    // ── gravity ──
    player.vy += GRAVITY * (dt * 60);
    player.y  += player.vy * (dt * 60);
    const gY = groundY();
    if (player.y + player.h >= gY) {
      player.y = gY - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // ── camera follow ──
    const camTarget = player.x - canvas.width * 0.35;
    cameraX += (camTarget - cameraX) * Math.min(dt * 8, 1);
    cameraX = Math.max(0, Math.min(cameraX, WORLD_W - canvas.width));

    // ── animate clouds ──
    for (const cl of CLOUDS) {
      cl.worldX -= cl.speed * (dt * 60);
      if (cl.worldX + cl.w < 0) cl.worldX = WORLD_W;
    }

    // ── rain ──
    updateRain(dt);

    // ── runner frame ──
    if (player.running) {
      player.frameTick += dt * 60 * 0.18;
      if (player.frameTick >= 1) { player.frame = (player.frame + 1) % 4; player.frameTick = 0; }
    }

    // ── stage triggers ──
    for (const stage of STAGES) {
      const wx = stageWorldX(stage);
      const dist = Math.abs(player.x + player.w/2 - wx);
      if (dist < 28 && !triggered[stage.id]) {
        triggered[stage.id] = true;
        openCard(stage.cardId);
        // coin pop at player screen position
        const screenX = player.x - cameraX + player.w/2;
        const screenY = player.y;
        spawnCoin(screenX, screenY);
      }
    }

    updateCoins(dt);

    draw();
    requestAnimationFrame(update);
  }

  // ── Open a stage card ────────────────────────────────────────
  function openCard(cardId) {
    // close any open card
    document.querySelectorAll('.stage-card').forEach(c => c.hidden = true);
    const card = document.getElementById(cardId);
    if (card) {
      card.hidden = false;
      activeCardId = cardId;
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ── Draw everything ──────────────────────────────────────────
  function draw() {
    const W = canvas.width, H = canvas.height;
    const gY = groundY();

    // sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, gY);
    grad.addColorStop(0, C.sky1);
    grad.addColorStop(1, C.sky2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // AWS service rain (behind everything)
    drawRain();

    // clouds
    for (const cl of CLOUDS) {
      drawCloud(cl.worldX - cameraX, cl.y, cl.w, cl.h);
    }

    // ground
    pxRect(0, gY, W, H - gY, C.ground);
    // grass strip
    pxRect(0, gY, W, 6, C.grass);
    // grass pixel detail
    for (let gx = 0; gx < W; gx += 8) {
      pxRect(gx, gY - 2, 4, 3, C.grass);
    }

    // stage signs & finish line
    for (const stage of STAGES) {
      const wx = stageWorldX(stage);
      if (stage.id === 'fun') drawFinish(wx);
      drawStageSign(wx, stage.label, !!triggered[stage.id]);
    }

    // runner
    const screenX = player.x - cameraX;
    drawRunner(screenX, player.facing, player.frame);

    // coin pops
    drawCoins();

    // progress HUD (tiny bar at bottom)
    const prog = player.x / (WORLD_W - player.w);
    pxRect(0, H - 4, W, 4, C.border);
    pxRect(0, H - 4, Math.round(W * prog), 4, C.accent);
  }

  // ── Expose for theme refresh ──────────────────────────────────
  window.gameInstance.refreshTheme = () => { refreshTheme(); };

  // ── Reduced-motion: show static scene then open first card ──
  if (prefersReducedMotion) {
    resize();
    draw();
    // open first card immediately
    openCard(STAGES[0].cardId);
    return;
  }

  // ── Kick off loop ────────────────────────────────────────────
  requestAnimationFrame(update);

})(); // end initGame
