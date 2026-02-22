// Failure Panel — lets user pick a component and see cascading failure impact
import { analyzeFailure } from './FailureAnalyzer.js';

export class FailurePanel {
  constructor(diagram) {
    this.diagram = diagram;
    this.visible = false;
    this.el = null;
    this._failureOverlay = null; // { targetId, impacted[] }
    this._create();
  }

  _create() {
    this.el = document.createElement('div');
    this.el.className = 'failure-panel';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
  }

  toggle() {
    this.visible = !this.visible;
    if (this.visible) {
      this._failureOverlay = null;
      this.update();
      this.el.style.display = 'block';
    } else {
      this.el.style.display = 'none';
      this._clearOverlay();
    }
  }

  _clearOverlay() {
    this._failureOverlay = null;
    // Reset all node failure highlights
    for (const node of this.diagram.nodes) {
      node._failState = null;
    }
    this.diagram.render();
  }

  _getSeverity(impactPercent) {
    if (impactPercent >= 60) return 'critical';
    if (impactPercent >= 30) return 'high';
    if (impactPercent >= 10) return 'medium';
    return 'low';
  }

  _renderChain(chain) {
    const nodes = this.diagram.nodes;
    return `<div class="failure-chain">${chain.map((id, i) => {
      const n = nodes.find(x => x.id === id);
      const label = n?.label || id;
      const cls = i === 0 ? 'source' : 'impacted';
      const arrow = i < chain.length - 1 ? '<span class="failure-chain-arrow">→</span>' : '';
      return `<span class="failure-chain-node ${cls}">${label}</span>${arrow}`;
    }).join('')}</div>`;
  }

  update() {
    if (!this.visible) return;

    const nodeOptions = this.diagram.nodes.map(n =>
      `<option value="${n.id}"${this._failureOverlay?.targetId === n.id ? ' selected' : ''}>${n.label} (${n.type})</option>`
    ).join('');

    let resultHtml = '';
    if (this._failureOverlay) {
      const fo = this._failureOverlay;
      const result = analyzeFailure(fo.targetId, this.diagram.nodes, this.diagram.connections);
      const targetNode = this.diagram.nodes.find(n => n.id === fo.targetId);
      const severity = this._getSeverity(result.impactPercent);

      resultHtml = `
        <div style="margin-top:12px;padding:12px;background:var(--bg-2);border-radius:8px;border:1px solid #ef444440">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-weight:600;color:#ef4444">
              ⚠️ ${targetNode?.label || 'Unknown'} fails
            </div>
            <span class="failure-severity ${severity}">${severity}</span>
          </div>
          <div style="display:flex;gap:16px;margin-bottom:10px">
            <div style="text-align:center">
              <div style="font-size:22px;font-weight:700;color:#ef4444">${result.impactCount}</div>
              <div style="font-size:10px;color:var(--text-2)">Impacted</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:22px;font-weight:700;color:#f59e0b">${result.impactPercent}%</div>
              <div style="font-size:10px;color:var(--text-2)">of System</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:22px;font-weight:700;color:var(--text-1)">${result.totalNodes}</div>
              <div style="font-size:10px;color:var(--text-2)">Total</div>
            </div>
          </div>
          ${result.chains.length > 0 ? `
            <div style="font-size:11px;font-weight:600;color:var(--text-2);margin-bottom:6px">Cascade Paths:</div>
            <div style="max-height:140px;overflow-y:auto">
              ${result.chains.slice(0, 10).map(chain => this._renderChain(chain)).join('')}
              ${result.chains.length > 10 ? `<div style="font-size:10px;color:var(--text-2);padding:4px 0">... and ${result.chains.length - 10} more paths</div>` : ''}
            </div>
          ` : '<div style="font-size:11px;color:#22c55e">✓ No downstream impact — this component is a leaf node</div>'}
        </div>
      `;
    }

    this.el.innerHTML = `
      <div class="cost-panel-header">
        <span>💥 Failure Analysis</span>
        <button class="cost-panel-close" id="failure-close">×</button>
      </div>
      <div style="padding:12px">
        <label style="font-size:11px;color:var(--text-2);display:block;margin-bottom:4px">What if this component fails?</label>
        <select class="props-input" id="failure-target" style="margin-bottom:4px">
          <option value="">— Select a component —</option>
          ${nodeOptions}
        </select>
        <button class="props-delete-btn" id="failure-analyze" style="background:#ef444420;color:#ef4444;border:1px solid #ef444440;margin-top:4px">
          ⚡ Analyze Failure
        </button>
        ${resultHtml}
      </div>
    `;

    this.el.querySelector('#failure-close')?.addEventListener('click', () => this.toggle());
    this.el.querySelector('#failure-analyze')?.addEventListener('click', () => {
      const targetId = document.getElementById('failure-target')?.value;
      if (!targetId) return;

      const result = analyzeFailure(targetId, this.diagram.nodes, this.diagram.connections);

      // Apply visual overlay
      for (const node of this.diagram.nodes) {
        if (node.id === targetId) node._failState = 'failed';
        else if (result.impacted.includes(node.id)) node._failState = 'impacted';
        else node._failState = 'healthy';
      }

      this._failureOverlay = { targetId };
      this.diagram.render();
      this.update();
    });
  }
}
