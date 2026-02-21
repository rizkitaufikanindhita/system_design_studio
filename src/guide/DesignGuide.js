import { guideContent } from './guideContent.js';

const TABS = [
  { key: 'framework', icon: '🎯' },
  { key: 'concepts', icon: '📐' },
  { key: 'patterns', icon: '🧩' },
  { key: 'technologies', icon: '🔧' },
  { key: 'numbers', icon: '📊' },
  { key: 'checklist', icon: '✅' },
];

export class DesignGuide {
  constructor() {
    this.isOpen = false;
    this.activeTab = 'framework';
    this.checkedItems = this._loadChecklist();
    this._createElements();
  }

  _createElements() {
    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'guide-backdrop';
    this.backdrop.addEventListener('click', () => this.close());

    // Drawer
    this.drawer = document.createElement('div');
    this.drawer.className = 'guide-drawer';

    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.drawer);
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.backdrop.classList.add('open');
    this.drawer.classList.add('open');
    this._render();
  }

  close() {
    this.isOpen = false;
    this.backdrop.classList.remove('open');
    this.drawer.classList.remove('open');
  }

  setTab(key) {
    this.activeTab = key;
    this._render();
  }

  _render() {
    const section = guideContent[this.activeTab];
    if (!section) return;

    const isChecklist = this.activeTab === 'checklist';

    this.drawer.innerHTML = `
      <div class="guide-header">
        <div>
          <div class="guide-title">Design Guide</div>
          <div class="guide-subtitle">Panduan System Design yang Reliable</div>
        </div>
        <button class="guide-close" id="guide-close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="guide-tabs">
        ${TABS.map(tab => `
          <button class="guide-tab ${tab.key === this.activeTab ? 'active' : ''}"
                  data-tab="${tab.key}" title="${guideContent[tab.key].title}">
            <span class="guide-tab-icon">${tab.icon}</span>
            <span class="guide-tab-label">${guideContent[tab.key].title.replace(/^[^\s]+\s/, '')}</span>
          </button>
        `).join('')}
      </div>

      <div class="guide-content">
        <div class="guide-section-header">
          <div class="guide-section-title">${section.title}</div>
          <div class="guide-section-subtitle">${section.subtitle}</div>
        </div>

        ${isChecklist ? this._renderChecklist(section) : this._renderCards(section)}
      </div>
    `;

    this._bindEvents();
  }

  _renderCards(section) {
    return `
      <div class="guide-cards">
        ${section.cards.map((card, i) => `
          <div class="guide-card animate-fade-in" style="animation-delay:${i * 0.05}s">
            <div class="guide-card-title">${card.title}</div>
            <div class="guide-card-content">${this._formatContent(card.content)}</div>
            ${card.tip ? `
              <div class="guide-card-tip">
                <span class="guide-tip-icon">💡</span>
                <span>${card.tip}</span>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  _renderChecklist(section) {
    return `
      <div class="guide-checklist">
        ${section.items.map(item => `
          <label class="guide-check-item ${this.checkedItems[item.id] ? 'checked' : ''}" data-id="${item.id}">
            <input type="checkbox" ${this.checkedItems[item.id] ? 'checked' : ''}>
            <div class="guide-check-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <div class="guide-check-text">${item.text}</div>
              <div class="guide-check-desc">${item.desc}</div>
            </div>
          </label>
        `).join('')}
        <div class="guide-check-progress">
          <div class="guide-progress-bar">
            <div class="guide-progress-fill" style="width:${this._checkProgress(section)}%"></div>
          </div>
          <span class="guide-progress-text">${this._checkedCount(section)} / ${section.items.length} completed</span>
        </div>
      </div>
    `;
  }

  _formatContent(text) {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/• /g, '<span class="guide-bullet">•</span> ')
      .replace(/\|(.+)\|/g, (match) => {
        // Simple table rendering
        const rows = match.trim().split('<br>').filter(r => r.trim());
        if (rows.length < 2) return match;
        const headers = rows[0].split('|').filter(c => c.trim());
        const separator = rows[1];
        if (!separator.includes('---')) return match;
        const dataRows = rows.slice(2);

        let table = '<table class="guide-table"><thead><tr>';
        headers.forEach(h => table += `<th>${h.trim()}</th>`);
        table += '</tr></thead><tbody>';
        dataRows.forEach(row => {
          const cells = row.split('|').filter(c => c.trim());
          table += '<tr>';
          cells.forEach(c => table += `<td>${c.trim()}</td>`);
          table += '</tr>';
        });
        table += '</tbody></table>';
        return table;
      });
  }

  _bindEvents() {
    document.getElementById('guide-close')?.addEventListener('click', () => this.close());

    this.drawer.querySelectorAll('.guide-tab').forEach(btn => {
      btn.addEventListener('click', () => this.setTab(btn.dataset.tab));
    });

    this.drawer.querySelectorAll('.guide-check-item').forEach(item => {
      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change', () => {
        const id = item.dataset.id;
        this.checkedItems[id] = checkbox.checked;
        item.classList.toggle('checked', checkbox.checked);
        this._saveChecklist();
        // Update progress
        const section = guideContent.checklist;
        const progressFill = this.drawer.querySelector('.guide-progress-fill');
        const progressText = this.drawer.querySelector('.guide-progress-text');
        if (progressFill) progressFill.style.width = this._checkProgress(section) + '%';
        if (progressText) progressText.textContent = `${this._checkedCount(section)} / ${section.items.length} completed`;
      });
    });
  }

  _checkedCount(section) {
    return section.items.filter(i => this.checkedItems[i.id]).length;
  }

  _checkProgress(section) {
    return Math.round((this._checkedCount(section) / section.items.length) * 100);
  }

  _saveChecklist() {
    try { localStorage.setItem('sysdesign_checklist', JSON.stringify(this.checkedItems)); } catch {}
  }

  _loadChecklist() {
    try {
      const raw = localStorage.getItem('sysdesign_checklist');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
}
