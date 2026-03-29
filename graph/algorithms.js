
// Graph traversal algorithms

import { state } from './state.js';
import { getNeighbors, labelOf } from './graph.js';
import { sleep, edgeKey } from './utils.js';
import { draw } from './canvas.js';
import { log, updateStats } from './ui.js';

export async function runBFS() {
  const src = state.startNode;
  const dst = state.endNode;
  const parent = {};
  const visited = new Set();
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
    updateStats(visitedCount, null, null, Math.round(performance.now() - t0), 'Running');
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

  // Reconstruct path
  if (dst !== null && state.visitedNodes.has(dst)) {
    let cur = dst;
    const path = [];
    
    while (cur !== undefined) {
      path.unshift(cur);
      cur = parent[cur];
    }
    
    for (let i = 0; i < path.length; i++) {
      state.pathNodes.add(path[i]);
      if (i > 0) {
        state.pathEdges.add(edgeKey(path[i - 1], path[i]));
        state.pathEdges.add(edgeKey(path[i], path[i - 1]));
      }
    }
    
    const elapsed = Math.round(performance.now() - t0);
    log(`Path: ${path.map(labelOf).join(' → ')}`, true);
    updateStats(visitedCount, path.length - 1, path.length - 1, elapsed, 'Done');
  } else if (dst !== null) {
    log('No path found.', true);
    updateStats(visitedCount, null, null, Math.round(performance.now() - t0), 'No path');
  } else {
    updateStats(visitedCount, null, null, Math.round(performance.now() - t0), 'Done');
  }
  
  draw();
}

export async function runDFS() {
  const src = state.startNode;
  const dst = state.endNode;
  const parent = {};
  const visited = new Set();
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
    updateStats(visitedCount, null, null, Math.round(performance.now() - t0), 'Running');
    draw();
    await sleep(state.speed);

    if (curr === dst) {
      found = true;
      break;
    }

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
    let cur = dst;
    const path = [];
    
    while (cur !== undefined) {
      path.unshift(cur);
      cur = parent[cur];
    }
    
    for (let i = 0; i < path.length; i++) {
      state.pathNodes.add(path[i]);
      if (i > 0) {
        state.pathEdges.add(edgeKey(path[i - 1], path[i]));
        state.pathEdges.add(edgeKey(path[i], path[i - 1]));
      }
    }
    
    log(`Path: ${path.map(labelOf).join(' → ')}`, true);
    updateStats(visitedCount, path.length - 1, path.length - 1, Math.round(performance.now() - t0), 'Done');
  } else if (dst !== null) {
    log('No path found.', true);
    updateStats(visitedCount, null, null, Math.round(performance.now() - t0), 'No path');
  } else {
    updateStats(visitedCount, null, null, Math.round(performance.now() - t0), 'Done');
  }
  
  draw();
}

export async function runDijkstra() {
  const src = state.startNode;
  const dst = state.endNode;
  const dist = {};
  const parent = {};
  const visited = new Set();
  
  for (const n of state.nodes) {
    dist[n.id] = Infinity;
  }
  dist[src] = 0;
  
  // Simple min-priority queue via array
  const pq = [{ id: src, d: 0 }];
  const t0 = performance.now();
  let visitedCount = 0;

  log(`Dijkstra from ${labelOf(src)}${dst !== null ? ' → ' + labelOf(dst) : ''}`, true);

  while (pq.length && state.running) {
    pq.sort((a, b) => a.d - b.d);
    const { id: curr, d: currDist } = pq.shift();
    
    if (visited.has(curr)) continue;
    
    visited.add(curr);
    state.visitedNodes.add(curr);
    state.frontierNodes.delete(curr);
    visitedCount++;
    
    log(`Visit ${labelOf(curr)}  dist=${currDist}`);
    updateStats(visitedCount, null, null, Math.round(performance.now() - t0), 'Running');
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
    let cur = dst;
    const path = [];
    
    while (cur !== undefined) {
      path.unshift(cur);
      cur = parent[cur];
    }
    
    for (let i = 0; i < path.length; i++) {
      state.pathNodes.add(path[i]);
      if (i > 0) {
        state.pathEdges.add(edgeKey(path[i - 1], path[i]));
        state.pathEdges.add(edgeKey(path[i], path[i - 1]));
      }
    }
    
    log(`Path: ${path.map(labelOf).join(' → ')}  cost=${dist[dst]}`, true);
    updateStats(visitedCount, path.length - 1, dist[dst], Math.round(performance.now() - t0), 'Done');
  } else if (dst !== null) {
    log('No path found.', true);
    updateStats(visitedCount, null, null, Math.round(performance.now() - t0), 'No path');
  } else {
    updateStats(visitedCount, null, null, Math.round(performance.now() - t0), 'Done');
  }
  
  draw();
}
