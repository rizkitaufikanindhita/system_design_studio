import { SCENARIOS } from './simulationConfigs.js';

export class SimulationPanel {
  constructor(diagram) {
    this.diagram = diagram;
    this.simulation = null;
    this.isOpen = false;
    this._configOpen = true;
    this._container = null;
    this._createContainer();
  }

  _createContainer() {
    this._container = document.createElement('div');
    this._container.className = 'sim-panel';
    this._container.id = 'sim-panel';
    document.body.appendChild(this._container);
  }

  attach(simulation) {
    this.simulation = simulation;
    simulation.onStateChange = () => this._render();
    simulation.onTick = (elapsed) => {
      // Throttle stats update to ~4fps
      if (!this._lastStatsUpdate || elapsed - this._lastStatsUpdate > 0.25) {
        this._lastStatsUpdate = elapsed;
        this._updateStats();
        this._updateDerived();
      }
    };
  }

  show() {
    this.isOpen = true;
    this._container.classList.add('open');
    this._render();
  }

  hide() {
    this.isOpen = false;
    this._container.classList.remove('open');
  }

  _render() {
    if (!this.simulation || !this.isOpen) return;

    const sim = this.simulation;
    const isRunning = sim.state === 'running';
    const isPaused = sim.state === 'paused';
    const params = sim.getUserParams();
    const derived = sim.getDerivedStats();
    const scenarioOpts = Object.entries(SCENARIOS).map(([key, s]) =>
      `<option value="${key}" ${sim.scenario === key ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    const speeds = [0.5, 1, 2, 4];
    const speedBtns = speeds.map(s =>
      `<button class="sim-speed-btn ${sim.speed === s ? 'active' : ''}" data-speed="${s}">${s}x</button>`
    ).join('');

    const dataSizes = [0.5, 2, 10, 100, 1024];
    const dataSizeLabels = ['0.5KB', '2KB', '10KB', '100KB', '1MB'];
    const dataSizeBtns = dataSizes.map((s, i) =>
      `<button class="sim-data-btn ${params.dataSizeKB === s ? 'active' : ''}" data-size="${s}">${dataSizeLabels[i]}</button>`
    ).join('');

    this._container.innerHTML = `
      <div class="sim-panel-inner">
        <div class="sim-config-section ${this._configOpen ? 'open' : ''}">
          <button class="sim-config-toggle" id="sim-config-toggle">
            <span>⚙ Config</span>
            <span class="sim-config-chevron">${this._configOpen ? '▾' : '▸'}</span>
          </button>
          <div class="sim-config-body" id="sim-config-body">
            <div class="sim-config-row">
              <div class="sim-config-field">
                <label class="sim-config-label">👥 Concurrent Users</label>
                <div class="sim-slider-row">
                  <input type="range" class="sim-slider" id="sim-users-slider"
                    min="2" max="7" step="0.1"
                    value="${Math.log10(params.concurrentUsers)}">
                  <span class="sim-slider-value" id="sim-users-value">${this._formatUsers(params.concurrentUsers)}</span>
                </div>
              </div>
              <div class="sim-config-field">
                <label class="sim-config-label">📊 Read : Write</label>
                <div class="sim-slider-row">
                  <input type="range" class="sim-slider" id="sim-rw-slider"
                    min="50" max="99" step="1"
                    value="${params.readRatio}">
                  <span class="sim-slider-value" id="sim-rw-value">${params.readRatio}:${100 - params.readRatio}</span>
                </div>
              </div>
            </div>
            <div class="sim-config-row">
              <div class="sim-config-field">
                <label class="sim-config-label">📦 Data / Request</label>
                <div class="sim-data-group">${dataSizeBtns}</div>
              </div>
              <div class="sim-config-derived" id="sim-derived">
                <span>→ ~${this._formatNumber(derived.readQPS)} read/s</span>
                <span class="sim-derived-dot">•</span>
                <span>~${this._formatNumber(derived.writeQPS)} write/s</span>
                <span class="sim-derived-dot">•</span>
                <span>~${this._formatBandwidth(derived.bandwidthMBps)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sim-controls">
          <div class="sim-btn-group">
            ${isRunning ? `
              <button class="sim-ctrl-btn" id="sim-pause" title="Pause">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              </button>
            ` : `
              <button class="sim-ctrl-btn sim-play" id="sim-play" title="${isPaused ? 'Resume' : 'Start'}">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5,3 19,12 5,21"/></svg>
              </button>
            `}
            <button class="sim-ctrl-btn sim-stop" id="sim-stop" title="Stop">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
            </button>
          </div>

          <div class="sim-divider"></div>

          <div class="sim-speed-group">
            <span class="sim-label">Speed</span>
            ${speedBtns}
          </div>

          <div class="sim-divider"></div>

          <div class="sim-scenario-group">
            <span class="sim-label">Scenario</span>
            <select class="sim-scenario-select" id="sim-scenario">${scenarioOpts}</select>
          </div>

          <div class="sim-divider"></div>

          <div class="sim-stats" id="sim-stats">
            <div class="sim-stat">
              <span class="sim-stat-value" id="sim-stat-rps">0</span>
              <span class="sim-stat-label">Total RPS</span>
            </div>
            <div class="sim-stat">
              <span class="sim-stat-value" id="sim-stat-latency">0ms</span>
              <span class="sim-stat-label">P99 Latency</span>
            </div>
            <div class="sim-stat">
              <span class="sim-stat-value sim-stat-health" id="sim-stat-health">
                <span class="sim-dot healthy"></span>0
                <span class="sim-dot warning"></span>0
                <span class="sim-dot error"></span>0
              </span>
              <span class="sim-stat-label">Nodes</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
    this._syncSliderFills();
  }

  _updateStats() {
    if (!this.simulation || this.simulation.state === 'idle') return;
    const stats = this.simulation.getSystemStats();

    const rpsEl = document.getElementById('sim-stat-rps');
    const latEl = document.getElementById('sim-stat-latency');
    const healthEl = document.getElementById('sim-stat-health');

    if (rpsEl) rpsEl.textContent = this._formatNumber(stats.totalRPS);
    if (latEl) latEl.textContent = Math.round(stats.maxLatency) + 'ms';
    if (healthEl) {
      healthEl.innerHTML = `
        <span class="sim-dot healthy"></span>${stats.healthyCount}
        <span class="sim-dot warning"></span>${stats.warningCount}
        <span class="sim-dot error"></span>${stats.errorCount}
      `;
    }
  }

  _updateDerived() {
    if (!this.simulation) return;
    const derived = this.simulation.getDerivedStats();
    const el = document.getElementById('sim-derived');
    if (el) {
      el.innerHTML = `
        <span>→ ~${this._formatNumber(derived.readQPS)} read/s</span>
        <span class="sim-derived-dot">•</span>
        <span>~${this._formatNumber(derived.writeQPS)} write/s</span>
        <span class="sim-derived-dot">•</span>
        <span>~${this._formatBandwidth(derived.bandwidthMBps)}</span>
      `;
    }
  }

  _formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toString();
  }

  _formatUsers(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  _formatBandwidth(mbps) {
    if (mbps >= 1024) return (mbps / 1024).toFixed(1) + ' GB/s';
    if (mbps >= 1) return mbps.toFixed(1) + ' MB/s';
    return (mbps * 1024).toFixed(0) + ' KB/s';
  }

  _bindEvents() {
    const sim = this.simulation;
    if (!sim) return;

    document.getElementById('sim-play')?.addEventListener('click', () => {
      if (sim.state === 'paused') sim.resume();
      else sim.start();
    });

    document.getElementById('sim-pause')?.addEventListener('click', () => {
      sim.pause();
    });

    document.getElementById('sim-stop')?.addEventListener('click', () => {
      sim.stop();
      this.hide();
      if (this.onStop) this.onStop();
    });

    document.getElementById('sim-scenario')?.addEventListener('change', (e) => {
      sim.setScenario(e.target.value);
    });

    this._container.querySelectorAll('.sim-speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sim.setSpeed(parseFloat(btn.dataset.speed));
        this._container.querySelectorAll('.sim-speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Config toggle
    document.getElementById('sim-config-toggle')?.addEventListener('click', () => {
      this._configOpen = !this._configOpen;
      const section = this._container.querySelector('.sim-config-section');
      const chevron = this._container.querySelector('.sim-config-chevron');
      if (section) section.classList.toggle('open', this._configOpen);
      if (chevron) chevron.textContent = this._configOpen ? '▾' : '▸';
    });

    // Concurrent users slider (logarithmic: 10^2 to 10^7)
    const usersSlider = document.getElementById('sim-users-slider');
    usersSlider?.addEventListener('input', (e) => {
      const rawVal = parseFloat(e.target.value);
      const users = Math.round(Math.pow(10, rawVal));
      sim.setUserParams({ concurrentUsers: users });
      const valEl = document.getElementById('sim-users-value');
      if (valEl) valEl.textContent = this._formatUsers(users);
      this._setSliderFill(e.target);
      this._updateDerived();
    });

    // Read:Write ratio slider
    const rwSlider = document.getElementById('sim-rw-slider');
    rwSlider?.addEventListener('input', (e) => {
      const ratio = parseInt(e.target.value);
      sim.setUserParams({ readRatio: ratio });
      const valEl = document.getElementById('sim-rw-value');
      if (valEl) valEl.textContent = `${ratio}:${100 - ratio}`;
      this._setSliderFill(e.target);
      this._updateDerived();
    });

    // Data size buttons
    this._container.querySelectorAll('.sim-data-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = parseFloat(btn.dataset.size);
        sim.setUserParams({ dataSizeKB: size });
        this._container.querySelectorAll('.sim-data-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._updateDerived();
      });
    });
  }

  _setSliderFill(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--val', pct + '%');
  }

  _syncSliderFills() {
    this._container.querySelectorAll('.sim-slider').forEach(s => this._setSliderFill(s));
  }
}
