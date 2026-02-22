// SLA Panel — displays system availability calculation with nines badge and weakest link
import { calculateSystemSla } from './SlaCalculator.js';

export class SlaPanel {
  constructor(diagram) {
    this.diagram = diagram;
    this.visible = false;
    this.el = null;
    this._create();
  }

  _create() {
    this.el = document.createElement('div');
    this.el.className = 'sla-panel';
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

  _getNinesTier(nines) {
    const n = parseFloat(nines);
    if (isNaN(n)) return { tier: 'excellent', label: '∞ Nines' };
    if (n >= 4) return { tier: 'excellent', label: `${nines} Nines` };
    if (n >= 3) return { tier: 'good', label: `${nines} Nines` };
    if (n >= 2) return { tier: 'fair', label: `${nines} Nines` };
    return { tier: 'poor', label: `${nines} Nines` };
  }

  update() {
    if (!this.visible) return;
    const result = calculateSystemSla(this.diagram.nodes, this.diagram.connections);
    const ninesTier = this._getNinesTier(result.nines);

    const rows = result.perComponent.map(c => {
      const slaColor = c.effectiveSla >= 0.9999 ? '#22c55e' :
                        c.effectiveSla >= 0.999 ? '#f59e0b' : '#ef4444';
      return `
        <tr>
          <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${c.label}">${c.label}</td>
          <td style="text-align:center">${c.replicas > 1 ? `×${c.replicas}` : '—'}</td>
          <td style="text-align:right;color:${slaColor};font-weight:600">${(c.effectiveSla * 100).toFixed(3)}%</td>
        </tr>
      `;
    }).join('');

    const slaColor = result.sla >= 0.9999 ? '#22c55e' :
                      result.sla >= 0.999 ? '#f59e0b' : '#ef4444';

    // Find weakest link
    const weakest = result.perComponent.length > 0 ? result.perComponent[0] : null;
    const weakestHtml = weakest ? `
      <div class="sla-weakest">
        <strong>⚠ Weakest link:</strong> ${weakest.label} (${(weakest.effectiveSla * 100).toFixed(3)}%)
        ${weakest.replicas <= 1 ? `<br><span style="font-size:10px;color:var(--text-2)">💡 Adding replicas would improve availability to ${(((1 - Math.pow(1 - weakest.baseSla, 2)) * 100).toFixed(4))}%</span>` : ''}
      </div>
    ` : '';

    this.el.innerHTML = `
      <div class="cost-panel-header">
        <span>📊 SLA / Availability</span>
        <button class="cost-panel-close" id="sla-close">×</button>
      </div>
      <div class="cost-panel-total" style="flex-direction:column;gap:12px;">
        <div style="display:flex;gap:20px;align-items:center;">
          <div style="text-align:center">
            <div style="color:var(--text-2);font-size:11px">System SLA</div>
            <div style="font-size:22px;font-weight:700;color:${slaColor}">${result.slaPercent}</div>
          </div>
          <div style="text-align:center">
            <div style="color:var(--text-2);font-size:11px">Rating</div>
            <div class="sla-nines-badge ${ninesTier.tier}">${ninesTier.label}</div>
          </div>
          <div style="text-align:center">
            <div style="color:var(--text-2);font-size:11px">Monthly Downtime</div>
            <div style="font-size:22px;font-weight:700;color:${slaColor}">${result.downtime}</div>
          </div>
        </div>
        ${weakestHtml}
      </div>
      <div class="cost-panel-table">
        <table>
          <thead><tr>
            <th>Component</th><th style="text-align:center">Replicas</th><th style="text-align:right">SLA</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="3" style="text-align:center;opacity:0.4;padding:16px">No components</td></tr>'}</tbody>
        </table>
      </div>
      <div style="padding:8px 12px;font-size:9px;opacity:0.35;text-align:center">
        Series topology assumed. Adding replicas improves per-component SLA.
      </div>
    `;

    this.el.querySelector('#sla-close')?.addEventListener('click', () => this.toggle());
  }
}
