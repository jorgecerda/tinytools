// URL Redirect Chain Checker Logic & UI Handler

import { escapeHtml, UA_PRESETS } from '../shared/utils.js';

export default {
  render(container) {
    container.innerHTML = `
            <div class="redirect-container">
                <div class="card-premium">
                    <div class="form-group">
                        <label for="redirectUrlInput">Enter URL to Trace</label>
                        <div class="redirect-input-group">
                            <input type="text" id="redirectUrlInput" class="input-premium" placeholder="http://example.com">
                            <div class="redirect-action-buttons">
                                <button class="btn-primary" id="traceBtn" style="white-space: nowrap; height: 46px;">Trace Redirects</button>
                                <button class="btn-secondary" id="clearRedirectBtn" style="white-space: nowrap; height: 46px;">Clear</button>
                            </div>
                        </div>
                    </div>

                    <div class="bulk-options-panel" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 16px;">
                        <div class="bulk-option-field">
                            <span class="bulk-option-label">Simulate Device / User-Agent</span>
                            <select class="bulk-select" id="redirectUaPreset">
                                <option value="chrome" selected>Chrome (Default)</option>
                                <option value="googlebot">Googlebot (SEO crawler)</option>
                                <option value="mobile">Mobile Safari</option>
                                <option value="custom">Custom...</option>
                            </select>
                        </div>
                        <div class="bulk-option-field" id="redirectCustomUaField" style="display: none;">
                            <span class="bulk-option-label">Custom User-Agent Header</span>
                            <input type="text" class="bulk-input" id="redirectCustomUaInput" placeholder="Enter custom User-Agent string">
                        </div>
                    </div>
                </div>

                <!-- Loader -->
                <div class="card-premium" id="redirectLoader" style="display: none;">
                    <div class="tool-loader" style="padding: 0;">
                        <div class="spinner"></div>
                        <p id="loaderMessage">Initiating request trace...</p>
                    </div>
                </div>

                <!-- SEO Alerts Dashboard -->
                <div id="seoAlertWrapper"></div>

                <!-- Timeline Output -->
                <div class="card-premium" id="timelineCard" style="display: none;">
                    <h3 style="margin-bottom: 20px;">Redirection Path Timeline</h3>
                    <div class="redirect-timeline-section">
                        <div class="redirect-timeline" id="timelineContainer">
                            <!-- Hops injected here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

    this.bindEvents();
  },

  bindEvents() {
    const traceBtn = document.getElementById('traceBtn');
    const urlInput = document.getElementById('redirectUrlInput');
    const uaPreset = document.getElementById('redirectUaPreset');
    const customUaField = document.getElementById('redirectCustomUaField');

    // Toggle custom UA field
    uaPreset.addEventListener('change', (e) => {
      customUaField.style.display =
        e.target.value === 'custom' ? 'flex' : 'none';
    });

    // Trace button trigger
    traceBtn.addEventListener('click', () => this.runTrace());

    // Press Enter to submit
    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.runTrace();
      }
    });

    // Clear button trigger
    const clearRedirectBtn = document.getElementById('clearRedirectBtn');
    if (clearRedirectBtn) {
      clearRedirectBtn.addEventListener('click', () => this.clearResults());
    }
  },

  async runTrace() {
    const urlInput = document.getElementById('redirectUrlInput');
    let url = urlInput.value.trim();

    if (!url) {
      alert('Please enter a URL to check.');
      return;
    }

    // Prepends http:// if no protocol is given
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
      urlInput.value = url;
    }

    const loader = document.getElementById('redirectLoader');
    const timelineCard = document.getElementById('timelineCard');
    const seoAlertWrapper = document.getElementById('seoAlertWrapper');
    const traceBtn = document.getElementById('traceBtn');

    // Reset UI
    loader.style.display = 'block';
    timelineCard.style.display = 'none';
    seoAlertWrapper.innerHTML = '';
    traceBtn.setAttribute('disabled', 'true');

    // Fetch options
    const preset = document.getElementById('redirectUaPreset').value;
    const customUa = document
      .getElementById('redirectCustomUaInput')
      .value.trim();
    const userAgent = preset === 'custom' ? customUa : UA_PRESETS[preset];

    try {
      document.getElementById('loaderMessage').textContent =
        'Tracing network hops...';

      const res = await fetch('/api/check-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          followRedirects: true,
          method: 'GET', // Redirect checking requires GET to resolve redirects accurately
          userAgent,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      this.renderResults(data);
    } catch (err) {
      console.error(err);
      seoAlertWrapper.innerHTML = `
                <div class="seo-alert seo-alert-danger">
                    <div style="font-size:1.2rem; line-height: 1; font-family: 'Geist Mono', monospace; font-weight: bold;">[!]</div>
                    <div>
                        <div class="seo-alert-title">Trace Request Failed</div>
                        <div class="seo-alert-desc">
                            We were unable to resolve the URL. Error details: <strong>${escapeHtml(err.message)}</strong>. 
                            Please verify the domain exists and is online.
                        </div>
                    </div>
                </div>
            `;
    } finally {
      loader.style.display = 'none';
      traceBtn.removeAttribute('disabled');
    }
  },

  renderResults(data) {
    const timelineCard = document.getElementById('timelineCard');
    const timelineContainer = document.getElementById('timelineContainer');
    const seoAlertWrapper = document.getElementById('seoAlertWrapper');

    timelineContainer.innerHTML = '';
    timelineCard.style.display = 'block';

    // 1. Analyze and render SEO status
    const chain = parseRedirectChain(data);
    const analysis = buildSeoAnalysis(chain);
    seoAlertWrapper.innerHTML = `
            <div class="seo-alert ${analysis.alertClass}">
                <div style="font-size:1.5rem; line-height: 1;">${analysis.icon}</div>
                <div>
                    <div class="seo-alert-title">${analysis.title}</div>
                    <div class="seo-alert-desc">${analysis.description}</div>
                </div>
            </div>
        `;

    // 2. Render hops
    chain.forEach((hop, i) => {
      const node = document.createElement('div');
      node.className = 'redirect-node';

      const isLast = i === chain.length - 1;
      let statusBadgeClass = 'status-badge ';
      let statusLabel = hop.status
        ? `${hop.status} ${hop.statusText}`
        : hop.statusText;

      if (hop.error) {
        statusBadgeClass += 'badge-err';
        statusLabel = hop.statusText || 'Failed';
      } else if (hop.status >= 200 && hop.status < 300) {
        statusBadgeClass += 'badge-2xx';
      } else if (hop.status >= 300 && hop.status < 400) {
        statusBadgeClass += 'badge-3xx';
      } else if (hop.status >= 400 && hop.status < 500) {
        statusBadgeClass += 'badge-4xx';
      } else if (hop.status >= 500) {
        statusBadgeClass += 'badge-5xx';
      }

      // Build headers table
      let headersTableHtml = '';
      if (hop.headers && Object.keys(hop.headers).length > 0) {
        headersTableHtml = `
                    <div class="redirect-headers-panel" id="headers-panel-${i}" style="display: none;">
                        <div class="redirect-headers-title">Response Headers</div>
                        <table class="redirect-headers-table">
                            <tbody>
                                ${Object.entries(hop.headers)
                                  .map(
                                    ([name, val]) => `
                                    <tr>
                                        <td>${escapeHtml(name)}</td>
                                        <td>${escapeHtml(val)}</td>
                                    </tr>
                                `,
                                  )
                                  .join('')}
                            </tbody>
                        </table>
                    </div>
                `;
      } else {
        headersTableHtml = `
                    <div class="redirect-headers-panel" id="headers-panel-${i}" style="display: none;">
                        <div class="redirect-headers-title">Response Headers</div>
                        <div style="font-size: 0.8rem; font-family: 'Geist Mono', monospace; padding:8px 12px; background-color:var(--bg-primary); border:1px solid var(--border-color); border-radius: 6px; color:var(--text-muted);">
                            No headers returned for this hop.
                        </div>
                    </div>
                `;
      }

      node.innerHTML = `
                <div class="redirect-node-marker"></div>
                ${!isLast && i === 0 ? '<div class="redirect-node-marker-pulse"></div>' : ''}
                
                <div class="redirect-hop-card">
                    <div class="redirect-hop-header">
                        <div class="redirect-hop-title-row">
                            <span class="redirect-hop-number">Hop ${i + 1}</span>
                            <span class="redirect-hop-url">${escapeHtml(hop.url)}</span>
                        </div>
                        <div class="redirect-hop-meta">
                            <span class="${statusBadgeClass}">${escapeHtml(statusLabel)}</span>
                            <span class="redirect-hop-time">${hop.responseTime}ms</span>
                            <button class="redirect-inspect-btn" id="inspectBtn-${i}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Headers
                            </button>
                        </div>
                    </div>
                    ${headersTableHtml}
                </div>
            `;

      timelineContainer.appendChild(node);

      // Bind show headers click
      const inspectBtn = node.querySelector(`#inspectBtn-${i}`);
      inspectBtn.addEventListener('click', () => {
        const panel = node.querySelector(`#headers-panel-${i}`);
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'block' : 'none';
        inspectBtn.querySelector('svg').style.transform = isHidden
          ? 'rotate(180deg)'
          : 'rotate(0deg)';
      });
    });
  },

  clearResults() {
    const urlInput = document.getElementById('redirectUrlInput');
    const timelineCard = document.getElementById('timelineCard');
    const seoAlertWrapper = document.getElementById('seoAlertWrapper');
    const loader = document.getElementById('redirectLoader');

    if (urlInput) urlInput.value = '';
    if (timelineCard) timelineCard.style.display = 'none';
    if (seoAlertWrapper) seoAlertWrapper.innerHTML = '';
    if (loader) loader.style.display = 'none';
  },

  destroy() {},
};

/**
 * Parses the raw redirect response data from the server.
 * @param {object} data
 * @returns {array}
 */
export function parseRedirectChain(data) {
  if (!data || !data.chain) return [];
  return data.chain;
}

/**
 * Builds the SEO analysis report from a redirect chain.
 * @param {array} chain
 * @returns {object}
 */
export function buildSeoAnalysis(chain) {
  if (!Array.isArray(chain) || chain.length === 0) {
    return {
      alertClass: 'seo-alert-danger',
      icon: '[ERROR]',
      title: 'Invalid Redirect Data',
      description: 'No redirection hops were found.',
    };
  }
  const finalHop = chain[chain.length - 1];
  const hops = chain.length;
  const totalDuration = chain.reduce((sum, h) => sum + h.responseTime, 0);

  // Check if last hop has error status
  if (finalHop.error) {
    return {
      alertClass: 'seo-alert-danger',
      icon: '[ERROR]',
      title: 'Redirection Error Detected',
      description: `The request chain broke on Hop ${hops} because of a connection error: <strong>${escapeHtml(finalHop.statusText)}</strong>.`,
    };
  }

  // Loop check
  const hasLoop = chain.some((h) => h.statusText === 'Redirect Loop Detected');
  if (hasLoop) {
    return {
      alertClass: 'seo-alert-danger',
      icon: '[LOOP]',
      title: 'Infinite Redirect Loop Detected!',
      description:
        'We detected a redirect loop. The server redirects back to a previously visited URL in the chain, creating an infinite loop. This URL is completely broken for users and search engine crawlers.',
    };
  }

  // 0 redirects (Direct URL)
  if (hops === 1) {
    return {
      alertClass: 'seo-alert-success',
      icon: '[SUCCESS]',
      title: 'Perfect: No Redirects Found',
      description: `The URL loads directly and returned status <strong>${finalHop.status} ${finalHop.statusText}</strong> in <strong>${totalDuration}ms</strong>. Ideal for SEO and quick load times.`,
    };
  }

  // 1 redirect (optimal migration)
  if (hops === 2) {
    return {
      alertClass: 'seo-alert-success',
      icon: '[OPTIMAL]',
      title: 'Optimal Redirect Path',
      description: `Successfully resolved in <strong>${hops - 1} redirect hop</strong>. Path: <code>${escapeHtml(chain[0].status)}</code> → <code>${escapeHtml(finalHop.status)}</code>. Total load time: <strong>${totalDuration}ms</strong>.`,
    };
  }

  // 2-3 redirects (suboptimal but acceptable)
  if (hops <= 4) {
    return {
      alertClass: 'seo-alert-warning',
      icon: '[WARNING]',
      title: 'Suboptimal Redirect Chain',
      description: `The URL has <strong>${hops - 1} redirects</strong> before resolving. While crawlers will follow this, it adds <strong>${totalDuration}ms</strong> of latency. Recommended: Update your links to point directly to <code>${escapeHtml(finalHop.url)}</code>.`,
    };
  }

  // > 3 redirects (Critical SEO issues)
  return {
    alertClass: 'seo-alert-danger',
    icon: '[CRITICAL]',
    title: 'Critical: Long Redirect Chain Detected!',
    description: `The URL took <strong>${hops - 1} hops</strong> to load. Search engine crawlers (like Googlebot) may abort crawling after 4-5 hops. This slows down page speeds significantly (<strong>${totalDuration}ms</strong> latency). Optimize the redirect rules on your server to point directly to the final destination.`,
  };
}
