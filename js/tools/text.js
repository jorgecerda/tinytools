// Character Counter & Text Analyzer Tool Module

export default {
  id: 'text',
  render(container) {
    container.innerHTML = `
            <div class="text-analyzer-layout">
                <!-- Top Stat Ribbon -->
                <div class="stats-ribbon">
                    <div class="stat-box">
                        <div class="stat-num" id="stat-words">0</div>
                        <div class="stat-label">Words</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-num" id="stat-chars-space">0</div>
                        <div class="stat-label">Characters</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-num" id="stat-chars-nospace">0</div>
                        <div class="stat-label">Chars (no space)</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-num" id="stat-sentences">0</div>
                        <div class="stat-label">Sentences</div>
                    </div>
                </div>

                <!-- Main Layout -->
                <div class="text-analyzer-main">
                    <!-- Left: Editor & Case conversions -->
                    <div class="card-premium editor-card">
                        <div class="analyzer-textarea-wrapper">
                            <textarea id="analyzer-input" class="analyzer-textarea" placeholder="Type or paste your text here to begin analyzing..."></textarea>
                        </div>
                        
                        <div class="editor-actions">
                            <button class="btn-primary" id="btn-copy-text">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                <span>Copy Text</span>
                            </button>
                            <button class="btn-secondary" id="btn-clear-text">Clear</button>
                            
                            <div style="flex-grow:1;"></div>
                            
                            <!-- Case Conversion Dropdown & Action -->
                            <select id="case-transform-select" class="calc-select">
                                <option value="" disabled selected>Convert Case...</option>
                                <option value="upper">UPPERCASE</option>
                                <option value="lower">lowercase</option>
                                <option value="title">Title Case</option>
                                <option value="sentence">Sentence Case</option>
                                <option value="slug">Slugify (url-slug)</option>
                                <option value="camel">camelCase</option>
                                <option value="reverse">esreveR (Reverse)</option>
                            </select>
                            <button class="btn-secondary" id="btn-apply-case">Apply</button>
                        </div>
                    </div>

                    <!-- Right: Limits & Insights -->
                    <div class="analyzer-sidebar">
                        <!-- Reading Times -->
                        <div class="widget-card">
                            <h3 class="widget-title">Estimation Insights</h3>
                            <div class="read-speak-grid">
                                <div class="time-item">
                                    <div class="time-val" id="time-reading">0s</div>
                                    <div class="time-lbl">Reading Time</div>
                                </div>
                                <div class="time-item">
                                    <div class="time-val" id="time-speaking">0s</div>
                                    <div class="time-lbl">Speaking Time</div>
                                </div>
                            </div>
                        </div>

                        <!-- Social Limits -->
                        <div class="widget-card">
                            <h3 class="widget-title">Social Media Limits</h3>
                            
                            <!-- Twitter -->
                            <div class="limit-item">
                                <div class="limit-header">
                                    <span>Twitter Post</span>
                                    <span id="limit-lbl-twitter">0 / 280</span>
                                </div>
                                <div class="limit-progress-bar">
                                    <div class="limit-progress-fill" id="limit-bar-twitter"></div>
                                </div>
                            </div>

                            <!-- Meta description -->
                            <div class="limit-item">
                                <div class="limit-header">
                                    <span>Meta Description</span>
                                    <span id="limit-lbl-meta">0 / 160</span>
                                </div>
                                <div class="limit-progress-bar">
                                    <div class="limit-progress-fill" id="limit-bar-meta"></div>
                                </div>
                            </div>

                            <!-- LinkedIn -->
                            <div class="limit-item">
                                <div class="limit-header">
                                    <span>LinkedIn Post</span>
                                    <span id="limit-lbl-linkedin">0 / 3000</span>
                                </div>
                                <div class="limit-progress-bar">
                                    <div class="limit-progress-fill" id="limit-bar-linkedin"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Word Density -->
                        <div class="widget-card">
                            <h3 class="widget-title">Word Frequency (Top 5)</h3>
                            <div class="density-list" id="density-list">
                                <p style="color:var(--text-muted); font-size:0.875rem; text-align:center;">Type text to view frequency analysis</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    this.setupListeners();
  },

  setupListeners() {
    const textarea = document.getElementById('analyzer-input');
    const statWords = document.getElementById('stat-words');
    const statCharsSpace = document.getElementById('stat-chars-space');
    const statCharsNoSpace = document.getElementById('stat-chars-nospace');
    const statSentences = document.getElementById('stat-sentences');

    const timeReading = document.getElementById('time-reading');
    const timeSpeaking = document.getElementById('time-speaking');

    const barTwitter = document.getElementById('limit-bar-twitter');
    const lblTwitter = document.getElementById('limit-lbl-twitter');
    const barMeta = document.getElementById('limit-bar-meta');
    const lblMeta = document.getElementById('limit-lbl-meta');
    const barLinkedin = document.getElementById('limit-bar-linkedin');
    const lblLinkedin = document.getElementById('limit-lbl-linkedin');

    const densityList = document.getElementById('density-list');

    const updateStats = () => {
      const text = textarea.value;

      // Chars count
      const charsWithSpace = charCount(text, false);
      const charsNoSpace = charCount(text, true);

      // Word count
      const words = wordCount(text);

      // Sentence count
      const sentences = sentenceCount(text);

      // Update header UI stats
      statWords.textContent = words.toLocaleString();
      statCharsSpace.textContent = charsWithSpace.toLocaleString();
      statCharsNoSpace.textContent = charsNoSpace.toLocaleString();
      statSentences.textContent = sentences.toLocaleString();

      // Estimated times
      // Reading: ~200 WPM
      const readSeconds = readingTime(text);
      timeReading.textContent = this.formatDuration(readSeconds);

      // Speaking: ~130 WPM
      const speakSeconds = Math.ceil((words / 130) * 60);
      timeSpeaking.textContent = this.formatDuration(speakSeconds);

      // Limit fills helper
      const updateProgress = (fillBar, label, limitInfo) => {
        fillBar.style.width = `${limitInfo.percentage}%`;
        label.textContent = `${limitInfo.current.toLocaleString()} / ${limitInfo.max.toLocaleString()}`;

        fillBar.classList.remove('warning', 'danger');
        if (limitInfo.status === 'danger') {
          fillBar.classList.add('danger');
        } else if (limitInfo.status === 'warning') {
          fillBar.classList.add('warning');
        }
      };

      const limits = socialLimits(text);
      updateProgress(barTwitter, lblTwitter, limits.twitter);
      updateProgress(barMeta, lblMeta, limits.meta);
      updateProgress(barLinkedin, lblLinkedin, limits.linkedin);

      // Word density calculations
      this.updateWordDensity(text, densityList);
    };

    // Input triggers
    textarea.addEventListener('input', updateStats);

    // Copy button
    const copyBtn = document.getElementById('btn-copy-text');
    copyBtn.addEventListener('click', () => {
      if (textarea.value.trim() !== '') {
        navigator.clipboard.writeText(textarea.value).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Copied!</span>
                    `;
          copyBtn.classList.add('btn-success');
          copyBtn.classList.remove('btn-primary');
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove('btn-success');
            copyBtn.classList.add('btn-primary');
          }, 1500);
        });
      }
    });

    // Clear button
    document.getElementById('btn-clear-text').addEventListener('click', () => {
      textarea.value = '';
      updateStats();
    });

    // Case Transformation
    document.getElementById('btn-apply-case').addEventListener('click', () => {
      const transformType = document.getElementById(
        'case-transform-select',
      ).value;
      const originalVal = textarea.value;
      if (!transformType || originalVal.trim() === '') return;

      let newVal = '';
      switch (transformType) {
        case 'upper':
          newVal = originalVal.toUpperCase();
          break;
        case 'lower':
          newVal = originalVal.toLowerCase();
          break;
        case 'title':
          newVal = this.toTitleCase(originalVal);
          break;
        case 'sentence':
          newVal = this.toSentenceCase(originalVal);
          break;
        case 'slug':
          newVal = this.toSlugify(originalVal);
          break;
        case 'camel':
          newVal = this.toCamelCase(originalVal);
          break;
        case 'reverse':
          newVal = originalVal.split('').reverse().join('');
          break;
      }

      textarea.value = newVal;
      updateStats();
    });
  },

  formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
  },

  toTitleCase(str) {
    const minorWords = [
      'a',
      'an',
      'the',
      'and',
      'but',
      'or',
      'for',
      'nor',
      'on',
      'at',
      'to',
      'from',
      'by',
      'of',
      'in',
      'with',
      'about',
      'as',
      'into',
      'like',
      'through',
      'over',
    ];
    return str.toLowerCase().replace(/\w\S*/g, (txt, index) => {
      if (index > 0 && minorWords.includes(txt)) {
        return txt;
      }
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
  },

  toSentenceCase(str) {
    return str
      .toLowerCase()
      .replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, separator, letter) => {
        return separator + letter.toUpperCase();
      });
  },

  toSlugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  toCamelCase(str) {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
      .trim();
  },

  updateWordDensity(text, container) {
    // Cleanup text to find alphanumeric words
    const cleaned = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // remove punctuation
      .replace(/\s+/g, ' ') // normalize spacing
      .trim();

    if (cleaned === '') {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:0.875rem; text-align:center;">Type text to view frequency analysis</p>`;
      return;
    }

    const words = cleaned.split(' ');
    const totalCount = words.length;

    // Count frequencies
    const freqs = {};
    words.forEach((word) => {
      if (word.length > 1) {
        // Ignore single-letter filler words for quality density mapping
        freqs[word] = (freqs[word] || 0) + 1;
      }
    });

    // Convert to array and sort
    const sorted = Object.entries(freqs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Take top 5

    if (sorted.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:0.875rem; text-align:center;">No valid analysis candidate words found</p>`;
      return;
    }

    let html = '<div class="density-list">';
    sorted.forEach(([word, count]) => {
      const pct = ((count / totalCount) * 100).toFixed(1);
      html += `
                <div class="density-row">
                    <span class="density-word">${word}</span>
                    <div>
                        <span class="density-count">${count}x</span>
                        <span style="color: var(--text-muted); margin-left: 6px; font-size: 0.8rem;">(${pct}%)</span>
                    </div>
                </div>
            `;
    });
    html += '</div>';
    container.innerHTML = html;
  },

  destroy() {},
};

/**
 * Calculates character count.
 * @param {string} text
 * @param {boolean} excludeSpaces
 * @returns {number}
 */
export function charCount(text, excludeSpaces = false) {
  if (!text) return 0;
  if (excludeSpaces) {
    return text.replace(/\s/g, '').length;
  }
  return text.length;
}

/**
 * Calculates word count.
 * @param {string} text
 * @returns {number}
 */
export function wordCount(text) {
  if (!text) return 0;
  const cleanText = text.trim();
  return cleanText === '' ? 0 : cleanText.split(/\s+/).length;
}

/**
 * Calculates sentence count.
 * @param {string} text
 * @returns {number}
 */
export function sentenceCount(text) {
  if (!text) return 0;
  const cleanText = text.trim();
  if (cleanText === '') return 0;
  return (text.match(/[.!?]+(\s|$)/g) || []).length || 1;
}

/**
 * Calculates reading time in seconds.
 * @param {string} text
 * @returns {number}
 */
export function readingTime(text) {
  const words = wordCount(text);
  return Math.ceil((words / 200) * 60);
}

/**
 * Evaluates limits for various social networks.
 * @param {string} text
 * @returns {object}
 */
export function socialLimits(text) {
  const chars = charCount(text, false);
  return {
    twitter: {
      current: chars,
      max: 280,
      percentage: Math.min((chars / 280) * 100, 100),
      status:
        chars > 280 ? 'danger' : chars >= 280 * 0.85 ? 'warning' : 'normal',
    },
    meta: {
      current: chars,
      max: 160,
      percentage: Math.min((chars / 160) * 100, 100),
      status:
        chars > 160 ? 'danger' : chars >= 160 * 0.85 ? 'warning' : 'normal',
    },
    linkedin: {
      current: chars,
      max: 3000,
      percentage: Math.min((chars / 3000) * 100, 100),
      status:
        chars > 3000 ? 'danger' : chars >= 3000 * 0.85 ? 'warning' : 'normal',
    },
  };
}
