import { ChatService } from './chatService.js';

const QUICK_PROMPTS = [
  { label: '🔍 Review Diagram', prompt: 'Review diagram system design saya. Apa yang sudah bagus dan apa yang perlu diperbaiki?' },
  { label: '➕ Suggest', prompt: 'Komponen apa lagi yang perlu ditambahkan ke diagram saya agar lebih reliable?' },
  { label: '⚠️ Cek SPOF', prompt: 'Cek single point of failure di diagram saya dan berikan solusinya.' },
  { label: '📈 Scaling', prompt: 'Bagaimana cara scale system di diagram saya untuk handle 10x traffic?' },
];

export class ChatPanel {
  constructor(diagram) {
    this.diagram = diagram;
    this.service = new ChatService();
    this.isOpen = false;
    this.messages = []; // { role: 'user'|'ai'|'system', text }
    this.isLoading = false;
    this._createElements();
  }

  _createElements() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'chat-backdrop';
    this.backdrop.addEventListener('click', () => this.close());

    this.drawer = document.createElement('div');
    this.drawer.className = 'chat-drawer';

    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.drawer);
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open() {
    this.isOpen = true;
    this.backdrop.classList.add('open');
    this.drawer.classList.add('open');
    this._render();
    // Show welcome if first time
    if (this.messages.length === 0) {
      this.messages.push({
        role: 'ai',
        text: `Halo! 👋 Saya **System Design Assistant**.\n\nSaya bisa membantu:\n• **Review** diagram kamu\n• **Suggest** komponen yang perlu ditambah\n• **Explain** konsep system design\n• **Cek** single point of failure\n\n${this.service.hasApiKey() ? '✅ API key aktif — AI mode' : '⚙️ Set API key di bawah untuk AI mode, atau gunakan quick prompts.'}`,
      });
      this._render();
    }
  }

  close() {
    this.isOpen = false;
    this.backdrop.classList.remove('open');
    this.drawer.classList.remove('open');
  }

  _render() {
    const hasKey = this.service.hasApiKey();
    const apiKey = this.service.getApiKey();

    this.drawer.innerHTML = `
      <div class="chat-header">
        <div>
          <div class="chat-title">💬 AI Assistant</div>
          <div class="chat-status ${hasKey ? 'active' : ''}">
            ${hasKey ? '● Gemini AI aktif' : '○ Offline mode'}
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="chat-btn-icon" id="chat-settings" title="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>
          <button class="chat-btn-icon" id="chat-clear" title="Clear chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
          <button class="chat-btn-icon" id="chat-close" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="chat-messages" id="chat-messages">
        ${this.messages.map(m => this._renderMessage(m)).join('')}
        ${this.isLoading ? `
          <div class="chat-message ai">
            <div class="chat-bubble ai">
              <div class="chat-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="chat-quick-prompts" id="chat-quick-prompts">
        ${QUICK_PROMPTS.map((qp, i) => `
          <button class="chat-quick-btn" data-idx="${i}">${qp.label}</button>
        `).join('')}
      </div>

      <div class="chat-settings-panel ${this._showSettings ? 'open' : ''}" id="chat-settings-panel">
        <div class="chat-settings-title">⚙️ API Settings</div>
        <label class="chat-settings-label">Gemini API Key</label>
        <input type="password" class="chat-settings-input" id="chat-api-key"
               value="${apiKey}" placeholder="AIzaSy...">
        <div class="chat-settings-hint">
          Dapatkan API key gratis di <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>
        </div>
        <button class="chat-settings-save" id="chat-save-key">Save Key</button>
      </div>

      <div class="chat-input-area">
        <textarea class="chat-input" id="chat-input" rows="1"
                  placeholder="Tanya tentang system design..." 
                  ${this.isLoading ? 'disabled' : ''}></textarea>
        <button class="chat-send-btn" id="chat-send" ${this.isLoading ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    `;

    this._bindEvents();
    this._scrollToBottom();
  }

  _renderMessage(msg) {
    const isUser = msg.role === 'user';
    const formatted = this._formatMarkdown(msg.text);
    return `
      <div class="chat-message ${msg.role}">
        <div class="chat-bubble ${msg.role}">
          ${formatted}
        </div>
      </div>
    `;
  }

  _formatMarkdown(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/• /g, '<span class="chat-bullet">•</span> ');
  }

  _scrollToBottom() {
    const el = document.getElementById('chat-messages');
    if (el) {
      requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
    }
  }

  _bindEvents() {
    document.getElementById('chat-close')?.addEventListener('click', () => this.close());

    document.getElementById('chat-clear')?.addEventListener('click', () => {
      this.messages = [];
      this.service.clearHistory();
      this.messages.push({ role: 'ai', text: 'Chat cleared! 🧹 Tanya apa saja tentang system design.' });
      this._render();
    });

    document.getElementById('chat-settings')?.addEventListener('click', () => {
      this._showSettings = !this._showSettings;
      const panel = document.getElementById('chat-settings-panel');
      if (panel) panel.classList.toggle('open', this._showSettings);
    });

    document.getElementById('chat-save-key')?.addEventListener('click', () => {
      const input = document.getElementById('chat-api-key');
      if (input) {
        this.service.setApiKey(input.value.trim());
        this._showSettings = false;
        this._render();
      }
    });

    // Quick prompts
    this.drawer.querySelectorAll('.chat-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        this._sendMessage(QUICK_PROMPTS[idx].prompt);
      });
    });

    // Send button
    document.getElementById('chat-send')?.addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      if (input && input.value.trim()) {
        this._sendMessage(input.value.trim());
      }
    });

    // Enter to send (Shift+Enter for newline)
    document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const input = e.target;
        if (input.value.trim()) {
          this._sendMessage(input.value.trim());
        }
      }
    });

    // Auto-resize textarea
    document.getElementById('chat-input')?.addEventListener('input', (e) => {
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    });
  }

  async _sendMessage(text) {
    this.messages.push({ role: 'user', text });
    this.isLoading = true;
    this._render();

    try {
      const response = await this.service.sendMessage(text, this.diagram);
      this.messages.push({ role: 'ai', text: response });
    } catch (error) {
      this.messages.push({ role: 'ai', text: `❌ **Error:** ${error.message}` });
    } finally {
      this.isLoading = false;
      this._render();
    }
  }
}
