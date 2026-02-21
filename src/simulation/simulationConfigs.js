// Simulation configurations per component type
// Each config defines: metrics, spec fields, tiers, capacity functions

export const SCENARIOS = {
  normal:   { label: 'Normal',        loadMultiplier: 1.0, failureChance: 0.01 },
  high:     { label: 'High Load',     loadMultiplier: 2.5, failureChance: 0.05 },
  spike:    { label: 'Traffic Spike', loadMultiplier: 5.0, failureChance: 0.12 },
  failure:  { label: 'Failure',       loadMultiplier: 3.0, failureChance: 0.35 },
};

// metric: { label, unit, min, max, warningThreshold, criticalThreshold, precision }
const m = (label, unit, min, max, warn, crit, precision = 0) => ({
  label, unit, min, max, warningThreshold: warn, criticalThreshold: crit, precision,
});

// Spec field helper
const sel = (key, label, options, def) => ({ key, label, type: 'select', options, default: def });
const num = (key, label, min, max, def) => ({ key, label, type: 'number', min, max, default: def });

export const simulationConfigs = {
  // === Client ===
  browser: {
    metrics: [
      m('Active Users', '', 50, 500, 400, 480),
      m('Req/s', 'rps', 10, 200, 150, 190),
    ],
    packetRate: 0.8,
    role: 'source',
    specFields: [],
    tiers: null,
    capacityFn: null,
  },
  mobile: {
    metrics: [
      m('Active Users', '', 100, 1000, 800, 950),
      m('Req/s', 'rps', 20, 300, 240, 280),
    ],
    packetRate: 0.9,
    role: 'source',
    specFields: [],
    tiers: null,
    capacityFn: null,
  },
  desktop: {
    metrics: [
      m('Active Users', '', 20, 200, 160, 190),
      m('Req/s', 'rps', 5, 100, 80, 95),
    ],
    packetRate: 0.6,
    role: 'source',
    specFields: [],
    tiers: null,
    capacityFn: null,
  },

  // === Networking ===
  loadBalancer: {
    metrics: [
      m('RPS In', 'rps', 100, 5000, 4000, 4800),
      m('RPS Out', 'rps', 100, 5000, 4000, 4800),
      m('Active Conns', '', 50, 2000, 1500, 1900),
    ],
    packetRate: 1.2,
    role: 'passthrough',
    specFields: [
      sel('maxConns', 'Max Connections', [1000, 5000, 10000, 50000, 100000], 10000),
      sel('algorithm', 'Algorithm', ['Round Robin', 'Least Conn', 'IP Hash'], 'Round Robin'),
      num('replicas', 'Replicas', 1, 10, 1),
    ],
    tiers: {
      small:  { maxConns: 1000, algorithm: 'Round Robin', replicas: 1 },
      medium: { maxConns: 10000, algorithm: 'Least Conn', replicas: 1 },
      large:  { maxConns: 100000, algorithm: 'Least Conn', replicas: 2 },
    },
    capacityFn: (s) => ({ maxRPS: Math.round(s.maxConns * 0.5) * s.replicas, maxConns: s.maxConns * s.replicas }),
  },
  apiGateway: {
    metrics: [
      m('RPS', 'rps', 50, 3000, 2400, 2900),
      m('Auth/s', '/s', 50, 3000, 2400, 2900),
      m('Latency', 'ms', 1, 50, 30, 45),
    ],
    packetRate: 1.0,
    role: 'passthrough',
    specFields: [
      sel('rateLimit', 'Rate Limit (/s)', [100, 500, 1000, 5000, 10000], 1000),
      num('replicas', 'Replicas', 1, 10, 1),
    ],
    tiers: {
      small:  { rateLimit: 100, replicas: 1 },
      medium: { rateLimit: 1000, replicas: 1 },
      large:  { rateLimit: 10000, replicas: 2 },
    },
    capacityFn: (s) => ({ maxRPS: s.rateLimit * s.replicas }),
  },
  cdn: {
    metrics: [
      m('Cache Hit', '%', 75, 99, null, null, 1),
      m('Bandwidth', 'MB/s', 10, 500, 400, 480),
    ],
    packetRate: 0.5,
    role: 'passthrough',
    specFields: [
      sel('bandwidth', 'Bandwidth (Gbps)', [1, 5, 10, 50, 100], 10),
    ],
    tiers: {
      small:  { bandwidth: 1 },
      medium: { bandwidth: 10 },
      large:  { bandwidth: 100 },
    },
    capacityFn: (s) => ({ maxBandwidth: s.bandwidth * 125 }), // Gbps → MB/s
  },
  dns: {
    metrics: [
      m('Queries/s', 'qps', 100, 10000, 8000, 9500),
      m('Latency', 'ms', 1, 20, 15, 19),
    ],
    packetRate: 0.3,
    role: 'passthrough',
    specFields: [],
    tiers: null,
    capacityFn: null,
  },
  reverseProxy: {
    metrics: [
      m('RPS', 'rps', 100, 5000, 4000, 4800),
      m('Latency', 'ms', 0.5, 10, 7, 9, 1),
    ],
    packetRate: 1.0,
    role: 'passthrough',
    specFields: [
      sel('maxConns', 'Max Connections', [1000, 5000, 10000, 50000], 10000),
      num('replicas', 'Replicas', 1, 10, 1),
    ],
    tiers: {
      small:  { maxConns: 1000, replicas: 1 },
      medium: { maxConns: 10000, replicas: 1 },
      large:  { maxConns: 50000, replicas: 2 },
    },
    capacityFn: (s) => ({ maxRPS: Math.round(s.maxConns * 0.5) * s.replicas }),
  },

  // === Compute ===
  appServer: {
    metrics: [
      m('CPU', '%', 5, 100, 75, 90),
      m('Memory', '%', 20, 100, 80, 95),
      m('RPS', 'rps', 50, 2000, 1500, 1900),
      m('Latency', 'ms', 5, 200, 100, 180),
    ],
    packetRate: 1.0,
    role: 'processor',
    specFields: [
      sel('vcpu', 'vCPU', [1, 2, 4, 8, 16, 32], 4),
      sel('ram', 'RAM (GB)', [2, 4, 8, 16, 32, 64], 8),
      num('replicas', 'Replicas', 1, 10, 1),
    ],
    tiers: {
      small:  { vcpu: 2, ram: 4, replicas: 1 },
      medium: { vcpu: 4, ram: 8, replicas: 1 },
      large:  { vcpu: 16, ram: 32, replicas: 2 },
    },
    capacityFn: (s) => ({ maxRPS: s.vcpu * 500 * s.replicas }),
  },
  microservice: {
    metrics: [
      m('RPS', 'rps', 10, 1000, 800, 950),
      m('Latency', 'ms', 2, 100, 60, 90),
      m('Error', '%', 0, 10, 2, 5, 2),
    ],
    packetRate: 0.8,
    role: 'processor',
    specFields: [
      sel('vcpu', 'vCPU', [0.5, 1, 2, 4, 8], 2),
      sel('ram', 'RAM (GB)', [1, 2, 4, 8, 16], 4),
      num('replicas', 'Replicas', 1, 20, 2),
    ],
    tiers: {
      small:  { vcpu: 0.5, ram: 1, replicas: 2 },
      medium: { vcpu: 2, ram: 4, replicas: 3 },
      large:  { vcpu: 8, ram: 16, replicas: 5 },
    },
    capacityFn: (s) => ({ maxRPS: s.vcpu * 500 * s.replicas }),
  },
  serverless: {
    metrics: [
      m('Invocations', '/s', 1, 500, 400, 480),
      m('Cold Starts', '/min', 0, 20, 10, 18),
      m('Duration', 'ms', 10, 1000, 500, 900),
    ],
    packetRate: 0.6,
    role: 'processor',
    specFields: [
      sel('memory', 'Memory (MB)', [128, 256, 512, 1024, 2048, 3072], 256),
      num('concurrency', 'Concurrency', 1, 1000, 100),
      num('timeout', 'Timeout (s)', 1, 900, 30),
    ],
    tiers: {
      small:  { memory: 128, concurrency: 10, timeout: 10 },
      medium: { memory: 256, concurrency: 100, timeout: 30 },
      large:  { memory: 2048, concurrency: 1000, timeout: 60 },
    },
    capacityFn: (s) => ({ maxInvocations: s.concurrency }),
  },
  worker: {
    metrics: [
      m('Jobs/s', '/s', 1, 200, 150, 190),
      m('Queue Depth', '', 0, 1000, 500, 900),
      m('Avg Duration', 'ms', 50, 5000, 3000, 4500),
    ],
    packetRate: 0.4,
    role: 'consumer',
    specFields: [
      num('instances', 'Instances', 1, 20, 2),
      num('concurrency', 'Concurrency/Inst', 1, 50, 5),
    ],
    tiers: {
      small:  { instances: 1, concurrency: 3 },
      medium: { instances: 2, concurrency: 5 },
      large:  { instances: 5, concurrency: 10 },
    },
    capacityFn: (s) => ({ maxJobs: s.instances * s.concurrency }),
  },

  // === Database ===
  postgresql: {
    metrics: [
      m('QPS', 'qps', 10, 5000, 3500, 4500),
      m('Connections', '', 5, 200, 150, 190),
      m('Latency', 'ms', 1, 100, 50, 90),
    ],
    packetRate: 0.3,
    role: 'sink',
    specFields: [
      sel('vcpu', 'vCPU', [2, 4, 8, 16, 32], 4),
      sel('ram', 'RAM (GB)', [8, 16, 32, 64, 128, 256], 16),
      sel('storage', 'Storage (GB)', [50, 100, 500, 1000, 5000], 100),
      num('maxConn', 'Max Connections', 20, 1000, 200),
      num('replicas', 'Read Replicas', 0, 5, 0),
    ],
    tiers: {
      small:  { vcpu: 2, ram: 8, storage: 50, maxConn: 50, replicas: 0 },
      medium: { vcpu: 4, ram: 16, storage: 100, maxConn: 200, replicas: 0 },
      large:  { vcpu: 16, ram: 64, storage: 1000, maxConn: 500, replicas: 2 },
    },
    capacityFn: (s) => ({ maxQPS: s.vcpu * 1000 * (1 + s.replicas * 0.8), maxConns: s.maxConn }),
  },
  mysql: {
    metrics: [
      m('QPS', 'qps', 10, 5000, 3500, 4500),
      m('Connections', '', 5, 200, 150, 190),
      m('Latency', 'ms', 1, 80, 40, 70),
    ],
    packetRate: 0.3,
    role: 'sink',
    specFields: [
      sel('vcpu', 'vCPU', [2, 4, 8, 16, 32], 4),
      sel('ram', 'RAM (GB)', [8, 16, 32, 64, 128, 256], 16),
      sel('storage', 'Storage (GB)', [50, 100, 500, 1000, 5000], 100),
      num('maxConn', 'Max Connections', 20, 1000, 200),
      num('replicas', 'Read Replicas', 0, 5, 0),
    ],
    tiers: {
      small:  { vcpu: 2, ram: 8, storage: 50, maxConn: 50, replicas: 0 },
      medium: { vcpu: 4, ram: 16, storage: 100, maxConn: 200, replicas: 0 },
      large:  { vcpu: 16, ram: 64, storage: 1000, maxConn: 500, replicas: 2 },
    },
    capacityFn: (s) => ({ maxQPS: s.vcpu * 1000 * (1 + s.replicas * 0.8), maxConns: s.maxConn }),
  },
  mongodb: {
    metrics: [
      m('Ops/s', 'ops', 10, 10000, 7000, 9000),
      m('Latency', 'ms', 1, 50, 30, 45),
      m('Disk I/O', 'MB/s', 1, 200, 150, 190),
    ],
    packetRate: 0.3,
    role: 'sink',
    specFields: [
      sel('vcpu', 'vCPU', [2, 4, 8, 16, 32], 4),
      sel('ram', 'RAM (GB)', [8, 16, 32, 64, 128], 16),
      sel('storage', 'Storage (GB)', [50, 100, 500, 1000, 5000], 100),
      num('replicas', 'Replica Set', 1, 7, 3),
    ],
    tiers: {
      small:  { vcpu: 2, ram: 8, storage: 50, replicas: 1 },
      medium: { vcpu: 4, ram: 16, storage: 100, replicas: 3 },
      large:  { vcpu: 16, ram: 64, storage: 1000, replicas: 5 },
    },
    capacityFn: (s) => ({ maxOps: s.vcpu * 2500 * Math.max(1, s.replicas * 0.6) }),
  },
  cassandra: {
    metrics: [
      m('Ops/s', 'ops', 100, 50000, 40000, 48000),
      m('Latency', 'ms', 1, 30, 20, 28),
      m('Disk I/O', 'MB/s', 5, 500, 400, 480),
    ],
    packetRate: 0.3,
    role: 'sink',
    specFields: [
      sel('vcpu', 'vCPU', [4, 8, 16, 32], 8),
      sel('ram', 'RAM (GB)', [16, 32, 64, 128], 32),
      num('nodes', 'Nodes', 3, 50, 3),
    ],
    tiers: {
      small:  { vcpu: 4, ram: 16, nodes: 3 },
      medium: { vcpu: 8, ram: 32, nodes: 6 },
      large:  { vcpu: 16, ram: 64, nodes: 12 },
    },
    capacityFn: (s) => ({ maxOps: s.vcpu * 6000 * s.nodes }),
  },
  dynamodb: {
    metrics: [
      m('RCU', '/s', 5, 5000, 4000, 4800),
      m('WCU', '/s', 5, 3000, 2400, 2900),
      m('Latency', 'ms', 1, 10, 7, 9),
    ],
    packetRate: 0.3,
    role: 'sink',
    specFields: [
      sel('rcu', 'Read Capacity (RCU)', [100, 500, 1000, 5000, 10000], 1000),
      sel('wcu', 'Write Capacity (WCU)', [100, 500, 1000, 5000, 10000], 1000),
      sel('mode', 'Capacity Mode', ['Provisioned', 'On-Demand'], 'Provisioned'),
    ],
    tiers: {
      small:  { rcu: 100, wcu: 100, mode: 'Provisioned' },
      medium: { rcu: 1000, wcu: 1000, mode: 'Provisioned' },
      large:  { rcu: 10000, wcu: 10000, mode: 'On-Demand' },
    },
    capacityFn: (s) => ({ maxRCU: s.rcu, maxWCU: s.wcu }),
  },

  // === Cache ===
  redis: {
    metrics: [
      m('Hit Rate', '%', 80, 99, null, null, 1),
      m('Ops/s', 'ops', 100, 100000, 80000, 95000),
      m('Memory', '%', 10, 100, 75, 90),
    ],
    packetRate: 0.5,
    role: 'sink',
    specFields: [
      sel('ram', 'RAM (GB)', [1, 2, 4, 8, 16, 32, 64], 4),
      sel('eviction', 'Eviction Policy', ['allkeys-lru', 'volatile-lru', 'noeviction'], 'allkeys-lru'),
      num('replicas', 'Replicas', 0, 5, 0),
    ],
    tiers: {
      small:  { ram: 2, eviction: 'allkeys-lru', replicas: 0 },
      medium: { ram: 8, eviction: 'allkeys-lru', replicas: 1 },
      large:  { ram: 32, eviction: 'allkeys-lru', replicas: 2 },
    },
    capacityFn: (s) => ({ maxOps: s.ram * 25000 * (1 + s.replicas * 0.5) }),
  },
  memcached: {
    metrics: [
      m('Hit Rate', '%', 80, 99, null, null, 1),
      m('Ops/s', 'ops', 100, 200000, 160000, 195000),
      m('Memory', '%', 10, 100, 75, 90),
    ],
    packetRate: 0.5,
    role: 'sink',
    specFields: [
      sel('ram', 'RAM (GB)', [1, 2, 4, 8, 16, 32, 64], 4),
      num('replicas', 'Nodes', 1, 20, 1),
    ],
    tiers: {
      small:  { ram: 2, replicas: 1 },
      medium: { ram: 8, replicas: 3 },
      large:  { ram: 32, replicas: 5 },
    },
    capacityFn: (s) => ({ maxOps: s.ram * 50000 * s.replicas }),
  },

  // === Message Queue ===
  kafka: {
    metrics: [
      m('Msg In', '/s', 100, 100000, 80000, 96000),
      m('Msg Out', '/s', 100, 100000, 80000, 96000),
      m('Lag', '', 0, 10000, 5000, 9000),
    ],
    packetRate: 1.0,
    role: 'queue',
    specFields: [
      num('brokers', 'Brokers', 1, 30, 3),
      num('partitions', 'Partitions', 1, 100, 12),
      sel('retention', 'Retention (days)', [1, 3, 7, 14, 30], 7),
    ],
    tiers: {
      small:  { brokers: 1, partitions: 3, retention: 1 },
      medium: { brokers: 3, partitions: 12, retention: 7 },
      large:  { brokers: 6, partitions: 48, retention: 30 },
    },
    capacityFn: (s) => ({ maxMsgIn: s.brokers * s.partitions * 1000 }),
  },
  rabbitmq: {
    metrics: [
      m('Msg In', '/s', 10, 10000, 8000, 9500),
      m('Msg Out', '/s', 10, 10000, 8000, 9500),
      m('Queue Size', '', 0, 5000, 3000, 4500),
    ],
    packetRate: 0.8,
    role: 'queue',
    specFields: [
      sel('ram', 'RAM (GB)', [2, 4, 8, 16], 4),
      num('nodes', 'Cluster Nodes', 1, 7, 1),
    ],
    tiers: {
      small:  { ram: 2, nodes: 1 },
      medium: { ram: 4, nodes: 3 },
      large:  { ram: 16, nodes: 5 },
    },
    capacityFn: (s) => ({ maxMsg: s.ram * 2500 * s.nodes }),
  },
  sqs: {
    metrics: [
      m('Msg In', '/s', 10, 5000, 4000, 4800),
      m('Msg Out', '/s', 10, 5000, 4000, 4800),
      m('Queue Size', '', 0, 10000, 5000, 9000),
    ],
    packetRate: 0.7,
    role: 'queue',
    specFields: [
      sel('type', 'Queue Type', ['Standard', 'FIFO'], 'Standard'),
    ],
    tiers: null,
    capacityFn: (s) => ({ maxMsg: s.type === 'FIFO' ? 3000 : 100000 }),
  },

  // === Storage ===
  s3: {
    metrics: [
      m('Reads', '/s', 10, 5000, 4000, 4800),
      m('Writes', '/s', 5, 2000, 1500, 1900),
      m('Bandwidth', 'MB/s', 1, 500, 400, 480),
    ],
    packetRate: 0.3,
    role: 'sink',
    specFields: [
      sel('tier', 'Storage Class', ['Standard', 'IA', 'Glacier'], 'Standard'),
    ],
    tiers: null,
    capacityFn: null,
  },
  filesystem: {
    metrics: [
      m('Reads', '/s', 5, 1000, 800, 950),
      m('Writes', '/s', 2, 500, 400, 480),
      m('IOPS', '', 10, 5000, 4000, 4800),
    ],
    packetRate: 0.3,
    role: 'sink',
    specFields: [
      sel('iops', 'IOPS', [3000, 6000, 16000, 64000], 3000),
      sel('throughput', 'Throughput (MB/s)', [125, 250, 500, 1000], 125),
    ],
    tiers: {
      small:  { iops: 3000, throughput: 125 },
      medium: { iops: 16000, throughput: 500 },
      large:  { iops: 64000, throughput: 1000 },
    },
    capacityFn: (s) => ({ maxIOPS: s.iops, maxThroughput: s.throughput }),
  },

  // === Search ===
  elasticsearch: {
    metrics: [
      m('QPS', 'qps', 10, 5000, 4000, 4800),
      m('Latency', 'ms', 5, 200, 100, 180),
      m('Index Size', 'GB', 1, 500, 400, 480),
    ],
    packetRate: 0.4,
    role: 'sink',
    specFields: [
      sel('vcpu', 'vCPU', [2, 4, 8, 16], 4),
      sel('ram', 'RAM (GB)', [8, 16, 32, 64], 16),
      num('nodes', 'Data Nodes', 1, 20, 3),
    ],
    tiers: {
      small:  { vcpu: 2, ram: 8, nodes: 1 },
      medium: { vcpu: 4, ram: 16, nodes: 3 },
      large:  { vcpu: 16, ram: 64, nodes: 6 },
    },
    capacityFn: (s) => ({ maxQPS: s.vcpu * 1200 * s.nodes }),
  },

  // === Stream Processing ===
  flink: {
    metrics: [
      m('Events/s', '/s', 100, 100000, 80000, 96000),
      m('Latency', 'ms', 1, 100, 60, 90),
      m('Backpressure', '%', 0, 100, 60, 85),
    ],
    packetRate: 0.8,
    role: 'processor',
    specFields: [
      num('parallelism', 'Parallelism', 1, 64, 4),
      sel('taskManagers', 'Task Managers', [1, 2, 4, 8, 16], 2),
    ],
    tiers: {
      small:  { parallelism: 2, taskManagers: 1 },
      medium: { parallelism: 4, taskManagers: 2 },
      large:  { parallelism: 16, taskManagers: 8 },
    },
    capacityFn: (s) => ({ maxEvents: s.parallelism * s.taskManagers * 5000 }),
  },
  spark: {
    metrics: [
      m('Events/s', '/s', 50, 50000, 40000, 48000),
      m('Batch Delay', 'ms', 100, 5000, 3000, 4500),
      m('Backpressure', '%', 0, 100, 60, 85),
    ],
    packetRate: 0.7,
    role: 'processor',
    specFields: [
      num('executors', 'Executors', 1, 50, 4),
      sel('coresPerExec', 'Cores/Executor', [1, 2, 4, 8], 2),
    ],
    tiers: {
      small:  { executors: 2, coresPerExec: 1 },
      medium: { executors: 4, coresPerExec: 2 },
      large:  { executors: 16, coresPerExec: 4 },
    },
    capacityFn: (s) => ({ maxEvents: s.executors * s.coresPerExec * 3000 }),
  },

  // === Coordination ===
  zookeeper: {
    metrics: [
      m('Watches', '', 10, 1000, 800, 950),
      m('Connections', '', 5, 100, 80, 95),
      m('Latency', 'ms', 1, 20, 15, 19),
    ],
    packetRate: 0.2,
    role: 'sink',
    specFields: [
      num('nodes', 'Ensemble Size', 1, 7, 3),
    ],
    tiers: {
      small:  { nodes: 1 },
      medium: { nodes: 3 },
      large:  { nodes: 5 },
    },
    capacityFn: null,
  },

  // === Monitoring ===
  logging: {
    metrics: [
      m('Events/s', '/s', 100, 50000, 40000, 48000),
      m('Storage', 'GB/day', 1, 100, 80, 95),
    ],
    packetRate: 0.2,
    role: 'sink',
    specFields: [
      sel('retention', 'Retention (days)', [7, 14, 30, 90, 365], 30),
    ],
    tiers: null,
    capacityFn: null,
  },
  metrics: {
    metrics: [
      m('Datapoints', '/s', 100, 100000, 80000, 96000),
      m('Storage', 'GB/day', 0.5, 50, 40, 48, 1),
    ],
    packetRate: 0.2,
    role: 'sink',
    specFields: [
      sel('retention', 'Retention (days)', [7, 14, 30, 90, 365], 30),
    ],
    tiers: null,
    capacityFn: null,
  },
};

// Default config for unknown types
export const defaultSimConfig = {
  metrics: [
    m('Throughput', '/s', 10, 1000, 800, 950),
    m('Latency', 'ms', 1, 100, 60, 90),
  ],
  packetRate: 0.5,
  role: 'processor',
  specFields: [],
  tiers: null,
  capacityFn: null,
};

export function getSimConfig(type) {
  return simulationConfigs[type] || defaultSimConfig;
}

// Get default spec values for a component type
export function getDefaultSpecs(type) {
  const config = getSimConfig(type);
  const specs = {};
  for (const field of (config.specFields || [])) {
    specs[field.key] = field.default;
  }
  return specs;
}
