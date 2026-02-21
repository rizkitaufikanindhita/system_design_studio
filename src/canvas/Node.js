import { findComponent } from '../palette/componentRegistry.js';

let _idCounter = 0;
export function generateId() { return `node_${++_idCounter}`; }
export function resetIdCounter(val = 0) { _idCounter = val; }

export class Node {
  constructor({ id, type, label, x, y, color, description }) {
    this.id = id || generateId();
    this.type = type;
    this.label = label || type;
    this.x = x || 0;
    this.y = y || 0;
    this.width = 160;
    this.height = 70;
    this.color = color || '#8b5cf6';
    this.description = description || '';
    this.selected = false;
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

  toJSON() {
    return {
      id: this.id, type: this.type, label: this.label,
      x: this.x, y: this.y, color: this.color,
      description: this.description,
    };
  }

  static fromJSON(data) {
    return new Node(data);
  }
}
