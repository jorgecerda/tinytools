// Background Image Remover Tool Logic (100% Client-Side via WebAssembly / ONNX AI)

/**
 * Validates if the uploaded file is a supported image type.
 * @param {File|null} file
 * @returns {boolean}
 */
export function isValidImageFile(file) {
    if (!file || !file.type) return false;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    return allowedTypes.includes(file.type.toLowerCase());
}

/**
 * Formats output filename with '-no-bg.png' extension.
 * @param {string} originalName
 * @returns {string}
 */
export function formatOutputFilename(originalName = 'image.png') {
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    return `${baseName}-no-bg.png`;
}

/**
 * Returns a human-friendly status message based on current progress phase.
 * @param {string} key
 * @param {number} percent
 * @returns {string}
 */
export function getFriendlyStatusMessage(key = '', percent = 0) {
    const k = String(key).toLowerCase();
    if (k.includes('fetch') || percent < 35) {
        return 'Loading local AI model into browser memory...';
    }
    if (k.includes('compute') || k.includes('model') || (percent >= 35 && percent < 75)) {
        return 'Analyzing photo & detecting subject boundaries...';
    }
    if (k.includes('encode') || k.includes('render') || percent >= 75) {
        return 'Removing background & refining transparent edges...';
    }
    return 'Processing image locally in your browser...';
}

// Module controller
export default {
    render(container) {
        container.innerHTML = `
            <div class="bg-remover-container">
                <!-- Dropzone Area -->
                <div class="bg-remover-dropzone" id="bgDropzone">
                    <input type="file" id="bgFileInput" accept="image/png, image/jpeg, image/webp" style="display: none;">
                    <div class="dropzone-icon-wrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    </div>
                    <h3 class="dropzone-title">Upload Photo or Image</h3>
                    <p class="dropzone-desc">Drag & drop your PNG, JPG, or WebP file here, or click to browse</p>
                    <p class="dropzone-subtext" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">100% client-side AI execution. Your image is processed in your browser memory and never uploaded to any server.</p>
                </div>

                <!-- Processing Status Bar -->
                <div class="bg-remover-status" id="bgStatus" style="display: none;">
                    <div class="status-header">
                        <span id="statusText">Preparing local AI model...</span>
                        <span id="statusPercent">0%</span>
                    </div>
                    <div class="progress-bar-wrap">
                        <div class="progress-bar-fill" id="statusProgressBar"></div>
                    </div>
                </div>

                <!-- Results Side-by-Side Comparison -->
                <div class="bg-remover-preview-grid" id="bgPreviewGrid" style="display: none;">
                    <!-- Original Image -->
                    <div class="preview-card">
                        <div class="preview-card-title">
                            <span>Original Image</span>
                            <span id="origDimensions" style="font-size: 0.75rem; color: var(--text-muted);"></span>
                        </div>
                        <div class="img-preview-box">
                            <img id="origImgPreview" alt="Original Upload">
                        </div>
                    </div>

                    <!-- Processed Transparent PNG -->
                    <div class="preview-card">
                        <div class="preview-card-title">
                            <span>Transparent Background</span>
                            <span style="font-size: 0.75rem; color: var(--success); font-weight: 600;">PNG Transparent</span>
                        </div>
                        <div class="img-preview-box checkerboard-bg">
                            <img id="processedImgPreview" alt="Background Removed Result">
                        </div>
                    </div>
                </div>

                <!-- Actions Bar -->
                <div class="bg-remover-actions" id="bgActions" style="display: none;">
                    <a id="downloadPngBtn" class="btn-primary" download="transparent-image.png" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        <span>Download Transparent PNG</span>
                    </a>
                    <button id="resetBgBtn" class="btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                        <span>Process Another Image</span>
                    </button>
                </div>
            </div>
        `;

        this.initEvents(container);
    },

    initEvents(container) {
        const dropzone = container.querySelector('#bgDropzone');
        const fileInput = container.querySelector('#bgFileInput');
        const statusBox = container.querySelector('#bgStatus');
        const statusText = container.querySelector('#statusText');
        const statusPercent = container.querySelector('#statusPercent');
        const progressBar = container.querySelector('#statusProgressBar');
        const previewGrid = container.querySelector('#bgPreviewGrid');
        const actionsBar = container.querySelector('#bgActions');
        const origImg = container.querySelector('#origImgPreview');
        const processedImg = container.querySelector('#processedImgPreview');
        const origDimensions = container.querySelector('#origDimensions');
        const downloadBtn = container.querySelector('#downloadPngBtn');
        const resetBtn = container.querySelector('#resetBgBtn');

        let currentProcessedUrl = null;

        dropzone.addEventListener('click', () => fileInput.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });

        resetBtn.addEventListener('click', () => {
            if (currentProcessedUrl) {
                URL.revokeObjectURL(currentProcessedUrl);
                currentProcessedUrl = null;
            }
            fileInput.value = '';
            dropzone.style.display = 'block';
            statusBox.style.display = 'none';
            previewGrid.style.display = 'none';
            actionsBar.style.display = 'none';
        });

        async function handleFile(file) {
            if (!isValidImageFile(file)) {
                alert('Please upload a valid image file (PNG, JPG, JPEG, or WebP).');
                return;
            }

            // Show original image preview
            const origUrl = URL.createObjectURL(file);
            origImg.src = origUrl;

            origImg.onload = () => {
                origDimensions.textContent = `${origImg.naturalWidth} × ${origImg.naturalHeight} px`;
            };

            dropzone.style.display = 'none';
            statusBox.style.display = 'flex';
            previewGrid.style.display = 'none';
            actionsBar.style.display = 'none';

            updateProgress(getFriendlyStatusMessage('fetch', 15), 15);

            try {
                // Dynamically import @imgly/background-removal library
                updateProgress(getFriendlyStatusMessage('fetch', 30), 30);
                const imglyModule = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm');
                const removeBackground = imglyModule.removeBackground || imglyModule.default;

                updateProgress(getFriendlyStatusMessage('compute', 50), 50);
                
                const outputBlob = await removeBackground(file, {
                    progress: (key, current, total) => {
                        if (total > 0) {
                            const percent = Math.min(95, Math.round(35 + (current / total) * 60));
                            const msg = getFriendlyStatusMessage(key, percent);
                            updateProgress(msg, percent);
                        }
                    }
                });

                updateProgress('Finalizing transparent PNG...', 100);

                // Display result
                if (currentProcessedUrl) {
                    URL.revokeObjectURL(currentProcessedUrl);
                }
                currentProcessedUrl = URL.createObjectURL(outputBlob);
                processedImg.src = currentProcessedUrl;

                const outFilename = formatOutputFilename(file.name);
                downloadBtn.href = currentProcessedUrl;
                downloadBtn.download = outFilename;

                setTimeout(() => {
                    statusBox.style.display = 'none';
                    previewGrid.style.display = 'grid';
                    actionsBar.style.display = 'flex';
                }, 400);

            } catch (err) {
                console.error('Background removal failed:', err);
                statusText.textContent = 'Error: Failed to process image locally. Please try a different photo.';
                statusText.style.color = 'var(--danger)';
                progressBar.style.backgroundColor = 'var(--danger)';
                
                setTimeout(() => {
                    resetBtn.click();
                }, 3000);
            }
        }

        function updateProgress(message, percentage) {
            statusText.textContent = message;
            statusPercent.textContent = `${percentage}%`;
            progressBar.style.width = `${percentage}%`;
        }
    }
};
