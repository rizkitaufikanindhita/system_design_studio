// Cost Panel — displays estimated monthly cloud costs for the diagram
import { estimateTotalCost } from './CostEstimator.js';

export class CostPanel {
  constructor(diagram) {
    this.diagram = diagram;
    this.visible = false;
    this.el = null;
    this._create();
  }

  _create() {
    this.el = document.createElement('div');
    this.el.className = 'cost-panel';
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
    const result = estimateTotalCost(this.diagram.nodes);

    const rows = result.perNode.filter(n => n.total > 0).map(n => `
      <tr>
        <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${n.label}">${n.label}</td>
        <td style="opacity:0.5;font-size:10px">${n.type}</td>
        <td style="text-align:right;font-weight:600;color:var(--text-accent)">$${n.total.toFixed(0)}</td>
      </tr>
    `).join('');

    this.el.innerHTML = `
      <div class="cost-panel-header">
        <span>💰 Cost Estimation</span>
        <button class="cost-panel-close" id="cost-close">×</button>
      </div>
      <div class="cost-panel-total">
        <span style="color:var(--text-2)">Estimated Monthly</span>
        <span style="font-size:24px;font-weight:700;color:#22c55e">${result.label}</span>
      </div>
      <div class="cost-panel-table">
        <table>
          <thead><tr>
            <th>Component</th><th>Type</th><th style="text-align:right">Cost</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="3" style="text-align:center;opacity:0.4">No components with cost</td></tr>'}</tbody>
        </table>
      </div>
      <div style="padding:8px 12px;font-size:9px;opacity:0.35;text-align:center">
        Based on approximate AWS on-demand pricing. Actual costs may vary.
      </div>
    `;

    this.el.querySelector('#cost-close')?.addEventListener('click', () => this.toggle());
  }
}
