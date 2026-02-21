let _groupIdCounter = 0;
export function generateGroupId() { return `group_${++_groupIdCounter}`; }
export function resetGroupIdCounter(val = 0) { _groupIdCounter = val; }

const GROUP_TYPES = {
  region:       { label: 'Region',             icon: '🌏', defaultColor: '#3b82f6', borderStyle: 'dashed', headerHeight: 28 },
  vpc:          { label: 'VPC',                icon: '🔒', defaultColor: '#6366f1', borderStyle: 'solid',  headerHeight: 28 },
  az:           { label: 'Availability Zone',  icon: '🏢', defaultColor: '#8b5cf6', borderStyle: 'dashed', headerHeight: 24 },
  microservice: { label: 'Microservice',       icon: '📦', defaultColor: '#22c55e', borderStyle: 'solid',  headerHeight: 28 },
  security:     { label: 'Security Zone',      icon: '🛡️', defaultColor: '#ef4444', borderStyle: 'solid',  headerHeight: 28 },
  custom:       { label: 'Custom Group',       icon: '📁', defaultColor: '#64748b', borderStyle: 'solid',  headerHeight: 28 },
};

export { GROUP_TYPES };

export class Group {
  constructor({ id, type, label, x, y, width, height, color, subtitle }) {
    this.id = id || generateGroupId();
    this.type = type || 'custom';
    const typeInfo = GROUP_TYPES[this.type] || GROUP_TYPES.custom;
    this.label = label || typeInfo.label;
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 400;
    this.height = height || 300;
    this.color = color || typeInfo.defaultColor;
    this.subtitle = subtitle || ''; // e.g., "10.0.0.0/16" for VPC, "ap-southeast-1" for region
    this.childNodeIds = [];
    this.selected = false;
  }

  get headerHeight() {
    return (GROUP_TYPES[this.type] || GROUP_TYPES.custom).headerHeight;
  }

  get borderStyle() {
    return (GROUP_TYPES[this.type] || GROUP_TYPES.custom).borderStyle;
  }

  get icon() {
    return (GROUP_TYPES[this.type] || GROUP_TYPES.custom).icon;
  }

  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  headerContainsPoint(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.headerHeight;
  }

  containsNode(node) {
    return node.x >= this.x + 10 &&
           node.x + node.width <= this.x + this.width - 10 &&
           node.y >= this.y + this.headerHeight + 5 &&
           node.y + node.height <= this.y + this.height - 10;
  }

  addNode(nodeId) {
    if (!this.childNodeIds.includes(nodeId)) {
      this.childNodeIds.push(nodeId);
    }
  }

  removeNode(nodeId) {
    this.childNodeIds = this.childNodeIds.filter(id => id !== nodeId);
  }

  // Auto-resize to fit children with padding
  autoResize(nodes) {
    const children = nodes.filter(n => this.childNodeIds.includes(n.id));
    if (children.length === 0) return;

    const pad = 20;
    const headerH = this.headerHeight;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const n of children) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }

    this.x = minX - pad;
    this.y = minY - headerH - pad;
    this.width = Math.max(200, maxX - minX + pad * 2);
    this.height = Math.max(150, maxY - minY + headerH + pad * 2);
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
  }

  // Move group + all children
  moveWithChildren(dx, dy, nodes) {
    this.x += dx;
    this.y += dy;
    for (const node of nodes) {
      if (this.childNodeIds.includes(node.id)) {
        node.moveTo(node.x + dx, node.y + dy);
      }
    }
  }

  // Get resize handle at point (returns handle name or null)
  getResizeHandleAt(px, py) {
    const s = 8; // handle size
    const r = this.x + this.width;
    const b = this.y + this.height;

    if (px >= r - s && px <= r + s && py >= b - s && py <= b + s) return 'se';
    if (px >= r - s && px <= r + s && py >= this.y - s && py <= this.y + s) return 'ne';
    if (px >= this.x - s && px <= this.x + s && py >= b - s && py <= b + s) return 'sw';
    return null;
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;
    const r = 12;
    const hh = this.headerHeight;
    const color = this.color;

    ctx.save();

    // Container body — semi-transparent fill
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = color + '08'; // very subtle fill
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.strokeStyle = color + '40';
    ctx.lineWidth = this.selected ? 2 : 1.5;
    if (this.borderStyle === 'dashed') {
      ctx.setLineDash([8, 4]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Selection highlight
    if (this.selected) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.strokeStyle = color + '60';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Header bar
    ctx.beginPath();
    ctx.roundRect(x, y, w, hh, [r, r, 0, 0]);
    ctx.fillStyle = color + '18';
    ctx.fill();

    // Header bottom border
    ctx.beginPath();
    ctx.moveTo(x, y + hh);
    ctx.lineTo(x + w, y + hh);
    ctx.strokeStyle = color + '30';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Icon + Label
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    const labelY = y + hh / 2;
    ctx.fillText(`${this.icon} ${this.label}`, x + 10, labelY);

    // Subtitle (e.g., CIDR, region name)
    if (this.subtitle) {
      const labelW = ctx.measureText(`${this.icon} ${this.label}`).width;
      ctx.font = '400 10px Inter, sans-serif';
      ctx.fillStyle = color + '80';
      ctx.fillText(this.subtitle, x + 10 + labelW + 8, labelY);
    }

    // Resize handle (bottom-right)
    if (this.selected) {
      const handleSize = 6;
      ctx.beginPath();
      ctx.rect(x + w - handleSize, y + h - handleSize, handleSize * 2, handleSize * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.restore();
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      color: this.color,
      subtitle: this.subtitle,
      childNodeIds: [...this.childNodeIds],
    };
  }

  static fromJSON(data) {
    const g = new Group(data);
    g.childNodeIds = data.childNodeIds || [];
    return g;
  }
}
