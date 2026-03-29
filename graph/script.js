// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════
const state = {
  nodes: [],
  edges: [],
  startNode: null,
  endNode: null,
  mode: 'node',
  algo: 'bfs',
  directed: false,
  speed: 50,
  running: false,
  edgeFrom: null,
  visitedNodes: new Set(),
  frontierNodes: new Set(),
  pathNodes: new Set(),
  activeEdges: new Set(),
  pathEdges: new Set(),
};

let nodeCounter = 0;

/* NOW PASTE YOUR FULL JS CODE BELOW (UNCHANGED) */
