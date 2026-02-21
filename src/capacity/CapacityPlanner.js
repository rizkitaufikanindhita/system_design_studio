// Capacity Planner — auto-suggests component specs based on user count & traffic patterns

const CAPACITY_RULES = {
  'load-balancer':  { perUser: 2, unit: 'RPS' },
  'api-gateway':    { perUser: 2, unit: 'RPS' },
  'app-server':     { perUser: 0.5, unit: 'RPS', recommend: (rps) => ({ vCPUs: Math.ceil(rps / 500), ramGB: Math.ceil(rps / 250), replicas: Math.max(2, Math.ceil(rps / 2000)) }) },
  'web-server':     { perUser: 1, unit: 'RPS', recommend: (rps) => ({ vCPUs: Math.ceil(rps / 800), ramGB: Math.ceil(rps / 400), replicas: Math.max(2, Math.ceil(rps / 3000)) }) },
  'graphql':        { perUser: 0.5, unit: 'RPS', recommend: (rps) => ({ vCPUs: Math.ceil(rps / 400), ramGB: Math.ceil(rps / 200), replicas: Math.max(2, Math.ceil(rps / 1500)) }) },
  'microservice':   { perUser: 0.3, unit: 'RPS', recommend: (rps) => ({ vCPUs: Math.ceil(rps / 600), ramGB: Math.ceil(rps / 300), replicas: Math.max(2, Math.ceil(rps / 2500)) }) },
  'database':       { perUser: 0.3, unit: 'QPS', recommend: (qps) => ({ vCPUs: Math.ceil(qps / 1000), ramGB: Math.ceil(qps / 250), storageGB: 100, replicas: qps > 5000 ? 2 : 1 }) },
  'nosql':          { perUser: 0.5, unit: 'QPS', recommend: (qps) => ({ storageGB: 50, replicas: qps > 10000 ? 3 : 1 }) },
  'cache':          { perUser: 2, unit: 'ops/s', recommend: (ops) => ({ ramGB: Math.ceil(ops / 5000), replicas: ops > 20000 ? 3 : 1 }) },
  'message-queue':  { perUser: 0.1, unit: 'msg/s' },
  'object-storage': { perUser: 0.01, unit: 'req/s' },
  'cdn':            { perUser: 3, unit: 'req/s' },
  'worker':         { perUser: 0.05, unit: 'jobs/s', recommend: (jobs) => ({ vCPUs: Math.ceil(jobs / 100), ramGB: Math.ceil(jobs / 50), replicas: Math.max(1, Math.ceil(jobs / 200)) }) },
};

export function planCapacity(nodes, concurrentUsers, readWriteRatio = '80:20') {
  const rwParts = readWriteRatio.split(':').map(Number);
  const readPct = rwParts[0] / (rwParts[0] + rwParts[1]);
  const writePct = 1 - readPct;

  const recommendations = [];

  for (const node of nodes) {
    const rule = CAPACITY_RULES[node.type];
    if (!rule) {
      recommendations.push({ nodeId: node.id, label: node.label, type: node.type, traffic: 0, unit: '', specs: null });
      continue;
    }

    const traffic = Math.ceil(concurrentUsers * rule.perUser);
    const specs = rule.recommend ? rule.recommend(traffic) : null;

    recommendations.push({
      nodeId: node.id,
      label: node.label,
      type: node.type,
      traffic,
      unit: rule.unit,
      specs,
    });
  }

  return {
    concurrentUsers,
    readWriteRatio,
    recommendations: recommendations.filter(r => r.traffic > 0).sort((a, b) => b.traffic - a.traffic),
  };
}
