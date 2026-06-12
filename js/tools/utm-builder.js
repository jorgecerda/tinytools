// UTM Builder & Verify Tool Module

import { escapeHtml } from '../shared/utils.js';

export default {
  id: 'utm-build-verify',

  render(container) {
    container.innerHTML = `
      <div class="utm-container">
        <!-- Subtabs Navigation -->
        <div class="utm-tabs">
          <button class="utm-tab-btn active" id="btnUtmTabBuild">Build Campaign URL</button>
          <button class="utm-tab-btn" id="btnUtmTabVerify">Verify Campaign URL</button>
        </div>

        <!-- Tab 1: Build Panel -->
        <div id="utmBuildPanel" class="utm-tab-panel active">
          <div class="utm-layout-grid">
            <!-- Left: UTM Form & Builder -->
            <div class="card-premium">
              <h3 style="margin-bottom:16px;">UTM Campaign Builder</h3>
              <div class="utm-form">
                <!-- Base URL -->
                <div class="utm-form-group">
                  <label class="utm-form-label" for="utmBaseUrl">Base URL <span class="required-star">*</span></label>
                  <input type="text" id="utmBaseUrl" class="input-premium" placeholder="https://example.com">
                  <div id="utmBaseUrlError" style="display:none; color:var(--danger); font-size:0.75rem; margin-top:2px;">Please enter a valid website URL (e.g., example.com)</div>
                </div>

                <!-- Campaign Source & Medium -->
                <div class="utm-form-row">
                  <div class="utm-form-group">
                    <label class="utm-form-label" for="utmSource">Source <span class="required-star">*</span></label>
                    <input type="text" id="utmSource" class="input-premium" placeholder="e.g. google, newsletter">
                  </div>
                  <div class="utm-form-group">
                    <label class="utm-form-label" for="utmMedium">Medium <span class="required-star">*</span></label>
                    <input type="text" id="utmMedium" class="input-premium" placeholder="e.g. cpc, email, social">
                  </div>
                </div>

                <!-- Campaign Name & ID -->
                <div class="utm-form-row">
                  <div class="utm-form-group">
                    <label class="utm-form-label" for="utmCampaign">Campaign <span class="required-star">*</span></label>
                    <input type="text" id="utmCampaign" class="input-premium" placeholder="e.g. summer_sale">
                  </div>
                  <div class="utm-form-group">
                    <label class="utm-form-label" for="utmId">ID <span style="color:var(--text-muted); font-size:0.75rem;">(optional)</span></label>
                    <input type="text" id="utmId" class="input-premium" placeholder="e.g. 984312">
                  </div>
                </div>

                <!-- Campaign Term & Content -->
                <div class="utm-form-row">
                  <div class="utm-form-group">
                    <label class="utm-form-label" for="utmTerm">Term <span style="color:var(--text-muted); font-size:0.75rem;">(optional)</span></label>
                    <input type="text" id="utmTerm" class="input-premium" placeholder="e.g. running+shoes">
                  </div>
                  <div class="utm-form-group">
                    <label class="utm-form-label" for="utmContent">Content <span style="color:var(--text-muted); font-size:0.75rem;">(optional)</span></label>
                    <input type="text" id="utmContent" class="input-premium" placeholder="e.g. banner_ad_1">
                  </div>
                </div>

                <div class="converter-controls" style="margin-top:8px;">
                  <button class="btn-secondary" id="clearUtmBtn">Reset Fields</button>
                </div>
              </div>
            </div>

            <!-- Right: GA4 prediction & checklist -->
            <div class="card-premium" style="display:flex; flex-direction:column; gap:20px;">
              <h3 style="margin-bottom:4px;">GA4 Channel Group</h3>

              <!-- GA4 Predictor Card -->
              <div>
                <div class="ga4-badge-container" style="margin-top:0;">
                  <span class="ga4-badge" id="ga4ChannelBadge">Direct</span>
                  <span class="ga4-channel-name" id="ga4ChannelName">Direct</span>
                </div>
              </div>

              <!-- Parameters checklist table -->
              <div>
                <span class="utm-form-label">Parameters Status Checklist</span>
                <table class="utm-verify-table">
                  <tbody id="utmChecklistBody">
                    <!-- Verification status items will be loaded dynamically -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Generated URL Section -->
          <div class="card-premium utm-output-card" id="utmOutputCard" style="display:none; margin-top:20px;">
            <h3>Generated Campaign URL</h3>
            <div class="utm-input-group" style="margin-top:8px;">
              <input type="text" id="utmGeneratedUrlInput" class="input-premium" readonly style="font-family:'Geist Mono', monospace; font-size:0.85rem;" placeholder="Generated campaign URL will appear here...">
              <button class="btn-primary" id="copyUtmUrlBtn" style="white-space: nowrap; padding: 12px 20px;">Copy Tagged URL</button>
            </div>
          </div>
        </div>

        <!-- Tab 2: Verify Panel -->
        <div id="utmVerifyPanel" class="utm-tab-panel" style="display:none;">
          <div class="utm-layout-grid">
            <!-- Left: Paste URL Parser box & Parameter Breakdown -->
            <div class="card-premium" style="display:flex; flex-direction:column; gap:16px;">
              <h3 style="margin-bottom:4px;">Paste URL to Inspect</h3>
              <div>
                <input type="text" id="utmPasteParser" class="input-premium" style="width:100%; margin-top:6px; padding:12px; font-family:'Geist Mono', monospace; font-size:0.85rem;" placeholder="Paste an existing URL containing UTM parameters...">
                <div id="utmPasteParserError" style="display:none; color:var(--danger); font-size:0.75rem; margin-top:4px;">Please enter a valid website URL (e.g., example.com)</div>
              </div>

              <!-- Parsed Parameter Breakdown -->
              <div id="utmParsedBreakdownWrapper" style="display:none; border-top:1px solid var(--border-color); padding-top:16px;">
                <h4 style="margin-bottom:12px; font-size:0.95rem;">Parsed Parameters</h4>
                <table class="utm-verify-table">
                  <tbody id="utmParsedBreakdownBody">
                    <!-- Dynamically rendered rows -->
                  </tbody>
                </table>
                <button class="btn-primary" id="btnImportToBuilder" style="margin-top:16px; width:100%;">
                  Import to Campaign Builder
                </button>
              </div>
            </div>

            <!-- Right: Verification results (GA4 + checklist) -->
            <div class="card-premium" style="display:flex; flex-direction:column; gap:20px;">
              <h3 style="margin-bottom:4px;">GA4 Channel Group</h3>
              <!-- GA4 Predictor Card -->
              <div>
                <div class="ga4-badge-container" style="margin-top:0;">
                  <span class="ga4-badge" id="ga4VerifyChannelBadge">Direct</span>
                  <span class="ga4-channel-name" id="ga4VerifyChannelName">Direct</span>
                </div>
              </div>

              <!-- Parameters checklist table -->
              <div>
                <span class="utm-form-label">Parameters Status Checklist</span>
                <table class="utm-verify-table">
                  <tbody id="utmVerifyChecklistBody">
                    <!-- Verification status items will be loaded dynamically -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateUI(); // Load initial state
    this.updateVerifyUI(); // Load initial verify state
  },

  bindEvents() {
    // Tab toggling
    const btnTabBuild = document.getElementById('btnUtmTabBuild');
    const btnTabVerify = document.getElementById('btnUtmTabVerify');
    const panelBuild = document.getElementById('utmBuildPanel');
    const panelVerify = document.getElementById('utmVerifyPanel');

    btnTabBuild.addEventListener('click', () => {
      btnTabBuild.classList.add('active');
      btnTabVerify.classList.remove('active');
      panelBuild.style.display = 'block';
      panelVerify.style.display = 'none';
    });

    btnTabVerify.addEventListener('click', () => {
      btnTabVerify.classList.add('active');
      btnTabBuild.classList.remove('active');
      panelVerify.style.display = 'block';
      panelBuild.style.display = 'none';
    });

    const inputs = ['utmBaseUrl', 'utmSource', 'utmMedium', 'utmCampaign', 'utmId', 'utmTerm', 'utmContent'];
    inputs.forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        this.updateUI();
      });
    });

    const parserText = document.getElementById('utmPasteParser');
    parserText.addEventListener('input', () => {
      this.updateVerifyUI();
    });

    const importBtn = document.getElementById('btnImportToBuilder');
    importBtn.addEventListener('click', () => {
      const val = parserText.value.trim();
      if (!val) return;

      const parsed = parseUtmUrl(val);
      if (parsed.baseUrl) {
        document.getElementById('utmBaseUrl').value = parsed.baseUrl;
        document.getElementById('utmSource').value = parsed.params.utm_source || '';
        document.getElementById('utmMedium').value = parsed.params.utm_medium || '';
        document.getElementById('utmCampaign').value = parsed.params.utm_campaign || '';
        document.getElementById('utmId').value = parsed.params.utm_id || '';
        document.getElementById('utmTerm').value = parsed.params.utm_term || '';
        document.getElementById('utmContent').value = parsed.params.utm_content || '';
        
        // Update builder UI
        this.updateUI();
        
        // Switch to Builder tab
        btnTabBuild.click();
      }
    });

    document.getElementById('clearUtmBtn').addEventListener('click', () => {
      inputs.forEach(id => {
        document.getElementById(id).value = '';
      });
      this.updateUI();
    });

    // Copy URL Action
    const copyBtn = document.getElementById('copyUtmUrlBtn');
    copyBtn.addEventListener('click', () => {
      const urlText = document.getElementById('utmGeneratedUrlInput').value;
      if (!urlText) return;

      navigator.clipboard.writeText(urlText).then(() => {
        const origText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('btn-success');
        setTimeout(() => {
          copyBtn.textContent = origText;
          copyBtn.classList.remove('btn-success');
        }, 1500);
      });
    });
  },

  updateUI() {
    const baseUrl = document.getElementById('utmBaseUrl').value.trim();
    const source = document.getElementById('utmSource').value.trim();
    const medium = document.getElementById('utmMedium').value.trim();
    const campaign = document.getElementById('utmCampaign').value.trim();
    const id = document.getElementById('utmId').value.trim();
    const term = document.getElementById('utmTerm').value.trim();
    const content = document.getElementById('utmContent').value.trim();

    const params = {};
    if (source) params.utm_source = source;
    if (medium) params.utm_medium = medium;
    if (campaign) params.utm_campaign = campaign;
    if (id) params.utm_id = id;
    if (term) params.utm_term = term;
    if (content) params.utm_content = content;

    const baseInput = document.getElementById('utmBaseUrl');
    const baseError = document.getElementById('utmBaseUrlError');

    let finalUrl = '';
    if (baseUrl) {
      if (isValidUrl(baseUrl)) {
        baseInput.classList.remove('input-invalid');
        baseError.style.display = 'none';
        finalUrl = buildUtmUrl(baseUrl, params);
        document.getElementById('utmGeneratedUrlInput').value = finalUrl;
        document.getElementById('utmOutputCard').style.display = 'block';
      } else {
        baseInput.classList.add('input-invalid');
        baseError.style.display = 'block';
        document.getElementById('utmGeneratedUrlInput').value = '';
        document.getElementById('utmOutputCard').style.display = 'none';
      }
    } else {
      baseInput.classList.remove('input-invalid');
      baseError.style.display = 'none';
      document.getElementById('utmGeneratedUrlInput').value = '';
      document.getElementById('utmOutputCard').style.display = 'none';
    }

    // GA4 prediction channel
    const ga4Channel = classifyGa4Channel(source, medium);
    const badge = document.getElementById('ga4ChannelBadge');
    const name = document.getElementById('ga4ChannelName');
    
    badge.textContent = ga4Channel;
    name.textContent = ga4Channel;
    badge.style.backgroundColor = getGa4ChannelColor(ga4Channel);

    // Update checklist status
    this.updateChecklist('utmChecklistBody', source, medium, campaign, id, term, content);
  },

  updateVerifyUI() {
    const parserInput = document.getElementById('utmPasteParser');
    const parserError = document.getElementById('utmPasteParserError');
    const urlStr = parserInput.value.trim();
    
    const breakdownWrapper = document.getElementById('utmParsedBreakdownWrapper');
    const breakdownBody = document.getElementById('utmParsedBreakdownBody');
    const badge = document.getElementById('ga4VerifyChannelBadge');
    const name = document.getElementById('ga4VerifyChannelName');

    if (urlStr) {
      if (isValidUrl(urlStr)) {
        parserInput.classList.remove('input-invalid');
        parserError.style.display = 'none';
        
        const parsed = parseUtmUrl(urlStr);
        const source = parsed.params.utm_source || '';
        const medium = parsed.params.utm_medium || '';
        const campaign = parsed.params.utm_campaign || '';
        const id = parsed.params.utm_id || '';
        const term = parsed.params.utm_term || '';
        const content = parsed.params.utm_content || '';

        // GA4 prediction channel for verified URL
        const ga4Channel = classifyGa4Channel(source, medium);
        badge.textContent = ga4Channel;
        name.textContent = ga4Channel;
        badge.style.backgroundColor = getGa4ChannelColor(ga4Channel);

        // Update verify checklist status
        this.updateChecklist('utmVerifyChecklistBody', source, medium, campaign, id, term, content);

        // Update breakdown table
        breakdownWrapper.style.display = 'block';
        const items = [
          { name: 'Base URL', val: parsed.baseUrl },
          { name: 'utm_source', val: source },
          { name: 'utm_medium', val: medium },
          { name: 'utm_campaign', val: campaign },
          { name: 'utm_id', val: id },
          { name: 'utm_term', val: term },
          { name: 'utm_content', val: content }
        ].filter(item => item.val !== '');

        if (items.length > 0) {
          breakdownBody.innerHTML = items.map(item => `
            <tr>
              <td style="font-weight: 600; color: var(--text-secondary); width: 35%;">${escapeHtml(item.name)}</td>
              <td style="color: var(--text-primary); word-break: break-all;">${escapeHtml(item.val)}</td>
            </tr>
          `).join('');
        } else {
          breakdownBody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--text-muted);">No parameters parsed.</td></tr>`;
        }
      } else {
        parserInput.classList.add('input-invalid');
        parserError.style.display = 'block';
        breakdownWrapper.style.display = 'none';
        breakdownBody.innerHTML = '';
        
        // Reset GA4 Verify badge to Unassigned
        badge.textContent = 'Unassigned';
        name.textContent = 'Unassigned';
        badge.style.backgroundColor = getGa4ChannelColor('Unassigned');
        
        // Reset checklist to empty state
        this.updateChecklist('utmVerifyChecklistBody', '', '', '', '', '', '');
      }
    } else {
      parserInput.classList.remove('input-invalid');
      parserError.style.display = 'none';
      breakdownWrapper.style.display = 'none';
      breakdownBody.innerHTML = '';
      
      // Reset GA4 Verify badge to Direct
      badge.textContent = 'Direct';
      name.textContent = 'Direct';
      badge.style.backgroundColor = getGa4ChannelColor('Direct');
      
      // Reset checklist to Direct state
      this.updateChecklist('utmVerifyChecklistBody', '', '', '', '', '', '');
    }
  },

  updateChecklist(containerId, source, medium, campaign, id, term, content) {
    const listBody = document.getElementById(containerId);
    if (!listBody) return;
    
    const items = [
      { name: 'Campaign Source (utm_source)', val: source, type: 'required' },
      { name: 'Campaign Medium (utm_medium)', val: medium, type: 'required' },
      { name: 'Campaign Name (utm_campaign)', val: campaign, type: 'required' },
      { name: 'Campaign ID (utm_id)', val: id, type: 'optional' },
      { name: 'Campaign Term (utm_term)', val: term, type: 'optional' },
      { name: 'Campaign Content (utm_content)', val: content, type: 'optional' }
    ];

    listBody.innerHTML = items.map(item => {
      let statusHtml = '';
      if (item.type === 'required') {
        statusHtml = item.val 
          ? `<span class="utm-verify-status status-valid">✓ Present</span>`
          : `<span class="utm-verify-status status-warning">✗ Required</span>`;
      } else {
        statusHtml = item.val
          ? `<span class="utm-verify-status status-valid">✓ Present</span>`
          : `<span class="utm-verify-status status-optional">Optional</span>`;
      }

      return `
        <tr>
          <td style="font-weight: 500; color: var(--text-primary);">${escapeHtml(item.name)}</td>
          <td style="text-align: right;">${statusHtml}</td>
        </tr>
      `;
    }).join('');
  },

  destroy() {}
};

// ─── Pure Helper Functions ───────────────────────────────────────────

/**
 * Verifies if a given string is a valid URL format.
 * @param {string} str
 * @returns {boolean}
 */
export function isValidUrl(str) {
  if (!str) return false;
  let url = str.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'localhost' || parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * Builds a tagged UTM URL from a base URL and parameter object.
 * @param {string} baseUrl 
 * @param {object} params 
 * @returns {string}
 */
export function buildUtmUrl(baseUrl, params) {
  if (!baseUrl) return '';
  let url = baseUrl.trim();
  
  // Clean URL format: automatically prepend http:// if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }

  try {
    const urlObj = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        urlObj.searchParams.set(key, value.trim());
      }
    }
    return urlObj.toString();
  } catch {
    // Basic fallback if URL constructor fails
    const hasQuery = url.includes('?');
    const parts = [];
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.trim())}`);
      }
    }
    if (parts.length === 0) return url;
    return url + (hasQuery ? '&' : '?') + parts.join('&');
  }
}

/**
 * Parses a tagged URL and returns the base URL and query parameters.
 * @param {string} urlStr 
 * @returns {object}
 */
export function parseUtmUrl(urlStr) {
  if (!urlStr) return { baseUrl: '', params: {} };
  let cleanUrl = urlStr.trim();
  
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = 'http://' + cleanUrl;
  }

  try {
    const urlObj = new URL(cleanUrl);
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Base URL is origin + pathname
    const baseUrl = urlObj.origin + urlObj.pathname;
    return { baseUrl, params };
  } catch {
    // String split fallback if URL parsing fails
    const splitIndex = cleanUrl.indexOf('?');
    if (splitIndex === -1) {
      return { baseUrl: cleanUrl, params: {} };
    }
    const baseUrl = cleanUrl.substring(0, splitIndex);
    const query = cleanUrl.substring(splitIndex + 1);
    const params = {};
    query.split('&').forEach(part => {
      const [key, val] = part.split('=');
      if (key) {
        params[decodeURIComponent(key)] = val ? decodeURIComponent(val) : '';
      }
    });
    return { baseUrl, params };
  }
}

const SEARCH_ENGINES = ['google', 'bing', 'yahoo', 'baidu', 'duckduckgo', 'yandex', 'ask', 'ecosia'];
const SOCIAL_NETWORKS = ['facebook', 'twitter', 't.co', 'instagram', 'linkedin', 'pinterest', 'tiktok', 'reddit', 'youtube', 'snapchat', 'whatsapp', 'tumblr', 'wechat'];
const VIDEO_PLATFORMS = ['youtube', 'vimeo', 'twitch', 'tiktok'];

/**
 * Classifies Campaign parameters into Google Analytics 4 default channel groups.
 * Ref: https://support.google.com/analytics/answer/9756891?hl=en
 * @param {string} source 
 * @param {string} medium 
 * @returns {string}
 */
export function classifyGa4Channel(source, medium) {
  const src = (source || '').toLowerCase().trim();
  const med = (medium || '').toLowerCase().trim();

  // Rules for Direct
  if (!src && !med) return 'Direct';
  if (src === 'direct' || src === '(direct)') {
    if (!med || med === '(none)' || med === 'none' || med === '(not set)') {
      return 'Direct';
    }
  }

  const isSearch = SEARCH_ENGINES.some(se => src.includes(se));
  const isSocial = SOCIAL_NETWORKS.some(sn => src.includes(sn));
  const isVideo = VIDEO_PLATFORMS.some(vp => src.includes(vp));

  const isPaid = /^(.*cp.*|ppc|retargeting|paid.*|banner)$/.test(med);

  if (med === 'email' || med === 'e-mail') return 'Email';
  if (/^affiliate(s)?$/.test(med)) return 'Affiliates';
  if (med === 'referral') return 'Referral';
  if (med === 'audio') return 'Audio';
  if (med === 'sms') return 'SMS';
  if (/push/.test(med)) return 'Mobile Push';
  if (/^(display|cpm|banner)$/.test(med)) return 'Display';

  // Video rule
  if (isVideo) {
    return isPaid ? 'Paid Video' : 'Organic Video';
  }
  
  // Social rule
  if (isSocial) {
    return isPaid ? 'Paid Social' : 'Organic Social';
  }

  // Search rule
  if (isSearch) {
    return isPaid ? 'Paid Search' : 'Organic Search';
  }

  // Fallback string matching on medium
  if (/^(social|social-network|social-media|sm|social_network|social_media)$/.test(med)) {
    return 'Organic Social';
  }
  if (/^(organic|search)$/.test(med)) return 'Organic Search';
  if (/^(cpc|ppc|paidsearch)$/.test(med)) return 'Paid Search';

  return 'Unassigned';
}

function getGa4ChannelColor(channel) {
  const mapping = {
    'Direct': '#64748b',          // slate
    'Organic Search': '#0ea5e9',  // sky
    'Paid Search': '#0284c7',     // dark sky
    'Organic Social': '#10b981',  // emerald
    'Paid Social': '#059669',     // dark emerald
    'Organic Video': '#f43f5e',   // rose
    'Paid Video': '#e11d48',      // dark rose
    'Email': '#a855f7',           // purple
    'Referral': '#eab308',        // yellow
    'Display': '#f97316',         // orange
    'Affiliates': '#ec4899',      // pink
    'SMS': '#14b8a6',             // teal
    'Mobile Push': '#6366f1',     // indigo
    'Audio': '#84cc16',           // lime
    'Unassigned': '#6b7280'       // gray
  };
  return mapping[channel] || '#6b7280';
}
