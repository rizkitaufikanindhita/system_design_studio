import { componentRegistry } from './componentRegistry.js';
import { componentDocs } from './componentDocs.js';
import { icons } from '../utils/icons.js';

export class Palette {
  constructor(containerEl, diagram) {
    this.container = containerEl;
    this.diagram = diagram;
    this.searchTerm = '';
    this._dragData = null;
    this._ghostEl = null;
    this._activeDoc = null; // currently shown doc type
    this.render();
  }

  render() {
    const filtered = this._getFiltered();
    this.container.innerHTML = `
      <div class="palette-header">
        <div class="palette-title">Components</div>
        <input type="text" class="palette-search" placeholder="Search components..." id="palette-search" value="${this.searchTerm}">
      </div>
      <div class="palette-categories">
        ${filtered.map((cat, i) => `
          <div class="palette-category" data-cat="${i}">
            <div class="palette-category-header">
              <span class="chevron">${icons.chevron}</span>
              <span>${cat.category}</span>
              <span style="opacity:0.4;margin-left:auto;font-size:11px">${cat.items.length}</span>
            </div>
            <div class="palette-items">
              ${cat.items.map(item => `
                <div class="palette-item-row">
                  <div class="palette-item" draggable="true"
                       data-type="${item.type}"
                       data-label="${item.label}"
                       data-color="${item.color}">
                    <div class="palette-item-icon" style="background:${item.color}22">
                      <span style="color:${item.color}">${item.icon}</span>
                    </div>
                    <div>
                      <div class="palette-item-label">${item.label}</div>
                      <div class="palette-item-desc">${item.desc}</div>
                    </div>
                  </div>
                  ${componentDocs[item.type] ? `
                    <button class="palette-doc-btn ${this._activeDoc === item.type ? 'active' : ''}" 
                            data-doc-type="${item.type}" title="Info: ${item.label}">?</button>
                  ` : ''}
                </div>
                ${this._activeDoc === item.type ? this._renderDocPanel(item.type) : ''}
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this._bindEvents();
  }

  _renderDocPanel(type) {
    const doc = componentDocs[type];
    if (!doc) return '';
    return `
      <div class="palette-doc-panel">
        <div class="palette-doc-title">${doc.title}</div>
        <div class="palette-doc-section">
          <div class="palette-doc-label">Tujuan</div>
          <div class="palette-doc-text">${doc.purpose}</div>
        </div>
        <div class="palette-doc-section">
          <div class="palette-doc-label">Cara Kerja</div>
          <div class="palette-doc-text">${doc.howItWorks}</div>
        </div>
        <div class="palette-doc-section">
          <div class="palette-doc-label">Kapan Digunakan</div>
          <div class="palette-doc-text">${doc.whenToUse}</div>
        </div>
        <div class="palette-doc-section">
          <div class="palette-doc-label">Contoh</div>
          <div class="palette-doc-text">${doc.example}</div>
        </div>
      </div>
    `;
  }

  _getFiltered() {
    if (!this.searchTerm) return componentRegistry;
    const term = this.searchTerm.toLowerCase();
    return componentRegistry.map(cat => ({
      ...cat,
      items: cat.items.filter(i =>
        i.label.toLowerCase().includes(term) ||
        i.desc.toLowerCase().includes(term) ||
        i.type.toLowerCase().includes(term)
      )
    })).filter(cat => cat.items.length > 0);
  }

  _bindEvents() {
    // Search
    const searchEl = document.getElementById('palette-search');
    if (searchEl) {
      searchEl.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.render();
      });
    }

    // Category collapse
    this.container.querySelectorAll('.palette-category-header').forEach(header => {
      header.addEventListener('click', () => {
        header.parentElement.classList.toggle('collapsed');
      });
    });

    // Doc buttons
    this.container.querySelectorAll('.palette-doc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.docType;
        this._activeDoc = this._activeDoc === type ? null : type;
        this.render();
        // Scroll to the opened doc
        if (this._activeDoc) {
          requestAnimationFrame(() => {
            const panel = this.container.querySelector('.palette-doc-panel');
            if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
        }
      });
    });

    // Drag from palette
    this.container.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        this._dragData = {
          type: item.dataset.type,
          label: item.dataset.label,
          color: item.dataset.color,
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(this._dragData));
        e.dataTransfer.effectAllowed = 'copy';

        // Ghost
        this._ghostEl = document.createElement('div');
        this._ghostEl.className = 'drag-ghost';
        this._ghostEl.style.background = item.dataset.color;
        this._ghostEl.textContent = item.dataset.label;
        document.body.appendChild(this._ghostEl);
        e.dataTransfer.setDragImage(this._ghostEl, 0, 0);
      });

      item.addEventListener('dragend', () => {
        if (this._ghostEl) {
          this._ghostEl.remove();
          this._ghostEl = null;
        }
        this._dragData = null;
      });
    });

    // Drop on canvas
    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (canvasWrapper) {
      canvasWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      canvasWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!this._dragData) {
          try {
            this._dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
          } catch { return; }
        }
        const rect = this.diagram.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = this.diagram.screenToWorld(screenX, screenY);

        this.diagram.addNode(
          this._dragData.type,
          this._dragData.label,
          world.x - 80, // center the node
          world.y - 35,
          this._dragData.color
        );
        this._dragData = null;
      });
    }
  }
}
