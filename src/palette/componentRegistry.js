import { icons } from '../utils/icons.js';

export const componentRegistry = [
  {
    category: 'Client',
    color: 'var(--node-client)',
    items: [
      { type: 'browser', label: 'Web Browser', desc: 'Web client', icon: icons.browser, color: '#3b82f6' },
      { type: 'mobile', label: 'Mobile App', desc: 'iOS / Android', icon: icons.mobile, color: '#3b82f6' },
      { type: 'desktop', label: 'Desktop Client', desc: 'Desktop app', icon: icons.desktop, color: '#3b82f6' },
    ]
  },
  {
    category: 'Networking',
    color: 'var(--node-gateway)',
    items: [
      { type: 'loadBalancer', label: 'Load Balancer', desc: 'Distribute traffic', icon: icons.loadBalancer, color: '#6366f1' },
      { type: 'apiGateway', label: 'API Gateway', desc: 'Route & auth', icon: icons.apiGateway, color: '#6366f1' },
      { type: 'cdn', label: 'CDN', desc: 'Content delivery', icon: icons.cdn, color: '#6366f1' },
      { type: 'dns', label: 'DNS', desc: 'Name resolution', icon: icons.dns, color: '#6366f1' },
      { type: 'reverseProxy', label: 'Reverse Proxy', desc: 'Forward requests', icon: icons.reverseProxy, color: '#6366f1' },
    ]
  },
  {
    category: 'Compute',
    color: 'var(--node-server)',
    items: [
      { type: 'appServer', label: 'App Server', desc: 'Application logic', icon: icons.server, color: '#8b5cf6' },
      { type: 'microservice', label: 'Microservice', desc: 'Isolated service', icon: icons.microservice, color: '#8b5cf6' },
      { type: 'serverless', label: 'Serverless', desc: 'Lambda / Function', icon: icons.lambda, color: '#8b5cf6' },
      { type: 'worker', label: 'Worker', desc: 'Background job', icon: icons.worker, color: '#8b5cf6' },
    ]
  },
  {
    category: 'Database',
    color: 'var(--node-database)',
    items: [
      { type: 'postgresql', label: 'PostgreSQL', desc: 'Relational DB', icon: icons.database, color: '#22c55e' },
      { type: 'mysql', label: 'MySQL', desc: 'Relational DB', icon: icons.database, color: '#22c55e' },
      { type: 'mongodb', label: 'MongoDB', desc: 'Document DB', icon: icons.database, color: '#22c55e' },
      { type: 'cassandra', label: 'Cassandra', desc: 'Wide-column DB', icon: icons.database, color: '#22c55e' },
      { type: 'dynamodb', label: 'DynamoDB', desc: 'Key-value DB', icon: icons.database, color: '#22c55e' },
    ]
  },
  {
    category: 'Cache',
    color: 'var(--node-cache)',
    items: [
      { type: 'redis', label: 'Redis', desc: 'In-memory cache', icon: icons.cache, color: '#f59e0b' },
      { type: 'memcached', label: 'Memcached', desc: 'Distributed cache', icon: icons.cache, color: '#f59e0b' },
    ]
  },
  {
    category: 'Message Queue',
    color: 'var(--node-queue)',
    items: [
      { type: 'kafka', label: 'Kafka', desc: 'Event streaming', icon: icons.queue, color: '#ec4899' },
      { type: 'rabbitmq', label: 'RabbitMQ', desc: 'Message broker', icon: icons.queue, color: '#ec4899' },
      { type: 'sqs', label: 'SQS', desc: 'AWS queue', icon: icons.queue, color: '#ec4899' },
    ]
  },
  {
    category: 'Storage',
    color: 'var(--node-storage)',
    items: [
      { type: 's3', label: 'Blob Storage (S3)', desc: 'Object storage', icon: icons.storage, color: '#06b6d4' },
      { type: 'filesystem', label: 'File System', desc: 'File storage', icon: icons.storage, color: '#06b6d4' },
    ]
  },
  {
    category: 'Search',
    color: 'var(--node-search)',
    items: [
      { type: 'elasticsearch', label: 'Elasticsearch', desc: 'Full-text search', icon: icons.search, color: '#f97316' },
    ]
  },
  {
    category: 'Stream Processing',
    color: 'var(--node-stream)',
    items: [
      { type: 'flink', label: 'Apache Flink', desc: 'Stream processing', icon: icons.stream, color: '#14b8a6' },
      { type: 'spark', label: 'Spark Streaming', desc: 'Batch + stream', icon: icons.stream, color: '#14b8a6' },
    ]
  },
  {
    category: 'Coordination',
    color: 'var(--node-coordination)',
    items: [
      { type: 'zookeeper', label: 'ZooKeeper', desc: 'Service coordination', icon: icons.coordination, color: '#a855f7' },
    ]
  },
  {
    category: 'Monitoring',
    color: 'var(--node-monitoring)',
    items: [
      { type: 'logging', label: 'Logging Service', desc: 'Centralized logs', icon: icons.monitoring, color: '#64748b' },
      { type: 'metrics', label: 'Metrics', desc: 'Performance tracking', icon: icons.monitoring, color: '#64748b' },
    ]
  },
  {
    category: 'Infrastructure',
    color: '#3b82f6',
    items: [
      { type: 'region', label: 'Region', desc: 'Cloud region', icon: '🌏', color: '#3b82f6', isGroup: true },
      { type: 'vpc', label: 'VPC', desc: 'Virtual network', icon: '🔒', color: '#6366f1', isGroup: true },
      { type: 'az', label: 'Availability Zone', desc: 'AZ boundary', icon: '🏢', color: '#8b5cf6', isGroup: true },
      { type: 'microservice', label: 'Microservice', desc: 'Service boundary', icon: '📦', color: '#22c55e', isGroup: true },
      { type: 'security', label: 'Security Zone', desc: 'DMZ / Private', icon: '🛡️', color: '#ef4444', isGroup: true },
      { type: 'custom', label: 'Custom Group', desc: 'Custom boundary', icon: '📁', color: '#64748b', isGroup: true },
    ]
  },
];

export function findComponent(type) {
  for (const cat of componentRegistry) {
    const item = cat.items.find(i => i.type === type);
    if (item) return item;
  }
  return null;
}
