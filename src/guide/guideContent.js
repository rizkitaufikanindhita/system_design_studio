export const guideContent = {
  framework: {
    title: '🎯 Delivery Framework',
    subtitle: 'Langkah-langkah mendesain system yang structured',
    cards: [
      {
        title: 'Step 1: Gather Requirements',
        content: `**Functional Requirements** — Apa yang harus bisa dilakukan system?\n• List core features (3-5 utama)\n• Identifikasi user flows utama\n• Tentukan data apa yang di-store\n\n**Non-Functional Requirements** — Bagaimana performanya?\n• Availability target (99.9%? 99.99%?)\n• Latency target (< 200ms?)\n• Throughput (berapa request/second?)\n• Consistency model (strong vs eventual)\n• Scale (berapa users? berapa data?)`,
        tip: 'Selalu mulai dengan requirements. Jangan langsung lompat ke solusi.',
      },
      {
        title: 'Step 2: High-Level Design',
        content: `Buat diagram awal dengan komponen utama:\n\n1. **Client** → Siapa yang mengakses?\n2. **API Gateway / Load Balancer** → Entry point\n3. **Application Services** → Business logic\n4. **Data Store** → Database + Cache\n5. **External Services** → Third-party APIs\n\nFokus pada **data flow**: bagaimana data mengalir dari client → server → database dan kembali.`,
        tip: 'Gunakan template "URL Shortener" di app ini sebagai contoh high-level design sederhana.',
      },
      {
        title: 'Step 3: Design Deep Dive',
        content: `Pilih 1-2 komponen paling kritis dan detail:\n\n• **Database schema** — Table/collection design\n• **API contracts** — Endpoint, request/response format\n• **Caching strategy** — Apa yang di-cache, TTL, invalidation\n• **Data partitioning** — Bagaimana data di-shard\n• **Concurrency handling** — Race conditions, locks`,
        tip: 'Komponen kritis = yang paling berdampak pada non-functional requirements.',
      },
      {
        title: 'Step 4: Fault Tolerance & Scaling',
        content: `Pertanyaan yang harus dijawab:\n\n• **Single point of failure?** → Tambah redundancy\n• **Database bottleneck?** → Read replicas, sharding\n• **Hot spots?** → Consistent hashing\n• **Data loss risk?** → Replication, backups\n• **Cascading failures?** → Circuit breaker, bulkhead\n• **Traffic spike?** → Auto-scaling, rate limiting`,
        tip: 'System design yang baik selalu mempertimbangkan "what if X fails?"',
      },
    ],
  },

  concepts: {
    title: '📐 Core Concepts',
    subtitle: 'Konsep fundamental yang harus dikuasai',
    cards: [
      {
        title: 'Load Balancing',
        content: `Mendistribusikan traffic ke multiple servers.\n\n**Algoritma:**\n• Round Robin — Bergantian\n• Least Connections — Server paling sedikit koneksi\n• Weighted — Bobot berdasarkan kapasitas\n• IP Hash — Consistent routing per client\n\n**Layer:**\n• L4 (Transport) — Berdasarkan IP/port, cepat\n• L7 (Application) — Berdasarkan URL/header, fleksibel`,
        tip: 'Selalu taruh Load Balancer di depan setiap tier yang punya multiple instances.',
      },
      {
        title: 'Caching',
        content: `Menyimpan data sering diakses di memory untuk reduce latency.\n\n**Strategi:**\n• **Cache-Aside** — App cek cache dulu, jika miss → query DB → store ke cache\n• **Write-Through** — Tulis ke cache + DB bersamaan\n• **Write-Behind** — Tulis ke cache, async sync ke DB\n\n**Invalidation:**\n• TTL (Time-to-Live)\n• Event-based invalidation\n• Manual purge\n\n**Tools:** Redis, Memcached`,
        tip: 'Cache hit ratio > 90% = caching strategy yang baik.',
      },
      {
        title: 'Database Sharding',
        content: `Horizontal partitioning data across multiple database instances.\n\n**Strategi:**\n• **Hash-based** — hash(key) % N shards\n• **Range-based** — Data A-M shard 1, N-Z shard 2\n• **Geographic** — Data berdasarkan region\n\n**Challenges:**\n• Cross-shard queries sulit\n• Resharding saat grow\n• Hotspot pada shard tertentu\n\n**Solusi:** Consistent Hashing untuk minimize resharding.`,
        tip: 'Jangan shard terlalu dini. Mulai dengan single DB, shard ketika benar-benar butuh.',
      },
      {
        title: 'Replication',
        content: `Copy data ke multiple nodes untuk reliability dan performance.\n\n**Model:**\n• **Leader-Follower** — 1 leader (write) + N followers (read)\n• **Leader-Leader** — Multiple nodes bisa write (conflict resolution needed)\n• **Leaderless** — Quorum-based (Cassandra, DynamoDB)\n\n**Trade-off:**\n• Synchronous → Strong consistency, higher latency\n• Asynchronous → Eventually consistent, lower latency`,
        tip: 'Replication ≠ Backup. Replication untuk availability, backup untuk disaster recovery.',
      },
      {
        title: 'CAP Theorem',
        content: `Dalam distributed system, pilih 2 dari 3:\n\n• **C**onsistency — Semua nodes lihat data yang sama\n• **A**vailability — Setiap request dapat response\n• **P**artition Tolerance — System tetap jalan saat network split\n\n**Realitanya:**\nPartition tolerance wajib di distributed system, jadi pilihan sebenarnya:\n• **CP** — Consistency > Availability (e.g., Banking)\n• **AP** — Availability > Consistency (e.g., Social media feed)`,
        tip: 'Lebih akurat: CAP adalah spectrum, bukan binary choice. Gunakan "tunable consistency".',
      },
      {
        title: 'SQL vs NoSQL',
        content: `**Pilih SQL ketika:**\n• Data highly relational\n• Need ACID transactions\n• Schema well-defined\n• Complex queries/joins needed\n• E.g., PostgreSQL, MySQL\n\n**Pilih NoSQL ketika:**\n• Schema flexible/evolving\n• Horizontal scale needed\n• High write throughput\n• Simple access patterns\n• E.g., MongoDB, Cassandra, DynamoDB`,
        tip: 'Banyak system menggunakan keduanya (polyglot persistence).',
      },
    ],
  },

  patterns: {
    title: '🧩 Design Patterns',
    subtitle: 'Pattern untuk menyelesaikan masalah umum',
    cards: [
      {
        title: 'Real-time Updates',
        content: `Cara push data ke client secara real-time:\n\n**WebSocket**\n• Bidirectional, persistent connection\n• Best for: Chat, gaming, live collaboration\n\n**Server-Sent Events (SSE)**\n• Unidirectional (server → client)\n• Best for: Live feeds, notifications\n\n**Long Polling**\n• Client poll, server holds until data available\n• Simpler but less efficient\n\n**Kapan pakai apa:**\n• Chat → WebSocket\n• Live feed → SSE\n• Simple notification → Long Polling`,
        tip: 'WebSocket butuh sticky sessions di Load Balancer atau dedicated connection manager.',
      },
      {
        title: 'Dealing with Contention',
        content: `Saat multiple users akses resource yang sama bersamaan:\n\n**Distributed Locking**\n• Gunakan Redis lock (SET NX EX)\n• Best for: Inventory, seat booking\n\n**Optimistic Concurrency Control**\n• Gunakan version number/timestamp\n• Check version saat write → retry jika conflict\n• Best for: Document editing, profile updates\n\n**Idempotency Keys**\n• Setiap request punya unique key\n• Prevent duplicate operations\n• Best for: Payment, order creation`,
        tip: 'Selalu pertimbangkan: "Apa yang terjadi jika 1000 user klik tombol yang sama?"',
      },
      {
        title: 'Multi-step Processes',
        content: `Menangani transaksi yang melibatkan multiple services:\n\n**Saga Pattern**\n• Setiap step punya compensating action (rollback)\n• Choreography: Events antar services\n• Orchestration: Central coordinator\n• Best for: E-commerce checkout, travel booking\n\n**Two-Phase Commit (2PC)**\n• Prepare → Commit/Abort\n• Strong consistency tapi slow\n• Best for: Banking, financial transactions\n\n**Outbox Pattern**\n• Store event di DB + kirim ke message queue\n• Guarantee at-least-once delivery`,
        tip: 'Saga lebih scalable dari 2PC. Gunakan 2PC hanya jika butuh strong consistency.',
      },
      {
        title: 'Scaling Reads',
        content: `Saat read traffic jauh lebih besar dari write:\n\n1. **Read Replicas** — Route reads ke follower DB\n2. **Cache Layer** — Redis/Memcached di depan DB\n3. **CDN** — Static content di edge servers\n4. **Denormalization** — Pre-compute data, avoid joins\n5. **Materialized Views** — DB-level pre-computed query\n\n**Urutan implementasi:** Cache → Read Replicas → CDN → Denormalization`,
        tip: 'Mayoritas aplikasi 80-90% read. Scaling reads biasanya prioritas pertama.',
      },
      {
        title: 'Scaling Writes',
        content: `Saat write throughput sangat tinggi:\n\n1. **Sharding** — Split data across DB instances\n2. **Partitioning** — Kafka/Queue partitions\n3. **Write-Ahead Log** — Batch writes, async flush\n4. **Message Queue** — Buffer writes, process async\n5. **CQRS** — Separate read/write models\n\n**Urutan implementasi:** Queue buffering → Sharding → CQRS`,
        tip: 'Jangan over-optimize writes jika read latency bisa ditoleransi eventual consistency.',
      },
      {
        title: 'Handling Large Blobs',
        content: `Upload/download file besar (images, videos, documents):\n\n1. **Pre-signed URLs** — Client upload langsung ke S3\n2. **Chunked Upload** — Split file jadi chunks, upload paralel\n3. **CDN Distribution** — Serve via edge locations\n4. **Thumbnail/Transcoding** — Process async via worker\n\n**Flow tipikal:**\nClient → API (get pre-signed URL) → S3 (direct upload) → Worker (process) → CDN (serve)`,
        tip: 'Jangan pernah upload file besar melalui application server. Selalu gunakan pre-signed URLs.',
      },
      {
        title: 'Long Running Tasks',
        content: `Task yang butuh waktu lama (> beberapa detik):\n\n1. **Job Queue** — Enqueue task, return immediately\n2. **Worker Pool** — Dedicated workers process queue\n3. **Progress Tracking** — Store status di Redis/DB\n4. **Retry with Backoff** — Handle failures gracefully\n5. **Dead Letter Queue** — Catch permanently failed jobs\n\n**Tools:** Celery, Sidekiq, AWS SQS + Lambda, Apache Airflow`,
        tip: 'Selalu return response cepat ke user, process di background, notify saat selesai.',
      },
    ],
  },

  technologies: {
    title: '🔧 Key Technologies',
    subtitle: 'Kapan menggunakan teknologi tertentu',
    cards: [
      {
        title: 'Redis',
        content: `**In-memory data store** — Sub-millisecond latency\n\n**Gunakan untuk:**\n• Caching (session, query results)\n• Rate limiting (sliding window counter)\n• Leaderboards (sorted sets)\n• Pub/Sub messaging\n• Distributed locks\n\n**Jangan gunakan untuk:**\n• Primary data store (data loss risk)\n• Large datasets (memory expensive)`,
      },
      {
        title: 'Kafka',
        content: `**Distributed event streaming platform**\n\n**Gunakan untuk:**\n• Event-driven architecture\n• Stream processing\n• Log aggregation\n• Change Data Capture (CDC)\n• Decoupling microservices\n\n**Characteristics:**\n• High throughput (millions events/sec)\n• Durable (disk-persisted)\n• Ordered within partition\n• Consumer groups for scaling`,
      },
      {
        title: 'Elasticsearch',
        content: `**Full-text search engine** — Inverted index based\n\n**Gunakan untuk:**\n• Full-text search\n• Log analytics\n• Geo-search (nearby locations)\n• Autocomplete/suggestions\n• Real-time analytics dashboards\n\n**Pattern:** Sync data dari primary DB ke Elasticsearch via CDC atau event-driven.`,
      },
      {
        title: 'PostgreSQL',
        content: `**Advanced relational database**\n\n**Keunggulan:**\n• ACID transactions\n• Complex queries & joins\n• JSON support (semi-structured)\n• Full-text search (good enough for many)\n• Extensions (PostGIS, pg_trgm)\n• Excellent for OLTP workloads\n\n**Scale:** Read replicas → Partitioning → Sharding (Citus)`,
      },
      {
        title: 'Cassandra / DynamoDB',
        content: `**Wide-column / Key-value stores**\n\n**Gunakan untuk:**\n• Time-series data\n• High write throughput\n• Geographically distributed data\n• Simple access patterns (key → value)\n\n**Cassandra:** Open-source, tunable consistency\n**DynamoDB:** AWS managed, auto-scaling, strong/eventual consistency\n\n**Jangan gunakan untuk:** Complex queries, joins, ad-hoc analytics`,
      },
      {
        title: 'API Gateway',
        content: `**Single entry point** untuk semua API calls\n\n**Fungsi:**\n• Authentication & Authorization\n• Rate Limiting\n• Request routing\n• SSL termination\n• Request/Response transformation\n• Monitoring & Logging\n\n**Tools:** Kong, AWS API Gateway, Nginx, Envoy`,
      },
    ],
  },

  numbers: {
    title: '📊 Numbers to Know',
    subtitle: 'Latency dan scale angka penting untuk estimasi',
    cards: [
      {
        title: 'Latency Numbers',
        content: `| Operation | Latency |\n|---|---|\n| L1 cache reference | **0.5 ns** |\n| L2 cache reference | **7 ns** |\n| Main memory reference | **100 ns** |\n| SSD random read | **150 μs** |\n| HDD seek | **10 ms** |\n| Network round trip (same DC) | **0.5 ms** |\n| Network round trip (cross DC) | **~150 ms** |\n| Redis GET | **< 1 ms** |\n| Database query (indexed) | **1-10 ms** |\n| Database query (full scan) | **100+ ms** |`,
        tip: 'Memory 1000x lebih cepat dari SSD. SSD 100x lebih cepat dari HDD.',
      },
      {
        title: 'Scale Estimates',
        content: `| Metric | Angka |\n|---|---|\n| QPS untuk 1 web server | **1K-10K** |\n| QPS untuk 1 database | **5K-10K** |\n| Redis operations/sec | **100K+** |\n| Kafka throughput | **1M+ events/sec** |\n| 1 GB transferred di 1 Gbps | **~10 detik** |\n| 1 TB storage per tahun | **~$23 (S3)** |`,
        tip: 'Back-of-envelope calculation: DAU × actions/user × % peak hour = peak QPS.',
      },
      {
        title: 'Storage Estimates',
        content: `| Data Type | Size |\n|---|---|\n| Tweet / short text | **~250 bytes** |\n| User profile | **~1 KB** |\n| Image (compressed) | **~200 KB** |\n| Image (high-res) | **~2 MB** |\n| 1 min video (720p) | **~50 MB** |\n| 1 hour video (1080p) | **~3 GB** |\n| 1 billion users × 1 KB | **~1 TB** |`,
        tip: '1 TB = 1,000 GB. 1 PB = 1,000 TB. AWS S3 = cheapest blob storage.',
      },
      {
        title: 'Availability Math',
        content: `| SLA | Downtime/Year | Downtime/Month |\n|---|---|---|\n| 99% | 3.65 days | 7.3 hours |\n| 99.9% | 8.77 hours | 43.8 min |\n| 99.99% | 52.6 min | 4.38 min |\n| 99.999% | 5.26 min | 26.3 sec |\n\n**Formula:** Combined availability = A₁ × A₂ × ... Aₙ\nDua komponen 99.9% = 99.8% combined`,
        tip: 'Setiap komponen tambahan menurunkan total availability. Keep it simple.',
      },
    ],
  },

  checklist: {
    title: '✅ Reliability Checklist',
    subtitle: 'Gunakan checklist ini saat mendesain system',
    items: [
      { id: 'spof', text: 'Tidak ada Single Point of Failure', desc: 'Setiap komponen punya redundancy (multiple instances)' },
      { id: 'replication', text: 'Data di-replicate ke multiple nodes', desc: 'Leader-follower atau multi-region replication' },
      { id: 'cache', text: 'Cache layer ada di depan database', desc: 'Redis/Memcached untuk reduce DB load' },
      { id: 'lb', text: 'Load Balancer di depan setiap tier', desc: 'Distribute traffic, health checks, failover' },
      { id: 'ratelimit', text: 'Rate limiting diimplementasi', desc: 'Protect dari abuse dan DDoS' },
      { id: 'monitoring', text: 'Monitoring, logging, dan alerting ada', desc: 'Metrics, distributed tracing, error alerting' },
      { id: 'graceful', text: 'Graceful degradation dipertimbangkan', desc: 'System tetap berfungsi (partial) saat komponen fail' },
      { id: 'sharding', text: 'Database scaling strategy dipilih', desc: 'Read replicas, sharding, atau partitioning' },
      { id: 'idempotent', text: 'Critical operations idempotent', desc: 'Retry-safe: same request = same result' },
      { id: 'retry', text: 'Retry + exponential backoff', desc: 'Handle transient failures gracefully' },
      { id: 'circuit', text: 'Circuit breaker pattern', desc: 'Prevent cascading failures antar services' },
      { id: 'backup', text: 'Backup dan disaster recovery plan', desc: 'Regular backups, RTO/RPO defined' },
      { id: 'security', text: 'Security: AuthN, AuthZ, Encryption', desc: 'HTTPS, token-based auth, data encryption at rest' },
      { id: 'async', text: 'Heavy operations di-async-kan', desc: 'Message queue untuk decouple dan buffer' },
    ],
  },
};
