export class InteractionManager {
  constructor(diagram) {
    this.diagram = diagram;
    this.canvas = diagram.canvas;
    this.isPanning = false;
    this.isDraggingNode = false;
    this.isDraggingMulti = false;
    this.isDraggingGroup = false;
    this.isResizingGroup = false;
    this.isDrawingConnection = false;
    this.isSelecting = false;
    this.dragOffset = { x: 0, y: 0 };
    this.multiDragOffsets = [];  // [{ node, dx, dy }]
    this.lastMouse = { x: 0, y: 0 };
    this.clipboard = null;
    this.clipboardMulti = null; // array for multi-copy
    this.spaceHeld = false;

    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this._onWheel.bind(this), { passive: false });
    this.canvas.addEventListener('dblclick', this._onDblClick.bind(this));
    window.addEventListener('keydown', this._onKeyDown.bind(this));
    window.addEventListener('keyup', this._onKeyUp.bind(this));
  }

  _getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  _onMouseDown(e) {
    const pos = this._getMousePos(e);
    const world = this.diagram.screenToWorld(pos.x, pos.y);

    // Middle button or Space held: pan
    if (e.button === 1 || (e.button === 0 && this.spaceHeld)) {
      this.isPanning = true;
      this.lastMouse = pos;
      this.canvas.style.cursor = 'grabbing';
      e.preventDefault();
      return;
    }

    if (e.button !== 0) return;

    // Check if clicking on a port of a selected node
    const portHit = this.diagram.getNodePortAt(world.x, world.y);
    if (portHit && portHit.node.selected) {
      this.isDrawingConnection = true;
      this.diagram.drawingConnection = {
        fromNode: portHit.node,
        fromPort: portHit.port,
        toX: world.x,
        toY: world.y,
      };
      this.canvas.style.cursor = 'crosshair';
      return;
    }

    // Check if clicking on a node
    const node = this.diagram.getNodeAt(world.x, world.y);
    if (node) {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+click: toggle selection
        this.diagram.toggleNodeSelection(node);
        return;
      }

      if (this.diagram.isNodeSelected(node) && this.diagram.selectedNodes.length > 1) {
        // Clicking on an already-selected node in a multi-selection: start multi-drag
        this.isDraggingMulti = true;
        this.multiDragOffsets = this.diagram.selectedNodes.map(n => ({
          node: n,
          dx: world.x - n.x,
          dy: world.y - n.y,
        }));
        this.canvas.style.cursor = 'grabbing';
        return;
      }

      // Single click: select just this node & start drag
      this.isDraggingNode = true;
      this.dragOffset = { x: world.x - node.x, y: world.y - node.y };
      this.diagram.selectNode(node);
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // Check if clicking on a connection
    const conn = this.diagram.getConnectionAt(world.x, world.y);
    if (conn) {
      this.diagram.selectConnection(conn);
      return;
    }

    // Check if clicking on a group
    const group = this.diagram.getGroupAt(world.x, world.y);
    if (group) {
      // Check resize handle first
      if (group.selected) {
        const handle = group.getResizeHandleAt(world.x, world.y);
        if (handle) {
          this.isResizingGroup = true;
          this._resizeHandle = handle;
          this.lastMouse = { x: world.x, y: world.y };
          this.canvas.style.cursor = 'nwse-resize';
          return;
        }
      }
      this.diagram.selectGroup(group);
      this.isDraggingGroup = true;
      this.dragOffset = { x: world.x - group.x, y: world.y - group.y };
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // Click on empty space: start rubber band selection
    this.diagram.clearSelection();
    if (this.diagram.selectedGroup) {
      this.diagram.selectedGroup.selected = false;
      this.diagram.selectedGroup = null;
    }
    this.isSelecting = true;
    this.diagram.selectionRect = { x1: world.x, y1: world.y, x2: world.x, y2: world.y };
    this.canvas.style.cursor = 'crosshair';
  }

  _onMouseMove(e) {
    const pos = this._getMousePos(e);
    const world = this.diagram.screenToWorld(pos.x, pos.y);

    if (this.isPanning) {
      const dx = pos.x - this.lastMouse.x;
      const dy = pos.y - this.lastMouse.y;
      this.diagram.offsetX += dx;
      this.diagram.offsetY += dy;
      this.lastMouse = pos;
      this.diagram.render();
      return;
    }

    if (this.isDraggingNode && this.diagram.selectedNode) {
      const gridSize = this.diagram.gridSize;
      const newX = Math.round((world.x - this.dragOffset.x) / gridSize) * gridSize;
      const newY = Math.round((world.y - this.dragOffset.y) / gridSize) * gridSize;
      this.diagram.selectedNode.moveTo(newX, newY);
      this.diagram.render();
      return;
    }

    if (this.isDraggingMulti) {
      const gridSize = this.diagram.gridSize;
      for (const item of this.multiDragOffsets) {
        const newX = Math.round((world.x - item.dx) / gridSize) * gridSize;
        const newY = Math.round((world.y - item.dy) / gridSize) * gridSize;
        item.node.moveTo(newX, newY);
      }
      this.diagram.render();
      return;
    }

    if (this.isDraggingGroup && this.diagram.selectedGroup) {
      const gridSize = this.diagram.gridSize;
      const group = this.diagram.selectedGroup;
      const newX = Math.round((world.x - this.dragOffset.x) / gridSize) * gridSize;
      const newY = Math.round((world.y - this.dragOffset.y) / gridSize) * gridSize;
      const dx = newX - group.x;
      const dy = newY - group.y;
      group.moveWithChildren(dx, dy, this.diagram.nodes);
      this.diagram.render();
      return;
    }

    if (this.isResizingGroup && this.diagram.selectedGroup) {
      const group = this.diagram.selectedGroup;
      const dx = world.x - this.lastMouse.x;
      const dy = world.y - this.lastMouse.y;
      group.width = Math.max(200, group.width + dx);
      group.height = Math.max(150, group.height + dy);
      this.lastMouse = { x: world.x, y: world.y };
      this.diagram.render();
      return;
    }

    if (this.isDrawingConnection && this.diagram.drawingConnection) {
      this.diagram.drawingConnection.toX = world.x;
      this.diagram.drawingConnection.toY = world.y;
      this.diagram.render();
      return;
    }

    if (this.isSelecting && this.diagram.selectionRect) {
      this.diagram.selectionRect.x2 = world.x;
      this.diagram.selectionRect.y2 = world.y;
      this.diagram.render();
      return;
    }

    // Hover cursor
    if (this.spaceHeld) {
      this.canvas.style.cursor = 'grab';
      return;
    }
    const portHit2 = this.diagram.getNodePortAt(world.x, world.y);
    if (portHit2) {
      this.canvas.style.cursor = 'crosshair';
      return;
    }
    const nodeHit = this.diagram.getNodeAt(world.x, world.y);
    this.canvas.style.cursor = nodeHit ? 'grab' : 'default';
  }

  _onMouseUp(e) {
    const pos = this._getMousePos(e);
    const world = this.diagram.screenToWorld(pos.x, pos.y);

    if (this.isDraggingNode) {
      this.isDraggingNode = false;
      // Check if node was dropped into a group
      const draggedNode = this.diagram.selectedNode;
      if (draggedNode) {
        for (const group of this.diagram.groups) {
          if (group.containsNode(draggedNode)) {
            group.addNode(draggedNode.id);
          } else {
            group.removeNode(draggedNode.id);
          }
        }
      }
      this.diagram._saveHistory();
      this.canvas.style.cursor = 'grab';
    }

    if (this.isDraggingMulti) {
      this.isDraggingMulti = false;
      this.multiDragOffsets = [];
      this.diagram._saveHistory();
      this.canvas.style.cursor = 'grab';
    }

    if (this.isDraggingGroup) {
      this.isDraggingGroup = false;
      this.diagram._saveHistory();
      this.canvas.style.cursor = 'grab';
    }

    if (this.isResizingGroup) {
      this.isResizingGroup = false;
      this._resizeHandle = null;
      this.diagram._saveHistory();
      this.canvas.style.cursor = 'default';
    }

    if (this.isDrawingConnection && this.diagram.drawingConnection) {
      const dc = this.diagram.drawingConnection;
      const targetNode = this.diagram.getNodeAt(world.x, world.y);
      if (targetNode && targetNode.id !== dc.fromNode.id) {
        const toPort = targetNode.getNearestPort(world.x, world.y);
        this.diagram.addConnection(dc.fromNode.id, dc.fromPort, targetNode.id, toPort);
      }
      this.diagram.drawingConnection = null;
      this.isDrawingConnection = false;
      this.canvas.style.cursor = 'default';
      this.diagram.render();
    }

    if (this.isSelecting) {
      const sr = this.diagram.selectionRect;
      if (sr) {
        // Only select if the rect has some size (not just a click)
        const dx = Math.abs(sr.x2 - sr.x1);
        const dy = Math.abs(sr.y2 - sr.y1);
        if (dx > 5 || dy > 5) {
          this.diagram.selectNodesInRect(sr.x1, sr.y1, sr.x2, sr.y2);
        }
      }
      this.diagram.selectionRect = null;
      this.isSelecting = false;
      this.canvas.style.cursor = 'default';
      this.diagram.render();
    }

    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = this.spaceHeld ? 'grab' : 'default';
    }
  }

  _onWheel(e) {
    e.preventDefault();
    const pos = this._getMousePos(e);
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    this.diagram.zoomTo(this.diagram.scale * delta, pos.x, pos.y);
  }

  _onDblClick(e) {
    const pos = this._getMousePos(e);
    const world = this.diagram.screenToWorld(pos.x, pos.y);
    const node = this.diagram.getNodeAt(world.x, world.y);
    if (node) {
      const labelInput = document.querySelector('#prop-label');
      if (labelInput) {
        labelInput.focus();
        labelInput.select();
      }
    }
  }

  _onKeyDown(e) {
    if (e.key === ' ' || e.code === 'Space') {
      if (!e.target.matches('input, textarea, select')) {
        e.preventDefault();
        this.spaceHeld = true;
        this.canvas.style.cursor = 'grab';
      }
    }

    const isInput = e.target.matches('input, textarea, select');

    // Delete / Backspace
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
      if (this.diagram.selectedNodes.length > 0) {
        this.diagram.removeSelectedNodes();
      } else if (this.diagram.selectedConnection) {
        this.diagram.removeConnection(this.diagram.selectedConnection.id);
      } else if (this.diagram.selectedGroup) {
        this.diagram.removeGroup(this.diagram.selectedGroup.id);
        this.diagram.selectedGroup = null;
      }
    }

    // Ctrl+A select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !isInput) {
      e.preventDefault();
      for (const n of this.diagram.selectedNodes) n.selected = false;
      this.diagram.selectedNodes = [...this.diagram.nodes];
      for (const n of this.diagram.selectedNodes) n.selected = true;
      this.diagram._notifySelectionChange();
      this.diagram.render();
    }

    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      // Undo
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); this.diagram.undo(); }
      // Redo
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); this.diagram.redo(); }

      // Copy (Ctrl+C)
      if (e.key === 'c' && !isInput && this.diagram.selectedNodes.length > 0) {
        e.preventDefault();
        this.clipboardMulti = this.diagram.selectedNodes.map(n => ({
          type: n.type,
          label: n.label,
          color: n.color,
          description: n.description,
          x: n.x,
          y: n.y,
        }));
        const count = this.clipboardMulti.length;
        this._toast(`Copied ${count} node${count > 1 ? 's' : ''}`);
      }

      // Paste (Ctrl+V)
      if (e.key === 'v' && !isInput && this.clipboardMulti && this.clipboardMulti.length > 0) {
        e.preventDefault();
        const offset = 40;
        // Deselect current
        for (const n of this.diagram.selectedNodes) n.selected = false;
        this.diagram.selectedNodes = [];

        for (const item of this.clipboardMulti) {
          const newNode = this.diagram.addNode(
            item.type, item.label,
            item.x + offset, item.y + offset,
            item.color, item.description
          );
          // addNode does selectNode, but we want multi-select
          newNode.selected = true;
          this.diagram.selectedNodes.push(newNode);
          item.x += offset;
          item.y += offset;
        }
        this.diagram._notifySelectionChange();
        this.diagram.render();
        this._toast(`Pasted ${this.clipboardMulti.length} node${this.clipboardMulti.length > 1 ? 's' : ''}`);
      }

      // Duplicate (Ctrl+D)
      if (e.key === 'd' && !isInput) {
        e.preventDefault();
        if (this.diagram.selectedNodes.length > 0) {
          const toDuplicate = [...this.diagram.selectedNodes];
          for (const n of this.diagram.selectedNodes) n.selected = false;
          this.diagram.selectedNodes = [];

          for (const node of toDuplicate) {
            const newNode = this.diagram.addNode(
              node.type, node.label,
              node.x + 40, node.y + 40,
              node.color, node.description
            );
            newNode.selected = true;
            this.diagram.selectedNodes.push(newNode);
          }
          this.diagram._notifySelectionChange();
          this.diagram.render();
          this._toast(`Duplicated ${toDuplicate.length} node${toDuplicate.length > 1 ? 's' : ''}`);
        }
      }
    }
  }

  _onKeyUp(e) {
    if (e.key === ' ' || e.code === 'Space') {
      this.spaceHeld = false;
      this.canvas.style.cursor = 'default';
    }
  }

  _toast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}
