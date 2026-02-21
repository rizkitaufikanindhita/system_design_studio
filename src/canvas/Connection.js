let _connIdCounter = 0;
export function generateConnId() { return `conn_${++_connIdCounter}`; }
export function resetConnIdCounter(val = 0) { _connIdCounter = val; }

// Protocol color scheme
const PROTOCOL_COLORS = {
  REST:     '#3b82f6',
  gRPC:     '#8b5cf6',
  GraphQL:  '#ec4899',
  WebSocket:'#22c55e',
  Kafka:    '#f59e0b',
  RabbitMQ: '#f97316',
  TCP:      '#64748b',
  UDP:      '#94a3b8',
};

export class Connection {
  constructor({ id, fromNodeId, fromPort, toNodeId, toPort, label, style,
                protocol, dataFormat, direction, isAsync }) {
    this.id = id || generateConnId();
    this.fromNodeId = fromNodeId;
    this.fromPort = fromPort || 'right';
    this.toNodeId = toNodeId;
    this.toPort = toPort || 'left';
    this.label = label || '';
    this.style = style || 'solid'; // solid | dashed
    this.protocol = protocol || '';     // REST, gRPC, GraphQL, WebSocket, Kafka, RabbitMQ, TCP, UDP
    this.dataFormat = dataFormat || ''; // JSON, Protobuf, Avro, XML, Binary
    this.direction = direction || 'unidirectional'; // unidirectional | bidirectional
    this.isAsync = isAsync || false;
    this.selected = false;
    this.simPackets = null;
  }

  get protocolColor() {
    return PROTOCOL_COLORS[this.protocol] || null;
  }

  get effectiveStyle() {
    if (this.isAsync) return 'dashed';
    return this.style;
  }

  _getControlPoints(from, to) {
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

    return { cp1x, cp1y, cp2x, cp2y };
  }

  _bezierPoint(t, p0, p1, p2, p3) {
    const u = 1 - t;
    return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
  }

  draw(ctx, nodes) {
    const fromNode = nodes.find(n => n.id === this.fromNodeId);
    const toNode = nodes.find(n => n.id === this.toNodeId);
    if (!fromNode || !toNode) return;

    const from = fromNode.ports[this.fromPort];
    const to = toNode.ports[this.toPort];
    if (!from || !to) return;

    const pColor = this.protocolColor;
    const baseColor = this.selected ? '#818cf8' : (pColor || '#4b5563');
    const lineWidth = this.selected ? 2.5 : 1.8;

    ctx.save();

    const { cp1x, cp1y, cp2x, cp2y } = this._getControlPoints(from, to);

    // Line
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x, to.y);
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = lineWidth;
    if (this.effectiveStyle === 'dashed') {
      ctx.setLineDash([6, 4]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow head (to)
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
    ctx.fillStyle = baseColor;
    ctx.fill();

    // Bidirectional: arrow at from
    if (this.direction === 'bidirectional') {
      const angle2 = Math.atan2(from.y - cp1y, from.x - cp1x);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(
        from.x - arrowLen * Math.cos(angle2 - Math.PI / 6),
        from.y - arrowLen * Math.sin(angle2 - Math.PI / 6)
      );
      ctx.lineTo(
        from.x - arrowLen * Math.cos(angle2 + Math.PI / 6),
        from.y - arrowLen * Math.sin(angle2 + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();
    }

    // Midpoint for badges
    const midX = this._bezierPoint(0.5, from.x, cp1x, cp2x, to.x);
    const midY = this._bezierPoint(0.5, from.y, cp1y, cp2y, to.y);

    // Protocol badge
    if (this.protocol) {
      this._drawProtocolBadge(ctx, midX, midY - (this.label ? 12 : 0));
    }

    // Label (below protocol badge if both exist)
    if (this.label) {
      const labelY = midY + (this.protocol ? 12 : 0);
      this._drawLabel(ctx, midX, labelY);
    }

    // Data format sub-label
    if (this.dataFormat && (this.protocol || this.label)) {
      const subY = midY + (this.protocol ? 12 : 0) + (this.label ? 14 : 0);
      ctx.font = '400 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#64748b';
      ctx.fillText(this.dataFormat, midX, subY);
    }

    // Async indicator
    if (this.isAsync && !this.protocol) {
      ctx.font = '600 8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f59e0b';
      const asyncY = midY - (this.label ? 14 : 0);
      ctx.fillText('ASYNC', midX, asyncY);
    }

    // Simulation packets
    if (this.simPackets && this.simPackets.length > 0) {
      this._drawPackets(ctx, from, to, cp1x, cp1y, cp2x, cp2y);
    }

    ctx.restore();
  }

  _drawProtocolBadge(ctx, x, y) {
    const color = this.protocolColor || '#64748b';
    const text = this.protocol;
    ctx.font = '600 9px Inter, sans-serif';
    const textW = ctx.measureText(text).width;
    const pad = 5;
    const h = 16;
    const w = textW + pad * 2;

    // Badge background
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 8);
    ctx.fillStyle = color + '20';
    ctx.fill();
    ctx.strokeStyle = color + '60';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Badge text
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  _drawLabel(ctx, x, y) {
    const labelPad = 6;
    ctx.font = '500 11px Inter, sans-serif';
    const textW = ctx.measureText(this.label).width;

    ctx.fillStyle = '#1a1d27';
    ctx.beginPath();
    ctx.roundRect(x - textW / 2 - labelPad, y - 8 - labelPad,
                  textW + labelPad * 2, 16 + labelPad, 4);
    ctx.fill();
    ctx.strokeStyle = '#2e3347';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#9ca3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, x, y);
  }

  _drawPackets(ctx, from, to, cp1x, cp1y, cp2x, cp2y) {
    for (const packet of this.simPackets) {
      const t = Math.max(0, Math.min(1, packet.t));
      const px = this._bezierPoint(t, from.x, cp1x, cp2x, to.x);
      const py = this._bezierPoint(t, from.y, cp1y, cp2y, to.y);

      ctx.save();
      ctx.shadowColor = packet.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(px, py, packet.size, 0, Math.PI * 2);
      ctx.fillStyle = packet.color;
      ctx.fill();
      ctx.restore();
    }
  }

  hitTest(px, py, nodes) {
    const fromNode = nodes.find(n => n.id === this.fromNodeId);
    const toNode = nodes.find(n => n.id === this.toNodeId);
    if (!fromNode || !toNode) return false;

    const from = fromNode.ports[this.fromPort];
    const to = toNode.ports[this.toPort];
    if (!from || !to) return false;

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
      protocol: this.protocol, dataFormat: this.dataFormat,
      direction: this.direction, isAsync: this.isAsync,
    };
  }

  static fromJSON(data) {
    return new Connection(data);
  }
}
