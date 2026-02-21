import { Node, resetIdCounter } from './Node.js';
import { Connection, resetConnIdCounter } from './Connection.js';
import { Group, resetGroupIdCounter } from './Group.js';
import { InteractionManager } from './InteractionManager.js';

export class DiagramCanvas {
  constructor(canvasEl, wrapperEl) {
    this.canvas = canvasEl;
    this.wrapper = wrapperEl;
    this.ctx = canvasEl.getContext('2d');
    this.nodes = [];
    this.connections = [];
    this.groups = [];

    // View transform
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;

    // Grid
    this.gridSize = 20;
    this.showGrid = true;

    // State — multi-select support
    this.selectedNodes = [];       // array of selected nodes
    this.selectedConnection = null;
    this.selectedGroup = null;
    this.hoveredNode = null;
    this.drawingConnection = null; // { fromNode, fromPort, toX, toY }
    this.selectionRect = null;     // { x1, y1, x2, y2 } in world coords

    // Callbacks
    this.onSelectionChange = null;
    this._changeListeners = [];

    // Interaction
    this.interaction = new InteractionManager(this);

    // History (undo/redo)
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;

    this._resize();
    this._observe();
    this._saveHistory();

    requestAnimationFrame(() => this.render());
  }

  addChangeListener(fn) {
    this._changeListeners.push(fn);
  }

  _notifyDiagramChange() {
    for (const fn of this._changeListeners) {
      if (typeof fn === 'function') fn();
    }
  }

  _resize() {
    const rect = this.wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.viewWidth = rect.width;
    this.viewHeight = rect.height;
  }

  _observe() {
    const ro = new ResizeObserver(() => { this._resize(); this.render(); });
    ro.observe(this.wrapper);
  }

  // ====== World <-> Screen transforms ======
  screenToWorld(sx, sy) {
    return {
      x: (sx - this.offsetX) / this.scale,
      y: (sy - this.offsetY) / this.scale,
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: wx * this.scale + this.offsetX,
      y: wy * this.scale + this.offsetY,
    };
  }

  // ====== Backward compat: selectedNode getter ======
  get selectedNode() {
    return this.selectedNodes.length === 1 ? this.selectedNodes[0] : null;
  }

  // ====== Node operations ======
  addNode(type, label, worldX, worldY, color, description) {
    const node = new Node({ type, label, x: worldX, y: worldY, color, description });
    // Snap to grid
    node.moveTo(
      Math.round(node.x / this.gridSize) * this.gridSize,
      Math.round(node.y / this.gridSize) * this.gridSize
    );
    this.nodes.push(node);
    this.selectNode(node);
    this._saveHistory();
    this.render();
    return node;
  }

  removeNode(nodeId) {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.connections = this.connections.filter(
      c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId
    );
    this.selectedNodes = this.selectedNodes.filter(n => n.id !== nodeId);
    this._saveHistory();
    this._notifySelectionChange();
    this.render();
  }

  removeSelectedNodes() {
    const ids = new Set(this.selectedNodes.map(n => n.id));
    this.nodes = this.nodes.filter(n => !ids.has(n.id));
    this.connections = this.connections.filter(
      c => !ids.has(c.fromNodeId) && !ids.has(c.toNodeId)
    );
    this.selectedNodes = [];
    this._saveHistory();
    this._notifySelectionChange();
    this.render();
  }

  selectNode(node) {
    // Single-select: deselect everything else
    for (const n of this.selectedNodes) n.selected = false;
    if (this.selectedConnection) this.selectedConnection.selected = false;
    this.selectedNodes = [node];
    this.selectedConnection = null;
    node.selected = true;
    this._notifySelectionChange();
    this.render();
  }

  toggleNodeSelection(node) {
    // Ctrl+click: add or remove from selection
    if (this.selectedConnection) this.selectedConnection.selected = false;
    this.selectedConnection = null;
    const idx = this.selectedNodes.indexOf(node);
    if (idx >= 0) {
      this.selectedNodes.splice(idx, 1);
      node.selected = false;
    } else {
      this.selectedNodes.push(node);
      node.selected = true;
    }
    this._notifySelectionChange();
    this.render();
  }

  isNodeSelected(node) {
    return this.selectedNodes.includes(node);
  }

  selectConnection(conn) {
    for (const n of this.selectedNodes) n.selected = false;
    if (this.selectedConnection) this.selectedConnection.selected = false;
    this.selectedConnection = conn;
    this.selectedNodes = [];
    if (conn) conn.selected = true;
    this._notifySelectionChange();
    this.render();
  }

  clearSelection() {
    for (const n of this.selectedNodes) n.selected = false;
    if (this.selectedConnection) this.selectedConnection.selected = false;
    if (this.selectedGroup) this.selectedGroup.selected = false;
    this.selectedNodes = [];
    this.selectedConnection = null;
    this.selectedGroup = null;
    this._notifySelectionChange();
    this.render();
  }

  selectNodesInRect(x1, y1, x2, y2) {
    // Normalize rect
    const left = Math.min(x1, x2);
    const right = Math.max(x1, x2);
    const top = Math.min(y1, y2);
    const bottom = Math.max(y1, y2);

    for (const n of this.selectedNodes) n.selected = false;
    if (this.selectedConnection) this.selectedConnection.selected = false;
    this.selectedConnection = null;

    this.selectedNodes = this.nodes.filter(node => {
      // Node is inside if it overlaps with rect
      return node.x + node.width > left &&
             node.x < right &&
             node.y + node.height > top &&
             node.y < bottom;
    });

    for (const n of this.selectedNodes) n.selected = true;
    this._notifySelectionChange();
    this.render();
  }

  // ====== Connection operations ======
  addConnection(fromNodeId, fromPort, toNodeId, toPort, label) {
    // Prevent duplicate
    const exists = this.connections.find(
      c => c.fromNodeId === fromNodeId && c.toNodeId === toNodeId
    );
    if (exists || fromNodeId === toNodeId) return null;

    const conn = new Connection({ fromNodeId, fromPort, toNodeId, toPort, label });
    this.connections.push(conn);
    this.selectConnection(conn);
    this._saveHistory();
    this.render();
    return conn;
  }

  removeConnection(connId) {
    this.connections = this.connections.filter(c => c.id !== connId);
    if (this.selectedConnection && this.selectedConnection.id === connId) {
      this.selectedConnection = null;
    }
    this._saveHistory();
    this._notifySelectionChange();
    this.render();
  }

  // ====== Group operations ======
  addGroup(type, worldX, worldY) {
    const group = new Group({ type, x: worldX, y: worldY });
    this.groups.push(group);
    this.selectGroup(group);
    this._saveHistory();
    this.render();
    return group;
  }

  removeGroup(groupId) {
    this.groups = this.groups.filter(g => g.id !== groupId);
    this._saveHistory();
    this._notifySelectionChange();
    this.render();
  }

  getGroupAt(worldX, worldY) {
    // Reverse order so topmost group is found first
    for (let i = this.groups.length - 1; i >= 0; i--) {
      if (this.groups[i].containsPoint(worldX, worldY)) {
        return this.groups[i];
      }
    }
    return null;
  }

  selectGroup(group) {
    // Deselect everything else
    for (const n of this.nodes) n.selected = false;
    this.selectedNodes = [];
    this.selectedConnection = null;
    for (const g of this.groups) g.selected = false;
    // Select this group
    if (group) group.selected = true;
    this.selectedGroup = group;
    this._notifySelectionChange();
  }

  // ====== Zoom ======
  zoomTo(newScale, centerX, centerY) {
    const prevScale = this.scale;
    this.scale = Math.max(0.2, Math.min(3, newScale));
    // Zoom toward cursor
    if (centerX !== undefined) {
      this.offsetX = centerX - (centerX - this.offsetX) * (this.scale / prevScale);
      this.offsetY = centerY - (centerY - this.offsetY) * (this.scale / prevScale);
    }
    this.render();
  }

  zoomIn() { this.zoomTo(this.scale * 1.15, this.viewWidth / 2, this.viewHeight / 2); }
  zoomOut() { this.zoomTo(this.scale / 1.15, this.viewWidth / 2, this.viewHeight / 2); }
  zoomReset() { this.scale = 1; this.offsetX = 0; this.offsetY = 0; this.render(); }

  // ====== History ======
  _saveHistory() {
    const state = this.serialize();
    // Trim future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(state);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIndex = this.history.length - 1;
    this._notifyDiagramChange();
  }

  undo() {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this._restoreFromHistory();
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    this._restoreFromHistory();
  }

  _restoreFromHistory() {
    const state = this.history[this.historyIndex];
    if (!state) return;
    this.deserialize(state, false);
    this._notifySelectionChange();
    this.render();
    this._notifyDiagramChange();
  }

  // ====== Serialization ======
  serialize() {
    return {
      nodes: this.nodes.map(n => n.toJSON()),
      connections: this.connections.map(c => c.toJSON()),
      groups: this.groups.map(g => g.toJSON()),
    };
  }

  deserialize(data, saveHistory = true) {
    if (!data) return;
    this.nodes = (data.nodes || []).map(d => Node.fromJSON(d));
    this.connections = (data.connections || []).map(d => Connection.fromJSON(d));
    this.groups = (data.groups || []).map(d => Group.fromJSON(d));
    this.selectedNodes = [];
    this.selectedConnection = null;

    // Reset ID counters based on existing IDs
    let maxNodeId = 0;
    let maxConnId = 0;
    for (const n of this.nodes) {
      const num = parseInt(n.id.replace('node_', '')) || 0;
      if (num > maxNodeId) maxNodeId = num;
    }
    for (const c of this.connections) {
      const num = parseInt(c.id.replace('conn_', '')) || 0;
      if (num > maxConnId) maxConnId = num;
    }
    resetIdCounter(maxNodeId);
    resetConnIdCounter(maxConnId);

    // Reset group ID counter
    let maxGroupId = 0;
    for (const g of this.groups) {
      const num = parseInt(g.id.replace('group_', '')) || 0;
      if (num > maxGroupId) maxGroupId = num;
    }
    resetGroupIdCounter(maxGroupId);

    if (saveHistory) this._saveHistory();
    this._notifySelectionChange();
    this.render();
  }

  clear() {
    this.nodes = [];
    this.connections = [];
    this.groups = [];
    this.selectedNodes = [];
    this.selectedConnection = null;
    this._saveHistory();
    this._notifySelectionChange();
    this.render();
  }

  // ====== Notifications ======
  _notifySelectionChange() {
    if (this.onSelectionChange) {
      // Pass first selected node (or null), connection, full array, and group
      this.onSelectionChange(
        this.selectedNodes.length === 1 ? this.selectedNodes[0] : null,
        this.selectedConnection,
        this.selectedNodes,
        this.selectedGroup || null
      );
    }
  }

  // ====== Hit testing ======
  getNodeAt(worldX, worldY) {
    // Iterate in reverse (top-most node first)
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      if (this.nodes[i].containsPoint(worldX, worldY)) {
        return this.nodes[i];
      }
    }
    return null;
  }

  getConnectionAt(worldX, worldY) {
    for (let i = this.connections.length - 1; i >= 0; i--) {
      if (this.connections[i].hitTest(worldX, worldY, this.nodes)) {
        return this.connections[i];
      }
    }
    return null;
  }

  getNodePortAt(worldX, worldY) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const port = this.nodes[i].getPortAt(worldX, worldY);
      if (port) return { node: this.nodes[i], port };
    }
    return null;
  }

  // ====== Rendering ======
  render() {
    const ctx = this.ctx;
    const w = this.viewWidth;
    const h = this.viewHeight;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    ctx.fillStyle = isDark ? '#0f1117' : '#f8f9fc';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Grid
    if (this.showGrid) this._drawGrid(ctx, w, h);

    // Groups (rendered first, behind everything)
    for (const group of this.groups) {
      group.draw(ctx);
    }

    // Connections
    for (const conn of this.connections) {
      conn.draw(ctx, this.nodes);
    }

    // Drawing connection (in progress)
    if (this.drawingConnection) {
      this._drawTempConnection(ctx);
    }

    // Nodes
    for (const node of this.nodes) {
      node.draw(ctx, this.scale);
    }

    // Selection rectangle
    if (this.selectionRect) {
      this._drawSelectionRect(ctx);
    }

    ctx.restore();

    // Update zoom display
    const zoomEl = document.getElementById('zoom-level');
    if (zoomEl) zoomEl.textContent = Math.round(this.scale * 100) + '%';
  }

  _drawGrid(ctx, w, h) {
    const gridSize = this.gridSize;
    const startX = Math.floor(-this.offsetX / this.scale / gridSize) * gridSize;
    const startY = Math.floor(-this.offsetY / this.scale / gridSize) * gridSize;
    const endX = startX + w / this.scale + gridSize * 2;
    const endY = startY + h / this.scale + gridSize * 2;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 0.5 / this.scale;

    ctx.beginPath();
    for (let x = startX; x < endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  _drawSelectionRect(ctx) {
    const sr = this.selectionRect;
    const x = Math.min(sr.x1, sr.x2);
    const y = Math.min(sr.y1, sr.y2);
    const w = Math.abs(sr.x2 - sr.x1);
    const h = Math.abs(sr.y2 - sr.y1);

    ctx.save();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1.5 / this.scale;
    ctx.setLineDash([6 / this.scale, 3 / this.scale]);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawTempConnection(ctx) {
    const dc = this.drawingConnection;
    const from = dc.fromNode.ports[dc.fromPort];

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);

    const dx = Math.abs(dc.toX - from.x) * 0.5;
    let cp1x, cp1y;
    if (dc.fromPort === 'right') { cp1x = from.x + Math.max(dx, 40); cp1y = from.y; }
    else if (dc.fromPort === 'left') { cp1x = from.x - Math.max(dx, 40); cp1y = from.y; }
    else if (dc.fromPort === 'bottom') { cp1x = from.x; cp1y = from.y + 40; }
    else { cp1x = from.x; cp1y = from.y - 40; }

    ctx.quadraticCurveTo(cp1x, cp1y, dc.toX, dc.toY);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // End circle
    ctx.beginPath();
    ctx.arc(dc.toX, dc.toY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#818cf8';
    ctx.fill();
    ctx.restore();
  }
}
