
// Application entry point

import { initCanvas, resizeCanvas, draw } from './canvas.js';
import { setupEventListeners, updateComplexity } from './ui.js';

function init() {
  // Initialize canvas
  const { canvas } = initCanvas();
  const wrap = document.getElementById('canvas-wrap');
  
  // Initial resize
  resizeCanvas(wrap);
  
  // Setup all event listeners
  setupEventListeners();
  
  // Initialize complexity display
  updateComplexity();
  
  // Initial draw
  draw();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
