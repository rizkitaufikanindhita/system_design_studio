import { getSimConfig, getDefaultSpecs, SCENARIOS } from './simulationConfigs.js';

export class SimulationEngine {
  constructor(diagram) {
    this.diagram = diagram;
    this.state = 'idle'; // idle | running | paused
    this.speed = 1.0;
    this.scenario = 'normal';
    this._rafId = null;
    this._lastTime = 0;
    this._elapsed = 0;

    // User-configurable parameters
    this.userParams = {
      concurrentUsers: 1000,
      readRatio: 80,      // 80% read, 20% write
      dataSizeKB: 2,      // KB per request
    };

    // Per-node simulation state: Map<nodeId, { metrics: [...], status, pulseAlpha }>
    this.nodeStates = new Map();
    // Per-connection packets: Map<connId, [{ t, color, size }]>
    this.connPackets = new Map();

    // Callbacks
    this.onStateChange = null;
    this.onTick = null;
  }

  start() {
    if (this.state === 'running') return;
    this.state = 'running';
    this._initNodeStates();
    this._lastTime = performance.now();
    this._elapsed = 0;
    this._tick();
    this._notify();
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
    this._notify();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this._lastTime = performance.now();
    this._tick();
    this._notify();
  }

  stop() {
    this.state = 'idle';
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
    this.nodeStates.clear();
    this.connPackets.clear();
    // Clear sim state from nodes and connections
    for (const node of this.diagram.nodes) {
      node.simState = null;
    }
    for (const conn of this.diagram.connections) {
      conn.simPackets = null;
    }
    this.diagram.render();
    this._notify();
  }

  setSpeed(multiplier) {
    this.speed = Math.max(0.25, Math.min(4, multiplier));
    this._notify();
  }

  setScenario(name) {
    if (SCENARIOS[name]) {
      this.scenario = name;
      this._notify();
    }
  }

  getScenario() {
    return SCENARIOS[this.scenario];
  }

  setUserParams(params) {
    Object.assign(this.userParams, params);
    // Don't call _notify() here — it triggers a full panel re-render
    // which destroys the slider DOM mid-drag. Slider handlers update UI directly.
  }

  getUserParams() {
    return { ...this.userParams };
  }

  getDerivedStats() {
    const p = this.userParams;
    const reqPerUserPerSec = 0.5; // 1 request per 2 seconds per user
    const totalQPS = p.concurrentUsers * reqPerUserPerSec;
    const readQPS = totalQPS * (p.readRatio / 100);
    const writeQPS = totalQPS * (1 - p.readRatio / 100);
    const bandwidthMBps = (totalQPS * p.dataSizeKB) / 1024;
    return { totalQPS, readQPS, writeQPS, bandwidthMBps };
  }

  // How much the user params scale the base simulation (1000 users = 1x)
  _getUserLoadFactor() {
    return this.userParams.concurrentUsers / 1000;
  }

  _notify() {
    if (this.onStateChange) this.onStateChange(this.state, this.speed, this.scenario);
  }

  _getNodeCapacity(node) {
    if (!node.specs) return null;
    const config = getSimConfig(node.type);
    if (!config.capacityFn) return null;
    return config.capacityFn(node.specs);
  }

  _initNodeStates() {
    for (const node of this.diagram.nodes) {
      const config = getSimConfig(node.type);
      // Initialize specs if not set
      if (!node.specs && config.specFields && config.specFields.length > 0) {
        node.specs = getDefaultSpecs(node.type);
      }
      const metricsState = config.metrics.map(metric => ({
        ...metric,
        current: metric.min + (metric.max - metric.min) * 0.3,
        target: metric.min + (metric.max - metric.min) * 0.3,
        _nextTargetTime: 0,
      }));
      const state = {
        metrics: metricsState,
        status: 'healthy', // healthy | warning | error
        pulseAlpha: 0,
        config,
      };
      this.nodeStates.set(node.id, state);
      node.simState = state;
    }

    for (const conn of this.diagram.connections) {
      this.connPackets.set(conn.id, []);
      conn.simPackets = [];
    }
  }

  _tick() {
    if (this.state !== 'running') return;

    const now = performance.now();
    const rawDelta = (now - this._lastTime) / 1000; // seconds
    const dt = rawDelta * this.speed;
    this._lastTime = now;
    this._elapsed += dt;

    const scenario = SCENARIOS[this.scenario];

    // Ensure new nodes added during simulation get state
    for (const node of this.diagram.nodes) {
      if (!this.nodeStates.has(node.id)) {
        const config = getSimConfig(node.type);
        const metricsState = config.metrics.map(metric => ({
          ...metric,
          current: metric.min + (metric.max - metric.min) * 0.3,
          target: metric.min + (metric.max - metric.min) * 0.3,
          _nextTargetTime: 0,
        }));
        const state = { metrics: metricsState, status: 'healthy', pulseAlpha: 0, config };
        this.nodeStates.set(node.id, state);
        node.simState = state;
      }
    }

    // Update node metrics
    for (const node of this.diagram.nodes) {
      const state = this.nodeStates.get(node.id);
      if (!state) continue;

      for (const metric of state.metrics) {
        // Periodically pick a new target value
        if (this._elapsed > metric._nextTargetTime) {
          const userFactor = this._getUserLoadFactor();
          const loadFactor = scenario.loadMultiplier * Math.max(0.1, Math.log10(userFactor + 1) + 0.5);
          const range = metric.max - metric.min;
          const baseRatio = 0.2 + Math.random() * 0.4; // 20-60% of range normally
          const loadedRatio = Math.min(1, baseRatio * loadFactor);
          // For percentage metrics like cache hit rate, high load = lower hit rate
          if (metric.unit === '%' && metric.label.includes('Hit')) {
            metric.target = metric.max - range * loadedRatio * 0.3;
          } else {
            metric.target = metric.min + range * loadedRatio;
          }
          // Add some noise
          metric.target += (Math.random() - 0.5) * range * 0.1;
          metric.target = Math.max(metric.min, Math.min(metric.max, metric.target));

          // Apply capacity ceiling from specs
          const capacity = this._getNodeCapacity(node);
          if (capacity) {
            // Scale metric max based on capacity ratio vs default
            const config = this.nodeStates.get(node.id)?.config;
            if (config?.capacityFn) {
              const defaultSpecs = getDefaultSpecs(node.type);
              const defaultCapacity = config.capacityFn(defaultSpecs);
              const capValues = Object.values(capacity);
              const defValues = Object.values(defaultCapacity);
              if (capValues.length > 0 && defValues.length > 0) {
                const capacityRatio = capValues[0] / Math.max(1, defValues[0]);
                // Higher capacity = metrics stay lower (more headroom)
                if (capacityRatio > 0) {
                  metric.target = metric.min + (metric.target - metric.min) / capacityRatio;
                  metric.target = Math.max(metric.min, Math.min(metric.max, metric.target));
                }
              }
            }
          }

          metric._nextTargetTime = this._elapsed + 0.5 + Math.random() * 2;
        }

        // Smooth interpolation toward target
        const lerpSpeed = 2.0 * this.speed;
        metric.current += (metric.target - metric.current) * Math.min(1, lerpSpeed * rawDelta);
      }

      // Determine status
      let worstStatus = 'healthy';
      for (const metric of state.metrics) {
        if (metric.criticalThreshold != null && metric.current >= metric.criticalThreshold) {
          worstStatus = 'error';
          break;
        }
        if (metric.warningThreshold != null && metric.current >= metric.warningThreshold) {
          worstStatus = 'warning';
        }
      }

      // Random failure based on scenario
      if (scenario.failureChance > 0 && Math.random() < scenario.failureChance * rawDelta) {
        worstStatus = Math.random() < 0.3 ? 'error' : 'warning';
      }
      state.status = worstStatus;

      // Pulse animation (decays)
      state.pulseAlpha = Math.max(0, state.pulseAlpha - rawDelta * 3);

      node.simState = state;
    }

    // Update connection packets
    for (const conn of this.diagram.connections) {
      let packets = this.connPackets.get(conn.id);
      if (!packets) {
        packets = [];
        this.connPackets.set(conn.id, packets);
      }

      // Spawn new packets
      const fromNode = this.diagram.nodes.find(n => n.id === conn.fromNodeId);
      if (fromNode) {
        const fromState = this.nodeStates.get(fromNode.id);
        const config = fromState ? fromState.config : { packetRate: 0.5 };
        const userFactor = Math.max(0.3, Math.log10(this._getUserLoadFactor() + 1) + 0.5);
        const rate = config.packetRate * scenario.loadMultiplier * this.speed * userFactor;
        if (Math.random() < rate * rawDelta * 2) {
          const statusColors = {
            healthy: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
          };
          const status = fromState ? fromState.status : 'healthy';
          packets.push({
            t: 0, // 0 to 1 progress along the connection
            color: statusColors[status] || '#818cf8',
            size: 3 + Math.random() * 2,
          });

          // Pulse the source node
          if (fromState) fromState.pulseAlpha = 1;
        }
      }

      // Move packets
      const packetSpeed = (0.3 + Math.random() * 0.1) * this.speed;
      for (const packet of packets) {
        packet.t += packetSpeed * rawDelta;
      }

      // Remove arrived packets & pulse destination
      const arrived = packets.filter(p => p.t >= 1);
      if (arrived.length > 0) {
        const toNode = this.diagram.nodes.find(n => n.id === conn.toNodeId);
        if (toNode) {
          const toState = this.nodeStates.get(toNode.id);
          if (toState) toState.pulseAlpha = Math.min(1, toState.pulseAlpha + 0.3);
        }
      }

      // Keep only active packets
      const activePackets = packets.filter(p => p.t < 1);
      this.connPackets.set(conn.id, activePackets);
      conn.simPackets = activePackets;
    }

    // Re-render
    this.diagram.render();
    if (this.onTick) this.onTick(this._elapsed);

    this._rafId = requestAnimationFrame(() => this._tick());
  }

  // Get aggregate stats
  getSystemStats() {
    let totalRPS = 0;
    let maxLatency = 0;
    let nodeCount = 0;
    let healthyCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    for (const [, state] of this.nodeStates) {
      nodeCount++;
      if (state.status === 'healthy') healthyCount++;
      else if (state.status === 'warning') warningCount++;
      else errorCount++;

      for (const metric of state.metrics) {
        if (metric.label === 'RPS' || metric.label === 'Req/s' || metric.label === 'QPS') {
          totalRPS += metric.current;
        }
        if (metric.label === 'Latency') {
          maxLatency = Math.max(maxLatency, metric.current);
        }
      }
    }

    return { totalRPS, maxLatency, nodeCount, healthyCount, warningCount, errorCount };
  }
}
