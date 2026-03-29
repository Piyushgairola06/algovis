
// Graph operations

import { state, incrementNodeCounter, resetNodeCounter } from './state.js';
import { edgeKey, pointLineSegDist } from './utils.js';

export const NODE_R = 20;

export function nodeAt(x, y) {
  return state.nodes.find(n => {
    const dx = n.x - x;
    const dy = n.y - y;
    return Math.sqrt(dx * dx + dy * dy) <= NODE_R;
  });
}

export function addNode(x, y) {
  const id = incrementNodeCounter();
  const label = String.fromCharCode(65 + (id % 26)); // A-Z cycling
  state.nodes.push({ id, x, y, label });
  return { id, label };
}

export function addEdge(from, to) {
  if (from === to) return false;
  
  const exists = state.edges.some(e =>
    (e.from === from && e.to === to) ||
    (!state.directed && e.from === to && e.to === from)
  );
  
  if (exists) return false;
  
  const weight = Math.floor(Math.random() * 9) + 1;
  state.edges.push({ from, to, weight });
  return true;
}

export function removeNode(id) {
  state.nodes = state.nodes.filter(n => n.id !== id);
  state.edges = state.edges.filter(e => e.from !== id && e.to !== id);
  
  if (state.startNode === id) state.startNode = null;
  if (state.endNode === id) state.endNode = null;
}

export function getNeighbors(id) {
  const result = [];
  
  for (const e of state.edges) {
    if (e.from === id) {
      result.push({ id: e.to, weight: e.weight, edgeFrom: e.from, edgeTo: e.to });
    }
    if (!state.directed && e.to === id) {
      result.push({ id: e.from, weight: e.weight, edgeFrom: e.to, edgeTo: e.from });
    }
  }
  
  return result;
}

export function labelOf(id) {
  const node = state.nodes.find(n => n.id === id);
  return node ? node.label : '?';
}

export function nearestEdgeIndex(px, py, threshold) {
  let best = -1;
  let bestD = threshold;
  
  state.edges.forEach((e, i) => {
    const a = state.nodes.find(n => n.id === e.from);
    const b = state.nodes.find(n => n.id === e.to);
    if (!a || !b) return;
    
    const d = pointLineSegDist(px, py, a.x, a.y, b.x, b.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  
  return best;
}

export function clearGraph() {
  state.nodes = [];
  state.edges = [];
  state.startNode = null;
  state.endNode = null;
  state.edgeFrom = null;
  resetNodeCounter();
}

export function resetVisualization() {
  state.visitedNodes.clear();
  state.frontierNodes.clear();
  state.pathNodes.clear();
  state.activeEdges.clear();
  state.pathEdges.clear();
  state.running = false;
}

