let _connIdCounter = 0;
export function generateConnId() { return `conn_${++_connIdCounter}`; }
export function resetConnIdCounter(val = 0) { _connIdCounter = val; }

export class Connection {
  constructor({ id, fromNodeId, fromPort, toNodeId, toPort, label, style }) {
    this.id = id || generateConnId();
    this.fromNodeId = fromNodeId;
    this.fromPort = fromPort || 'right';
    this.toNodeId = toNodeId;
    this.toPort = toPort || 'left';
    this.label = label || '';
    this.style = style || 'solid'; // solid | dashed
    this.selected = false;
  }

  draw(ctx, nodes) {
    const fromNode = nodes.find(n => n.id === this.fromNodeId);
    const toNode = nodes.find(n => n.id === this.toNodeId);
    if (!fromNode || !toNode) return;

    const from = fromNode.ports[this.fromPort];
    const to = toNode.ports[this.toPort];
    if (!from || !to) return;

    const color = this.selected ? '#818cf8' : '#4b5563';
    const lineWidth = this.selected ? 2.5 : 1.8;

    ctx.save();

    // Bezier control points
    const dx = Math.abs(to.x - from.x) * 0.5;
    const dy = Math.abs(to.y - from.y) * 0.5;

    let cp1x, cp1y, cp2x, cp2y;

    if (this.fromPort === 'right' || this.fromPort === 'left') {
      const dir = this.fromPort === 'right' ? 1 : -1;
      cp1x = from.x + dir * Math.max(dx, 40);
      cp1y = from.y;
    } else {
      cp1x = from.x;
      const dir = this.fromPort === 'bottom' ? 1 : -1;
      cp1y = from.y + dir * Math.max(dy, 40);
    }

    if (this.toPort === 'right' || this.toPort === 'left') {
      const dir = this.toPort === 'right' ? 1 : -1;
      cp2x = to.x + dir * Math.max(dx, 40);
      cp2y = to.y;
    } else {
      cp2x = to.x;
      const dir = this.toPort === 'bottom' ? 1 : -1;
      cp2y = to.y + dir * Math.max(dy, 40);
    }

    // Line
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x, to.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    if (this.style === 'dashed') {
      ctx.setLineDash([6, 4]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow head
    const angle = Math.atan2(to.y - cp2y, to.x - cp2x);
    const arrowLen = 10;
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - arrowLen * Math.cos(angle - Math.PI / 6),
      to.y - arrowLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - arrowLen * Math.cos(angle + Math.PI / 6),
      to.y - arrowLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Label
    if (this.label) {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const labelPad = 6;
      ctx.font = '500 11px Inter, sans-serif';
      const textW = ctx.measureText(this.label).width;

      // Background
      ctx.fillStyle = '#1a1d27';
      ctx.beginPath();
      ctx.roundRect(midX - textW / 2 - labelPad, midY - 8 - labelPad,
                    textW + labelPad * 2, 16 + labelPad, 4);
      ctx.fill();
      ctx.strokeStyle = '#2e3347';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text
      ctx.fillStyle = '#9ca3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.label, midX, midY);
    }

    ctx.restore();
  }

  hitTest(px, py, nodes) {
    const fromNode = nodes.find(n => n.id === this.fromNodeId);
    const toNode = nodes.find(n => n.id === this.toNodeId);
    if (!fromNode || !toNode) return false;

    const from = fromNode.ports[this.fromPort];
    const to = toNode.ports[this.toPort];
    if (!from || !to) return false;

    // Simple proximity test along the line
    const threshold = 8;
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mx = (1 - t) * from.x + t * to.x;
      const my = (1 - t) * from.y + t * to.y;
      const dx = px - mx;
      const dy = py - my;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) return true;
    }
    return false;
  }

  toJSON() {
    return {
      id: this.id, fromNodeId: this.fromNodeId, fromPort: this.fromPort,
      toNodeId: this.toNodeId, toPort: this.toPort,
      label: this.label, style: this.style,
    };
  }

  static fromJSON(data) {
    return new Connection(data);
  }
}
