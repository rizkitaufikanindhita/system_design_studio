const NODE_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#ef4444', '#f59e0b', '#22c55e',
  '#14b8a6', '#06b6d4', '#f97316', '#64748b',
];

export class PropertiesPanel {
  constructor(containerEl, diagram) {
    this.container = containerEl;
    this.diagram = diagram;
    this.renderEmpty();
  }

  renderEmpty() {
    this.container.innerHTML = `
      <div class="props-header">
        <span class="props-title">Properties</span>
      </div>
      <div class="props-body">
        <div class="props-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="9" x2="9" y2="21"/>
          </svg>
          <div>Select a node or connection<br>to edit its properties</div>
        </div>
      </div>
    `;
  }

  renderNode(node) {
    this.container.innerHTML = `
      <div class="props-header">
        <span class="props-title">Node Properties</span>
      </div>
      <div class="props-body animate-slide-in">
        <div class="props-group">
          <label class="props-label">Label</label>
          <input type="text" class="props-input" id="prop-label" value="${this._esc(node.label)}">
        </div>
        <div class="props-group">
          <label class="props-label">Description</label>
          <input type="text" class="props-input" id="prop-desc" value="${this._esc(node.description)}" placeholder="Optional description">
        </div>
        <div class="props-group">
          <label class="props-label">Type</label>
          <input type="text" class="props-input" value="${node.type}" disabled style="opacity:0.6">
        </div>
        <div class="props-group">
          <label class="props-label">Position</label>
          <div style="display:flex;gap:8px">
            <input type="number" class="props-input" id="prop-x" value="${Math.round(node.x)}" style="width:50%">
            <input type="number" class="props-input" id="prop-y" value="${Math.round(node.y)}" style="width:50%">
          </div>
        </div>
        <div class="props-group">
          <label class="props-label">Color</label>
          <div class="props-color-row">
            ${NODE_COLORS.map(c => `
              <div class="props-color-swatch ${c === node.color ? 'active' : ''}"
                   style="background:${c}" data-color="${c}"></div>
            `).join('')}
          </div>
        </div>
        <button class="props-delete-btn" id="prop-delete">Delete Node</button>
      </div>
    `;

    this._bindNodeEvents(node);
  }

  renderConnection(conn) {
    this.container.innerHTML = `
      <div class="props-header">
        <span class="props-title">Connection</span>
      </div>
      <div class="props-body animate-slide-in">
        <div class="props-group">
          <label class="props-label">Label</label>
          <input type="text" class="props-input" id="prop-conn-label" value="${this._esc(conn.label)}" placeholder="e.g. REST API, gRPC">
        </div>
        <div class="props-group">
          <label class="props-label">Line Style</label>
          <select class="props-input" id="prop-conn-style">
            <option value="solid" ${conn.style === 'solid' ? 'selected' : ''}>Solid</option>
            <option value="dashed" ${conn.style === 'dashed' ? 'selected' : ''}>Dashed</option>
          </select>
        </div>
        <button class="props-delete-btn" id="prop-conn-delete">Delete Connection</button>
      </div>
    `;

    this._bindConnectionEvents(conn);
  }

  _bindNodeEvents(node) {
    const labelEl = document.getElementById('prop-label');
    const descEl = document.getElementById('prop-desc');
    const xEl = document.getElementById('prop-x');
    const yEl = document.getElementById('prop-y');
    const deleteEl = document.getElementById('prop-delete');

    if (labelEl) labelEl.addEventListener('input', (e) => {
      node.label = e.target.value;
      this.diagram.render();
      this.diagram._saveHistory();
    });

    if (descEl) descEl.addEventListener('input', (e) => {
      node.description = e.target.value;
      this.diagram.render();
      this.diagram._saveHistory();
    });

    if (xEl) xEl.addEventListener('change', (e) => {
      node.moveTo(parseInt(e.target.value) || 0, node.y);
      this.diagram.render();
      this.diagram._saveHistory();
    });

    if (yEl) yEl.addEventListener('change', (e) => {
      node.moveTo(node.x, parseInt(e.target.value) || 0);
      this.diagram.render();
      this.diagram._saveHistory();
    });

    // Color swatches
    this.container.querySelectorAll('.props-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        node.color = swatch.dataset.color;
        this.container.querySelectorAll('.props-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.diagram.render();
        this.diagram._saveHistory();
      });
    });

    if (deleteEl) deleteEl.addEventListener('click', () => {
      this.diagram.removeNode(node.id);
    });
  }

  _bindConnectionEvents(conn) {
    const labelEl = document.getElementById('prop-conn-label');
    const styleEl = document.getElementById('prop-conn-style');
    const deleteEl = document.getElementById('prop-conn-delete');

    if (labelEl) labelEl.addEventListener('input', (e) => {
      conn.label = e.target.value;
      this.diagram.render();
      this.diagram._saveHistory();
    });

    if (styleEl) styleEl.addEventListener('change', (e) => {
      conn.style = e.target.value;
      this.diagram.render();
      this.diagram._saveHistory();
    });

    if (deleteEl) deleteEl.addEventListener('click', () => {
      this.diagram.removeConnection(conn.id);
    });
  }

  renderMulti(nodes) {
    const labels = nodes.map(n => n.label).join(', ');
    this.container.innerHTML = `
      <div class="props-header">
        <span class="props-title">Multi Selection</span>
      </div>
      <div class="props-body animate-slide-in">
        <div class="props-group">
          <label class="props-label">Selected Nodes</label>
          <div style="font-size:28px;font-weight:700;color:var(--text-accent);margin-bottom:4px">${nodes.length}</div>
          <div style="font-size:12px;color:var(--text-tertiary);line-height:1.5;max-height:100px;overflow-y:auto">${this._esc(labels)}</div>
        </div>
        <div class="props-group">
          <label class="props-label">Bulk Color</label>
          <div class="props-color-row">
            ${NODE_COLORS.map(c => `
              <div class="props-color-swatch"
                   style="background:${c}" data-color="${c}"></div>
            `).join('')}
          </div>
        </div>
        <button class="props-delete-btn" id="prop-delete-multi">Delete All (${nodes.length})</button>
      </div>
    `;

    // Bind bulk color
    this.container.querySelectorAll('.props-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        for (const n of nodes) n.color = swatch.dataset.color;
        this.container.querySelectorAll('.props-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.diagram.render();
        this.diagram._saveHistory();
      });
    });

    // Bind bulk delete
    document.getElementById('prop-delete-multi')?.addEventListener('click', () => {
      this.diagram.removeSelectedNodes();
    });
  }

  update(selectedNode, selectedConnection, selectedNodes) {
    if (selectedNodes && selectedNodes.length > 1) {
      this.renderMulti(selectedNodes);
    } else if (selectedNode) {
      this.renderNode(selectedNode);
    } else if (selectedConnection) {
      this.renderConnection(selectedConnection);
    } else {
      this.renderEmpty();
    }
  }

  _esc(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }
}
