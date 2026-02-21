// Capacity Panel — lets user input concurrent users and auto-suggests specs
import { planCapacity } from './CapacityPlanner.js';

export class CapacityPanel {
  constructor(diagram) {
    this.diagram = diagram;
    this.visible = false;
    this.el = null;
    this._users = 10000;
    this._ratio = '80:20';
    this._result = null;
    this._create();
  }

  _create() {
    this.el = document.createElement('div');
    this.el.className = 'capacity-panel';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
  }

  toggle() {
    this.visible = !this.visible;
    if (this.visible) {
      this.update();
      this.el.style.display = 'block';
    } else {
      this.el.style.display = 'none';
    }
  }

  update() {
    if (!this.visible) return;

    const resultHtml = this._result ? this._renderResult() : '';

    this.el.innerHTML = `
      <div class="cost-panel-header">
        <span>📐 Capacity Planning</span>
        <button class="cost-panel-close" id="capacity-close">×</button>
      </div>
      <div style="padding:12px">
        <div class="props-group">
          <label class="props-label">Concurrent Users</label>
          <input type="number" class="props-input" id="capacity-users" value="${this._users}" min="100" step="1000">
        </div>
        <div class="props-group">
          <label class="props-label">Read:Write Ratio</label>
          <select class="props-input" id="capacity-ratio">
            <option value="80:20" ${this._ratio === '80:20' ? 'selected' : ''}>80:20 (Read Heavy)</option>
            <option value="50:50" ${this._ratio === '50:50' ? 'selected' : ''}>50:50 (Balanced)</option>
            <option value="20:80" ${this._ratio === '20:80' ? 'selected' : ''}>20:80 (Write Heavy)</option>
          </select>
        </div>
        <button class="spec-tier-btn active" id="capacity-plan" style="width:100%;margin-bottom:8px">
          🔄 Auto-Size Components
        </button>
        ${resultHtml}
      </div>
    `;

    this.el.querySelector('#capacity-close')?.addEventListener('click', () => this.toggle());
    this.el.querySelector('#capacity-users')?.addEventListener('change', (e) => { this._users = parseInt(e.target.value) || 10000; });
    this.el.querySelector('#capacity-ratio')?.addEventListener('change', (e) => { this._ratio = e.target.value; });
    this.el.querySelector('#capacity-plan')?.addEventListener('click', () => {
      this._result = planCapacity(this.diagram.nodes, this._users, this._ratio);
      // Apply recommendations to nodes
      for (const rec of this._result.recommendations) {
        if (rec.specs) {
          const node = this.diagram.nodes.find(n => n.id === rec.nodeId);
          if (node) {
            if (!node.specs) node.specs = {};
            Object.assign(node.specs, rec.specs);
          }
        }
      }
      this.diagram.render();
      this.update();
    });
  }

  _renderResult() {
    if (!this._result) return '';
    const rows = this._result.recommendations.map(r => {
      const specStr = r.specs ? Object.entries(r.specs).map(([k, v]) => `${k}:${v}`).join(', ') : '—';
      return `
        <tr>
          <td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.label}</td>
          <td style="text-align:right;color:var(--text-accent)">${r.traffic} ${r.unit}</td>
          <td style="font-size:10px;color:var(--text-2)">${specStr}</td>
        </tr>
      `;
    }).join('');

    return `
      <div style="margin-top:8px;padding:8px;background:var(--bg-2);border-radius:8px;border:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;color:#22c55e;margin-bottom:6px">
          ✓ Auto-sized for ${this._result.concurrentUsers.toLocaleString()} users
        </div>
        <div class="cost-panel-table" style="background:transparent;border:none">
          <table>
            <thead><tr><th>Component</th><th style="text-align:right">Traffic</th><th>Suggested</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }
}
