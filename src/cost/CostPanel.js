// Cost Panel — displays estimated monthly cloud costs with expandable breakdown
import { estimateTotalCost } from './CostEstimator.js';

const CATEGORY_MAP = {
  'app-server': 'Compute', 'web-server': 'Compute', 'graphql': 'Compute',
  'microservice': 'Compute', 'serverless': 'Compute', 'worker': 'Compute', 'cron': 'Compute',
  'database': 'Database', 'nosql': 'Database', 'graph-db': 'Database',
  'timeseries-db': 'Database', 'data-warehouse': 'Database', 'search': 'Database', 'vector-db': 'Database',
  'cache': 'Cache & Storage', 'object-storage': 'Cache & Storage', 'cdn': 'Cache & Storage', 'file-storage': 'Cache & Storage',
  'message-queue': 'Messaging', 'event-bus': 'Messaging', 'stream': 'Messaging',
  'load-balancer': 'Infrastructure', 'dns': 'Infrastructure', 'service-mesh': 'Infrastructure',
  'container-orch': 'Infrastructure', 'registry': 'Infrastructure', 'api-gateway': 'Infrastructure',
  'monitoring': 'Observability', 'logging': 'Observability', 'tracing': 'Observability',
  'waf': 'Security', 'auth': 'Security', 'vault': 'Security',
};

export class CostPanel {
  constructor(diagram) {
    this.diagram = diagram;
    this.visible = false;
    this.el = null;
    this._expandedNodes = new Set();
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

    // Category breakdown
    const cats = {};
    for (const n of result.perNode) {
      const cat = CATEGORY_MAP[n.type] || 'Other';
      cats[cat] = (cats[cat] || 0) + n.total;
    }
    const catPills = Object.entries(cats)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, cost]) => `<span class="cost-category-pill">${cat}: $${Math.round(cost)}</span>`)
      .join('');

    // Component rows with expandable breakdown
    const rows = result.perNode.filter(n => n.total > 0).map(n => {
      const isExpanded = this._expandedNodes.has(n.nodeId);
      const hasBreakdown = n.breakdown && n.breakdown.length > 1;
      const expandIcon = hasBreakdown
        ? `<button class="cost-expand-btn ${isExpanded ? 'open' : ''}" data-node="${n.nodeId}">▶</button>`
        : '<span style="width:18px;display:inline-block"></span>';

      let row = `
        <tr class="cost-main-row" data-node="${n.nodeId}">
          <td>${expandIcon}<span style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle" title="${n.label}">${n.label}</span></td>
          <td style="opacity:0.5;font-size:10px">${n.type}</td>
          <td style="text-align:right;font-weight:600;color:#22c55e">$${n.total.toFixed(0)}</td>
        </tr>`;

      // Expanded breakdown
      if (isExpanded && hasBreakdown) {
        for (const item of n.breakdown) {
          row += `
            <tr class="cost-breakdown-row">
              <td colspan="2" style="padding-left:26px;font-size:11px;color:var(--text-2)">${item.item}</td>
              <td style="text-align:right;font-size:11px;color:var(--text-2)">$${item.cost.toFixed(2)}</td>
            </tr>`;
        }
      }
      return row;
    }).join('');

    this.el.innerHTML = `
      <div class="cost-panel-header">
        <span>💰 Cost Estimation</span>
        <button class="cost-panel-close" id="cost-close">×</button>
      </div>
      <div class="cost-panel-total">
        <span style="color:var(--text-2);font-size:11px">Estimated Monthly</span>
        <span style="font-size:26px;font-weight:700;color:#22c55e">${result.label}</span>
      </div>
      ${catPills ? `<div class="cost-category-pills">${catPills}</div>` : ''}
      <div class="cost-panel-table">
        <table>
          <thead><tr>
            <th>Component</th><th>Type</th><th style="text-align:right">Cost</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="3" style="text-align:center;opacity:0.4;padding:16px">No components with cost</td></tr>'}</tbody>
        </table>
      </div>
      <div style="padding:8px 12px;font-size:9px;opacity:0.35;text-align:center">
        Based on approximate AWS on-demand pricing. Actual costs may vary.
      </div>
    `;

    this.el.querySelector('#cost-close')?.addEventListener('click', () => this.toggle());

    // Expand/collapse click handlers
    this.el.querySelectorAll('.cost-expand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = btn.dataset.node;
        if (this._expandedNodes.has(nodeId)) {
          this._expandedNodes.delete(nodeId);
        } else {
          this._expandedNodes.add(nodeId);
        }
        this.update();
      });
    });
  }
}
