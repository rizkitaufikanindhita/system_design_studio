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

  update() {
    if (!this.visible) return;

    const nodeOptions = this.diagram.nodes.map(n =>
      `<option value="${n.id}">${n.label} (${n.type})</option>`
    ).join('');

    let resultHtml = '';
    if (this._failureOverlay) {
      const fo = this._failureOverlay;
      const result = analyzeFailure(fo.targetId, this.diagram.nodes, this.diagram.connections);
      const targetNode = this.diagram.nodes.find(n => n.id === fo.targetId);

      resultHtml = `
        <div style="margin-top:12px;padding:10px;background:var(--bg-2);border-radius:8px;border:1px solid #ef444440">
          <div style="font-weight:600;color:#ef4444;margin-bottom:6px">
            ⚠️ ${targetNode?.label || 'Unknown'} fails
          </div>
          <div style="display:flex;gap:16px;margin-bottom:8px">
            <div style="text-align:center">
              <div style="font-size:20px;font-weight:700;color:#ef4444">${result.impactCount}</div>
              <div style="font-size:10px;color:var(--text-2)">Impacted</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:20px;font-weight:700;color:#f59e0b">${result.impactPercent}%</div>
              <div style="font-size:10px;color:var(--text-2)">of System</div>
            </div>
          </div>
          ${result.impacted.length > 0 ? `
            <div style="font-size:11px;color:var(--text-2);margin-bottom:4px">Cascading impact:</div>
            <div style="max-height:120px;overflow-y:auto">
              ${result.impacted.map(id => {
                const n = this.diagram.nodes.find(x => x.id === id);
                return `<div style="font-size:11px;padding:2px 0;color:var(--text-1)">
                  <span style="color:#ef4444">✕</span> ${n?.label || id}
                </div>`;
              }).join('')}
            </div>
          ` : '<div style="font-size:11px;color:#22c55e">✓ No downstream impact</div>'}
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
          Analyze Failure
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
