export const templates = [
  {
    id: 'url-shortener',
    name: 'URL Shortener (Bit.ly)',
    data: {
      nodes: [
        { id: 'node_1', type: 'browser', label: 'Web Client', x: 40, y: 160, color: '#3b82f6', description: 'User browser' },
        { id: 'node_2', type: 'loadBalancer', label: 'Load Balancer', x: 280, y: 160, color: '#6366f1', description: 'Distribute traffic' },
        { id: 'node_3', type: 'appServer', label: 'URL Service', x: 520, y: 80, color: '#8b5cf6', description: 'Shorten & redirect' },
        { id: 'node_4', type: 'appServer', label: 'URL Service', x: 520, y: 240, color: '#8b5cf6', description: 'Replica' },
        { id: 'node_5', type: 'redis', label: 'Redis Cache', x: 760, y: 80, color: '#f59e0b', description: 'Hot URL cache' },
        { id: 'node_6', type: 'postgresql', label: 'PostgreSQL', x: 760, y: 240, color: '#22c55e', description: 'URL mappings' },
      ],
      connections: [
        { id: 'conn_1', fromNodeId: 'node_1', fromPort: 'right', toNodeId: 'node_2', toPort: 'left', label: 'HTTPS' },
        { id: 'conn_2', fromNodeId: 'node_2', fromPort: 'right', toNodeId: 'node_3', toPort: 'left', label: '' },
        { id: 'conn_3', fromNodeId: 'node_2', fromPort: 'right', toNodeId: 'node_4', toPort: 'left', label: '' },
        { id: 'conn_4', fromNodeId: 'node_3', fromPort: 'right', toNodeId: 'node_5', toPort: 'left', label: 'Read' },
        { id: 'conn_5', fromNodeId: 'node_3', fromPort: 'bottom', toNodeId: 'node_6', toPort: 'top', label: 'Write', style: 'dashed' },
        { id: 'conn_6', fromNodeId: 'node_4', fromPort: 'right', toNodeId: 'node_6', toPort: 'left', label: 'Read/Write' },
      ],
    }
  },
  {
    id: 'chat-app',
    name: 'Chat App (WhatsApp)',
    data: {
      nodes: [
        { id: 'node_1', type: 'mobile', label: 'Mobile App', x: 40, y: 140, color: '#3b82f6', description: 'iOS / Android' },
        { id: 'node_2', type: 'apiGateway', label: 'API Gateway', x: 280, y: 140, color: '#6366f1', description: 'Auth & routing' },
        { id: 'node_3', type: 'appServer', label: 'Chat Service', x: 520, y: 60, color: '#8b5cf6', description: 'Message handling' },
        { id: 'node_4', type: 'appServer', label: 'WebSocket Server', x: 520, y: 220, color: '#8b5cf6', description: 'Real-time delivery' },
        { id: 'node_5', type: 'kafka', label: 'Kafka', x: 760, y: 60, color: '#ec4899', description: 'Message queue' },
        { id: 'node_6', type: 'cassandra', label: 'Cassandra', x: 1000, y: 60, color: '#22c55e', description: 'Message store' },
        { id: 'node_7', type: 'redis', label: 'Redis', x: 760, y: 220, color: '#f59e0b', description: 'Presence & sessions' },
        { id: 'node_8', type: 's3', label: 'S3', x: 1000, y: 220, color: '#06b6d4', description: 'Media storage' },
      ],
      connections: [
        { id: 'conn_1', fromNodeId: 'node_1', fromPort: 'right', toNodeId: 'node_2', toPort: 'left', label: 'HTTPS' },
        { id: 'conn_2', fromNodeId: 'node_2', fromPort: 'right', toNodeId: 'node_3', toPort: 'left', label: 'REST' },
        { id: 'conn_3', fromNodeId: 'node_2', fromPort: 'right', toNodeId: 'node_4', toPort: 'left', label: 'WebSocket' },
        { id: 'conn_4', fromNodeId: 'node_3', fromPort: 'right', toNodeId: 'node_5', toPort: 'left', label: 'Produce' },
        { id: 'conn_5', fromNodeId: 'node_5', fromPort: 'right', toNodeId: 'node_6', toPort: 'left', label: 'Consume' },
        { id: 'conn_6', fromNodeId: 'node_4', fromPort: 'right', toNodeId: 'node_7', toPort: 'left', label: 'Session' },
        { id: 'conn_7', fromNodeId: 'node_3', fromPort: 'bottom', toNodeId: 'node_8', toPort: 'top', label: 'Upload', style: 'dashed' },
      ],
    }
  },
  {
    id: 'ride-sharing',
    name: 'Ride-sharing (Uber)',
    data: {
      nodes: [
        { id: 'node_1', type: 'mobile', label: 'Rider App', x: 40, y: 80, color: '#3b82f6', description: 'Request ride' },
        { id: 'node_2', type: 'mobile', label: 'Driver App', x: 40, y: 260, color: '#3b82f6', description: 'Accept ride' },
        { id: 'node_3', type: 'apiGateway', label: 'API Gateway', x: 280, y: 160, color: '#6366f1', description: 'Auth & routing' },
        { id: 'node_4', type: 'appServer', label: 'Trip Service', x: 520, y: 80, color: '#8b5cf6', description: 'Trip management' },
        { id: 'node_5', type: 'appServer', label: 'Matching Service', x: 520, y: 240, color: '#8b5cf6', description: 'Driver-rider match' },
        { id: 'node_6', type: 'redis', label: 'Redis', x: 760, y: 160, color: '#f59e0b', description: 'Location cache' },
        { id: 'node_7', type: 'postgresql', label: 'PostgreSQL', x: 760, y: 320, color: '#22c55e', description: 'Trip records' },
        { id: 'node_8', type: 'kafka', label: 'Kafka', x: 1000, y: 160, color: '#ec4899', description: 'Location events' },
      ],
      connections: [
        { id: 'conn_1', fromNodeId: 'node_1', fromPort: 'right', toNodeId: 'node_3', toPort: 'left', label: 'HTTPS' },
        { id: 'conn_2', fromNodeId: 'node_2', fromPort: 'right', toNodeId: 'node_3', toPort: 'left', label: 'HTTPS' },
        { id: 'conn_3', fromNodeId: 'node_3', fromPort: 'right', toNodeId: 'node_4', toPort: 'left', label: '' },
        { id: 'conn_4', fromNodeId: 'node_3', fromPort: 'right', toNodeId: 'node_5', toPort: 'left', label: '' },
        { id: 'conn_5', fromNodeId: 'node_5', fromPort: 'right', toNodeId: 'node_6', toPort: 'left', label: 'Geo query' },
        { id: 'conn_6', fromNodeId: 'node_4', fromPort: 'bottom', toNodeId: 'node_7', toPort: 'top', label: 'Persist' },
        { id: 'conn_7', fromNodeId: 'node_6', fromPort: 'right', toNodeId: 'node_8', toPort: 'left', label: 'Events' },
      ],
    }
  }
];
