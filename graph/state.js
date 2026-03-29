
// Application state management

export const state = {
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
  
  // Visual state
  visitedNodes: new Set(),
  frontierNodes: new Set(),
  pathNodes: new Set(),
  activeEdges: new Set(),   // "from-to" strings
  pathEdges: new Set(),
  
  // Mouse tracking
  _mouseX: undefined,
  _mouseY: undefined,
};

export let nodeCounter = 0;

export function incrementNodeCounter() {
  return nodeCounter++;
}

export function resetNodeCounter() {
  nodeCounter = 0;
}

// Complexity data for each algorithm
export const COMPLEXITY = {
  bfs:      { time: 'O(V+E)', space: 'O(V)', complete: 'Yes', optimal: 'Yes (unweighted)' },
  dfs:      { time: 'O(V+E)', space: 'O(V)', complete: 'Yes', optimal: 'No' },
  dijkstra: { time: 'O((V+E)logV)', space: 'O(V)', complete: 'Yes', optimal: 'Yes' },
};
