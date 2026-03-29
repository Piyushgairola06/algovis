
// UI management and DOM interactions

import { state, COMPLEXITY } from './state.js';
import { 
  addNode, addEdge, removeNode, labelOf, nodeAt, 
  nearestEdgeIndex, clearGraph, resetVisualization 
} from './graph.js';
import { initCanvas, resizeCanvas, draw, getCanvas } from './canvas.js';
import { runBFS, runDFS, runDijkstra } from './algorithms.js';
import { canvasPos } from './utils.js';

const logBox = document.getElementById('log-box');

export function log(msg, highlight = false) {
  const p = document.createElement('p');
  p.textContent = '> ' + msg;
  if (highlight) p.className = 'highlight';
  logBox.appendChild(p);
  logBox.scrollTop = logBox.scrollHeight;
  
  if (logBox.children.length > 40) {
    logBox.removeChild(logBox.firstChild);
  }
}

export function clearLog() {
  logBox.innerHTML = '';
}

export function updateStats(visited, pathLen, cost, time, status) {
  document.getElementById('stat-visited').textContent = visited ?? 0;
  document.getElementById('stat-path').textContent = pathLen ?? '—';
  document.getElementById('stat-cost').textContent = cost ?? '—';
  document.getElementById('stat-time').textContent = time != null ? time + 'ms' : '0ms';
  document.getElementById('stat-status').textContent = status ?? 'Ready';
}

export function updateComplexity() {
  const c = COMPLEXITY[state.algo];
  document.getElementById('cx-time').textContent = c.time;
  document.getElementById('cx-space').textContent = c.space;
  document.getElementById('cx-complete').textContent = c.complete;
  document.getElementById('cx-optimal').textContent = c.optimal;
}

function hideHint() {
  document.getElementById('canvas-hint').style.opacity = '0';
}

function resetVis() {
  resetVisualization();
  updateStats(0, null, null, 0, 'Ready');
  draw();
}

export function loadSample() {
  clearGraph();
  resetVis();
  
  const canvas = getCanvas();
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  
  const positions = [
    [cx, cy - 160],       // A 0
    [cx - 160, cy - 60],  // B 1
    [cx + 160, cy - 60],  // C 2
    [cx - 240, cy + 80],  // D 3
    [cx - 60, cy + 80],   // E 4
    [cx + 60, cy + 80],   // F 5
    [cx + 240, cy + 80],  // G 6
    [cx, cy + 200],       // H 7
  ];
  
  positions.forEach(([x, y]) => addNode(x, y));

  const edgePairs = [
    [0, 1], [0, 2], [1, 3], [1, 4], 
    [2, 5], [2, 6], [4, 5], [3, 7], 
    [5, 7], [6, 7]
  ];
  
  edgePairs.forEach(([a, b]) => addEdge(state.nodes[a].id, state.nodes[b].id));

  state.startNode = state.nodes[0].id;
  state.endNode = state.nodes[7].id;
  
  log('Sample graph loaded. Press Run.', true);
  draw();
}

export function setupEventListeners() {
  const canvas = getCanvas();
  const wrap = document.getElementById('canvas-wrap');
  
  // Canvas interaction state
  let dragging = null;
  let dragOffX = 0;
  let dragOffY = 0;
  let didDrag = false;

  // Window resize
  window.addEventListener('resize', () => {
    resizeCanvas(wrap);
    draw();
  });

  // Canvas mouse events
  canvas.addEventListener('mousedown', e => {
    const { x, y } = canvasPos(canvas, e);
    const hit = nodeAt(x, y);
    
    if (hit && state.mode !== 'delete' && state.mode !== 'start' && 
        state.mode !== 'end' && state.mode !== 'edge') {
      dragging = hit;
      dragOffX = x - hit.x;
      dragOffY = y - hit.y;
      didDrag = false;
    }
  });

  canvas.addEventListener('mousemove', e => {
    const { x, y } = canvasPos(canvas, e);
    state._mouseX = x;
    state._mouseY = y;
    
    if (dragging) {
      dragging.x = x - dragOffX;
      dragging.y = y - dragOffY;
      didDrag = true;
      draw();
      return;
    }
    
    if (state.edgeFrom !== null) {
      draw();
    }
  });

  canvas.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = null;
    }
  });

  canvas.addEventListener('click', e => {
    if (didDrag) {
      didDrag = false;
      return;
    }
    
    const { x, y } = canvasPos(canvas, e);
    const hit = nodeAt(x, y);

    if (state.mode === 'node') {
      if (!hit) {
        addNode(x, y);
        hideHint();
        draw();
      }
      return;
    }
    
    if (state.mode === 'start') {
      if (hit) {
        state.startNode = hit.id;
        draw();
        log(`Start → ${labelOf(hit.id)}`);
      }
      return;
    }
    
    if (state.mode === 'end') {
      if (hit) {
        state.endNode = hit.id;
        draw();
        log(`End → ${labelOf(hit.id)}`);
      }
      return;
    }
    
    if (state.mode === 'delete') {
      if (hit) {
        removeNode(hit.id);
        draw();
        log(`Deleted ${labelOf(hit.id)}`);
      } else {
        const ei = nearestEdgeIndex(x, y, 12);
        if (ei >= 0) {
          state.edges.splice(ei, 1);
          draw();
          log('Edge deleted');
        }
      }
      return;
    }
    
    if (state.mode === 'edge') {
      if (!hit) {
        state.edgeFrom = null;
        draw();
        return;
      }
      
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
    }
  });

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
    resetVis();
    clearLog();
    log('Undirected graph mode.');
  });

  document.getElementById('btn-directed').addEventListener('click', () => {
    state.directed = true;
    document.getElementById('btn-directed').classList.add('active');
    document.getElementById('btn-undirected').classList.remove('active');
    resetVis();
    clearLog();
    log('Directed graph mode.');
  });

  // Speed slider
  document.getElementById('speed').addEventListener('input', function() {
    state.speed = +this.value;
    document.getElementById('speed-label').textContent = this.value + 'ms';
  });

  // Run button
  document.getElementById('btn-run').addEventListener('click', async () => {
    if (state.running) return;
    
    if (state.nodes.length === 0) {
      log('No nodes. Load sample or add nodes.');
      return;
    }
    
    if (state.startNode === null) {
      log('Set a start node first (Edit Mode → Set Start).');
      return;
    }

    resetVis();
    clearLog();
    state.running = true;
    document.getElementById('btn-run').disabled = true;

    if (state.algo === 'bfs') {
      await runBFS();
    } else if (state.algo === 'dfs') {
      await runDFS();
    } else {
      await runDijkstra();
    }

    state.running = false;
    document.getElementById('btn-run').disabled = false;
  });

  // Reset visualization button
  document.getElementById('btn-reset-vis').addEventListener('click', () => {
    if (state.running) {
      state.running = false;
    }
    setTimeout(() => {
      resetVis();
      clearLog();
      log('Visualization reset. Press Run.');
    }, 50);
  });

  // Clear graph button
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (state.running) {
      state.running = false;
    }
    setTimeout(() => {
      clearGraph();
      resetVis();
      clearLog();
      log('Graph cleared.');
      draw();
    }, 50);
  });

  // Sample button
  document.getElementById('btn-sample').addEventListener('click', () => {
    if (state.running) return;
    clearLog();
    loadSample();
  });
}
