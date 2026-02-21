// Documentation for each component type
// Explains: purpose, how it works, when to use, real-world examples

export const componentDocs = {
  // === Client ===
  browser: {
    title: 'Web Browser',
    purpose: 'Titik masuk utama user ke sistem melalui browser (Chrome, Firefox, dll).',
    howItWorks: 'Browser mengirim HTTP request ke server, menerima HTML/CSS/JS, lalu render halaman. Komunikasi bisa pakai REST API, GraphQL, atau WebSocket untuk real-time.',
    whenToUse: 'Hampir semua web application. Cocok untuk dashboard, e-commerce, social media, dll.',
    example: 'Gmail, Twitter/X, Netflix web player',
  },
  mobile: {
    title: 'Mobile App',
    purpose: 'Native atau hybrid app di iOS/Android yang berkomunikasi dengan backend via API.',
    howItWorks: 'App mengirim request ke API server (biasanya REST atau gRPC). Data di-cache lokal untuk offline support. Push notification via FCM/APNs.',
    whenToUse: 'Saat butuh akses hardware (kamera, GPS, sensor), push notification, atau pengalaman offline.',
    example: 'Instagram, Gojek, Tokopedia',
  },
  desktop: {
    title: 'Desktop Client',
    purpose: 'Aplikasi native yang berjalan di desktop (Windows/Mac/Linux).',
    howItWorks: 'Seperti mobile app tapi untuk desktop. Bisa pakai Electron, Qt, atau native framework. Komunikasi ke backend via API.',
    whenToUse: 'Saat butuh performa tinggi, akses file system, atau integrasi OS yang dalam.',
    example: 'VS Code (Electron), Slack desktop, Figma desktop',
  },

  // === Networking ===
  loadBalancer: {
    title: 'Load Balancer',
    purpose: 'Mendistribusikan traffic ke beberapa server agar tidak ada yang overload.',
    howItWorks: 'Menerima semua request masuk, lalu forward ke salah satu server backend. Algoritma: Round Robin, Least Connections, IP Hash, atau Weighted. Bisa di Layer 4 (TCP) atau Layer 7 (HTTP).',
    whenToUse: 'Saat punya lebih dari 1 server backend. Wajib untuk high availability dan horizontal scaling.',
    example: 'AWS ALB/NLB, Nginx, HAProxy, Google Cloud LB',
  },
  apiGateway: {
    title: 'API Gateway',
    purpose: 'Single entry point untuk semua API. Handle authentication, rate limiting, routing, dan transformasi request.',
    howItWorks: 'Client kirim request ke gateway → gateway validasi auth → route ke service yang tepat → return response. Bisa juga aggregate multiple service calls.',
    whenToUse: 'Saat pakai microservices. Untuk centralize auth, rate limiting, logging, dan API versioning.',
    example: 'Kong, AWS API Gateway, Apigee, Zuul',
  },
  cdn: {
    title: 'CDN (Content Delivery Network)',
    purpose: 'Menyimpan dan menyajikan static content (gambar, video, JS, CSS) dari server yang dekat dengan user.',
    howItWorks: 'File di-cache di edge server di seluruh dunia. User request diarahkan ke edge server terdekat. Cache di-invalidate saat content berubah.',
    whenToUse: 'Untuk static assets, video streaming, website global. Mengurangi latency dan load di origin server.',
    example: 'CloudFlare, AWS CloudFront, Akamai, Fastly',
  },
  dns: {
    title: 'DNS (Domain Name System)',
    purpose: 'Menerjemahkan domain name (google.com) menjadi IP address.',
    howItWorks: 'Client query DNS → recursive resolver → root server → TLD server → authoritative server → return IP. Hasil di-cache dengan TTL.',
    whenToUse: 'Selalu ada di setiap system. Penting untuk load balancing (DNS round-robin) dan failover (health-checked routing).',
    example: 'Route 53, CloudFlare DNS, Google DNS (8.8.8.8)',
  },
  reverseProxy: {
    title: 'Reverse Proxy',
    purpose: 'Perantara antara client dan backend server. Menerima request dari client dan forward ke server internal.',
    howItWorks: 'Client tidak tahu IP server asli — hanya tahu IP proxy. Proxy bisa handle SSL termination, caching, compression, dan security.',
    whenToUse: 'Untuk SSL termination, caching, security layer, atau menyembunyikan internal architecture.',
    example: 'Nginx, Traefik, Envoy, Caddy',
  },

  // === Compute ===
  appServer: {
    title: 'Application Server',
    purpose: 'Server utama yang menjalankan business logic aplikasi.',
    howItWorks: 'Menerima request dari client/LB → proses business logic → query database → return response. Stateless agar bisa di-scale horizontal.',
    whenToUse: 'Inti dari hampir semua system. Tempat logic utama berjalan — authentication, CRUD, business rules.',
    example: 'Express.js, Spring Boot, Django, Laravel, ASP.NET',
  },
  microservice: {
    title: 'Microservice',
    purpose: 'Service kecil yang independent, fokus pada satu domain/fungsi. Bisa deploy dan scale sendiri.',
    howItWorks: 'Setiap service punya database sendiri, berkomunikasi via API (REST/gRPC) atau message queue. Deploy independent, bisa pakai bahasa berbeda.',
    whenToUse: 'Saat tim besar, butuh independent deployment, scaling per-service, atau polyglot tech stack.',
    example: 'Netflix (500+ services), Uber, Tokopedia',
  },
  serverless: {
    title: 'Serverless / Lambda',
    purpose: 'Function yang jalan on-demand, bayar per eksekusi. Tidak perlu manage server.',
    howItWorks: 'Code di-upload sebagai function. Saat ada trigger (HTTP, event, schedule), platform auto-provision container, jalankan function, lalu shutdown. Cold start ~100-500ms.',
    whenToUse: 'Untuk event-driven tasks, cron jobs, webhook handler, atau traffic yang sangat tidak stabil (bursty).',
    example: 'AWS Lambda, Google Cloud Functions, Vercel Functions',
  },
  worker: {
    title: 'Background Worker',
    purpose: 'Process yang berjalan di background untuk handle task yang lama atau asynchronous.',
    howItWorks: 'Consume task dari message queue → proses → update result di database. Tidak melayani HTTP request langsung. Bisa di-scale berdasarkan queue length.',
    whenToUse: 'Untuk email sending, video encoding, report generation, data processing — apapun yang terlalu lama untuk synchronous response.',
    example: 'Celery, Sidekiq, Bull (Node.js), AWS SQS workers',
  },

  // === Database ===
  postgresql: {
    title: 'PostgreSQL',
    purpose: 'Relational database open-source yang powerful. Support ACID transactions, JSON, full-text search.',
    howItWorks: 'Data disimpan dalam tabel dengan relasi (foreign key). Query pakai SQL. Support index B-tree, GiST, dan GIN. Bisa handle concurrent transactions dengan MVCC.',
    whenToUse: 'Default choice untuk kebanyakan aplikasi. Saat butuh ACID, complex queries, JOIN, atau data integrity yang ketat.',
    example: 'Instagram, Reddit, Notion, GitLab',
  },
  mysql: {
    title: 'MySQL',
    purpose: 'Relational database populer, terutama untuk web applications. Simple dan cepat untuk read-heavy workloads.',
    howItWorks: 'Mirip PostgreSQL — tabel, SQL, ACID. Engine default InnoDB support row-level locking dan foreign keys. Replication mudah di-setup.',
    whenToUse: 'Untuk CRUD apps, blog, e-commerce sederhana. Saat butuh sesuatu yang proven dan banyak community support.',
    example: 'WordPress, Facebook (modifikasi), Airbnb, Uber',
  },
  mongodb: {
    title: 'MongoDB',
    purpose: 'Document database NoSQL. Menyimpan data dalam format JSON-like (BSON).',
    howItWorks: 'Data disimpan sebagai documents dalam collections (bukan tabel). Schema flexible — setiap document bisa beda struktur. Sharding built-in.',
    whenToUse: 'Saat schema sering berubah, data semi-structured, atau butuh horizontal scaling. Bagus untuk prototyping cepat.',
    example: 'eBay, Coinbase, EA Games',
  },
  cassandra: {
    title: 'Apache Cassandra',
    purpose: 'Wide-column database NoSQL untuk write-heavy workloads dengan skala besar.',
    howItWorks: 'Distributed, no single point of failure. Data di-partition across cluster pakai consistent hashing. Tunable consistency (ONE, QUORUM, ALL).',
    whenToUse: 'Saat butuh write speed tinggi, multi-datacenter replication, atau data time-series yang besar.',
    example: 'Apple (75k+ nodes), Netflix, Instagram messages, Discord',
  },
  dynamodb: {
    title: 'DynamoDB',
    purpose: 'Fully managed key-value + document database dari AWS. Single-digit ms latency at any scale.',
    howItWorks: 'Serverless — AWS manage semuanya. Data diakses via primary key (partition key + optional sort key). Auto-scaling, pay per read/write.',
    whenToUse: 'Saat pakai AWS, butuh low latency, predictable performance, dan tidak mau manage infrastructure.',
    example: 'Amazon.com, Lyft, Samsung, Snapchat',
  },

  // === Cache ===
  redis: {
    title: 'Redis',
    purpose: 'In-memory data store untuk caching, session storage, rate limiting, real-time leaderboards.',
    howItWorks: 'Data disimpan di RAM → read/write ~1ms. Support berbagai data structure: string, hash, list, set, sorted set. Bisa persistence ke disk. Pub/Sub built-in.',
    whenToUse: 'Caching (paling umum), session management, rate limiting, leaderboard, real-time analytics, message broker sederhana.',
    example: 'Twitter, GitHub, Stack Overflow, Pinterest',
  },
  memcached: {
    title: 'Memcached',
    purpose: 'Distributed in-memory cache yang simple. Hanya key-value, tapi sangat cepat.',
    howItWorks: 'Data disimpan di RAM sebagai key-value pairs. Consistent hashing untuk distribusi. LRU eviction saat memory penuh. Multi-threaded.',
    whenToUse: 'Saat butuh simple caching tanpa fitur tambahan Redis. Lebih baik untuk large cache yang butuh multi-threading.',
    example: 'Facebook (primary cache), Wikipedia, YouTube',
  },

  // === Message Queue ===
  kafka: {
    title: 'Apache Kafka',
    purpose: 'Distributed event streaming platform. Untuk high-throughput message processing dan event sourcing.',
    howItWorks: 'Producer publish messages ke topics → messages disimpan di partitions (ordered, durable) → consumer groups consume secara parallel. Retention configurable (hari/minggu).',
    whenToUse: 'Event sourcing, stream processing, log aggregation, real-time analytics, decoupling microservices dengan volume tinggi.',
    example: 'LinkedIn (asal Kafka), Uber (1T+ events/day), Netflix',
  },
  rabbitmq: {
    title: 'RabbitMQ',
    purpose: 'Traditional message broker untuk task queue dan request-reply patterns.',
    howItWorks: 'Producer kirim message ke exchange → exchange route ke queue berdasarkan routing rules → consumer consume dari queue. Support ACK/NACK, dead letter queue, priority.',
    whenToUse: 'Background jobs, task distribution, request-reply patterns. Saat butuh complex routing, priority, atau per-message acknowledgment.',
    example: 'Robinhood, Mozilla, VMware',
  },
  sqs: {
    title: 'Amazon SQS',
    purpose: 'Fully managed message queue dari AWS. Simple, reliable, auto-scaling.',
    howItWorks: 'Producer kirim message → SQS simpan (redundant across AZ) → consumer poll message → process → delete. Standard (at-least-once) atau FIFO (exactly-once, ordered).',
    whenToUse: 'Saat pakai AWS dan butuh simple queue tanpa manage infrastructure. Decoupling services, buffering writes.',
    example: 'Amazon.com, Capital One, BMW',
  },

  // === Storage ===
  s3: {
    title: 'Blob Storage (S3)',
    purpose: 'Object storage untuk file: gambar, video, backup, logs, static assets.',
    howItWorks: 'File disimpan sebagai objects dengan unique key. Virtually unlimited storage. 99.999999999% durability. Tiered storage (Standard, IA, Glacier).',
    whenToUse: 'Menyimpan file apapun: user uploads, backups, logs, data lake, static website hosting.',
    example: 'AWS S3, Google Cloud Storage, Azure Blob Storage',
  },
  filesystem: {
    title: 'File System',
    purpose: 'Distributed file system untuk menyimpan file yang butuh akses seperti folder biasa.',
    howItWorks: 'File disimpan di disk dengan hierarki directory. Distributed FS (HDFS, EFS) replicate data across nodes untuk redundancy.',
    whenToUse: 'Saat app butuh akses file via path (bukan object key). Shared storage antar servers, atau legacy system yang butuh mount.',
    example: 'HDFS, AWS EFS, GlusterFS, NFS',
  },

  // === Search ===
  elasticsearch: {
    title: 'Elasticsearch',
    purpose: 'Full-text search engine. Sangat cepat untuk search, filter, dan aggregate data.',
    howItWorks: 'Data di-index dalam inverted index → search sangat cepat (ms). Support fuzzy match, autocomplete, faceted search, aggregation. Cluster-based, sharding otomatis.',
    whenToUse: 'Full-text search (produk, artikel), log analysis (ELK stack), real-time analytics pada semi-structured data.',
    example: 'Wikipedia, GitHub (code search), Netflix, Stack Overflow',
  },

  // === Stream Processing ===
  flink: {
    title: 'Apache Flink',
    purpose: 'Stream processing framework untuk real-time data processing.',
    howItWorks: 'Consume data dari stream (Kafka) → apply transformations, aggregations, windowing → output result. Support exactly-once semantics dan stateful processing.',
    whenToUse: 'Real-time fraud detection, anomaly detection, CEP (Complex Event Processing), continuous ETL.',
    example: 'Alibaba, Uber, Netflix, Airbnb',
  },
  spark: {
    title: 'Spark Streaming',
    purpose: 'Unified engine untuk batch dan stream processing.',
    howItWorks: 'Micro-batch approach: stream data dibagi jadi batch kecil (detik), diproses pakai Spark engine. Support SQL, ML, graph processing.',
    whenToUse: 'Saat butuh batch + stream processing dalam satu platform. ETL, ML pipeline, large-scale data processing.',
    example: 'Netflix, eBay, Yahoo, TripAdvisor',
  },

  // === Coordination ===
  zookeeper: {
    title: 'ZooKeeper',
    purpose: 'Service coordination: leader election, config management, distributed locking, service discovery.',
    howItWorks: 'Menyimpan configuration data di tree-like structure (znodes). Watches mechanism untuk notify changes. Consensus via ZAB protocol. Strongly consistent.',
    whenToUse: 'Saat butuh distributed coordination: leader election, config sync, service discovery, distributed locks.',
    example: 'Kafka (metadata), Hadoop, HBase, Solr',
  },

  // === Monitoring ===
  logging: {
    title: 'Logging Service',
    purpose: 'Centralized log collection, storage, dan analysis.',
    howItWorks: 'Apps kirim log → log collector (Fluentd/Logstash) → storage (Elasticsearch) → visualize (Kibana/Grafana). Full-text search pada logs.',
    whenToUse: 'Selalu. Setiap production system harus punya centralized logging untuk debugging dan auditing.',
    example: 'ELK Stack, Datadog, Splunk, Grafana Loki',
  },
  metrics: {
    title: 'Metrics & Monitoring',
    purpose: 'Mengumpulkan, menyimpan, dan visualisasi performance metrics (CPU, latency, error rate, dll).',
    howItWorks: 'Agent/exporter collect metrics → time-series database (Prometheus) → dashboard (Grafana) → alerting rules trigger notification saat threshold tercapai.',
    whenToUse: 'Selalu. Untuk monitoring health system, SLA tracking, capacity planning, dan incident response.',
    example: 'Prometheus + Grafana, Datadog, New Relic, AWS CloudWatch',
  },
};
