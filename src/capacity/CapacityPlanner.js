// Capacity Planner — auto-suggests component specs based on user count & traffic patterns

const CAPACITY_RULES = {
  'load-balancer':  { perUser: 2, unit: 'RPS', category: 'infra' },
  'api-gateway':    { perUser: 2, unit: 'RPS', category: 'infra' },
  'app-server':     { perUser: 0.5, unit: 'RPS', category: 'compute',
    recommend: (rps) => ({ vCPUs: Math.ceil(rps / 500), ramGB: Math.ceil(rps / 250), replicas: Math.max(2, Math.ceil(rps / 2000)) }) },
  'web-server':     { perUser: 1, unit: 'RPS', category: 'compute',
    recommend: (rps) => ({ vCPUs: Math.ceil(rps / 800), ramGB: Math.ceil(rps / 400), replicas: Math.max(2, Math.ceil(rps / 3000)) }) },
  'graphql':        { perUser: 0.5, unit: 'RPS', category: 'compute',
    recommend: (rps) => ({ vCPUs: Math.ceil(rps / 400), ramGB: Math.ceil(rps / 200), replicas: Math.max(2, Math.ceil(rps / 1500)) }) },
  'microservice':   { perUser: 0.3, unit: 'RPS', category: 'compute',
    recommend: (rps) => ({ vCPUs: Math.ceil(rps / 600), ramGB: Math.ceil(rps / 300), replicas: Math.max(2, Math.ceil(rps / 2500)) }) },
  'database':       { perUser: 0.3, unit: 'QPS', category: 'database', rwSensitive: true,
    recommend: (qps, readPct, writePct) => {
      // Writes are 3x more expensive than reads for databases
      const effectiveLoad = qps * (readPct + writePct * 3);
      return {
        vCPUs: Math.ceil(effectiveLoad / 800),
        ramGB: Math.ceil(effectiveLoad / 200),
        storageGB: Math.max(100, Math.ceil(qps * 0.05)),
        replicas: effectiveLoad > 3000 ? 3 : effectiveLoad > 1500 ? 2 : 1,
      };
    }},
  'nosql':          { perUser: 0.5, unit: 'QPS', category: 'database', rwSensitive: true,
    recommend: (qps, readPct, writePct) => {
      const effectiveLoad = qps * (readPct + writePct * 2);
      return { storageGB: Math.max(50, Math.ceil(qps * 0.02)), replicas: effectiveLoad > 8000 ? 3 : 1 };
    }},
  'cache':          { perUser: 2, unit: 'ops/s', category: 'cache', rwSensitive: true,
    recommend: (ops, readPct) => {
      // Cache handles mostly reads; higher read ratio = more hits = more ram needed
      const readOps = ops * readPct;
      return { ramGB: Math.ceil(readOps / 4000), replicas: readOps > 15000 ? 3 : 1 };
    }},
  'message-queue':  { perUser: 0.1, unit: 'msg/s', category: 'messaging' },
  'object-storage': { perUser: 0.01, unit: 'req/s', category: 'storage' },
  'cdn':            { perUser: 3, unit: 'req/s', category: 'infra' },
  'worker':         { perUser: 0.05, unit: 'jobs/s', category: 'compute',
    recommend: (jobs) => ({ vCPUs: Math.ceil(jobs / 100), ramGB: Math.ceil(jobs / 50), replicas: Math.max(1, Math.ceil(jobs / 200)) }) },
  'search':         { perUser: 0.2, unit: 'QPS', category: 'database', rwSensitive: true,
    recommend: (qps, readPct) => {
      const readLoad = qps * readPct;
      return { vCPUs: Math.ceil(readLoad / 500), ramGB: Math.ceil(readLoad / 150), replicas: readLoad > 2000 ? 3 : 1 };
    }},
  'graph-db':       { perUser: 0.15, unit: 'QPS', category: 'database', rwSensitive: true,
    recommend: (qps, readPct, writePct) => {
      const effectiveLoad = qps * (readPct + writePct * 4);
      return { vCPUs: Math.ceil(effectiveLoad / 400), ramGB: Math.ceil(effectiveLoad / 100), replicas: effectiveLoad > 2000 ? 2 : 1 };
    }},
};

export function planCapacity(nodes, concurrentUsers, readWriteRatio = '80:20') {
  const rwParts = readWriteRatio.split(':').map(Number);
  const readPct = rwParts[0] / (rwParts[0] + rwParts[1]);
  const writePct = 1 - readPct;

  const recommendations = [];

  for (const node of nodes) {
    const rule = CAPACITY_RULES[node.type];
    if (!rule) {
      recommendations.push({ nodeId: node.id, label: node.label, type: node.type, traffic: 0, unit: '', specs: null, oldSpecs: null });
      continue;
    }

    const traffic = Math.ceil(concurrentUsers * rule.perUser);
    // Pass R:W ratio to recommend function for rwSensitive components
    const specs = rule.recommend
      ? (rule.rwSensitive ? rule.recommend(traffic, readPct, writePct) : rule.recommend(traffic))
      : null;

    // Capture old specs for before/after comparison
    const oldSpecs = node.specs ? { ...node.specs } : null;

    recommendations.push({
      nodeId: node.id,
      label: node.label,
      type: node.type,
      traffic,
      unit: rule.unit,
      specs,
      oldSpecs,
      category: rule.category,
    });
  }

  return {
    concurrentUsers,
    readWriteRatio,
    readPct: Math.round(readPct * 100),
    writePct: Math.round(writePct * 100),
    recommendations: recommendations.filter(r => r.traffic > 0).sort((a, b) => b.traffic - a.traffic),
  };
}
