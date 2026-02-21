// SLA / Availability Calculator
// Computes system availability from component SLAs + topology (series vs parallel/replicas)

const COMPONENT_SLA = {
  'app-server':     0.9999,
  'web-server':     0.9999,
  'api-gateway':    0.9999,
  'graphql':        0.9999,
  'microservice':   0.9999,
  'serverless':     0.99999,
  'worker':         0.9999,
  'cron':           0.9999,
  'load-balancer':  0.99999,
  'database':       0.9995,
  'nosql':          0.99999,
  'graph-db':       0.9995,
  'timeseries-db':  0.9995,
  'data-warehouse': 0.9999,
  'search':         0.9995,
  'vector-db':      0.9995,
  'cache':          0.9999,
  'object-storage': 0.99999,
  'cdn':            0.99999,
  'file-storage':   0.9999,
  'message-queue':  0.99999,
  'event-bus':      0.99999,
  'stream':         0.99999,
  'dns':            0.99999,
  'service-mesh':   0.9999,
  'container-orch': 0.9999,
  'registry':       0.9999,
  'monitoring':     0.9999,
  'logging':        0.9999,
  'tracing':        0.9999,
  'waf':            0.9999,
  'auth':           0.9999,
  'vault':          0.9999,
};

function getComponentSla(node) {
  const baseSla = COMPONENT_SLA[node.type] || 0.999;
  const replicas = (node.specs && node.specs.replicas) || 1;
  // Parallel: 1 - (1-sla)^replicas
  if (replicas > 1) {
    return 1 - Math.pow(1 - baseSla, replicas);
  }
  return baseSla;
}

export function calculateSystemSla(nodes, connections) {
  if (nodes.length === 0) return { sla: 1, nines: '∞', downtime: '0', perComponent: [] };

  // Compute individual SLAs (with replica benefit)
  const perComponent = nodes.map(n => {
    const sla = getComponentSla(n);
    return {
      nodeId: n.id,
      label: n.label,
      type: n.type,
      baseSla: COMPONENT_SLA[n.type] || 0.999,
      replicas: n.specs?.replicas || 1,
      effectiveSla: sla,
    };
  });

  // System SLA = product of all component SLAs (series topology)
  const systemSla = perComponent.reduce((acc, c) => acc * c.effectiveSla, 1);

  // Nines
  const nines = systemSla >= 1 ? '∞' : (-Math.log10(1 - systemSla)).toFixed(2);

  // Monthly downtime
  const monthMinutes = 30 * 24 * 60;
  const downtimeMin = monthMinutes * (1 - systemSla);
  let downtime;
  if (downtimeMin < 1) downtime = `${(downtimeMin * 60).toFixed(1)}s`;
  else if (downtimeMin < 60) downtime = `${downtimeMin.toFixed(1)}m`;
  else downtime = `${(downtimeMin / 60).toFixed(1)}h`;

  return {
    sla: systemSla,
    slaPercent: (systemSla * 100).toFixed(4) + '%',
    nines,
    downtime,
    perComponent: perComponent.sort((a, b) => a.effectiveSla - b.effectiveSla),
  };
}
