// Failure Analysis — identifies cascading failure paths when a component goes down

export function analyzeFailure(targetNodeId, nodes, connections) {
  if (!targetNodeId) return { impacted: [], chains: [] };

  // Build adjacency (directed graph — who depends on whom)
  const dependents = {}; // nodeId -> [nodeIds that depend on it]
  for (const conn of connections) {
    if (!dependents[conn.fromNodeId]) dependents[conn.fromNodeId] = [];
    // toNode depends on fromNode, but in failure terms: if fromNode dies, toNode is impacted
    // Actually: connection from A -> B means A sends to B, so B depends on A
    // If A fails, B loses its upstream
    if (!dependents[conn.toNodeId]) dependents[conn.toNodeId] = [];
    // fromNodeId is the source, toNodeId is the consumer
    // If toNodeId fails: fromNodeId might back up, but we focus on downstream
    // If fromNodeId fails: toNodeId loses the dependency

    // We want: "if X fails, who is impacted?"
    // X → Y means X sends data to Y. If X fails, Y may not get data.
    // So: failure of fromNodeId impacts toNodeId
    if (!dependents[conn.fromNodeId]) dependents[conn.fromNodeId] = [];
    dependents[conn.fromNodeId].push(conn.toNodeId);
  }

  // BFS from target node to find all impacted nodes
  const impacted = new Set();
  const chains = [];
  const queue = [{ nodeId: targetNodeId, chain: [targetNodeId] }];
  const visited = new Set([targetNodeId]);

  while (queue.length > 0) {
    const { nodeId, chain } = queue.shift();
    const deps = dependents[nodeId] || [];
    for (const depId of deps) {
      if (!visited.has(depId)) {
        visited.add(depId);
        impacted.add(depId);
        const newChain = [...chain, depId];
        chains.push(newChain);
        queue.push({ nodeId: depId, chain: newChain });
      }
    }
  }

  return {
    targetNodeId,
    impacted: Array.from(impacted),
    chains,
    impactCount: impacted.size,
    totalNodes: nodes.length,
    impactPercent: nodes.length > 0 ? Math.round((impacted.size / nodes.length) * 100) : 0,
  };
}
