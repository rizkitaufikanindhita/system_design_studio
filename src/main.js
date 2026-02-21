import './style.css';
import { DiagramCanvas } from './canvas/DiagramCanvas.js';
import { Palette } from './palette/Palette.js';
import { PropertiesPanel } from './properties/PropertiesPanel.js';
import { Toolbar } from './toolbar/Toolbar.js';
import { loadDiagram } from './utils/storage.js';

// ====== Initialize ======
function init() {
  const canvasEl = document.getElementById('diagram-canvas');
  const wrapperEl = document.getElementById('canvas-wrapper');
  const toolbarEl = document.getElementById('toolbar');
  const paletteEl = document.getElementById('palette');
  const propsEl = document.getElementById('properties-panel');

  // Create diagram canvas
  const diagram = new DiagramCanvas(canvasEl, wrapperEl);

  // Create UI components
  const palette = new Palette(paletteEl, diagram);
  const properties = new PropertiesPanel(propsEl, diagram);
  const toolbar = new Toolbar(toolbarEl, diagram);

  // Hook up selection change to properties panel
  diagram.onSelectionChange = (node, conn, selectedNodes, selectedGroup) => {
    properties.update(node, conn, selectedNodes, selectedGroup);
  };

  // Load autosaved diagram if exists
  const saved = loadDiagram('autosave');
  if (saved && saved.nodes && saved.nodes.length > 0) {
    diagram.deserialize(saved, false);
  }

  // Autosave on change
  diagram.addChangeListener(() => {
    // Debounced autosave
    clearTimeout(diagram._autosaveTimer);
    diagram._autosaveTimer = setTimeout(() => {
      const data = diagram.serialize();
      try {
        localStorage.setItem('sysdesign_autosave', JSON.stringify(data));
      } catch (e) {
        // ignore
      }
    }, 1000);
  });

  // Expose for debugging
  window.__diagram = diagram;
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
