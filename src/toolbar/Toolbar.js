import { icons } from '../utils/icons.js';
import { saveDiagram, loadDiagram, exportAsJSON, importJSON, exportAsPNG } from '../utils/storage.js';
import { templates } from '../templates/templates.js';
import { DesignGuide } from '../guide/DesignGuide.js';
import { ChatPanel } from '../chat/ChatPanel.js';

export class Toolbar {
  constructor(containerEl, diagram) {
    this.container = containerEl;
    this.diagram = diagram;
    this.guide = new DesignGuide();
    this.chat = new ChatPanel(diagram);
    this.render();
  }

  render() {
    const templateOptions = templates.map(t =>
      `<option value="${t.id}">${t.name}</option>`
    ).join('');

    this.container.innerHTML = `
      <div class="toolbar-brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="url(#brandGrad)" stroke-width="2">
          <defs><linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#818cf8"/><stop offset="100%" style="stop-color:#a855f7"/>
          </linearGradient></defs>
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/>
          <circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/>
          <line x1="10" y1="8" x2="14" y2="8"/><line x1="8" y1="10" x2="8" y2="14"/>
          <line x1="16" y1="10" x2="16" y2="14"/>
        </svg>
        <span class="toolbar-brand-text">SysDesign Studio</span>
      </div>

      <div class="toolbar-group">
        <button class="toolbar-btn" id="btn-new" title="New Diagram">${icons.newFile}</button>
        <button class="toolbar-btn" id="btn-save" title="Save">${icons.save}</button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button class="toolbar-btn" id="btn-undo" title="Undo (Ctrl+Z)">${icons.undo}</button>
        <button class="toolbar-btn" id="btn-redo" title="Redo (Ctrl+Y)">${icons.redo}</button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button class="toolbar-btn" id="btn-zoom-in" title="Zoom In">${icons.zoomIn}</button>
        <button class="toolbar-btn" id="btn-zoom-out" title="Zoom Out">${icons.zoomOut}</button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <select class="toolbar-select" id="select-template" title="Load Template">
          <option value="">📐 Templates</option>
          ${templateOptions}
        </select>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group">
        <button class="toolbar-btn guide-btn" id="btn-guide" title="Design Guide">
          <span style="font-size:16px">📖</span><span>Guide</span>
        </button>
        <button class="toolbar-btn chat-btn" id="btn-chat" title="AI Chat Assistant">
          <span style="font-size:16px">💬</span><span>Chat</span>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button class="toolbar-btn" id="btn-export-png" title="Export PNG">${icons.image}<span>PNG</span></button>
        <button class="toolbar-btn" id="btn-export-json" title="Export JSON">${icons.fileJson}<span>JSON</span></button>
        <button class="toolbar-btn" id="btn-import-json" title="Import JSON">${icons.upload}</button>
      </div>

      <div class="toolbar-divider"></div>

      <button class="toolbar-btn" id="btn-theme" title="Toggle Theme">${icons.sun}</button>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const $ = id => document.getElementById(id);

    $('btn-new')?.addEventListener('click', () => {
      if (confirm('Create a new diagram? Current unsaved changes will be lost.')) {
        this.diagram.clear();
        this._toast('New diagram created');
      }
    });

    $('btn-save')?.addEventListener('click', () => {
      const data = this.diagram.serialize();
      saveDiagram('autosave', data);
      this._toast('Diagram saved!');
    });

    $('btn-undo')?.addEventListener('click', () => this.diagram.undo());
    $('btn-redo')?.addEventListener('click', () => this.diagram.redo());
    $('btn-zoom-in')?.addEventListener('click', () => this.diagram.zoomIn());
    $('btn-zoom-out')?.addEventListener('click', () => this.diagram.zoomOut());

    $('select-template')?.addEventListener('change', (e) => {
      const templateId = e.target.value;
      if (!templateId) return;
      const template = templates.find(t => t.id === templateId);
      if (template) {
        this.diagram.deserialize(template.data);
        // Center view
        this.diagram.offsetX = 60;
        this.diagram.offsetY = 40;
        this.diagram.scale = 1;
        this.diagram.render();
        this._toast(`Loaded template: ${template.name}`);
      }
      e.target.value = '';
    });

    $('btn-export-png')?.addEventListener('click', () => {
      exportAsPNG(this.diagram.canvas);
      this._toast('PNG exported!');
    });

    $('btn-export-json')?.addEventListener('click', () => {
      exportAsJSON(this.diagram.serialize());
      this._toast('JSON exported!');
    });

    $('btn-import-json')?.addEventListener('click', async () => {
      const data = await importJSON();
      if (data) {
        this.diagram.deserialize(data);
        this._toast('Diagram imported!');
      }
    });

    $('btn-guide')?.addEventListener('click', () => {
      this.guide.toggle();
    });

    $('btn-chat')?.addEventListener('click', () => {
      this.chat.toggle();
    });

    $('btn-theme')?.addEventListener('click', () => {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      $('btn-theme').innerHTML = next === 'dark' ? icons.sun : icons.moon;
      this.diagram.render();
    });
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
    setTimeout(() => toast.remove(), 2500);
  }
}
