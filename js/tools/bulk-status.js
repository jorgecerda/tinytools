// Bulk HTTP Status Tool Logic & UI Handler

import { escapeHtml, formatBytes, UA_PRESETS } from '../shared/utils.js';

let isProcessing = false;
let isCancelled = false;
let processedCount = 0;
let totalCount = 0;
let resultsData = [];
let stats = { success: 0, redirect: 0, clientErr: 0, serverErr: 0, failed: 0 };


export default {
  render(container) {
    isProcessing = false;
    isCancelled = false;
    resultsData = [];
    stats = { success: 0, redirect: 0, clientErr: 0, serverErr: 0, failed: 0 };

    container.innerHTML = `
            <div class="bulk-container">
                <div class="card-premium">
                    <div class="bulk-input-section">
                        <label class="bulk-option-label" style="display:block; margin-bottom: 8px;">Enter URLs (one per line, max 100)</label>
                        <textarea id="bulkUrlsInput" class="bulk-textarea" placeholder="example.com&#10;github.com/nonexistent-404&#10;https://httpstat.us/301&#10;https://httpstat.us/500"></textarea>
                        
                        <button class="bulk-options-toggle" id="optionsToggleBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            Advanced Request Options
                        </button>

                        <div class="bulk-options-panel" id="optionsPanel" style="display: none;">
                            <div class="bulk-option-field">
                                <span class="bulk-option-label">Request Method</span>
                                <select class="bulk-select" id="reqMethod">
                                    <option value="GET">GET (Downloads headers & HTML)</option>
                                    <option value="HEAD" selected>HEAD (Fastest, headers only)</option>
                                </select>
                            </div>
                            <div class="bulk-option-field">
                                <span class="bulk-option-label">Follow Redirects</span>
                                <select class="bulk-select" id="followRedirects">
                                    <option value="true" selected>Yes (Check final destination)</option>
                                    <option value="false">No (Check direct response)</option>
                                </select>
                            </div>
                            <div class="bulk-option-field">
                                <span class="bulk-option-label">User Agent preset</span>
                                <select class="bulk-select" id="uaPreset">
                                    <option value="chrome" selected>Chrome (Default)</option>
                                    <option value="googlebot">Googlebot (SEO crawler)</option>
                                    <option value="mobile">Mobile Safari</option>
                                    <option value="custom">Custom...</option>
                                </select>
                            </div>
                            <div class="bulk-option-field" id="customUaField" style="display: none;">
                                <span class="bulk-option-label">Custom User-Agent</span>
                                <input type="text" class="bulk-input" id="customUaInput" placeholder="Enter custom User-Agent header">
                            </div>
                        </div>
                    </div>

                    <div class="bulk-actions">
                        <button class="btn-primary" id="startBtn">Check HTTP Statuses</button>
                        <button class="btn-danger" id="cancelBtn" style="display: none;">Cancel Check</button>
                        <button class="btn-secondary" id="clearBtn">Clear Input</button>
                    </div>
                </div>

                <!-- Progress & Stats counter (Shown when running or done) -->
                <div class="card-premium" id="progressCard" style="display: none;">
                    <div class="bulk-progress-card">
                        <div class="bulk-progress-info">
                            <span class="bulk-progress-text" id="progressStatusText">Preparing checks...</span>
                            <span class="bulk-progress-text" id="progressPercentText">0%</span>
                        </div>
                        <div class="bulk-progress-bar-bg">
                            <div class="bulk-progress-bar-fill" id="progressBarFill"></div>
                        </div>
                        
                        <!-- Stats Counter Row -->
                        <div class="bulk-stats-grid">
                            <div class="bulk-stat-item stat-success">
                                <span class="bulk-stat-val" id="statSuccess">0</span>
                                <span class="bulk-stat-lbl">Success (2xx)</span>
                            </div>
                            <div class="bulk-stat-item stat-redirect">
                                <span class="bulk-stat-val" id="statRedirect">0</span>
                                <span class="bulk-stat-lbl">Redirect (3xx)</span>
                            </div>
                            <div class="bulk-stat-item stat-client-err">
                                <span class="bulk-stat-val" id="statClientErr">0</span>
                                <span class="bulk-stat-lbl">Client Error (4xx)</span>
                            </div>
                            <div class="bulk-stat-item stat-server-err">
                                <span class="bulk-stat-val" id="statServerErr">0</span>
                                <span class="bulk-stat-lbl">Server Error (5xx)</span>
                            </div>
                            <div class="bulk-stat-item stat-failed">
                                <span class="bulk-stat-val" id="statFailed">0</span>
                                <span class="bulk-stat-lbl">Failed</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results Grid -->
                <div class="bulk-results-section" id="resultsSection" style="display: none;">
                    <div class="bulk-filter-bar">
                        <div class="bulk-filter-input-wrapper">
                            <svg class="bulk-filter-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input type="text" id="resultsFilter" placeholder="Filter by URL or Status...">
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button class="btn-primary" id="exportCsvBtn">
                                Export to CSV
                            </button>
                            <button class="btn-secondary" id="clearResultsBtn">
                                Clear Results
                            </button>
                        </div>
                    </div>

                    <div class="bulk-table-container">
                        <table class="bulk-table" id="resultsTable">
                            <thead>
                                <tr>
                                    <th style="width: 50px; text-align: center;">#</th>
                                    <th>URL Checked</th>
                                    <th style="width: 140px;">Status Code</th>
                                    <th style="width: 120px; text-align: right;">Response Time</th>
                                    <th style="width: 100px; text-align: right;">Size</th>
                                </tr>
                            </thead>
                            <tbody id="resultsTableBody">
                                <!-- Results rows added dynamically -->
                            </tbody>
                        </table>
                    </div>
                    <p class="dropzone-subtext" style="margin-top: 10px; text-align: left;">
                        Note: Click on any row to view full headers, resolved redirect destinations, and redirect chains.
                    </p>
                </div>
            </div>
        `;

    this.bindEvents();
  },

  bindEvents() {
    const optionsToggleBtn = document.getElementById('optionsToggleBtn');
    const optionsPanel = document.getElementById('optionsPanel');
    const uaPreset = document.getElementById('uaPreset');
    const customUaField = document.getElementById('customUaField');
    const startBtn = document.getElementById('startBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const clearBtn = document.getElementById('clearBtn');
    const bulkUrlsInput = document.getElementById('bulkUrlsInput');
    const resultsFilter = document.getElementById('resultsFilter');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    // Toggle options panel
    optionsToggleBtn.addEventListener('click', () => {
      const isHidden = optionsPanel.style.display === 'none';
      optionsPanel.style.display = isHidden ? 'grid' : 'none';
      optionsToggleBtn.querySelector('svg').style.transform = isHidden
        ? 'rotate(180deg)'
        : 'rotate(0deg)';
    });

    // Toggle custom UA field
    uaPreset.addEventListener('change', (e) => {
      customUaField.style.display =
        e.target.value === 'custom' ? 'flex' : 'none';
    });

    // Clear input
    clearBtn.addEventListener('click', () => {
      bulkUrlsInput.value = '';
      bulkUrlsInput.focus();
    });

    // Run checking
    startBtn.addEventListener('click', () => this.startChecking());

    // Cancel checking
    cancelBtn.addEventListener('click', () => this.cancelChecking());

    // Live filtering of results
    resultsFilter.addEventListener('input', (e) =>
      this.filterResultsTable(e.target.value),
    );

    // Export to CSV
    exportCsvBtn.addEventListener('click', () => this.exportCsv());

    // Clear Results
    const clearResultsBtn = document.getElementById('clearResultsBtn');
    if (clearResultsBtn) {
      clearResultsBtn.addEventListener('click', () => this.clearResults());
    }
  },

  async startChecking() {
    if (isProcessing) return;

    const bulkUrlsInput = document.getElementById('bulkUrlsInput');
    const rawUrls = bulkUrlsInput.value
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (rawUrls.length === 0) {
      alert('Please enter at least one URL to check.');
      return;
    }

    // Maximum limit validation
    if (rawUrls.length > 100) {
      alert(
        'To preserve performance, checking is limited to a maximum of 100 URLs at a time.',
      );
      return;
    }

    // Initialize state
    isProcessing = true;
    isCancelled = false;
    processedCount = 0;
    totalCount = rawUrls.length;
    resultsData = Array(totalCount).fill(null);
    stats = { success: 0, redirect: 0, clientErr: 0, serverErr: 0, failed: 0 };

    // UI Updates
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'inline-flex';
    document.getElementById('clearBtn').setAttribute('disabled', 'true');
    bulkUrlsInput.setAttribute('disabled', 'true');
    document.getElementById('progressCard').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'block';

    // Clear old table rows and filters
    document.getElementById('resultsFilter').value = '';
    const tableBody = document.getElementById('resultsTableBody');
    tableBody.innerHTML = '';

    // Pre-create skeleton rows
    rawUrls.forEach((url, i) => {
      const tr = document.createElement('tr');
      tr.id = `result-row-${i}`;
      tr.innerHTML = `
                <td style="text-align: center; color: var(--text-muted);">${i + 1}</td>
                <td style="font-family: 'Geist Mono', monospace; font-size:0.85rem;">${escapeHtml(url)}</td>
                <td><span class="status-badge" style="background-color:var(--bg-primary); border:1px solid var(--border-color); color:var(--text-muted);">Queued</span></td>
                <td style="text-align: right; color: var(--text-muted);">-</td>
                <td style="text-align: right; color: var(--text-muted);">-</td>
            `;
      tableBody.appendChild(tr);
    });

    // Get options
    const followRedirects =
      document.getElementById('followRedirects').value === 'true';
    const method = document.getElementById('reqMethod').value;
    const preset = document.getElementById('uaPreset').value;
    const customUa = document.getElementById('customUaInput').value.trim();
    const userAgent = preset === 'custom' ? customUa : UA_PRESETS[preset];

    const options = { followRedirects, method, userAgent };

    this.updateProgress();

    // Run queue with concurrency limit of 5
    let index = 0;
    const workers = [];
    const workerLimit = Math.min(5, totalCount);

    const runWorker = async () => {
      while (index < totalCount && !isCancelled) {
        const currentIdx = index++;
        const url = rawUrls[currentIdx];
        this.updateRowUI(currentIdx, null, 'Pending');

        try {
          const res = await this.checkSingleUrl(url, options);
          if (isCancelled) return;
          resultsData[currentIdx] = res;
          this.updateRowUI(currentIdx, res);
          this.updateStatsCounters(res);
        } catch (err) {
          if (isCancelled) return;
          const errRes = {
            url,
            chain: [
              {
                url,
                status: 0,
                statusText: err.message || 'Connection failed',
                responseTime: 0,
                headers: {},
                error: true,
              },
            ],
            hopCount: 1,
            redirected: false,
          };
          resultsData[currentIdx] = errRes;
          this.updateRowUI(currentIdx, errRes);
          this.updateStatsCounters(errRes);
        }

        processedCount++;
        this.updateProgress();
      }
    };

    // Spawn concurrency workers
    for (let w = 0; w < workerLimit; w++) {
      workers.push(runWorker());
    }

    // Wait for all workers to finish

    await Promise.all(workers);

    // Reset actions UI
    isProcessing = false;
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('clearBtn').removeAttribute('disabled');
    bulkUrlsInput.removeAttribute('disabled');

    if (isCancelled) {
      document.getElementById('progressStatusText').textContent =
        'Check Canceled';
    } else {
      document.getElementById('progressStatusText').textContent =
        'All Checks Completed!';
    }
  },

  cancelChecking() {
    if (!isProcessing) return;
    isCancelled = true;
    isProcessing = false;

    // Update all queued/checking rows to Canceled
    for (let i = 0; i < totalCount; i++) {
      if (!resultsData[i]) {
        const row = document.getElementById(`result-row-${i}`);
        if (row) {
          row.querySelector('.status-badge').className = 'status-badge';
          row.querySelector('.status-badge').style =
            'background-color:rgba(0,0,0,0.1); color:var(--text-muted); border:1px solid var(--border-color);';
          row.querySelector('.status-badge').textContent = 'Canceled';
        }
      }
    }

    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('clearBtn').removeAttribute('disabled');
    document.getElementById('bulkUrlsInput').removeAttribute('disabled');
    document.getElementById('progressStatusText').textContent =
      'Checking Cancelled';
  },

  async checkSingleUrl(url, options) {
    const res = await fetch('/api/check-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        followRedirects: options.followRedirects,
        method: options.method,
        userAgent: options.userAgent,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  },

  updateProgress() {
    const percentText = document.getElementById('progressPercentText');
    const fillBar = document.getElementById('progressBarFill');
    const statusText = document.getElementById('progressStatusText');

    const percentage =
      totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

    percentText.textContent = `${percentage}%`;
    fillBar.style.width = `${percentage}%`;
    statusText.textContent = `Checking URL ${processedCount} of ${totalCount}...`;
  },

  updateStatsCounters(data) {
    // Evaluate based on the final hop of the chain
    const finalHop = data.chain[data.chain.length - 1];
    const category = finalHop.error
      ? 'failed'
      : classifyStatusCode(finalHop.status);
    stats[category]++;

    // Sync to UI
    document.getElementById('statSuccess').textContent = stats.success;
    document.getElementById('statRedirect').textContent = stats.redirect;
    document.getElementById('statClientErr').textContent = stats.clientErr;
    document.getElementById('statServerErr').textContent = stats.serverErr;
    document.getElementById('statFailed').textContent = stats.failed;
  },

  updateRowUI(i, data, statusTextOverride) {
    const row = document.getElementById(`result-row-${i}`);
    if (!row) return;

    if (statusTextOverride) {
      row.querySelector('.status-badge').textContent = statusTextOverride;
      row.querySelector('.status-badge').className = 'status-badge';
      row.querySelector('.status-badge').style =
        'background-color:rgba(99,102,241,0.05); color:var(--primary); border:1px solid rgba(99,102,241,0.15);';
      return;
    }

    // Renders complete final response
    row.innerHTML = formatResultRow(i, data);

    // Bind click event to expand details
    row.addEventListener('click', () => this.toggleRowDetails(i));
  },

  toggleRowDetails(i) {
    const row = document.getElementById(`result-row-${i}`);
    if (!row) return;

    // Check if details row is already open
    const existingDetails = document.getElementById(`details-row-${i}`);
    if (existingDetails) {
      existingDetails.remove();
      return;
    }

    // Close any other open details first
    document.querySelectorAll('.bulk-details-row').forEach((el) => el.remove());

    const data = resultsData[i];
    if (!data) return; // No data yet

    const finalHop = data.chain[data.chain.length - 1];

    // Build details content
    const tr = document.createElement('tr');
    tr.id = `details-row-${i}`;
    tr.className = 'bulk-details-row';

    // Format redirect chain list
    let chainListHtml = '';
    data.chain.forEach((hop, idx) => {
      let badgeClass = 'badge-err';
      if (!hop.error) {
        const category = classifyStatusCode(hop.status);
        if (category === 'success') badgeClass = 'badge-2xx';
        else if (category === 'redirect') badgeClass = 'badge-3xx';
        else if (category === 'clientErr') badgeClass = 'badge-4xx';
        else if (category === 'serverErr') badgeClass = 'badge-5xx';
      }
      chainListHtml += `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:0.8rem;">
                    <span style="font-weight:700; color:var(--text-muted); width: 16px;">${idx + 1}.</span>
                    <span class="status-badge ${badgeClass}" style="flex-shrink:0;">${hop.status || 'Err'}</span>
                    <span style="font-family:'Geist Mono', monospace; word-break:break-all;">${escapeHtml(hop.url)}</span>
                    <span style="color:var(--text-muted); margin-left:auto; flex-shrink:0; font-size:0.75rem;">(${hop.responseTime}ms)</span>
                </div>
            `;
    });

    // Format headers list
    let headersHtml = '';
    const parsedHeaders = parseHeaders(finalHop.headers);
    if (parsedHeaders && Object.keys(parsedHeaders).length > 0) {
      Object.entries(parsedHeaders).forEach(([name, val]) => {
        headersHtml += `
                    <div class="bulk-header-item">
                        <span class="bulk-header-name">${escapeHtml(name)}:</span>
                        <span class="bulk-header-val">${escapeHtml(val)}</span>
                    </div>
                `;
      });
    } else {
      headersHtml =
        '<div style="color:var(--text-muted);">No headers available.</div>';
    }

    tr.innerHTML = `
            <td colspan="5" class="bulk-details-cell">
                <div class="bulk-details-content">
                    <div class="bulk-details-grid">
                        <div>
                            <div class="bulk-details-title">Redirect Path & Hops</div>
                            <div style="background-color:rgba(0,0,0,0.15); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px;">
                                ${chainListHtml}
                            </div>
                        </div>
                        <div>
                            <div class="bulk-details-title">Final Hop HTTP Headers</div>
                            <div class="bulk-headers-list">
                                ${headersHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </td>
        `;

    row.insertAdjacentElement('afterend', tr);
  },

  filterResultsTable(query) {
    const q = query.toLowerCase().trim();
    for (let i = 0; i < totalCount; i++) {
      const row = document.getElementById(`result-row-${i}`);
      if (!row) continue;

      const data = resultsData[i];
      const detailsRow = document.getElementById(`details-row-${i}`);

      if (!q) {
        row.style.display = 'table-row';
        if (detailsRow) detailsRow.style.display = 'table-row';
        continue;
      }

      let matches = false;
      if (data) {
        const finalHop = data.chain[data.chain.length - 1];
        const urls = data.chain.map((h) => h.url.toLowerCase()).join(' ');
        const status = String(finalHop.status);
        const statusText = finalHop.statusText.toLowerCase();

        if (urls.includes(q) || status.includes(q) || statusText.includes(q)) {
          matches = true;
        }
      } else {
        // If checking hasn't resolved it yet, match against the row text
        const cellText = row.textContent.toLowerCase();
        if (cellText.includes(q)) {
          matches = true;
        }
      }

      if (matches) {
        row.style.display = 'table-row';
        if (detailsRow) detailsRow.style.display = 'table-row';
      } else {
        row.style.display = 'none';
        if (detailsRow) detailsRow.style.display = 'none';
      }
    }
  },

  exportCsv() {
    if (resultsData.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent +=
      'Index,Requested URL,Final URL,Hops,Final Status Code,Status Text,Total Response Time (ms),Size (bytes)\n';

    resultsData.forEach((data, index) => {
      if (!data) return;
      const finalHop = data.chain[data.chain.length - 1];
      const totalDuration = data.chain.reduce(
        (sum, h) => sum + h.responseTime,
        0,
      );
      const size = finalHop.headers
        ? finalHop.headers['content-length'] || ''
        : '';

      const row = [
        index + 1,
        `"${data.url.replace(/"/g, '""')}"`,
        `"${finalHop.url.replace(/"/g, '""')}"`,
        data.hopCount,
        finalHop.status || 'Error',
        `"${finalHop.statusText.replace(/"/g, '""')}"`,
        totalDuration,
        size,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `tinytools_bulk_http_status_${Date.now()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  clearResults() {
    if (isProcessing) return;
    resultsData = [];
    const resultsSection = document.getElementById('resultsSection');
    const progressCard = document.getElementById('progressCard');
    const tableBody = document.getElementById('resultsTableBody');

    if (resultsSection) resultsSection.style.display = 'none';
    if (progressCard) progressCard.style.display = 'none';
    if (tableBody) tableBody.innerHTML = '';

    stats = { success: 0, redirect: 0, clientErr: 0, serverErr: 0, failed: 0 };
  },

  destroy() {
    isCancelled = true;
    isProcessing = false;
    resultsData = [];
  },
};

/**
 * Classifies a status code into success, redirect, clientErr, serverErr, or failed.
 * @param {number} statusCode
 * @returns {string}
 */
export function classifyStatusCode(statusCode) {
  if (!statusCode) return 'failed';
  if (statusCode >= 200 && statusCode < 300) return 'success';
  if (statusCode >= 300 && statusCode < 400) return 'redirect';
  if (statusCode >= 400 && statusCode < 500) return 'clientErr';
  if (statusCode >= 500) return 'serverErr';
  return 'failed';
}

/**
 * Parses and normalizes headers object or string.
 * @param {object|string} headers
 * @returns {object}
 */
export function parseHeaders(headers) {
  if (!headers) return {};
  if (typeof headers === 'object') {
    const normalized = {};
    for (const [key, value] of Object.entries(headers)) {
      normalized[key.toLowerCase()] = value;
    }
    return normalized;
  }
  if (typeof headers === 'string') {
    const result = {};
    const lines = headers.split(/\r?\n/);
    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const value = parts.slice(1).join(':').trim();
        result[key] = value;
      }
    }
    return result;
  }
  return {};
}

/**
 * Formats a result row to HTML.
 * @param {number} i
 * @param {object} data
 * @returns {string}
 */
export function formatResultRow(i, data) {
  const finalHop = data.chain[data.chain.length - 1];
  let statusBadgeClass = 'status-badge ';
  let statusLabel = finalHop.status
    ? `${finalHop.status} ${finalHop.statusText}`
    : finalHop.statusText;

  if (finalHop.error) {
    statusBadgeClass += 'badge-err';
    statusLabel = finalHop.statusText || 'Failed';
  } else {
    const category = classifyStatusCode(finalHop.status);
    if (category === 'success') statusBadgeClass += 'badge-2xx';
    else if (category === 'redirect') statusBadgeClass += 'badge-3xx';
    else if (category === 'clientErr') statusBadgeClass += 'badge-4xx';
    else if (category === 'serverErr') statusBadgeClass += 'badge-5xx';
    else statusBadgeClass += 'badge-err';
  }

  const totalDuration = data.chain.reduce((sum, h) => sum + h.responseTime, 0);
  const durationLabel = `${totalDuration}ms`;
  const parsedHeaders = parseHeaders(finalHop.headers);
  const sizeHeader = parsedHeaders['content-length'];
  const sizeLabel = sizeHeader ? formatBytes(parseInt(sizeHeader)) : '-';

  return `
        <td style="text-align: center; color: var(--text-secondary);">${i + 1}</td>
        <td style="font-family: 'Geist Mono', monospace; font-size:0.85rem;">
            <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(data.url)}</div>
            ${data.redirected ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">→ Redirected to: ${escapeHtml(finalHop.url)}</div>` : ''}
        </td>
        <td><span class="${statusBadgeClass}">${escapeHtml(statusLabel)}</span></td>
        <td style="text-align: right; font-weight: 500;">${durationLabel}</td>
        <td style="text-align: right; color: var(--text-secondary);">${sizeLabel}</td>
    `;
}
