// visualizer.js — state management, canvas rendering, UI controls
// Depends on: algorithms.js (loaded first in index.html)

// ── Shared State (also used by algorithms.js) ─────────────────────────────────
let arr      = [];
let bars     = [];
let pointers = {};
let comps    = 0;
let swaps    = 0;
let running  = false;
let stopped  = false;
let algo     = 'bubble';

// ── Canvas ────────────────────────────────────────────────────────────────────
const canvas  = document.getElementById('vis');
const ctx     = canvas.getContext('2d');
const wrapper = document.getElementById('vis-wrapper');

function resizeCanvas() {
  canvas.width  = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
  draw();
}
window.addEventListener('resize', resizeCanvas);

const BAR_COLORS = {
  normal:  '#1e3a2a',
  compare: '#ff6b35',
  swap:    '#ffcc00',
  sorted:  '#00e5a0',
  pivot:   '#c084fc',
};

// ── Draw ──────────────────────────────────────────────────────────────────────
function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!arr.length) return;

  const n          = arr.length;
  const ARROW_ZONE = 30;
  const gap        = Math.max(1, Math.floor(W / n * 0.12));
  const barW       = (W - gap * (n + 1)) / n;
  const maxVal     = Math.max(...arr);
  const showVal    = barW >= 14 && n <= 60;

  for (let i = 0; i < n; i++) {
    const barH = (arr[i] / maxVal) * (H - ARROW_ZONE - 10);
    const x    = gap + i * (barW + gap);
    const y    = H - ARROW_ZONE - barH;

    ctx.fillStyle = BAR_COLORS[bars[i]] || BAR_COLORS.normal;
    ctx.beginPath();
    ctx.rect(x, y, barW, barH);
    ctx.fill();

    // value label on top of bar
    if (showVal) {
      ctx.fillStyle    = bars[i] === 'sorted' ? '#080b0f' : '#e8f0ea';
      ctx.font         = `${Math.min(barW * 0.55, 11)}px 'JetBrains Mono', monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(arr[i], x + barW / 2, y - 2);
    }
  }

  // pointer arrows ▲ below active bars
  const ARROW_COLORS = { compare:'#ff6b35', swap:'#ffcc00', pivot:'#c084fc', sorted:'#00e5a0' };
  for (const [idx, pType] of Object.entries(pointers)) {
    const i      = parseInt(idx);
    const x      = gap + i * (barW + gap) + barW / 2;
    const arrowY = H - ARROW_ZONE + 4;
    const col    = ARROW_COLORS[pType] || '#5a6e61';

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, arrowY);
    ctx.lineTo(x - 5, arrowY + 10);
    ctx.lineTo(x + 5, arrowY + 10);
    ctx.closePath();
    ctx.fill();

    if (pType === 'pivot') {
      ctx.fillStyle    = col;
      ctx.font         = "8px 'JetBrains Mono', monospace";
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('pivot', x, arrowY + 12);
    }
  }
}

// ── Explain Box ───────────────────────────────────────────────────────────────
const explainBox = document.getElementById('explain-box');
function explain(msg, type = '') {
  explainBox.textContent = msg;
  explainBox.className   = type;
}

// ── Helpers (shared with algorithms.js) ──────────────────────────────────────
function sleep(ms)  { return new Promise(r => setTimeout(r, ms)); }
function getDelay() { return parseInt(document.getElementById('speed').value); }

async function pause(states, msg = '', type = '') {
  if (stopped) throw new Error('stopped');
  pointers = {};
  for (const [i, s] of states) { bars[i] = s; pointers[i] = s; }
  if (msg) explain(msg, type);
  draw();
  await sleep(getDelay());
  for (const [i, s] of states) if (s !== 'sorted' && s !== 'pivot') bars[i] = 'normal';
}

function updateStats() {
  document.getElementById('s-comps').textContent = comps;
  document.getElementById('s-swaps').textContent = swaps;
}

function setStatus(s) { document.getElementById('s-status').textContent = s; }

let t0;
function startTimer() { t0 = performance.now(); }
function stopTimer()  {
  document.getElementById('s-time').textContent = (performance.now() - t0).toFixed(0) + 'ms';
}

function log(msg) {
  const el    = document.getElementById('log');
  const entry = document.createElement('span');
  entry.className = 'log-entry';
  entry.innerHTML = `<span class="ts">&gt;</span> ${msg}`;
  el.prepend(entry);
}

// ── Array Generators ──────────────────────────────────────────────────────────
function makeRandom(n)   { return Array.from({ length: n }, () => Math.floor(Math.random() * 90) + 10); }
function makeReversed(n) { return Array.from({ length: n }, (_, i) => Math.round(100 - (i / (n - 1)) * 90)); }
function makeNearly(n) {
  const a = Array.from({ length: n }, (_, i) => Math.round(10 + (i / (n - 1)) * 90));
  for (let k = 0; k < Math.floor(n * 0.15); k++) {
    const i = Math.floor(Math.random() * n), j = Math.floor(Math.random() * n);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function makeFewUnique(n) {
  const vals = [15, 35, 55, 75, 95];
  return Array.from({ length: n }, () => vals[Math.floor(Math.random() * vals.length)]);
}

function applyArray(newArr) {
  arr      = newArr;
  bars     = Array(arr.length).fill('normal');
  pointers = {};
  comps    = swaps = 0;
  updateStats();
  setStatus('Ready');
  explain('Ready — select an algorithm and press ▶ Run');
  draw();
}

function genArray(preset = 'random') {
  const n   = parseInt(document.getElementById('size').value);
  const gen = { random: makeRandom, reversed: makeReversed, nearly: makeNearly, few: makeFewUnique };
  applyArray((gen[preset] || makeRandom)(n));
  log(`Preset: ${preset} — ${n} elements`);
}

// ── Custom Input ──────────────────────────────────────────────────────────────
function applyCustomInput() {
  if (running) return;
  const raw     = document.getElementById('custom-input').value.trim();
  const errEl   = document.getElementById('input-error');
  const inputEl = document.getElementById('custom-input');

  errEl.classList.remove('show');
  inputEl.classList.remove('error');

  if (!raw) { showInputError('Enter some numbers first'); return; }

  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  const nums  = parts.map(Number);

  if (!parts.length || nums.some(v => isNaN(v) || v < 1 || v > 999 || !Number.isInteger(v))) {
    showInputError('Only whole numbers 1–999, comma-separated');
    inputEl.classList.add('error');
    return;
  }
  if (parts.length > 60) {
    showInputError('Max 60 values allowed');
    inputEl.classList.add('error');
    return;
  }

  applyArray(nums);
  log(`Custom input — ${nums.length} elements: ${nums.slice(0, 8).join(', ')}${nums.length > 8 ? '…' : ''}`);
}

function showInputError(msg) {
  const el = document.getElementById('input-error');
  el.textContent = msg;
  el.classList.add('show');
}

// ── Event Listeners ───────────────────────────────────────────────────────────

// Algorithm selector
document.getElementById('algo-btns').addEventListener('click', e => {
  const btn = e.target.closest('.algo-btn');
  if (!btn || running) return;
  document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  algo = btn.dataset.algo;
  const c = COMPLEXITIES[algo];
  document.getElementById('c-best').textContent   = c.best;
  document.getElementById('c-avg').textContent    = c.avg;
  document.getElementById('c-worst').textContent  = c.worst;
  document.getElementById('c-space').textContent  = c.space;
  document.getElementById('c-stable').textContent = c.stable;
  genArray();
  log('Algorithm → ' + btn.textContent.trim());
});

// Sliders
document.getElementById('size').addEventListener('input', function () {
  document.getElementById('size-val').textContent = this.value;
  if (!running) genArray();
});

document.getElementById('speed').addEventListener('input', function () {
  document.getElementById('speed-val').textContent = this.value;
});

// Custom input
document.getElementById('btn-apply').addEventListener('click', applyCustomInput);
document.getElementById('custom-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') applyCustomInput();
});

// Presets
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (running) return;
    document.getElementById('custom-input').value = '';
    document.getElementById('input-error').classList.remove('show');
    genArray(btn.dataset.preset);
  });
});

// Reset
document.getElementById('btn-reset').addEventListener('click', () => {
  if (running) { stopped = true; return; }
  genArray();
});

// Run
document.getElementById('btn-go').addEventListener('click', async () => {
  if (running) return;
  running = true;
  stopped = false;
  comps   = swaps = 0;
  updateStats();
  setStatus('Running…');
  document.getElementById('btn-go').disabled = true;
  log(`Starting ${algo} on ${arr.length} elements`);
  startTimer();

  try {
    await ALGO_FNS[algo]();
    stopTimer();
    setStatus('Done ✓');
    pointers = {};
    explain('Sorting complete! Every element is in its correct position ✓', 'sorted');
    log(`Done — ${comps} comparisons, ${swaps} swaps`);
  } catch (e) {
    stopTimer();
    setStatus('Stopped');
    explain('Stopped.', '');
    log('Stopped by user');
    bars.fill('normal');
    pointers = {};
    draw();
  }

  running = false;
  document.getElementById('btn-go').disabled = false;
});

// ── Init ──────────────────────────────────────────────────────────────────────
resizeCanvas();
genArray();