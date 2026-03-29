
// Canvas rendering

import { state } from './state.js';
import { NODE_R } from './graph.js';
import { edgeKey } from './utils.js';

let canvas, ctx;

export function initCanvas() {
  canvas = document.getElementById('graph-canvas');
  ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

export function resizeCanvas(wrap) {
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
}

export function getCanvas() {
  return canvas;
}

function nodeColor(id) {
  if (id === state.startNode) return '#e8e8e8';
  if (id === state.endNode) return '#ff6b6b';
  if (state.pathNodes.has(id)) return '#06d6a0';
  if (state.visitedNodes.has(id)) return '#4a9eff';
  if (state.frontierNodes.has(id)) return '#ffd166';
  return '#1e1e1e';
}

function nodeBorderColor(id) {
  if (id === state.startNode) return '#ffffff';
  if (id === state.endNode) return '#ff6b6b';
  if (state.pathNodes.has(id)) return '#06d6a0';
  if (state.visitedNodes.has(id)) return '#4a9eff';
  if (state.frontierNodes.has(id)) return '#ffd166';
  if (state.edgeFrom === id) return '#ffd166';
  return '#444';
}

function nodeTextColor(id) {
  if (id === state.startNode) return '#0d0d0d';
  if (state.pathNodes.has(id)) return '#0d0d0d';
  return '#e8e8e8';
}

function edgeColor(from, to) {
  const k1 = edgeKey(from, to);
  const k2 = edgeKey(to, from);
  if (state.pathEdges.has(k1) || state.pathEdges.has(k2)) return '#06d6a0';
  if (state.activeEdges.has(k1) || state.activeEdges.has(k2)) return '#4a9eff';
  return '#2a2a2a';
}

function edgeWidth(from, to) {
  const k1 = edgeKey(from, to);
  const k2 = edgeKey(to, from);
  if (state.pathEdges.has(k1) || state.pathEdges.has(k2)) return 2.5;
  if (state.activeEdges.has(k1) || state.activeEdges.has(k2)) return 1.5;
  return 1;
}

function drawArrow(x1, y1, x2, y2, color, lw) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return;
  
  const ux = dx / len;
  const uy = dy / len;
  const ex = x2 - ux * NODE_R;
  const ey = y2 - uy * NODE_R;
  const sx = x1 + ux * NODE_R;
  const sy = y1 + uy * NODE_R;
  const headLen = 10;
  const headAng = Math.PI / 6;
  const ang = Math.atan2(ey - sy, ex - sx);

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - headLen * Math.cos(ang - headAng), ey - headLen * Math.sin(ang - headAng));
  ctx.lineTo(ex - headLen * Math.cos(ang + headAng), ey - headLen * Math.sin(ang + headAng));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  for (const e of state.edges) {
    const a = state.nodes.find(n => n.id === e.from);
    const b = state.nodes.find(n => n.id === e.to);
    if (!a || !b) continue;
    
    const col = edgeColor(e.from, e.to);
    const lw = edgeWidth(e.from, e.to);

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
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
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
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Draw nodes
  for (const n of state.nodes) {
    const bg = nodeColor(n.id);
    const border = nodeBorderColor(n.id);
    const txt = nodeTextColor(n.id);

    ctx.beginPath();
    ctx.arc(n.x, n.y, NODE_R, 0, Math.PI * 2);
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
