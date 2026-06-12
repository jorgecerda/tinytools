// Shared Utility Helpers & Constants

let cachedPdfLib = null;
let cachedPdfJs = null;

/**
 * Escapes special HTML characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats a byte size into readable size labels (Bytes, KB, MB, GB, TB).
 * @param {number} bytes
 * @param {number} decimals
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Reads a File object as an ArrayBuffer.
 * @param {File} file
 * @returns {Promise<ArrayBuffer>}
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * User Agent Presets for network requests.
 */
export const UA_PRESETS = {
  chrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 tiinytools/1.0',
  googlebot:
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  mobile:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  custom: '',
};

/**
 * Lazy loads the pdf-lib library from CDN.
 * @returns {Promise<any>}
 */
export async function loadPdfLib() {
  if (typeof window === 'undefined') {
    return null;
  }
  if (cachedPdfLib || window.PDFLib) {
    cachedPdfLib = cachedPdfLib || window.PDFLib;
    return cachedPdfLib;
  }
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load pdf-lib.'));
    document.head.appendChild(script);
  });
  cachedPdfLib = window.PDFLib;
  return cachedPdfLib;
}

/**
 * Lazy loads the pdf.js library from CDN.
 * @returns {Promise<any>}
 */
export async function loadPdfJs() {
  if (typeof window === 'undefined') {
    return null;
  }
  if (cachedPdfJs || window.pdfjsLib) {
    cachedPdfJs = cachedPdfJs || window.pdfjsLib;
    return cachedPdfJs;
  }
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load pdf.js.'));
    document.head.appendChild(script);
  });
  cachedPdfJs = window.pdfjsLib;
  return cachedPdfJs;
}
