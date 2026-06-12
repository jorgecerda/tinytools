// PDF Compress & Convert Tool Module
// Compress: 100% client-side render-and-rebuild via pdf.js + pdf-lib (real JPEG compression)
// Convert:  Server-side via Netlify Functions → CloudConvert API (API key never exposed)

import {
  formatBytes,
  readFileAsArrayBuffer,
  loadPdfLib,
  loadPdfJs,
} from '../shared/utils.js';

export default {
  id: 'pdftools',
  PDFLib: null,
  pdfjsLib: null,
  compressQueue: [],
  convertQueue: [],
  selectedFormat: 'docx',
  selectedQuality: 'balanced', // 'high' | 'balanced' | 'max'

  // Quality presets: { renderScale, jpegQuality }
  QUALITY_PRESETS: {
    high: { renderScale: 2.0, jpegQuality: 0.88, label: 'High Quality' },
    balanced: { renderScale: 1.5, jpegQuality: 0.72, label: 'Balanced' },
    max: { renderScale: 1.1, jpegQuality: 0.52, label: 'Max Compression' },
  },

  // ─── Render ────────────────────────────────────────────────────────
  async render(container) {
    container.innerHTML = `
            <div class="card-premium pdftools-container" style="position:relative;">

                <!-- Tabs -->
                <div class="pdftools-tabs">
                    <button class="pdftools-tab-btn active" id="pdftab-compress">
                        Compress PDF
                    </button>
                    <button class="pdftools-tab-btn" id="pdftab-convert">
                        Convert PDF
                    </button>
                </div>

                <!-- ── Tab 1: Compress ── -->
                <div class="pdftools-tab-panel active" id="pdftoolspanel-compress">

                    <!-- Info note -->
                    <div class="api-key-banner saved" style="margin-top:8px;">
                        <span class="api-key-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                        </span>
                        <div class="api-key-text">
                            <p>100% Private — Processed in your browser</p>
                            <span>Files are re-rendered and rebuilt with JPEG compression. Output PDFs are image-based (not text-searchable).</span>
                        </div>
                    </div>

                    <!-- Quality Selector -->
                    <div class="format-selector" style="margin-top:20px;">
                        <span class="format-selector-label">Compression Level</span>
                        <button class="format-pill" data-quality="high" id="quality-high">
                            High Quality
                        </button>
                        <button class="format-pill active" data-quality="balanced" id="quality-balanced">
                            Balanced
                        </button>
                        <button class="format-pill" data-quality="max" id="quality-max">
                            Max Compression
                        </button>
                    </div>

                    <!-- Dropzone -->
                    <div class="dropzone-premium" id="compress-dropzone" style="margin-top:16px;">
                        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                             stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <p class="dropzone-text">Drag & drop PDF files here, or
                            <span style="color:var(--primary);font-weight:600;">browse files</span></p>
                        <p class="dropzone-subtext">Multiple files supported. Each is compressed individually.</p>
                        <input type="file" id="compress-file-input" multiple accept="application/pdf" style="display:none;">
                    </div>

                    <div id="compress-queue-wrap" style="display:none;">
                        <div class="pdftools-file-queue" id="compress-queue"></div>
                        <div class="pdftools-controls">
                            <button class="btn-secondary" id="compress-clear-btn">Clear All</button>
                            <button class="btn-primary" id="compress-run-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                </svg>
                                Compress All
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ── Tab 2: Convert ── -->
                <div class="pdftools-tab-panel" id="pdftoolspanel-convert">

                    <!-- Info note -->
                    <div class="api-key-banner saved" style="margin-top:8px;">
                        <span class="api-key-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4l3 3"/>
                            </svg>
                        </span>
                        <div class="api-key-text">
                            <p>Powered by CloudConvert</p>
                            <span>Files are securely sent to CloudConvert for conversion and immediately deleted after processing.</span>
                        </div>
                    </div>

                    <!-- Format Selector -->
                    <div class="format-selector" style="margin-top:20px;">
                        <span class="format-selector-label">Output Format</span>
                        <button class="format-pill active" data-format="docx" id="fmt-docx">
                            Word (.docx)
                        </button>
                        <button class="format-pill" data-format="pptx" id="fmt-pptx">
                            PowerPoint (.pptx)
                        </button>
                        <button class="format-pill" data-format="xlsx" id="fmt-xlsx">
                            Excel (.xlsx)
                        </button>
                        <button class="format-pill" data-format="png" id="fmt-png">
                            Image (.png)
                        </button>
                    </div>

                    <!-- Dropzone -->
                    <div class="dropzone-premium" id="convert-dropzone" style="margin-top:16px;">
                        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                             stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <p class="dropzone-text">Drag & drop PDF files here, or
                            <span style="color:var(--primary);font-weight:600;">browse files</span></p>
                        <p class="dropzone-subtext">Multiple files supported. Each is converted to the selected format.</p>
                        <input type="file" id="convert-file-input" multiple accept="application/pdf" style="display:none;">
                    </div>

                    <div id="convert-queue-wrap" style="display:none;">
                        <div class="pdftools-file-queue" id="convert-queue"></div>
                        <div class="pdftools-controls">
                            <button class="btn-secondary" id="convert-clear-btn">Clear All</button>
                            <button class="btn-primary" id="convert-run-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="17 1 21 5 17 9"/>
                                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                                    <polyline points="7 23 3 19 7 15"/>
                                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                                </svg>
                                Convert All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    this.setupTabs();
    this.setupQualityPills();
    this.setupFormatPills();
    this.setupCompressTab();
    this.setupConvertTab();
  },

  // ─── Tabs ──────────────────────────────────────────────────────────
  setupTabs() {
    const btnC = document.getElementById('pdftab-compress');
    const btnX = document.getElementById('pdftab-convert');
    const panC = document.getElementById('pdftoolspanel-compress');
    const panX = document.getElementById('pdftoolspanel-convert');

    btnC.addEventListener('click', () => {
      btnC.classList.add('active');
      panC.classList.add('active');
      btnX.classList.remove('active');
      panX.classList.remove('active');
    });
    btnX.addEventListener('click', () => {
      btnX.classList.add('active');
      panX.classList.add('active');
      btnC.classList.remove('active');
      panC.classList.remove('active');
    });
  },

  // ─── Quality Pills ──────────────────────────────────────────────────
  setupQualityPills() {
    document.querySelectorAll('[data-quality]').forEach((pill) => {
      pill.addEventListener('click', () => {
        document
          .querySelectorAll('[data-quality]')
          .forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedQuality = pill.getAttribute('data-quality');
      });
    });
  },

  // ─── Format Pills ───────────────────────────────────────────────────
  setupFormatPills() {
    document.querySelectorAll('[data-format]').forEach((pill) => {
      pill.addEventListener('click', () => {
        document
          .querySelectorAll('[data-format]')
          .forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedFormat = pill.getAttribute('data-format');
      });
    });
  },

  // ─── Compress Tab Setup ─────────────────────────────────────────────
  setupCompressTab() {
    const dropzone = document.getElementById('compress-dropzone');
    const fileInput = document.getElementById('compress-file-input');
    this.bindDropzone(dropzone, fileInput, (files) =>
      this.addToQueue(files, 'compress'),
    );
    document
      .getElementById('compress-clear-btn')
      .addEventListener('click', () => {
        this.compressQueue = [];
        this.renderQueue('compress');
      });
    document
      .getElementById('compress-run-btn')
      .addEventListener('click', () => this.runCompress());
  },

  // ─── Convert Tab Setup ──────────────────────────────────────────────
  setupConvertTab() {
    const dropzone = document.getElementById('convert-dropzone');
    const fileInput = document.getElementById('convert-file-input');
    this.bindDropzone(dropzone, fileInput, (files) =>
      this.addToQueue(files, 'convert'),
    );
    document
      .getElementById('convert-clear-btn')
      .addEventListener('click', () => {
        this.convertQueue = [];
        this.renderQueue('convert');
      });
    document
      .getElementById('convert-run-btn')
      .addEventListener('click', () => this.runConvert());
  },

  // ─── Shared Queue Logic ─────────────────────────────────────────────
  addToQueue(files, mode) {
    const queue = mode === 'compress' ? this.compressQueue : this.convertQueue;
    for (const file of files) {
      if (file.type !== 'application/pdf') continue;
      queue.push({
        id: crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
        name: file.name,
        size: file.size,
        file,
        status: 'pending',
        progress: 0,
        result: null,
        error: null,
      });
    }
    this.renderQueue(mode);
  },

  renderQueue(mode) {
    const queue = mode === 'compress' ? this.compressQueue : this.convertQueue;
    const listEl = document.getElementById(`${mode}-queue`);
    const wrap = document.getElementById(`${mode}-queue-wrap`);

    if (queue.length === 0) {
      wrap.style.display = 'none';
      listEl.innerHTML = '';
      return;
    }
    wrap.style.display = 'block';

    listEl.innerHTML = queue
      .map((item) => {
        let statusHtml = '';
        let actionsHtml = '';

        if (item.status === 'pending') {
          statusHtml = `<span class="pdftools-file-status pending">● Queued</span>`;
          actionsHtml = this._removeBtn(item.id, mode);
        } else if (item.status === 'processing') {
          const pct = Math.round(item.progress);
          statusHtml = `<span class="pdftools-file-status processing"><span class="inline-spinner"></span> ${pct}%</span>`;
          actionsHtml = '';
        } else if (item.status === 'done') {
          if (mode === 'compress' && item.result) {
            const saved = item.size - item.result.blob.size;
            const pct = Math.max(0, Math.round((saved / item.size) * 100));
            const cls = pct >= 10 ? 'good' : 'minimal';
            const before = this.formatBytes(item.size);
            const after = this.formatBytes(item.result.blob.size);
            statusHtml = `<span class="compress-badge ${cls}">✓ −${pct}%</span>
                                    <span class="pdftools-file-status done" style="margin-left:6px;">${before} → ${after}</span>`;
          } else {
            statusHtml = `<span class="pdftools-file-status done">✓ Ready</span>`;
          }
          actionsHtml = `<button class="btn-download-result" data-id="${item.id}" data-mode="${mode}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg> Download
                </button>`;
        } else if (item.status === 'error') {
          statusHtml = `<span class="pdftools-file-status error" title="${item.error}">✗ Failed</span>`;
          actionsHtml = this._removeBtn(item.id, mode);
        }

        const progressStyle =
          item.status === 'processing'
            ? `--progress:${item.progress}%;`
            : item.status === 'done'
              ? '--progress:100%;'
              : '';

        return `
                <div class="pdftools-file-item ${item.status}" data-id="${item.id}" style="${progressStyle}">
                    <svg class="pdftools-file-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <div class="pdftools-file-info">
                        <div class="pdftools-file-name" title="${item.name}">${item.name}</div>
                        <div class="pdftools-file-meta">
                            <span>${this.formatBytes(item.size)}</span>
                            ${statusHtml}
                        </div>
                    </div>
                    <div class="pdftools-file-actions">${actionsHtml}</div>
                </div>`;
      })
      .join('');

    // Download listeners
    listEl.querySelectorAll('.btn-download-result').forEach((btn) => {
      btn.addEventListener('click', () =>
        this.downloadItem(btn.dataset.id, btn.dataset.mode),
      );
    });
    // Remove listeners
    listEl.querySelectorAll('.btn-remove-file').forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = btn.dataset.mode;
        if (m === 'compress')
          this.compressQueue = this.compressQueue.filter(
            (i) => i.id !== btn.dataset.id,
          );
        else
          this.convertQueue = this.convertQueue.filter(
            (i) => i.id !== btn.dataset.id,
          );
        this.renderQueue(m);
      });
    });
  },

  _removeBtn(id, mode) {
    return `<button class="btn-remove-file" data-id="${id}" data-mode="${mode}" title="Remove">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>`;
  },

  // ─── Compress: Render-and-Rebuild via pdf.js + pdf-lib ──────────────
  // Each PDF page is rendered to a canvas as JPEG, then embedded in a new PDF.
  // This gives 40–80% size reduction on typical PDFs (much better than just re-serializing).
  async runCompress() {
    const pending = this.compressQueue.filter((i) => i.status === 'pending');
    if (!pending.length) {
      alert('No pending files to compress.');
      return;
    }

    const preset =
      this.QUALITY_PRESETS[this.selectedQuality] ||
      this.QUALITY_PRESETS.balanced;

    // Load both libraries in parallel
    await Promise.all([this.loadPdfLib(), this.loadPdfJs()]);

    for (const item of pending) {
      item.status = 'processing';
      item.progress = 2;
      this.renderQueue('compress');

      try {
        const arrayBuffer = await this.readFileAsArrayBuffer(item.file);

        // Load with pdf.js for rendering
        const pdfJsDoc = await this.pdfjsLib.getDocument({ data: arrayBuffer })
          .promise;
        const pageCount = pdfJsDoc.numPages;

        // Create a fresh PDF with pdf-lib
        const newDoc = await this.PDFLib.PDFDocument.create();

        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          // Check if tool was destroyed mid-render (user navigated away)
          if (!this.pdfjsLib) break;

          const page = await pdfJsDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: preset.renderScale });

          // Render page to an offscreen canvas
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;

          // Export canvas as JPEG (lossy) at the chosen quality
          const jpegBytes = await this._canvasToJpegBytes(
            canvas,
            preset.jpegQuality,
          );

          // Embed JPEG in the new PDF document
          const jpgImage = await newDoc.embedJpg(jpegBytes);
          const { width, height } = jpgImage.scale(1);
          const newPage = newDoc.addPage([width, height]);
          newPage.drawImage(jpgImage, { x: 0, y: 0, width, height });

          // Update progress bar
          const progress = 5 + Math.round((pageNum / pageCount) * 90);
          item.progress = progress;
          this._setItemProgress(item.id, progress);
        }

        const compressedBytes = await newDoc.save({ useObjectStreams: true });

        item.progress = 100;
        item.status = 'done';
        item.result = {
          blob: new Blob([compressedBytes], { type: 'application/pdf' }),
          outputName: item.name.replace(/\.pdf$/i, '_compressed.pdf'),
        };
      } catch (err) {
        console.error('Compress error:', err);
        item.status = 'error';
        item.error = err.message || 'Compression failed';
      }

      this.renderQueue('compress');
    }
  },

  // Convert canvas to JPEG bytes as Uint8Array
  _canvasToJpegBytes(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas to JPEG failed'));
            return;
          }
          blob
            .arrayBuffer()
            .then((buf) => resolve(new Uint8Array(buf)))
            .catch(reject);
        },
        'image/jpeg',
        quality,
      );
    });
  },

  _setItemProgress(id, pct) {
    const el = document.querySelector(`.pdftools-file-item[data-id="${id}"]`);
    if (!el) return;
    // Update the animated CSS progress bar
    el.style.setProperty('--progress', `${pct}%`);
    // Also update the percentage text so it stays in sync with the bar
    const statusEl = el.querySelector('.pdftools-file-status.processing');
    if (statusEl) {
      statusEl.innerHTML = `<span class="inline-spinner"></span> ${Math.round(pct)}%`;
    }
  },

  // ─── Convert: Via Netlify Functions → CloudConvert ──────────────────
  async runConvert() {
    const pending = this.convertQueue.filter((i) => i.status === 'pending');
    if (!pending.length) {
      alert('No pending files to convert.');
      return;
    }

    for (const item of pending) {
      item.status = 'processing';
      item.progress = 5;
      this.renderQueue('convert');

      try {
        const outputName = item.name.replace(
          /\.pdf$/i,
          `.${this.selectedFormat}`,
        );
        const blob = await this._cloudConvertFile(
          item.file,
          this.selectedFormat,
          (pct) => {
            item.progress = pct;
            this._setItemProgress(item.id, pct);
          },
        );
        item.status = 'done';
        item.result = { blob, outputName };
      } catch (err) {
        console.error('Convert error:', err);
        item.status = 'error';
        item.error = err.message || 'Conversion failed';
      }

      this.renderQueue('convert');
    }
  },

  // CloudConvert flow via Netlify serverless functions (API key stays on server)
  async _cloudConvertFile(file, outputFormat, onProgress) {
    onProgress(8);

    // Step 1: Ask our Netlify function to create the job → returns upload URL
    const startRes = await fetch('/api/cc-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outputFormat }),
    });

    if (!startRes.ok) {
      const err = await startRes.json().catch(() => ({}));
      throw new Error(
        err.error || `Failed to start conversion (${startRes.status})`,
      );
    }

    const { jobId, uploadUrl, uploadParams } = await startRes.json();
    onProgress(18);

    // Step 2: Upload file directly to CloudConvert's S3 endpoint (no API key needed)
    const formData = new FormData();
    Object.entries(uploadParams).forEach(([k, v]) => formData.append(k, v));
    formData.append('file', file);

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });
    if (!uploadRes.ok)
      throw new Error(`File upload failed (${uploadRes.status})`);

    onProgress(35);

    // Step 3: Poll our Netlify function for job status
    let downloadUrl = null;
    for (let attempt = 0; attempt < 90; attempt++) {
      await new Promise((r) => setTimeout(r, 2500));

      const statusRes = await fetch('/api/cc-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      if (!statusRes.ok) throw new Error('Failed to check conversion status.');

      const data = await statusRes.json();

      if (data.status === 'error')
        throw new Error(data.message || 'Conversion failed on CloudConvert.');
      if (data.status === 'finished') {
        downloadUrl = data.downloadUrl;
        break;
      }

      // Gradually advance the progress bar while waiting
      const waitPct = 35 + Math.min(50, attempt * 1.5);
      onProgress(waitPct);
    }

    if (!downloadUrl)
      throw new Error(
        'Conversion timed out after 3 minutes. Please try again.',
      );
    onProgress(90);

    // Step 4: Download the converted file from CloudConvert's export URL
    const dlRes = await fetch(downloadUrl);
    if (!dlRes.ok) throw new Error(`Download failed (${dlRes.status})`);

    const blob = await dlRes.blob();
    onProgress(100);
    return blob;
  },

  // ─── Download ───────────────────────────────────────────────────────
  downloadItem(id, mode) {
    const queue = mode === 'compress' ? this.compressQueue : this.convertQueue;
    const item = queue.find((i) => i.id === id);
    if (!item?.result) return;

    const url = URL.createObjectURL(item.result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.result.outputName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // ─── Library Loaders ────────────────────────────────────────────────
  async loadPdfLib() {
    this.PDFLib = await loadPdfLib();
    return this.PDFLib;
  },

  async loadPdfJs() {
    this.pdfjsLib = await loadPdfJs();
    return this.pdfjsLib;
  },

  // ─── Utilities ──────────────────────────────────────────────────────
  bindDropzone(dropzone, fileInput, onFiles) {
    ['dragenter', 'dragover'].forEach((ev) =>
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      }),
    );
    ['dragleave', 'drop'].forEach((ev) =>
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      }),
    );
    dropzone.addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf',
      );
      if (files.length) onFiles(files);
    });
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf',
      );
      if (files.length) onFiles(files);
      fileInput.value = '';
    });
  },

  readFileAsArrayBuffer(file) {
    return readFileAsArrayBuffer(file);
  },

  formatBytes(bytes, decimals = 2) {
    return formatBytes(bytes, decimals);
  },

  destroy() {
    this.compressQueue = [];
    this.convertQueue = [];
    this.PDFLib = null;
    this.pdfjsLib = null;
  },
};
