// Cost estimation engine — calculates monthly cloud cost per component
// Based on specs (vCPU, RAM, replicas, storage, throughput) and region pricing

const COST_MODELS = {
  // === Compute ===
  'app-server':     { type: 'compute',  baseMonth: 25,  perVCPU: 20,  perGBRam: 3,   perReplica: true },
  'web-server':     { type: 'compute',  baseMonth: 20,  perVCPU: 18,  perGBRam: 2.5, perReplica: true },
  'api-gateway':    { type: 'managed',  baseMonth: 35,  perMillionReq: 3.5 },
  'graphql':        { type: 'compute',  baseMonth: 25,  perVCPU: 20,  perGBRam: 3,   perReplica: true },
  'microservice':   { type: 'compute',  baseMonth: 15,  perVCPU: 18,  perGBRam: 2.5, perReplica: true },
  'serverless':     { type: 'serverless', baseMonth: 0, perMillionInvoke: 0.2, perGBs: 0.0000166 },
  'worker':         { type: 'compute',  baseMonth: 20,  perVCPU: 18,  perGBRam: 2.5, perReplica: true },
  'cron':           { type: 'serverless', baseMonth: 0, perMillionInvoke: 0.2, perGBs: 0.0000166 },

  // === Databases ===
  'database':       { type: 'database', baseMonth: 30,  perVCPU: 30,  perGBRam: 5,   perGBStorage: 0.115, perReplica: true },
  'nosql':          { type: 'managed',  baseMonth: 25,  perWCU: 0.00065, perRCU: 0.00013, perGBStorage: 0.25 },
  'graph-db':       { type: 'database', baseMonth: 50,  perVCPU: 35,  perGBRam: 6,   perGBStorage: 0.1,  perReplica: true },
  'timeseries-db':  { type: 'database', baseMonth: 35,  perVCPU: 25,  perGBRam: 4,   perGBStorage: 0.08, perReplica: true },
  'data-warehouse': { type: 'managed',  baseMonth: 250, perTBScan: 5 },
  'search':         { type: 'database', baseMonth: 40,  perVCPU: 25,  perGBRam: 5,   perGBStorage: 0.12, perReplica: true },
  'vector-db':      { type: 'database', baseMonth: 45,  perVCPU: 30,  perGBRam: 5,   perGBStorage: 0.15, perReplica: true },

  // === Cache & Storage ===
  'cache':          { type: 'cache',    baseMonth: 15,  perGBRam: 6.5, perReplica: true },
  'object-storage': { type: 'storage',  baseMonth: 0,   perGBStorage: 0.023, perMillionReq: 0.4 },
  'cdn':            { type: 'managed',  baseMonth: 0,   perTBTransfer: 85,   perMillionReq: 0.75 },
  'file-storage':   { type: 'storage',  baseMonth: 0,   perGBStorage: 0.30 },

  // === Messaging ===
  'message-queue':  { type: 'managed',  baseMonth: 25,  perMillionMsg: 0.40 },
  'event-bus':      { type: 'managed',  baseMonth: 1,   perMillionEvents: 1.0 },
  'stream':         { type: 'managed',  baseMonth: 15,  perShardHr: 0.015, perGBWrite: 0.04 },

  // === Infrastructure ===
  'load-balancer':  { type: 'managed',  baseMonth: 16.2, perLCU: 6.08 },
  'dns':            { type: 'managed',  baseMonth: 0.50, perMillionQuery: 0.40 },
  'service-mesh':   { type: 'managed',  baseMonth: 100 },
  'container-orch': { type: 'managed',  baseMonth: 72,   perVCPU: 10, perGBRam: 1.2 },
  'registry':       { type: 'managed',  baseMonth: 10,   perGBStorage: 0.10 },

  // === Monitoring ===
  'monitoring':     { type: 'managed',  baseMonth: 0,   perMetric: 0.30, perGBLog: 0.50 },
  'logging':        { type: 'managed',  baseMonth: 0,   perGBIngested: 0.50, perGBStored: 0.03 },
  'tracing':        { type: 'managed',  baseMonth: 0,   perMillionSpans: 5.0 },

  // === Security ===
  'waf':            { type: 'managed',  baseMonth: 5,   perMillionReq: 0.60 },
  'auth':           { type: 'managed',  baseMonth: 0,   perMAU: 0.0055 },
  'vault':          { type: 'managed',  baseMonth: 1,   perSecret: 0.05, perAPICall: 0.03 },
};

export function estimateComponentCost(node) {
  const model = COST_MODELS[node.type];
  if (!model) return { total: 0, breakdown: [], label: 'Unknown' };

  const specs = node.specs || {};
  const replicas = specs.replicas || 1;
  let total = model.baseMonth;
  const breakdown = [];

  if (model.baseMonth > 0) {
    breakdown.push({ item: 'Base', cost: model.baseMonth });
  }

  // Compute-type costs
  if (model.perVCPU && specs.vCPUs) {
    const c = model.perVCPU * specs.vCPUs;
    total += c;
    breakdown.push({ item: `${specs.vCPUs} vCPU`, cost: c });
  }
  if (model.perGBRam && specs.ramGB) {
    const c = model.perGBRam * specs.ramGB;
    total += c;
    breakdown.push({ item: `${specs.ramGB} GB RAM`, cost: c });
  }
  if (model.perGBStorage && specs.storageGB) {
    const c = model.perGBStorage * specs.storageGB;
    total += c;
    breakdown.push({ item: `${specs.storageGB} GB Storage`, cost: c });
  }

  // Replica multiplier
  if (model.perReplica && replicas > 1) {
    const beforeReplica = total;
    total *= replicas;
    breakdown.push({ item: `×${replicas} replicas`, cost: total - beforeReplica });
  }

  return {
    total: Math.round(total * 100) / 100,
    breakdown,
    label: `~$${Math.round(total)}/mo`,
  };
}

export function estimateTotalCost(nodes) {
  let grandTotal = 0;
  const perNode = [];

  for (const node of nodes) {
    const est = estimateComponentCost(node);
    grandTotal += est.total;
    perNode.push({ nodeId: node.id, label: node.label, type: node.type, ...est });
  }

  return {
    grandTotal: Math.round(grandTotal * 100) / 100,
    perNode: perNode.sort((a, b) => b.total - a.total),
    label: `~$${grandTotal.toFixed(0)}/mo`,
  };
}
