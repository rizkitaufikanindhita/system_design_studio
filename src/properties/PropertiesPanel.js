import { getSimConfig, getDefaultSpecs } from '../simulation/simulationConfigs.js';

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
        ${this._renderSpecsSection(node)}
      </div>
    `;

    this._bindNodeEvents(node);
    this._bindSpecEvents(node);
  }

  renderConnection(conn) {
    const protocols = ['', 'REST', 'gRPC', 'GraphQL', 'WebSocket', 'Kafka', 'RabbitMQ', 'TCP', 'UDP'];
    const formats = ['', 'JSON', 'Protobuf', 'Avro', 'XML', 'Binary'];
    this.container.innerHTML = `
      <div class="props-header">
        <span class="props-title">Connection</span>
      </div>
      <div class="props-body animate-slide-in">
        <div class="props-group">
          <label class="props-label">Label</label>
          <input type="text" class="props-input" id="prop-conn-label" value="${this._esc(conn.label)}" placeholder="e.g. User API">
        </div>
        <div class="props-group">
          <label class="props-label">Protocol</label>
          <select class="props-input" id="prop-conn-protocol">
            ${protocols.map(p => `<option value="${p}" ${conn.protocol === p ? 'selected' : ''}>${p || '— None —'}</option>`).join('')}
          </select>
        </div>
        <div class="props-group">
          <label class="props-label">Data Format</label>
          <select class="props-input" id="prop-conn-format">
            ${formats.map(f => `<option value="${f}" ${conn.dataFormat === f ? 'selected' : ''}>${f || '— None —'}</option>`).join('')}
          </select>
        </div>
        <div class="props-group">
          <label class="props-label">Direction</label>
          <select class="props-input" id="prop-conn-direction">
            <option value="unidirectional" ${conn.direction === 'unidirectional' ? 'selected' : ''}>→ Unidirectional</option>
            <option value="bidirectional" ${conn.direction === 'bidirectional' ? 'selected' : ''}>↔ Bidirectional</option>
          </select>
        </div>
        <div class="props-group">
          <label class="props-label" style="display:flex;align-items:center;gap:8px">
            <input type="checkbox" id="prop-conn-async" ${conn.isAsync ? 'checked' : ''} style="width:auto;margin:0">
            Asynchronous
          </label>
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
    const el = (id) => document.getElementById(id);
    const save = () => { this.diagram.render(); this.diagram._saveHistory(); };

    el('prop-conn-label')?.addEventListener('input', (e) => { conn.label = e.target.value; this.diagram.render(); });
    el('prop-conn-protocol')?.addEventListener('change', (e) => { conn.protocol = e.target.value; save(); });
    el('prop-conn-format')?.addEventListener('change', (e) => { conn.dataFormat = e.target.value; save(); });
    el('prop-conn-direction')?.addEventListener('change', (e) => { conn.direction = e.target.value; save(); });
    el('prop-conn-async')?.addEventListener('change', (e) => { conn.isAsync = e.target.checked; save(); });
    el('prop-conn-style')?.addEventListener('change', (e) => { conn.style = e.target.value; save(); });
    el('prop-conn-delete')?.addEventListener('click', () => { this.diagram.removeConnection(conn.id); });
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

  update(selectedNode, selectedConnection, selectedNodes, selectedGroup) {
    if (selectedGroup) {
      this.renderGroup(selectedGroup);
    } else if (selectedNodes && selectedNodes.length > 1) {
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

  renderGroup(group) {
    const groupTypes = [
      { value: 'region', label: '🌏 Region' },
      { value: 'vpc', label: '🔒 VPC' },
      { value: 'az', label: '🏢 Availability Zone' },
      { value: 'microservice', label: '📦 Microservice' },
      { value: 'security', label: '🛡️ Security Zone' },
      { value: 'custom', label: '📁 Custom Group' },
    ];

    this.container.innerHTML = `
      <div class="props-header">
        <span class="props-title">Group Properties</span>
      </div>
      <div class="props-body animate-slide-in">
        <div class="props-group">
          <label class="props-label">Label</label>
          <input type="text" class="props-input" id="prop-group-label" value="${this._esc(group.label)}">
        </div>
        <div class="props-group">
          <label class="props-label">Type</label>
          <select class="props-input" id="prop-group-type">
            ${groupTypes.map(t => `<option value="${t.value}" ${t.value === group.type ? 'selected' : ''}>${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="props-group">
          <label class="props-label">Subtitle</label>
          <input type="text" class="props-input" id="prop-group-subtitle" value="${this._esc(group.subtitle)}" placeholder="e.g. ap-southeast-1, 10.0.0.0/16">
        </div>
        <div class="props-group">
          <label class="props-label">Color</label>
          <div class="props-color-row">
            ${NODE_COLORS.map(c => `
              <div class="props-color-swatch ${c === group.color ? 'active' : ''}"
                   style="background:${c}" data-color="${c}"></div>
            `).join('')}
          </div>
        </div>
        <div class="props-group">
          <label class="props-label">Size</label>
          <div style="display:flex;gap:8px">
            <input type="number" class="props-input" id="prop-group-w" value="${Math.round(group.width)}" style="width:50%" min="200">
            <input type="number" class="props-input" id="prop-group-h" value="${Math.round(group.height)}" style="width:50%" min="150">
          </div>
        </div>
        <div class="props-group">
          <label class="props-label">Children</label>
          <div style="font-size:12px;color:var(--text-2)">${group.childNodeIds.length} nodes</div>
        </div>
        <button class="props-delete-btn" id="prop-group-delete">Delete Group</button>
      </div>
    `;

    this._bindGroupEvents(group);
  }

  _bindGroupEvents(group) {
    const labelEl = document.getElementById('prop-group-label');
    const typeEl = document.getElementById('prop-group-type');
    const subtitleEl = document.getElementById('prop-group-subtitle');
    const wEl = document.getElementById('prop-group-w');
    const hEl = document.getElementById('prop-group-h');
    const deleteEl = document.getElementById('prop-group-delete');

    if (labelEl) labelEl.addEventListener('input', (e) => {
      group.label = e.target.value;
      this.diagram.render();
    });

    if (typeEl) typeEl.addEventListener('change', (e) => {
      group.type = e.target.value;
      this.diagram.render();
      this.diagram._saveHistory();
    });

    if (subtitleEl) subtitleEl.addEventListener('input', (e) => {
      group.subtitle = e.target.value;
      this.diagram.render();
    });

    if (wEl) wEl.addEventListener('change', (e) => {
      group.width = Math.max(200, parseInt(e.target.value) || 400);
      this.diagram.render();
      this.diagram._saveHistory();
    });

    if (hEl) hEl.addEventListener('change', (e) => {
      group.height = Math.max(150, parseInt(e.target.value) || 300);
      this.diagram.render();
      this.diagram._saveHistory();
    });

    // Color swatches
    this.container.querySelectorAll('.props-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        group.color = swatch.dataset.color;
        this.container.querySelectorAll('.props-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.diagram.render();
        this.diagram._saveHistory();
      });
    });

    if (deleteEl) deleteEl.addEventListener('click', () => {
      this.diagram.removeGroup(group.id);
      this.diagram.selectedGroup = null;
    });
  }

  _renderSpecsSection(node) {
    const config = getSimConfig(node.type);
    if (!config.specFields || config.specFields.length === 0) return '';

    // Initialize node.specs if not set
    if (!node.specs) {
      node.specs = getDefaultSpecs(node.type);
    }

    const tierBtns = config.tiers ? Object.entries(config.tiers).map(([key]) => {
      const labels = { small: '🟢 Small', medium: '🟡 Medium', large: '🔴 Large' };
      return `<button class="spec-tier-btn" data-tier="${key}">${labels[key] || key}</button>`;
    }).join('') : '';

    const fields = config.specFields.map(f => {
      const val = node.specs[f.key] ?? f.default;
      if (f.type === 'select') {
        const opts = f.options.map(o =>
          `<option value="${o}" ${String(val) === String(o) ? 'selected' : ''}>${o}</option>`
        ).join('');
        return `
          <div class="props-group">
            <label class="props-label">${f.label}</label>
            <select class="props-input spec-field" data-key="${f.key}">${opts}</select>
          </div>`;
      } else {
        return `
          <div class="props-group">
            <label class="props-label">${f.label}</label>
            <input type="number" class="props-input spec-field" data-key="${f.key}"
              min="${f.min}" max="${f.max}" value="${val}">
          </div>`;
      }
    }).join('');

    return `
      <div class="spec-section">
        <div class="spec-header">⚙️ Simulation Specs</div>
        ${tierBtns ? `<div class="spec-tier-row">${tierBtns}</div>` : ''}
        ${fields}
      </div>`;
  }

  _bindSpecEvents(node) {
    const config = getSimConfig(node.type);
    if (!config.specFields || config.specFields.length === 0) return;
    if (!node.specs) node.specs = getDefaultSpecs(node.type);

    // Tier buttons
    this.container.querySelectorAll('.spec-tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = config.tiers[btn.dataset.tier];
        if (!tier) return;
        Object.assign(node.specs, tier);
        this.container.querySelectorAll('.spec-tier-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Update field values in DOM
        this.container.querySelectorAll('.spec-field').forEach(el => {
          const key = el.dataset.key;
          if (key in tier) el.value = tier[key];
        });
        this.diagram.render();
      });
    });

    // Individual spec fields
    this.container.querySelectorAll('.spec-field').forEach(el => {
      el.addEventListener('change', () => {
        const key = el.dataset.key;
        const field = config.specFields.find(f => f.key === key);
        if (field) {
          node.specs[key] = field.type === 'number' ? parseFloat(el.value) : el.value;
          // Remove tier highlight since user customized
          this.container.querySelectorAll('.spec-tier-btn').forEach(b => b.classList.remove('active'));
          this.diagram.render();
        }
      });
    });
  }
}
