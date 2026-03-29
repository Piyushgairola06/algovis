// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════
const state = {
  nodes: [],       // { id, x, y, label }
  edges: [],       // { from, to, weight }
  startNode: null,
  endNode: null,
  mode: 'node',
  algo: 'bfs',
  directed: false,
  speed: 50,
  running: false,
  edgeFrom: null,  // node id pending second click for edge
  // visual state
  visitedNodes: new Set(),
  frontierNodes: new Set(),
  pathNodes: new Set(),
  activeEdges: new Set(),   // "from-to" strings
  pathEdges: new Set(),
};

let nodeCounter = 0;

// ═══════════════════════════════════════════════════════════════
//  CANVAS SETUP
// ═══════════════════════════════════════════════════════════════
const canvas  = document.getElementById('graph-canvas');
const ctx     = canvas.getContext('2d');
const wrap    = document.getElementById('canvas-wrap');

function resize() {
  canvas.width  = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  draw();
}
window.addEventListener('resize', resize);
resize();

// ═══════════════════════════════════════════════════════════════
//  DRAW
// ═══════════════════════════════════════════════════════════════
const NODE_R = 20;

function nodeColor(id) {
  if (id === state.startNode) return '#e8e8e8';
  if (id === state.endNode)   return '#ff6b6b';
  if (state.pathNodes.has(id))     return '#06d6a0';
  if (state.visitedNodes.has(id))  return '#4a9eff';
  if (state.frontierNodes.has(id)) return '#ffd166';
  return '#1e1e1e';
}

function nodeBorderColor(id) {
  if (id === state.startNode) return '#ffffff';
  if (id === state.endNode)   return '#ff6b6b';
  if (state.pathNodes.has(id))     return '#06d6a0';
  if (state.visitedNodes.has(id))  return '#4a9eff';
  if (state.frontierNodes.has(id)) return '#ffd166';
  if (state.edgeFrom === id)       return '#ffd166';
  return '#444';
}

function nodeTextColor(id) {
  if (id === state.startNode) return '#0d0d0d';
  if (state.pathNodes.has(id)) return '#0d0d0d';
  return '#e8e8e8';
}

function edgeKey(a, b) { return `${a}-${b}`; }

function edgeColor(from, to) {
  const k1 = edgeKey(from, to), k2 = edgeKey(to, from);
  if (state.pathEdges.has(k1) || state.pathEdges.has(k2)) return '#06d6a0';
  if (state.activeEdges.has(k1) || state.activeEdges.has(k2)) return '#4a9eff';
  return '#2a2a2a';
}

function edgeWidth(from, to) {
  const k1 = edgeKey(from, to), k2 = edgeKey(to, from);
  if (state.pathEdges.has(k1) || state.pathEdges.has(k2)) return 2.5;
  if (state.activeEdges.has(k1) || state.activeEdges.has(k2)) return 1.5;
  return 1;
}

function drawArrow(x1, y1, x2, y2, color, lw) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len === 0) return;
  const ux = dx/len, uy = dy/len;
  const ex = x2 - ux*NODE_R, ey = y2 - uy*NODE_R;
  const sx = x1 + ux*NODE_R, sy = y1 + uy*NODE_R;
  const headLen = 10, headAng = Math.PI/6;
  const ang = Math.atan2(ey-sy, ex-sx);

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - headLen*Math.cos(ang-headAng), ey - headLen*Math.sin(ang-headAng));
  ctx.lineTo(ex - headLen*Math.cos(ang+headAng), ey - headLen*Math.sin(ang+headAng));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  for (const e of state.edges) {
    const a = state.nodes.find(n => n.id === e.from);
    const b = state.nodes.find(n => n.id === e.to);
    if (!a || !b) continue;
    const col = edgeColor(e.from, e.to);
    const lw  = edgeWidth(e.from, e.to);

    if (state.directed) {
      drawArrow(a.x, a.y, b.x, b.y, col, lw);
    } else {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.stroke();
    }

    // Weight label for Dijkstra
    if (state.algo === 'dijkstra') {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      ctx.fillStyle = '#555';
      ctx.font = '10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.weight, mx, my - 7);
    }
  }

  // Pending edge line
  if (state.edgeFrom !== null && state._mouseX !== undefined) {
    const a = state.nodes.find(n => n.id === state.edgeFrom);
    if (a) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(state._mouseX, state._mouseY);
      ctx.strokeStyle = '#ffd16688';
      ctx.lineWidth = 1;
      ctx.setLineDash([4,4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Draw nodes
  for (const n of state.nodes) {
    const bg     = nodeColor(n.id);
    const border = nodeBorderColor(n.id);
    const txt    = nodeTextColor(n.id);

    ctx.beginPath();
    ctx.arc(n.x, n.y, NODE_R, 0, Math.PI*2);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = txt;
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.label, n.x, n.y);
  }
}

// ═══════════════════════════════════════════════════════════════
//  GRAPH HELPERS
// ═══════════════════════════════════════════════════════════════
function nodeAt(x, y) {
  return state.nodes.find(n => {
    const dx = n.x - x, dy = n.y - y;
    return Math.sqrt(dx*dx + dy*dy) <= NODE_R;
  });
}

function addNode(x, y) {
  const id    = nodeCounter++;
  const label = String.fromCharCode(65 + (id % 26)); // A-Z cycling
  state.nodes.push({ id, x, y, label });
  hideHint();
  draw();
}

function addEdge(from, to) {
  if (from === to) return;
  const exists = state.edges.some(e =>
    (e.from === from && e.to === to) ||
    (!state.directed && e.from === to && e.to === from)
  );
  if (exists) return;
  const weight = Math.floor(Math.random() * 9) + 1;
  state.edges.push({ from, to, weight });
  draw();
}

function removeNode(id) {
  state.nodes = state.nodes.filter(n => n.id !== id);
  state.edges = state.edges.filter(e => e.from !== id && e.to !== id);
  if (state.startNode === id) state.startNode = null;
  if (state.endNode   === id) state.endNode   = null;
}

function getNeighbors(id) {
  const result = [];
  for (const e of state.edges) {
    if (e.from === id) result.push({ id: e.to, weight: e.weight, edgeFrom: e.from, edgeTo: e.to });
    if (!state.directed && e.to === id) result.push({ id: e.from, weight: e.weight, edgeFrom: e.to, edgeTo: e.from });
  }
  return result;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════════
//  LOGGING
// ═══════════════════════════════════════════════════════════════
const logBox = document.getElementById('log-box');
function log(msg, highlight=false) {
  const p = document.createElement('p');
  p.textContent = '> ' + msg;
  if (highlight) p.className = 'highlight';
  logBox.appendChild(p);
  logBox.scrollTop = logBox.scrollHeight;
  if (logBox.children.length > 40) logBox.removeChild(logBox.firstChild);
}
function clearLog() { logBox.innerHTML = ''; }

// ═══════════════════════════════════════════════════════════════
//  STATS
// ═══════════════════════════════════════════════════════════════
function updateStats(visited, pathLen, cost, time, status) {
  document.getElementById('stat-visited').textContent = visited ?? 0;
  document.getElementById('stat-path').textContent    = pathLen ?? '—';
  document.getElementById('stat-cost').textContent    = cost ?? '—';
  document.getElementById('stat-time').textContent    = time != null ? time + 'ms' : '0ms';
  document.getElementById('stat-status').textContent  = status ?? 'Ready';
}

// ═══════════════════════════════════════════════════════════════
//  COMPLEXITY DATA
// ═══════════════════════════════════════════════════════════════
const COMPLEXITY = {
  bfs:      { time:'O(V+E)', space:'O(V)', complete:'Yes', optimal:'Yes (unweighted)' },
  dfs:      { time:'O(V+E)', space:'O(V)', complete:'Yes', optimal:'No' },
  dijkstra: { time:'O((V+E)logV)', space:'O(V)', complete:'Yes', optimal:'Yes' },
};

function updateComplexity() {
  const c = COMPLEXITY[state.algo];
  document.getElementById('cx-time').textContent     = c.time;
  document.getElementById('cx-space').textContent    = c.space;
  document.getElementById('cx-complete').textContent = c.complete;
  document.getElementById('cx-optimal').textContent  = c.optimal;
}

// ═══════════════════════════════════════════════════════════════
//  ALGORITHMS
// ═══════════════════════════════════════════════════════════════
function labelOf(id) {
  const n = state.nodes.find(n => n.id === id);
  return n ? n.label : '?';
}

async function runBFS() {
  const src = state.startNode, dst = state.endNode;
  const parent = {}, visited = new Set();
  const queue = [src];
  visited.add(src);
  state.frontierNodes.add(src);
  let visitedCount = 0;
  const t0 = performance.now();

  log(`BFS from ${labelOf(src)}${dst !== null ? ' → ' + labelOf(dst) : ''}`, true);

  while (queue.length && state.running) {
    const curr = queue.shift();
    state.frontierNodes.delete(curr);
    state.visitedNodes.add(curr);
    visitedCount++;
    log(`Visit ${labelOf(curr)}`);
    updateStats(visitedCount, null, null, Math.round(performance.now()-t0), 'Running');
    draw();
    await sleep(state.speed);

    if (curr === dst) break;

    for (const nb of getNeighbors(curr)) {
      if (!visited.has(nb.id)) {
        visited.add(nb.id);
        parent[nb.id] = curr;
        state.frontierNodes.add(nb.id);
        state.activeEdges.add(edgeKey(curr, nb.id));
        queue.push(nb.id);
      }
    }
  }

  // reconstruct path
  if (dst !== null && state.visitedNodes.has(dst)) {
    let cur = dst; const path = [];
    while (cur !== undefined) { path.unshift(cur); cur = parent[cur]; }
    for (let i=0; i<path.length; i++) {
      state.pathNodes.add(path[i]);
      if (i>0) { state.pathEdges.add(edgeKey(path[i-1], path[i])); state.pathEdges.add(edgeKey(path[i], path[i-1])); }
    }
    const elapsed = Math.round(performance.now()-t0);
    log(`Path: ${path.map(labelOf).join(' → ')}`, true);
    updateStats(visitedCount, path.length-1, path.length-1, elapsed, 'Done');
  } else if (dst !== null) {
    log('No path found.', true);
    updateStats(visitedCount, null, null, Math.round(performance.now()-t0), 'No path');
  } else {
    updateStats(visitedCount, null, null, Math.round(performance.now()-t0), 'Done');
  }
  draw();
}

async function runDFS() {
  const src = state.startNode, dst = state.endNode;
  const parent = {}, visited = new Set();
  const stack = [src];
  const t0 = performance.now();
  let visitedCount = 0;
  let found = false;

  log(`DFS from ${labelOf(src)}${dst !== null ? ' → ' + labelOf(dst) : ''}`, true);

  while (stack.length && state.running) {
    const curr = stack.pop();
    if (visited.has(curr)) continue;
    visited.add(curr);
    state.visitedNodes.add(curr);
    state.frontierNodes.delete(curr);
    visitedCount++;
    log(`Visit ${labelOf(curr)}`);
    updateStats(visitedCount, null, null, Math.round(performance.now()-t0), 'Running');
    draw();
    await sleep(state.speed);

    if (curr === dst) { found = true; break; }

    for (const nb of getNeighbors(curr)) {
      if (!visited.has(nb.id)) {
        parent[nb.id] = curr;
        state.frontierNodes.add(nb.id);
        state.activeEdges.add(edgeKey(curr, nb.id));
        stack.push(nb.id);
      }
    }
  }

  if (dst !== null && found) {
    let cur = dst; const path = [];
    while (cur !== undefined) { path.unshift(cur); cur = parent[cur]; }
    for (let i=0; i<path.length; i++) {
      state.pathNodes.add(path[i]);
      if (i>0) { state.pathEdges.add(edgeKey(path[i-1], path[i])); state.pathEdges.add(edgeKey(path[i], path[i-1])); }
    }
    log(`Path: ${path.map(labelOf).join(' → ')}`, true);
    updateStats(visitedCount, path.length-1, path.length-1, Math.round(performance.now()-t0), 'Done');
  } else if (dst !== null) {
    log('No path found.', true);
    updateStats(visitedCount, null, null, Math.round(performance.now()-t0), 'No path');
  } else {
    updateStats(visitedCount, null, null, Math.round(performance.now()-t0), 'Done');
  }
  draw();
}

async function runDijkstra() {
  const src = state.startNode;
  const dst = state.endNode;
  const dist = {}, parent = {}, visited = new Set();
  for (const n of state.nodes) dist[n.id] = Infinity;
  dist[src] = 0;
  // Simple min-priority queue via array
  const pq = [{ id: src, d: 0 }];
  const t0 = performance.now();
  let visitedCount = 0;

  log(`Dijkstra from ${labelOf(src)}${dst !== null ? ' → ' + labelOf(dst) : ''}`, true);

  while (pq.length && state.running) {
    pq.sort((a,b) => a.d - b.d);
    const { id: curr, d: currDist } = pq.shift();
    if (visited.has(curr)) continue;
    visited.add(curr);
    state.visitedNodes.add(curr);
    state.frontierNodes.delete(curr);
    visitedCount++;
    log(`Visit ${labelOf(curr)}  dist=${currDist}`);
    updateStats(visitedCount, null, null, Math.round(performance.now()-t0), 'Running');
    draw();
    await sleep(state.speed);

    if (curr === dst) break;

    for (const nb of getNeighbors(curr)) {
      const nd = currDist + nb.weight;
      if (nd < dist[nb.id]) {
        dist[nb.id] = nd;
        parent[nb.id] = curr;
        state.frontierNodes.add(nb.id);
        state.activeEdges.add(edgeKey(curr, nb.id));
        pq.push({ id: nb.id, d: nd });
      }
    }
  }

  if (dst !== null && dist[dst] < Infinity) {
    let cur = dst; const path = [];
    while (cur !== undefined) { path.unshift(cur); cur = parent[cur]; }
    for (let i=0; i<path.length; i++) {
      state.pathNodes.add(path[i]);
      if (i>0) { state.pathEdges.add(edgeKey(path[i-1], path[i])); state.pathEdges.add(edgeKey(path[i], path[i-1])); }
    }
    log(`Path: ${path.map(labelOf).join(' → ')}  cost=${dist[dst]}`, true);
    updateStats(visitedCount, path.length-1, dist[dst], Math.round(performance.now()-t0), 'Done');
  } else if (dst !== null) {
    log('No path found.', true);
    updateStats(visitedCount, null, null, Math.round(performance.now()-t0), 'No path');
  } else {
    updateStats(visitedCount, null, null, Math.round(performance.now()-t0), 'Done');
  }
  draw();
}

// ═══════════════════════════════════════════════════════════════
//  SAMPLE GRAPH
// ═══════════════════════════════════════════════════════════════
function loadSample() {
  clearGraph();
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2;
  const positions = [
    [cx,       cy-160],  // A 0
    [cx-160,   cy-60],   // B 1
    [cx+160,   cy-60],   // C 2
    [cx-240,   cy+80],   // D 3
    [cx-60,    cy+80],   // E 4
    [cx+60,    cy+80],   // F 5
    [cx+240,   cy+80],   // G 6
    [cx,       cy+200],  // H 7
  ];
  positions.forEach(([x,y]) => addNode(x, y));

  const edgePairs = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[4,5],[3,7],[5,7],[6,7]];
  edgePairs.forEach(([a,b]) => addEdge(state.nodes[a].id, state.nodes[b].id));

  state.startNode = state.nodes[0].id;
  state.endNode   = state.nodes[7].id;
  log('Sample graph loaded. Press Run.', true);
  draw();
}

function clearGraph() {
  state.nodes = [];
  state.edges = [];
  state.startNode = null;
  state.endNode   = null;
  state.edgeFrom  = null;
  nodeCounter = 0;
  resetVis();
}

function resetVis() {
  state.visitedNodes.clear();
  state.frontierNodes.clear();
  state.pathNodes.clear();
  state.activeEdges.clear();
  state.pathEdges.clear();
  state.running = false;
  updateStats(0, null, null, 0, 'Ready');
  draw();
}

// ═══════════════════════════════════════════════════════════════
//  CANVAS INTERACTION
// ═══════════════════════════════════════════════════════════════
let dragging = null, dragOffX = 0, dragOffY = 0, didDrag = false;

canvas.addEventListener('mousedown', e => {
  const { x, y } = canvasPos(e);
  const hit = nodeAt(x, y);
  if (hit && state.mode !== 'delete' && state.mode !== 'start' && state.mode !== 'end' && state.mode !== 'edge') {
    dragging = hit; dragOffX = x - hit.x; dragOffY = y - hit.y; didDrag = false;
    return;
  }
});

canvas.addEventListener('mousemove', e => {
  const { x, y } = canvasPos(e);
  state._mouseX = x; state._mouseY = y;
  if (dragging) {
    dragging.x = x - dragOffX;
    dragging.y = y - dragOffY;
    didDrag = true;
    draw();
    return;
  }
  if (state.edgeFrom !== null) draw();
});

canvas.addEventListener('mouseup', e => {
  if (dragging) { dragging = null; return; }
});

canvas.addEventListener('click', e => {
  if (didDrag) { didDrag = false; return; }
  const { x, y } = canvasPos(e);
  const hit = nodeAt(x, y);

  if (state.mode === 'node') {
    if (!hit) addNode(x, y);
    return;
  }
  if (state.mode === 'start') {
    if (hit) { state.startNode = hit.id; draw(); log(`Start → ${labelOf(hit.id)}`); }
    return;
  }
  if (state.mode === 'end') {
    if (hit) { state.endNode = hit.id; draw(); log(`End → ${labelOf(hit.id)}`); }
    return;
  }
  if (state.mode === 'delete') {
    if (hit) { removeNode(hit.id); draw(); log(`Deleted ${labelOf(hit.id)}`); }
    else {
      // delete edge near click
      const ei = nearestEdgeIndex(x, y, 12);
      if (ei >= 0) { state.edges.splice(ei,1); draw(); log('Edge deleted'); }
    }
    return;
  }
  if (state.mode === 'edge') {
    if (!hit) { state.edgeFrom = null; draw(); return; }
    if (state.edgeFrom === null) {
      state.edgeFrom = hit.id;
      log(`Edge from ${labelOf(hit.id)} — click target node`);
      draw();
    } else {
      if (hit.id !== state.edgeFrom) {
        addEdge(state.edgeFrom, hit.id);
        log(`Edge ${labelOf(state.edgeFrom)} → ${labelOf(hit.id)}`);
      }
      state.edgeFrom = null;
      draw();
    }
    return;
  }
});

function canvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function nearestEdgeIndex(px, py, threshold) {
  let best = -1, bestD = threshold;
  state.edges.forEach((e, i) => {
    const a = state.nodes.find(n => n.id === e.from);
    const b = state.nodes.find(n => n.id === e.to);
    if (!a || !b) return;
    const d = pointLineSegDist(px, py, a.x, a.y, b.x, b.y);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

function pointLineSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2-x1, dy = y2-y1;
  const lenSq = dx*dx + dy*dy;
  if (lenSq === 0) return Math.hypot(px-x1, py-y1);
  const t = Math.max(0, Math.min(1, ((px-x1)*dx + (py-y1)*dy) / lenSq));
  return Math.hypot(px - (x1+t*dx), py - (y1+t*dy));
}

// ═══════════════════════════════════════════════════════════════
//  UI CONTROLS
// ═══════════════════════════════════════════════════════════════
function hideHint() {
  document.getElementById('canvas-hint').style.opacity = '0';
}

// Algorithm buttons
document.querySelectorAll('.algo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.running) return;
    document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.algo = btn.dataset.algo;
    updateComplexity();
    resetVis();
    clearLog();
    log('Algorithm changed to ' + btn.textContent + '. Press Run.');
  });
});

// Mode buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.mode = btn.dataset.mode;
    state.edgeFrom = null;
    draw();
  });
});

// Directed toggle
document.getElementById('btn-undirected').addEventListener('click', () => {
  state.directed = false;
  document.getElementById('btn-undirected').classList.add('active');
  document.getElementById('btn-directed').classList.remove('active');
  resetVis(); clearLog(); log('Undirected graph mode.');
});
document.getElementById('btn-directed').addEventListener('click', () => {
  state.directed = true;
  document.getElementById('btn-directed').classList.add('active');
  document.getElementById('btn-undirected').classList.remove('active');
  resetVis(); clearLog(); log('Directed graph mode.');
});

// Speed
document.getElementById('speed').addEventListener('input', function() {
  state.speed = +this.value;
  document.getElementById('speed-label').textContent = this.value + 'ms';
});

// Run
document.getElementById('btn-run').addEventListener('click', async () => {
  if (state.running) return;
  if (state.nodes.length === 0) { log('No nodes. Load sample or add nodes.'); return; }
  if (state.startNode === null) { log('Set a start node first (Edit Mode → Set Start).'); return; }

  resetVis();
  clearLog();
  state.running = true;
  document.getElementById('btn-run').disabled = true;

  if (state.algo === 'bfs')      await runBFS();
  else if (state.algo === 'dfs') await runDFS();
  else                           await runDijkstra();

  state.running = false;
  document.getElementById('btn-run').disabled = false;
});

// Reset vis
document.getElementById('btn-reset-vis').addEventListener('click', () => {
  if (state.running) { state.running = false; }
  setTimeout(() => { resetVis(); clearLog(); log('Visualization reset. Press Run.'); }, 50);
});

// Clear graph
document.getElementById('btn-clear').addEventListener('click', () => {
  if (state.running) { state.running = false; }
  setTimeout(() => { clearGraph(); clearLog(); log('Graph cleared.'); draw(); }, 50);
});

// Sample
document.getElementById('btn-sample').addEventListener('click', () => {
  if (state.running) return;
  clearLog();
  loadSample();
});

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
updateComplexity();
