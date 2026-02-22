// Capacity Panel — lets user input concurrent users and auto-suggests specs
import { planCapacity } from './CapacityPlanner.js';
import { estimateTotalCost } from '../cost/CostEstimator.js';

export class CapacityPanel {
  constructor(diagram) {
    this.diagram = diagram;
    this.visible = false;
    this.el = null;
    this._users = 10000;
    this._ratio = '80:20';
    this._result = null;
    this._costBefore = null;
    this._costAfter = null;
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
            <option value="95:5" ${this._ratio === '95:5' ? 'selected' : ''}>95:5 (Read Dominant)</option>
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
      // Capture cost before auto-sizing
      this._costBefore = estimateTotalCost(this.diagram.nodes).grandTotal;

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

      // Capture cost after auto-sizing
      this._costAfter = estimateTotalCost(this.diagram.nodes).grandTotal;

      this.diagram.render();
      this.update();
    });
  }

  _renderResult() {
    if (!this._result) return '';
    const rows = this._result.recommendations.map(r => {
      const specStr = r.specs ? Object.entries(r.specs).map(([k, v]) => `${k}:${v}`).join(', ') : '—';

      // Before/after comparison
      let diffHtml = '';
      if (r.specs && r.oldSpecs) {
        const changes = [];
        for (const [key, newVal] of Object.entries(r.specs)) {
          const oldVal = r.oldSpecs[key];
          if (oldVal !== undefined && oldVal !== newVal) {
            changes.push(`<div class="capacity-diff">
              <span class="capacity-diff-old">${key}:${oldVal}</span>
              <span class="capacity-diff-arrow">→</span>
              <span class="capacity-diff-new">${key}:${newVal}</span>
            </div>`);
          }
        }
        if (changes.length > 0) {
          diffHtml = `<div style="margin-top:2px">${changes.join('')}</div>`;
        }
      }

      return `
        <tr>
          <td style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.label}">${r.label}</td>
          <td style="text-align:right;color:var(--text-accent);font-size:11px">${r.traffic.toLocaleString()} ${r.unit}</td>
          <td style="font-size:10px;color:var(--text-2)">${specStr}${diffHtml}</td>
        </tr>
      `;
    }).join('');

    // Cost impact
    let costImpactHtml = '';
    if (this._costBefore !== null && this._costAfter !== null) {
      const diff = this._costAfter - this._costBefore;
      const diffColor = diff > 0 ? '#ef4444' : diff < 0 ? '#22c55e' : 'var(--text-2)';
      const diffSign = diff > 0 ? '+' : '';
      costImpactHtml = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:6px 8px;background:var(--bg-3);border-radius:6px;font-size:11px">
          <span style="color:var(--text-2)">💰 Cost Impact</span>
          <span>
            <span style="color:var(--text-2)">$${Math.round(this._costBefore)}</span>
            <span style="color:var(--text-2)"> → </span>
            <span style="color:#22c55e;font-weight:700">$${Math.round(this._costAfter)}</span>
            <span style="color:${diffColor};font-weight:600;margin-left:4px">(${diffSign}$${Math.round(diff)})</span>
          </span>
        </div>
      `;
    }

    return `
      <div style="margin-top:8px;padding:10px;background:var(--bg-2);border-radius:8px;border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:12px;font-weight:600;color:#22c55e">
            ✓ Auto-sized for ${this._result.concurrentUsers.toLocaleString()} users
          </div>
          <div style="font-size:10px;color:var(--text-2)">
            R:W ${this._result.readPct}:${this._result.writePct}
          </div>
        </div>
        <div class="cost-panel-table" style="background:transparent;border:none;padding:0">
          <table>
            <thead><tr><th>Component</th><th style="text-align:right">Traffic</th><th>Suggested</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${costImpactHtml}
      </div>
    `;
  }
}
