const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `Kamu adalah System Design Assistant yang ahli. Tugasmu membantu user mendesain system architecture yang reliable dan scalable.

Rules:
- Jawab dalam Bahasa Indonesia (campur istilah teknis Inggris yang umum)
- Berikan jawaban ringkas, praktis, dan actionable
- Gunakan bullet points dan formatting yang jelas
- Jika user share diagram, analyze nodes dan connections, lalu beri feedback spesifik
- Suggest improvements berdasarkan best practices
- Gunakan contoh real-world (Netflix, Uber, WhatsApp, dll.) jika relevan
- Jangan terlalu panjang, max 300 kata per response
- Gunakan **bold** untuk istilah penting`;

const FALLBACK_RESPONSES = {
  review: `**Review Diagram:**\n\nBeberapa hal yang perlu diperhatikan:\n\n• **Single Point of Failure** — Pastikan setiap komponen punya redundancy\n• **Load Balancer** — Sudah ada di depan application servers?\n• **Cache Layer** — Tambahkan Redis/Memcached untuk reduce DB load\n• **Database Replication** — Setup read replicas untuk scaling reads\n• **Monitoring** — Pastikan ada logging dan alerting\n\n💡 Tip: Mulai dari komponen yang paling kritis dan pastikan punya backup plan.`,
  improve: `**Saran Improvement:**\n\n1. **Tambah Cache** — Redis di depan database untuk reduce latency\n2. **Message Queue** — Kafka/RabbitMQ untuk decouple services\n3. **CDN** — Untuk static content dan reduce latency global\n4. **Rate Limiting** — Protect API dari abuse\n5. **Circuit Breaker** — Prevent cascading failures\n6. **Health Checks** — Auto-detect dan replace unhealthy instances\n\n💡 Tip: Implement secara bertahap, mulai dari yang paling berdampak.`,
  spof: `**Single Point of Failure Analysis:**\n\nKomponen yang sering jadi SPOF:\n\n• **Database** → Solusi: Replication (leader-follower)\n• **Application Server** → Solusi: Multiple instances + Load Balancer\n• **Load Balancer** → Solusi: Active-passive LB pair\n• **DNS** → Solusi: Multiple DNS providers\n• **Cache** → Solusi: Redis Cluster/Sentinel\n\n💡 Rule: Jika hanya ada 1 instance dari sebuah komponen, itu SPOF.`,
  default: `Saya bisa membantu dengan:\n\n• **Review diagram** — Analyze dan beri feedback\n• **Suggest components** — Komponen apa yang perlu ditambah\n• **Explain concepts** — Load balancing, caching, sharding, dll.\n• **Best practices** — Tips untuk design yang reliable\n\n💡 Coba tanya sesuatu yang spesifik tentang diagram kamu!`,
};

export class ChatService {
  constructor() {
    this.apiKey = this._loadApiKey();
    this.conversationHistory = [];
  }

  getApiKey() {
    return this.apiKey;
  }

  setApiKey(key) {
    this.apiKey = key;
    try { localStorage.setItem('sysdesign_gemini_key', key); } catch {}
  }

  _loadApiKey() {
    try { return localStorage.getItem('sysdesign_gemini_key') || ''; } catch { return ''; }
  }

  hasApiKey() {
    return this.apiKey && this.apiKey.trim().length > 10;
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  _buildDiagramContext(diagram) {
    if (!diagram) return 'No diagram loaded.';
    const data = diagram.serialize();
    if (!data.nodes || data.nodes.length === 0) return 'Diagram kosong (belum ada komponen).';

    const nodes = data.nodes.map(n => `- ${n.label} (${n.type})`).join('\n');
    const connections = data.connections.map(c => {
      const from = data.nodes.find(n => n.id === c.fromNodeId);
      const to = data.nodes.find(n => n.id === c.toNodeId);
      return `- ${from?.label || c.fromNodeId} → ${to?.label || c.toNodeId}${c.label ? ` [${c.label}]` : ''}`;
    }).join('\n');

    return `Current diagram:\n\nNodes (${data.nodes.length}):\n${nodes}\n\nConnections (${data.connections.length}):\n${connections || 'None'}`;
  }

  async sendMessage(userMessage, diagram) {
    const diagramContext = this._buildDiagramContext(diagram);

    // If no API key, return fallback
    if (!this.hasApiKey()) {
      return this._getFallbackResponse(userMessage);
    }

    // Build messages for Gemini
    const userContent = `${userMessage}\n\n---\n${diagramContext}`;

    this.conversationHistory.push({ role: 'user', parts: [{ text: userContent }] });

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: this.conversationHistory,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          throw new Error('API key tidak valid. Cek kembali Gemini API key kamu.');
        }
        if (response.status === 429) {
          throw new Error('Rate limit tercapai. Coba lagi dalam beberapa detik.');
        }
        throw new Error(err.error?.message || `API error (${response.status})`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada response.';

      this.conversationHistory.push({ role: 'model', parts: [{ text: aiText }] });

      // Keep history manageable (last 20 messages)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return aiText;
    } catch (error) {
      // Remove the failed user message from history
      this.conversationHistory.pop();
      throw error;
    }
  }

  _getFallbackResponse(message) {
    const lower = message.toLowerCase();
    if (lower.includes('review') || lower.includes('analys') || lower.includes('cek')) {
      return Promise.resolve(FALLBACK_RESPONSES.review);
    }
    if (lower.includes('improve') || lower.includes('tambah') || lower.includes('saran') || lower.includes('suggest')) {
      return Promise.resolve(FALLBACK_RESPONSES.improve);
    }
    if (lower.includes('spof') || lower.includes('single point') || lower.includes('failure')) {
      return Promise.resolve(FALLBACK_RESPONSES.spof);
    }
    return Promise.resolve(FALLBACK_RESPONSES.default);
  }
}
