import { findComponent } from '../palette/componentRegistry.js';

let _idCounter = 0;
export function generateId() { return `node_${++_idCounter}`; }
export function resetIdCounter(val = 0) { _idCounter = val; }

export class Node {
  constructor({ id, type, label, x, y, color, description, specs }) {
    this.id = id || generateId();
    this.type = type;
    this.label = label || type;
    this.x = x || 0;
    this.y = y || 0;
    this.width = 160;
    this.height = 70;
    this.color = color || '#8b5cf6';
    this.description = description || '';
    this.specs = specs || null; // vCPUs, ramGB, replicas, storageGB, etc.
    this.selected = false;
    this.simState = null; // Set by SimulationEngine when active
    this.ports = {
      top:    { x: 0, y: 0 },
      bottom: { x: 0, y: 0 },
      left:   { x: 0, y: 0 },
      right:  { x: 0, y: 0 },
    };
    this._updatePorts();
  }

  _updatePorts() {
    this.ports.top    = { x: this.x + this.width / 2, y: this.y };
    this.ports.bottom = { x: this.x + this.width / 2, y: this.y + this.height };
    this.ports.left   = { x: this.x,                  y: this.y + this.height / 2 };
    this.ports.right  = { x: this.x + this.width,     y: this.y + this.height / 2 };
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
    this._updatePorts();
  }

  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  getPortAt(px, py, threshold = 14) {
    for (const [name, port] of Object.entries(this.ports)) {
      const dx = px - port.x;
      const dy = py - port.y;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) {
        return name;
      }
    }
    return null;
  }

  getNearestPort(px, py) {
    let minDist = Infinity;
    let nearest = 'top';
    for (const [name, port] of Object.entries(this.ports)) {
      const dx = px - port.x;
      const dy = py - port.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = name;
      }
    }
    return nearest;
  }

  draw(ctx, scale = 1) {
    const comp = findComponent(this.type);
    const color = this.color || (comp ? comp.color : '#8b5cf6');
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;
    const r = 10;

    // Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // Body
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = '#1e2130';
    ctx.fill();
    ctx.restore();

    // Color accent bar on top
    ctx.beginPath();
    ctx.roundRect(x, y, w, 4, [r, r, 0, 0]);
    ctx.fillStyle = color;
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.strokeStyle = this.selected ? '#818cf8' : '#2e3347';
    ctx.lineWidth = this.selected ? 2 : 1;
    ctx.stroke();

    // Selection glow
    if (this.selected) {
      ctx.save();
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.strokeStyle = 'rgba(99,102,241,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Icon circle
    const iconSize = 28;
    const iconX = x + 14;
    const iconY = y + h / 2 - iconSize / 2;
    ctx.beginPath();
    ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = color + '22';
    ctx.fill();

    // Icon (simplified - draw letter)
    ctx.fillStyle = color;
    ctx.font = `bold ${14}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const letter = this.label.charAt(0).toUpperCase();
    ctx.fillText(letter, iconX + iconSize / 2, iconY + iconSize / 2 + 1);

    // Label
    ctx.fillStyle = '#e8eaf0';
    ctx.font = `600 ${13}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const labelX = iconX + iconSize + 10;
    const maxLabelW = w - (labelX - x) - 10;
    ctx.save();
    ctx.beginPath();
    ctx.rect(labelX, y, maxLabelW, h);
    ctx.clip();
    ctx.fillText(this.label, labelX, y + h / 2 - (this.description ? 6 : 0));

    // Description
    if (this.description) {
      ctx.fillStyle = '#6b7280';
      ctx.font = `400 ${11}px Inter, sans-serif`;
      ctx.fillText(this.description, labelX, y + h / 2 + 10);
    }
    ctx.restore();

    // Simulation overlay
    if (this.simState) {
      this._drawSimState(ctx, x, y, w, h, color);
    }

    // Replica badge
    const replicas = this.specs?.replicas || this.specs?.nodes || this.specs?.instances || this.specs?.brokers || 0;
    if (replicas > 1) {
      const badgeText = `×${replicas}`;
      ctx.font = 'bold 10px Inter, sans-serif';
      const tw = ctx.measureText(badgeText).width;
      const bw = tw + 8;
      const bh = 16;
      const bx = x + w - bw - 4;
      const by = y + 8;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 4);
      ctx.fillStyle = color + 'cc';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, bx + bw / 2, by + bh / 2);
    }

    // Fail state overlay
    if (this._failState) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      if (this._failState === 'failed') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Red X
        ctx.font = '700 40px Inter, sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('✕', x + w / 2, y + h / 2 + 15);
      } else if (this._failState === 'impacted') {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Warning Icon
        ctx.font = '700 30px Inter, sans-serif';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️', x + w / 2, y + h / 2 + 10);
      }
      ctx.restore();
    }

    // Ports (drawn when hovered or selected)
    if (this.selected) {
      this._drawPorts(ctx, color);
    }
  }

  _drawPorts(ctx, color) {
    const portR = 5;
    for (const port of Object.values(this.ports)) {
      ctx.beginPath();
      ctx.arc(port.x, port.y, portR, 0, Math.PI * 2);
      ctx.fillStyle = '#1e2130';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  _drawSimState(ctx, x, y, w, h, nodeColor) {
    const state = this.simState;
    const statusColors = { healthy: '#22c55e', warning: '#f59e0b', error: '#ef4444' };
    const statusColor = statusColors[state.status] || '#22c55e';

    // Status badge (top-right corner)
    const badgeR = 5;
    const badgeX = x + w - 10;
    const badgeY = y + 10;

    ctx.save();
    // Pulse glow
    if (state.pulseAlpha > 0) {
      ctx.shadowColor = statusColor;
      ctx.shadowBlur = 12 * state.pulseAlpha;
    }
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = statusColor;
    ctx.fill();

    // Pulse ring
    if (state.pulseAlpha > 0.1) {
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR + 4 * state.pulseAlpha, 0, Math.PI * 2);
      ctx.strokeStyle = statusColor;
      ctx.globalAlpha = state.pulseAlpha * 0.6;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Mini-metrics bar below node
    const metrics = state.metrics;
    if (metrics.length === 0) return;

    // Show top 2 metrics
    const display = metrics.slice(0, 2);
    const metricText = display.map(m => {
      const val = m.precision > 0 ? m.current.toFixed(m.precision) : Math.round(m.current);
      return `${m.label}: ${val}${m.unit ? m.unit : ''}`;
    }).join('  •  ');

    const metricY = y + h + 6;
    const fontSize = 9;

    ctx.save();
    ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`;
    const textWidth = ctx.measureText(metricText).width;
    const padding = 6;
    const boxW = textWidth + padding * 2;
    const boxH = fontSize + padding * 2 - 2;
    const boxX = x + (w - boxW) / 2;

    // Background pill
    ctx.beginPath();
    ctx.roundRect(boxX, metricY, boxW, boxH, 4);
    ctx.fillStyle = 'rgba(15, 17, 23, 0.85)';
    ctx.fill();
    ctx.strokeStyle = statusColor + '44';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Metric text
    ctx.fillStyle = '#9ca3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(metricText, boxX + boxW / 2, metricY + boxH / 2);
    ctx.restore();
  }

  toJSON() {
    const data = {
      id: this.id, type: this.type, label: this.label,
      x: this.x, y: this.y, color: this.color,
      description: this.description,
    };
    if (this.specs) data.specs = { ...this.specs };
    return data;
  }

  static fromJSON(data) {
    return new Node(data);
  }
}
