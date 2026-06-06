// PDF Split & Join Tool Module

export default {
    id: 'pdf',
    mergeFiles: [], // Queue for PDF merging
    splitFile: null, // Holder for the current split file details
    PDFLib: null,
    pdfjsLib: null,
    JSZipLib: null,

    async render(container) {
        // Build base HTML structure
        container.innerHTML = `
            <div class="card-premium pdf-tool-container" style="position: relative;">
                <!-- Loading overlay -->
                <div class="pdf-loading-overlay" id="pdfLoader" style="display: none;">
                    <div class="spinner"></div>
                    <p id="pdfLoaderText">Loading engine...</p>
                </div>

                <!-- Tabs -->
                <div class="pdf-tabs">
                    <button class="pdf-tab-btn active" id="tab-btn-merge">Merge PDFs (Join)</button>
                    <button class="pdf-tab-btn" id="tab-btn-split">Split PDF (Extract Pages)</button>
                </div>

                <!-- Tab Panel 1: Merge PDFs -->
                <div class="pdf-tab-panel active" id="panel-merge">
                    <div class="dropzone-premium" id="merge-dropzone">
                        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        <p class="dropzone-text">Drag & drop multiple PDF files here, or <span style="color:var(--primary); font-weight:600;">browse files</span></p>
                        <p class="dropzone-subtext">Merge files sequentially into a single PDF document.</p>
                        <input type="file" id="merge-file-input" multiple accept="application/pdf" style="display: none;">
                    </div>

                    <!-- Merge Queue -->
                    <div class="merge-queue" id="merge-queue-container" style="display: none;"></div>

                    <!-- Merge controls -->
                    <div class="merge-controls" id="merge-controls-bar" style="display: none;">
                        <button class="btn-secondary" id="btn-clear-merge">Clear All</button>
                        <button class="btn-primary" id="btn-execute-merge">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            <span>Merge PDFs</span>
                        </button>
                    </div>
                </div>

                <!-- Tab Panel 2: Split PDFs -->
                <div class="pdf-tab-panel" id="panel-split">
                    <!-- Dropzone -->
                    <div class="dropzone-premium" id="split-dropzone">
                        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        <p class="dropzone-text">Drag & drop a single PDF file here, or <span style="color:var(--primary); font-weight:600;">browse files</span></p>
                        <p class="dropzone-subtext">Extract pages, download them individually, or bundle selected pages as a ZIP.</p>
                        <input type="file" id="split-file-input" accept="application/pdf" style="display: none;">
                    </div>

                    <!-- Uploaded file details -->
                    <div class="split-file-details" id="split-details-card" style="display: none;">
                        <div class="split-meta-info">
                            <span class="split-meta-name" id="split-file-name">-</span>
                            <span class="split-meta-pages" id="split-file-pages">Total pages: 0</span>
                        </div>
                        <button class="btn-danger" id="btn-remove-split">Remove PDF</button>
                    </div>

                    <!-- Bulk actions bar -->
                    <div class="split-bulk-bar" id="split-bulk-bar" style="display: none;">
                        <label class="split-bulk-select-all" id="lbl-bulk-select">
                            <input type="checkbox" id="bulk-select-checkbox" class="bulk-select-checkbox">
                            <span>Select All</span>
                        </label>
                        <div class="split-bulk-actions">
                            <button class="btn-secondary" id="btn-zip-selected">Download Selected (ZIP)</button>
                            <button class="btn-primary" id="btn-zip-all">Download All (ZIP)</button>
                        </div>
                    </div>

                    <!-- Scrollable pages grid -->
                    <div class="split-pages-grid" id="split-pages-grid" style="display: none;"></div>
                </div>
            </div>
        `;

        this.setupTabListeners();
        this.setupMergeListeners();
        this.setupSplitListeners();
    },

    // 1. Dependency Loaders (Lazy loaded via CDN)
    async loadPdfLib() {
        if (this.PDFLib) return this.PDFLib;
        await new Promise((resolve, reject) => {
            if (window.PDFLib) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load pdf-lib.'));
            document.head.appendChild(script);
        });
        this.PDFLib = window.PDFLib;
        return this.PDFLib;
    },

    async loadPdfJs() {
        if (this.pdfjsLib) return this.pdfjsLib;
        await new Promise((resolve, reject) => {
            if (window.pdfjsLib) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load pdf.js.'));
            document.head.appendChild(script);
        });
        this.pdfjsLib = window.pdfjsLib;
        return this.pdfjsLib;
    },

    async loadJsZip() {
        if (this.JSZipLib) return this.JSZipLib;
        await new Promise((resolve, reject) => {
            if (window.JSZip) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load JSZip.'));
            document.head.appendChild(script);
        });
        this.JSZipLib = window.JSZip;
        return this.JSZipLib;
    },

    async loadAllDependencies() {
        const loader = document.getElementById('pdfLoader');
        const loaderText = document.getElementById('pdfLoaderText');
        if (loader) {
            loaderText.textContent = "Loading dependencies...";
            loader.style.display = 'flex';
        }

        try {
            await this.loadPdfLib();
            await this.loadPdfJs();
            await this.loadJsZip();
            if (loader) loader.style.display = 'none';
        } catch (error) {
            console.error("Dependency loading failed", error);
            alert("Could not load pdf helpers. Check your internet connection.");
            if (loader) loader.style.display = 'none';
            throw error;
        }
    },

    // 2. Tab Navigation
    setupTabListeners() {
        const tabBtnMerge = document.getElementById('tab-btn-merge');
        const tabBtnSplit = document.getElementById('tab-btn-split');
        const panelMerge = document.getElementById('panel-merge');
        const panelSplit = document.getElementById('panel-split');

        tabBtnMerge.addEventListener('click', () => {
            tabBtnMerge.classList.add('active');
            tabBtnSplit.classList.remove('active');
            panelMerge.classList.add('active');
            panelSplit.classList.remove('active');
        });

        tabBtnSplit.addEventListener('click', () => {
            tabBtnSplit.classList.add('active');
            tabBtnMerge.classList.remove('active');
            panelSplit.classList.add('active');
            panelMerge.classList.remove('active');
        });
    },

    // 3. Merge Logic & Queue Handlers
    setupMergeListeners() {
        const dropzone = document.getElementById('merge-dropzone');
        const fileInput = document.getElementById('merge-file-input');

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            if (files.length > 0) {
                this.addFilesToMergeQueue(files);
            }
        });

        dropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.addFilesToMergeQueue(files);
            }
            fileInput.value = '';
        });

        document.getElementById('btn-clear-merge').addEventListener('click', () => {
            this.mergeFiles = [];
            this.renderMergeQueue();
        });

        document.getElementById('btn-execute-merge').addEventListener('click', async () => {
            if (this.mergeFiles.length < 2) {
                alert("Please add at least 2 PDF files to merge.");
                return;
            }

            const loader = document.getElementById('pdfLoader');
            const loaderText = document.getElementById('pdfLoaderText');
            loaderText.textContent = "Merging PDF files...";
            loader.style.display = 'flex';

            try {
                const pdfLib = await this.loadPdfLib();
                const mergedPdf = await pdfLib.PDFDocument.create();

                for (const fileObj of this.mergeFiles) {
                    const fileBytes = await this.readFileAsArrayBuffer(fileObj.file);
                    const doc = await pdfLib.PDFDocument.load(fileBytes);
                    const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
                    pages.forEach(page => mergedPdf.addPage(page));
                }

                const mergedPdfBytes = await mergedPdf.save();
                this.downloadBlob(mergedPdfBytes, 'tiinytools-merged.pdf');
            } catch (error) {
                console.error("PDF Merge failed:", error);
                alert(`PDF Merge failed: ${error.message}`);
            } finally {
                loader.style.display = 'none';
            }
        });
    },

    async addFilesToMergeQueue(files) {
        await this.loadAllDependencies();
        const loader = document.getElementById('pdfLoader');
        const loaderText = document.getElementById('pdfLoaderText');
        loaderText.textContent = "Analyzing files...";
        loader.style.display = 'flex';

        try {
            for (const file of files) {
                const arrayBuffer = await this.readFileAsArrayBuffer(file);
                const doc = await this.PDFLib.PDFDocument.load(arrayBuffer, { updateMetadata: false });
                const pageCount = doc.getPageCount();
                
                this.mergeFiles.push({
                    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
                    name: file.name,
                    size: file.size,
                    pages: pageCount,
                    file: file
                });
            }
            this.renderMergeQueue();
        } catch (error) {
            console.error("Failed to parse file pages", error);
            alert("Could not load file. Verify that it is a valid, unencrypted PDF.");
        } finally {
            loader.style.display = 'none';
        }
    },

    renderMergeQueue() {
        const queueContainer = document.getElementById('merge-queue-container');
        const controlsBar = document.getElementById('merge-controls-bar');

        if (this.mergeFiles.length === 0) {
            queueContainer.style.display = 'none';
            controlsBar.style.display = 'none';
            queueContainer.innerHTML = '';
            return;
        }

        queueContainer.style.display = 'flex';
        controlsBar.style.display = 'flex';

        queueContainer.innerHTML = this.mergeFiles.map((item, index) => `
            <div class="merge-item" data-id="${item.id}">
                <div class="merge-item-info">
                    <div class="merge-item-name" title="${item.name}">${index + 1}. ${item.name}</div>
                    <div class="merge-item-meta">
                        <span>Pages: ${item.pages}</span>
                        <span>Size: ${this.formatBytes(item.size)}</span>
                    </div>
                </div>
                <div class="merge-item-actions">
                    <button class="merge-action-btn btn-up" title="Move Up" ${index === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </button>
                    <button class="merge-action-btn btn-down" title="Move Down" ${index === this.mergeFiles.length - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <button class="merge-action-btn btn-remove" title="Remove">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
        `).join('');

        queueContainer.querySelectorAll('.merge-item').forEach(itemNode => {
            const itemId = itemNode.getAttribute('data-id');
            const idx = this.mergeFiles.findIndex(f => f.id === itemId);

            itemNode.querySelector('.btn-up').addEventListener('click', (e) => {
                e.stopPropagation();
                if (idx > 0) {
                    const temp = this.mergeFiles[idx];
                    this.mergeFiles[idx] = this.mergeFiles[idx - 1];
                    this.mergeFiles[idx - 1] = temp;
                    this.renderMergeQueue();
                }
            });

            itemNode.querySelector('.btn-down').addEventListener('click', (e) => {
                e.stopPropagation();
                if (idx < this.mergeFiles.length - 1) {
                    const temp = this.mergeFiles[idx];
                    this.mergeFiles[idx] = this.mergeFiles[idx + 1];
                    this.mergeFiles[idx + 1] = temp;
                    this.renderMergeQueue();
                }
            });

            itemNode.querySelector('.btn-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.mergeFiles.splice(idx, 1);
                this.renderMergeQueue();
            });
        });
    },

    // 4. Split / Extract logic with Thumbnails & ZIP bundling
    setupSplitListeners() {
        const dropzone = document.getElementById('split-dropzone');
        const fileInput = document.getElementById('split-file-input');

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            if (files.length > 0) {
                this.loadSplitFile(files[0]);
            }
        });

        dropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.loadSplitFile(files[0]);
            }
            fileInput.value = '';
        });

        document.getElementById('btn-remove-split').addEventListener('click', () => {
            this.splitFile = null;
            this.toggleSplitUI(false);
        });

        // Bulk Actions Handlers
        const selectAllCheckbox = document.getElementById('bulk-select-checkbox');
        selectAllCheckbox.addEventListener('change', (e) => {
            const checked = e.target.checked;
            const cardCheckboxes = document.querySelectorAll('.page-card-checkbox');
            
            cardCheckboxes.forEach(cb => {
                cb.checked = checked;
                const pageIdx = parseInt(cb.getAttribute('data-index'), 10);
                if (checked) {
                    this.splitFile.selectedPages.add(pageIdx);
                } else {
                    this.splitFile.selectedPages.delete(pageIdx);
                }
            });
            this.updateBulkUIState();
        });

        // Zip Selected Download
        document.getElementById('btn-zip-selected').addEventListener('click', () => {
            if (!this.splitFile || this.splitFile.selectedPages.size === 0) {
                alert("Please select at least one page to download.");
                return;
            }
            this.downloadSelectedAsZip();
        });

        // Zip All Download
        document.getElementById('btn-zip-all').addEventListener('click', () => {
            if (!this.splitFile) return;
            // Select all pages
            for (let i = 0; i < this.splitFile.pages; i++) {
                this.splitFile.selectedPages.add(i);
            }
            // Update individual check boxes visual state
            document.querySelectorAll('.page-card-checkbox').forEach(cb => cb.checked = true);
            document.getElementById('bulk-select-checkbox').checked = true;
            this.updateBulkUIState();

            this.downloadSelectedAsZip();
        });
    },

    async loadSplitFile(file) {
        await this.loadAllDependencies();
        
        const loader = document.getElementById('pdfLoader');
        const loaderText = document.getElementById('pdfLoaderText');
        loaderText.textContent = "Loading PDF...";
        loader.style.display = 'flex';

        try {
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const doc = await this.PDFLib.PDFDocument.load(arrayBuffer, { updateMetadata: false });
            const pageCount = doc.getPageCount();

            this.splitFile = {
                name: file.name,
                pages: pageCount,
                file: file,
                selectedPages: new Set() // Store 0-indexed page numbers
            };

            document.getElementById('split-file-name').textContent = file.name;
            document.getElementById('split-file-pages').textContent = `Total pages: ${pageCount} (${this.formatBytes(file.size)})`;

            // Reset checkboxes
            document.getElementById('bulk-select-checkbox').checked = false;

            this.toggleSplitUI(true);

            // Populate Grid List
            const grid = document.getElementById('split-pages-grid');
            grid.innerHTML = '';
            
            for (let i = 0; i < pageCount; i++) {
                const pageNum = i + 1;
                grid.insertAdjacentHTML('beforeend', `
                    <div class="page-card" data-index="${i}">
                        <label class="page-card-checkbox-wrapper">
                            <input type="checkbox" class="page-card-checkbox" data-index="${i}">
                        </label>
                        <div class="page-card-thumbnail-container">
                            <canvas class="page-card-thumbnail" id="page-canvas-${pageNum}" style="display:none;"></canvas>
                            <div class="page-thumbnail-skeleton" id="page-skeleton-${pageNum}">
                                <div class="skeleton-spinner"></div>
                                <span class="skeleton-text">Rendering</span>
                            </div>
                        </div>
                        <div class="page-card-info">
                            <span class="page-card-num">Page ${pageNum}</span>
                            <button class="btn-card-download" data-index="${i}" title="Download individual page">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            </button>
                        </div>
                    </div>
                `);
            }

            // Register card specific checkbox and download listeners
            grid.querySelectorAll('.page-card').forEach(card => {
                const pageIdx = parseInt(card.getAttribute('data-index'), 10);
                
                // Checkbox toggle
                card.querySelector('.page-card-checkbox').addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.splitFile.selectedPages.add(pageIdx);
                    } else {
                        this.splitFile.selectedPages.delete(pageIdx);
                    }
                    this.updateBulkUIState();
                });

                // Download single button
                card.querySelector('.btn-card-download').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.downloadSinglePage(pageIdx);
                });
            });

            // Start rendering thumbnails sequentially
            this.renderAllThumbnails(arrayBuffer);

        } catch (error) {
            console.error("Failed to read PDF file:", error);
            alert("This file is not a valid PDF or is encrypted. Please try a different document.");
            this.splitFile = null;
            this.toggleSplitUI(false);
        } finally {
            loader.style.display = 'none';
        }
    },

    async renderAllThumbnails(arrayBuffer) {
        try {
            const pdfDoc = await this.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            // Render pages in loop (asynchronous to allow other page loaders to render without freezing the UI)
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                // If user switched tabs or removed file during render
                if (!this.splitFile) break;

                const canvas = document.getElementById(`page-canvas-${pageNum}`);
                const skeleton = document.getElementById(`page-skeleton-${pageNum}`);
                if (!canvas) continue;

                try {
                    const page = await pdfDoc.getPage(pageNum);
                    
                    // Render viewport at thumbnail size
                    const viewport = page.getViewport({ scale: 1.0 });
                    const scale = 140 / viewport.width; // Base thumbnail scale
                    const scaledViewport = page.getViewport({ scale: scale });

                    canvas.width = scaledViewport.width;
                    canvas.height = scaledViewport.height;

                    const context = canvas.getContext('2d');
                    const renderContext = {
                        canvasContext: context,
                        viewport: scaledViewport
                    };

                    await page.render(renderContext).promise;

                    if (skeleton) skeleton.style.display = 'none';
                    canvas.style.display = 'block';
                } catch (e) {
                    console.error(`Page ${pageNum} render error:`, e);
                    if (skeleton) {
                        const spinner = skeleton.querySelector('.skeleton-spinner');
                        const text = skeleton.querySelector('.skeleton-text');
                        if (spinner) spinner.style.display = 'none';
                        if (text) text.textContent = "Fail preview";
                    }
                }
            }
        } catch (error) {
            console.error("Failed PDFJS document rendering init:", error);
        }
    },

    updateBulkUIState() {
        const total = this.splitFile.pages;
        const selected = this.splitFile.selectedPages.size;
        const selectAllCheckbox = document.getElementById('bulk-select-checkbox');
        const zipSelectedBtn = document.getElementById('btn-zip-selected');

        zipSelectedBtn.textContent = `Download Selected (${selected}) (ZIP)`;

        if (selected === total) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (selected > 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    },

    async downloadSinglePage(pageIdx) {
        const loader = document.getElementById('pdfLoader');
        const loaderText = document.getElementById('pdfLoaderText');
        loaderText.textContent = `Extracting Page ${pageIdx + 1}...`;
        loader.style.display = 'flex';

        try {
            const arrayBuffer = await this.readFileAsArrayBuffer(this.splitFile.file);
            const srcDoc = await this.PDFLib.PDFDocument.load(arrayBuffer);
            const singleDoc = await this.PDFLib.PDFDocument.create();

            const [copiedPage] = await singleDoc.copyPages(srcDoc, [pageIdx]);
            singleDoc.addPage(copiedPage);

            const singlePdfBytes = await singleDoc.save();
            const outputName = this.splitFile.name.replace('.pdf', '') + `_page_${pageIdx + 1}.pdf`;
            
            this.downloadBlob(singlePdfBytes, outputName);
        } catch (error) {
            console.error("Single page split failed:", error);
            alert("Extracting page failed. Please try again.");
        } finally {
            loader.style.display = 'none';
        }
    },

    async downloadSelectedAsZip() {
        const loader = document.getElementById('pdfLoader');
        const loaderText = document.getElementById('pdfLoaderText');
        const selectedCount = this.splitFile.selectedPages.size;
        loaderText.textContent = `Processing and zipping ${selectedCount} pages...`;
        loader.style.display = 'flex';

        try {
            const zip = new this.JSZipLib();
            const arrayBuffer = await this.readFileAsArrayBuffer(this.splitFile.file);
            const srcDoc = await this.PDFLib.PDFDocument.load(arrayBuffer);

            // Extract pages and add them to zip structure
            const sortedPageIndices = Array.from(this.splitFile.selectedPages).sort((a, b) => a - b);
            
            for (const pageIdx of sortedPageIndices) {
                const singleDoc = await this.PDFLib.PDFDocument.create();
                const [copiedPage] = await singleDoc.copyPages(srcDoc, [pageIdx]);
                singleDoc.addPage(copiedPage);
                
                const pdfBytes = await singleDoc.save();
                zip.file(`page_${pageIdx + 1}.pdf`, pdfBytes);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const outputName = this.splitFile.name.replace('.pdf', '') + '_pages_bundle.zip';
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = outputName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error("ZIP Generation failed:", error);
            alert("Creating ZIP bundle failed. Please check file properties.");
        } finally {
            loader.style.display = 'none';
        }
    },

    toggleSplitUI(show) {
        const dropzone = document.getElementById('split-dropzone');
        const detailsCard = document.getElementById('split-details-card');
        const bulkBar = document.getElementById('split-bulk-bar');
        const grid = document.getElementById('split-pages-grid');

        if (show) {
            dropzone.style.display = 'none';
            detailsCard.style.display = 'flex';
            bulkBar.style.display = 'flex';
            grid.style.display = 'grid';
        } else {
            dropzone.style.display = 'flex';
            detailsCard.style.display = 'none';
            bulkBar.style.display = 'none';
            grid.style.display = 'none';
            grid.innerHTML = '';
        }
    },

    // 5. General Utility Methods
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    },

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    downloadBlob(bytes, filename) {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    },

    destroy() {
        this.mergeFiles = [];
        this.splitFile = null;
    }
};
