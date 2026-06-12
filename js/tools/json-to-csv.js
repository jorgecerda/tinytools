// JSON to CSV Converter Tool Module

import { escapeHtml } from '../shared/utils.js';

let csvResult = '';
let parsedJson = null;

export default {
  id: 'json-to-csv',
  
  render(container) {
    csvResult = '';
    parsedJson = null;

    container.innerHTML = `
      <div class="json-csv-container">
        <div class="json-input-grid">
          <!-- Left Panel: Input -->
          <div class="card-premium">
            <h3 style="margin-bottom:16px;">JSON Input</h3>
            <div class="json-textarea-wrapper">
              <textarea id="jsonPasteInput" class="json-textarea" placeholder='Paste your JSON array or object here...\n\nExample:\n[\n  {"name": "John", "role": "Developer", "location": {"city": "NY", "country": "US"}},\n  {"name": "Sarah", "role": "Designer", "location": {"city": "SF", "country": "US"}}\n]'></textarea>
            </div>
            
            <div class="converter-controls">
              <button class="btn-primary" id="convertBtn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Convert to CSV
              </button>
              <button class="btn-secondary" id="clearJsonBtn">Clear</button>
            </div>
          </div>

          <!-- Right Panel: Upload & Load -->
          <div class="card-premium" style="display:flex; flex-direction:column; gap:20px;">
            <div>
              <h3 style="margin-bottom:12px;">Upload JSON File</h3>
              <div class="dropzone-premium" id="jsonDropzone">
                <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <p class="dropzone-text">Drag & drop JSON file, or <span style="color:var(--primary); font-weight:600;">browse</span></p>
                <p class="dropzone-subtext">Supports .json files up to 5MB</p>
                <input type="file" id="jsonFileInput" accept=".json,application/json" style="display: none;">
              </div>
            </div>

            <div class="load-url-panel">
              <h3 style="margin-bottom:10px;">Fetch JSON from URL</h3>
              <div class="json-url-input-group">
                <input type="text" class="input-premium" id="jsonUrlInput" placeholder="https://api.example.com/data">
                <button class="btn-primary" id="fetchJsonBtn">Fetch</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Status/Error Dashboard -->
        <div id="jsonErrorWrapper"></div>

        <!-- Output Area (hidden initially) -->
        <div class="card-premium preview-section" id="outputCard" style="display: none;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
            <h3>CSV Output Preview</h3>
            <div class="pdf-tabs" style="margin: 0; padding: 2px;">
              <button class="pdf-tab-btn active" id="btnPreviewTable" style="padding:6px 12px; font-size:0.8rem;">Table View</button>
              <button class="pdf-tab-btn" id="btnPreviewRaw" style="padding:6px 12px; font-size:0.8rem;">Raw Text</button>
            </div>
          </div>

          <!-- Preview Content -->
          <div id="previewTableContainer" class="csv-preview-box">
            <!-- Table will be injected here -->
          </div>
          <div id="previewRawContainer" style="display: none;">
            <textarea id="rawCsvOutput" class="csv-raw-textarea" readonly></textarea>
          </div>

          <!-- Export controls -->
          <div class="converter-controls" style="margin-top:16px;">
            <button class="btn-primary" id="downloadCsvBtn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download CSV
            </button>
            <button class="btn-primary" id="downloadExcelBtn" style="background: linear-gradient(135deg, #107c41, #1f9a55); border: none;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Download for Excel
            </button>
            <button class="btn-secondary" id="copyCsvBtn">Copy to Clipboard</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const pasteInput = document.getElementById('jsonPasteInput');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearJsonBtn');
    const dropzone = document.getElementById('jsonDropzone');
    const fileInput = document.getElementById('jsonFileInput');
    const urlInput = document.getElementById('jsonUrlInput');
    const fetchBtn = document.getElementById('fetchJsonBtn');
    
    const btnTable = document.getElementById('btnPreviewTable');
    const btnRaw = document.getElementById('btnPreviewRaw');
    const tblContainer = document.getElementById('previewTableContainer');
    const rawContainer = document.getElementById('previewRawContainer');
    
    const dlCsv = document.getElementById('downloadCsvBtn');
    const dlExcel = document.getElementById('downloadExcelBtn');
    const copyCsv = document.getElementById('copyCsvBtn');

    // Trigger conversion
    convertBtn.addEventListener('click', () => this.processConversion(pasteInput.value));
    
    // Clear fields
    clearBtn.addEventListener('click', () => {
      pasteInput.value = '';
      document.getElementById('outputCard').style.display = 'none';
      this.clearError();
    });



    // File Drag & Drop
    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, e => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', e => {
      const file = e.dataTransfer.files[0];
      if (file) this.handleFile(file);
    });

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this.handleFile(file);
      fileInput.value = '';
    });

    // Load from URL
    fetchBtn.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!url) {
        alert('Please enter a URL first.');
        return;
      }
      this.clearError();
      fetchBtn.disabled = true;
      fetchBtn.textContent = 'Fetching...';

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
        const data = await res.json();
        pasteInput.value = JSON.stringify(data, null, 2);
        this.processConversion(pasteInput.value);
      } catch (err) {
        this.showError('Failed to fetch JSON from URL. (Note: The server must support CORS)', err.message);
      } finally {
        fetchBtn.disabled = false;
        fetchBtn.textContent = 'Fetch';
      }
    });

    // View toggles
    btnTable.addEventListener('click', () => {
      btnTable.classList.add('active');
      btnRaw.classList.remove('active');
      tblContainer.style.display = 'block';
      rawContainer.style.display = 'none';
    });

    btnRaw.addEventListener('click', () => {
      btnRaw.classList.add('active');
      btnTable.classList.remove('active');
      rawContainer.style.display = 'block';
      tblContainer.style.display = 'none';
    });

    // Downloads & Copies
    dlCsv.addEventListener('click', () => this.downloadFile(csvResult, 'data.csv', 'text/csv'));
    dlExcel.addEventListener('click', () => {
      // Prefixes UTF-8 BOM so Excel opens it with correct character decoding
      this.downloadFile('\uFEFF' + csvResult, 'data_excel.csv', 'text/csv;charset=utf-8;');
    });

    copyCsv.addEventListener('click', () => {
      if (!csvResult) return;
      navigator.clipboard.writeText(csvResult).then(() => {
        const originalText = copyCsv.textContent;
        copyCsv.textContent = 'Copied!';
        copyCsv.classList.add('btn-success');
        setTimeout(() => {
          copyCsv.textContent = originalText;
          copyCsv.classList.remove('btn-success');
        }, 1500);
      });
    });
  },

  handleFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      document.getElementById('jsonPasteInput').value = text;
      this.processConversion(text);
    };
    reader.onerror = () => alert('Failed to read file.');
    reader.readAsText(file);
  },

  processConversion(jsonText) {
    this.clearError();
    const val = jsonText.trim();
    if (!val) {
      alert('Please paste or upload JSON content first.');
      return;
    }

    try {
      parsedJson = JSON.parse(val);
      csvResult = jsonToCsv(parsedJson);

      // Render outputs
      const lines = csvResult.split('\n').filter(line => line.trim() !== '');
      let rawPreview = csvResult;
      if (lines.length > 11) {
        rawPreview = lines.slice(0, 11).join('\n') + `\n\n... and ${lines.length - 11} more rows. Download full CSV to get all records.`;
      }
      document.getElementById('rawCsvOutput').value = rawPreview;
      this.renderTablePreview(csvResult);
      document.getElementById('outputCard').style.display = 'block';
    } catch (err) {
      this.showError('JSON Parsing Error', err.message);
      document.getElementById('outputCard').style.display = 'none';
    }
  },

  renderTablePreview(csvText) {
    const container = document.getElementById('previewTableContainer');
    if (!csvText) {
      container.innerHTML = '<div style="padding:16px; color:var(--text-muted);">No data to display.</div>';
      return;
    }

    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    const headers = parseCsvRow(lines[0]);
    const maxRows = Math.min(lines.length, 11); // Header + 10 data rows

    let tableHtml = '<table class="csv-preview-table"><thead><tr>';
    headers.forEach(h => {
      tableHtml += `<th>${escapeHtml(h)}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    for (let i = 1; i < maxRows; i++) {
      const cells = parseCsvRow(lines[i]);
      tableHtml += '<tr>';
      headers.forEach((_, colIndex) => {
        const val = cells[colIndex] !== undefined ? cells[colIndex] : '';
        tableHtml += `<td>${escapeHtml(val)}</td>`;
      });
      tableHtml += '</tr>';
    }

    tableHtml += '</tbody></table>';

    if (lines.length > 11) {
      tableHtml += `
        <div style="padding: 12px; font-size:0.8rem; text-align:center; color:var(--text-muted); border-top:1px solid var(--border-color);">
          Showing first 10 rows. Download full CSV to inspect all ${lines.length - 1} records.
        </div>
      `;
    }

    container.innerHTML = tableHtml;
  },

  showError(title, desc) {
    document.getElementById('jsonErrorWrapper').innerHTML = `
      <div class="seo-alert seo-alert-danger" style="margin-top:16px;">
        <div style="font-size:1.5rem; line-height: 1;">[!]</div>
        <div>
          <div class="seo-alert-title">${escapeHtml(title)}</div>
          <div class="seo-alert-desc">${escapeHtml(desc)}</div>
        </div>
      </div>
    `;
  },

  clearError() {
    const el = document.getElementById('jsonErrorWrapper');
    if (el) el.innerHTML = '';
  },

  downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  destroy() {
    csvResult = '';
    parsedJson = null;
  }
};

// ─── Pure Helper Functions ───────────────────────────────────────────

/**
 * Flattens a nested object into key-value pairs using dot notation for headings.
 * @param {object} obj 
 * @param {string} prefix 
 * @returns {object}
 */
export function flattenObject(obj, prefix = '') {
  const result = {};
  if (!obj || typeof obj !== 'object') return result;

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

/**
 * Converts parsed JSON array or object to CSV format.
 * @param {any} jsonData 
 * @returns {string}
 */
export function jsonToCsv(jsonData) {
  let arr = [];
  if (Array.isArray(jsonData)) {
    arr = jsonData;
  } else if (jsonData && typeof jsonData === 'object') {
    arr = [jsonData];
  } else {
    throw new Error('Input must be a valid JSON array or object');
  }

  // Flatten all items
  const flattenedArr = arr.map(item => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return flattenObject(item);
    }
    return { value: item };
  });

  // Collect all unique headers
  const headersSet = new Set();
  flattenedArr.forEach(item => {
    Object.keys(item).forEach(k => headersSet.add(k));
  });
  const headers = Array.from(headersSet);

  if (headers.length === 0) return '';

  const csvRows = [];
  
  // Headers row
  csvRows.push(headers.map(h => escapeCsvField(h)).join(','));

  // Data rows
  flattenedArr.forEach(item => {
    const row = headers.map(h => {
      const val = item[h];
      if (val === null || val === undefined) return '';
      return escapeCsvField(val);
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Escapes fields to conform with standard RFC 4180 CSV specifications.
 * @param {any} field 
 * @returns {string}
 */
export function escapeCsvField(field) {
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Simple CSV parser to handle quotes/commas for preview render rows.
 * @param {string} text 
 * @returns {string[]}
 */
export function parseCsvRow(text) {
  const result = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"'; // Double quotes inside quote block
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cell);
      cell = '';
    } else {
      cell += c;
    }
  }
  result.push(cell);
  return result;
}
