// Percentage Calculator Tool Module

export default {
  id: 'percentage',
  render(container) {
    container.innerHTML = `
            <div class="percentage-calc-grid">
                <!-- Calc 1: What is X% of Y? -->
                <div class="calc-card" id="calc-card-1">
                    <h3 class="calc-card-title">Percentage of a Value</h3>
                    <div class="calc-inputs-row">
                        <div class="calc-input-wrapper">
                            <label for="c1-pct">Percentage (%)</label>
                            <input type="number" id="c1-pct" class="input-premium" placeholder="e.g. 15" step="any">
                        </div>
                        <span class="calc-operator">of</span>
                        <div class="calc-input-wrapper">
                            <label for="c1-val">Value</label>
                            <input type="number" id="c1-val" class="input-premium" placeholder="e.g. 200" step="any">
                        </div>
                    </div>
                    <div class="calc-result-bar" id="c1-result-bar">
                        <span class="result-label">Result</span>
                        <div class="result-value-container">
                            <span class="result-value" id="c1-result">-</span>
                            <button class="copy-btn-inline" data-target="c1-result" title="Copy to clipboard">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Calc 2: X is what percentage of Y? -->
                <div class="calc-card" id="calc-card-2">
                    <h3 class="calc-card-title">Percentage Share</h3>
                    <div class="calc-inputs-row">
                        <div class="calc-input-wrapper">
                            <label for="c2-val1">Value 1 (Part)</label>
                            <input type="number" id="c2-val1" class="input-premium" placeholder="e.g. 50" step="any">
                        </div>
                        <span class="calc-operator">is what % of</span>
                        <div class="calc-input-wrapper">
                            <label for="c2-val2">Value 2 (Whole)</label>
                            <input type="number" id="c2-val2" class="input-premium" placeholder="e.g. 250" step="any">
                        </div>
                    </div>
                    <div class="calc-result-bar" id="c2-result-bar">
                        <span class="result-label">Result</span>
                        <div class="result-value-container">
                            <span class="result-value" id="c2-result">-</span>
                            <button class="copy-btn-inline" data-target="c2-result" title="Copy to clipboard">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Calc 3: Percentage Change from X to Y -->
                <div class="calc-card" id="calc-card-3">
                    <h3 class="calc-card-title">Percentage Increase / Decrease</h3>
                    <div class="calc-inputs-row">
                        <div class="calc-input-wrapper">
                            <label for="c3-val1">From Value</label>
                            <input type="number" id="c3-val1" class="input-premium" placeholder="e.g. 100" step="any">
                        </div>
                        <span class="calc-operator">to</span>
                        <div class="calc-input-wrapper">
                            <label for="c3-val2">To Value</label>
                            <input type="number" id="c3-val2" class="input-premium" placeholder="e.g. 150" step="any">
                        </div>
                    </div>
                    <div class="calc-result-bar" id="c3-result-bar">
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <span class="result-label">Difference</span>
                            <div id="c3-badge-container"></div>
                        </div>
                        <div class="result-value-container">
                            <span class="result-value" id="c3-result">-</span>
                            <button class="copy-btn-inline" data-target="c3-result" title="Copy to clipboard">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Calc 4: Add/Subtract percentage to value -->
                <div class="calc-card" id="calc-card-4">
                    <h3 class="calc-card-title">Adjust Value by Percentage</h3>
                    <div class="calc-inputs-row">
                        <div class="calc-input-wrapper" style="flex: 2;">
                            <label for="c4-val">Base Value</label>
                            <input type="number" id="c4-val" class="input-premium" placeholder="e.g. 200" step="any">
                        </div>
                        <div class="calc-input-wrapper" style="flex: 1.5; min-width:80px;">
                            <label for="c4-op">Action</label>
                            <select id="c4-op" class="calc-select">
                                <option value="add">Add (+)</option>
                                <option value="sub">Subtract (-)</option>
                            </select>
                        </div>
                        <div class="calc-input-wrapper" style="flex: 2;">
                            <label for="c4-pct">Percentage (%)</label>
                            <input type="number" id="c4-pct" class="input-premium" placeholder="e.g. 10" step="any">
                        </div>
                    </div>
                    <div class="calc-result-bar" id="c4-result-bar">
                        <span class="result-label">Result</span>
                        <div class="result-value-container">
                            <span class="result-value" id="c4-result">-</span>
                            <button class="copy-btn-inline" data-target="c4-result" title="Copy to clipboard">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    this.setupListeners();
  },

  setupListeners() {
    // Calculator 1 inputs
    const c1Pct = document.getElementById('c1-pct');
    const c1Val = document.getElementById('c1-val');
    const c1Result = document.getElementById('c1-result');
    const c1Bar = document.getElementById('c1-result-bar');

    const calc1 = () => {
      const pct = parseFloat(c1Pct.value);
      const val = parseFloat(c1Val.value);
      if (!isNaN(pct) && !isNaN(val)) {
        const res = percentOf(pct, val);
        c1Result.textContent = this.formatNumber(res);
        c1Bar.classList.add('has-value');
      } else {
        c1Result.textContent = '-';
        c1Bar.classList.remove('has-value');
      }
    };

    c1Pct.addEventListener('input', calc1);
    c1Val.addEventListener('input', calc1);

    // Calculator 2 inputs
    const c2Val1 = document.getElementById('c2-val1');
    const c2Val2 = document.getElementById('c2-val2');
    const c2Result = document.getElementById('c2-result');
    const c2Bar = document.getElementById('c2-result-bar');

    const calc2 = () => {
      const v1 = parseFloat(c2Val1.value);
      const v2 = parseFloat(c2Val2.value);
      if (!isNaN(v1) && !isNaN(v2) && v2 !== 0) {
        const res = percentageShare(v1, v2);
        c2Result.textContent = this.formatNumber(res) + '%';
        c2Bar.classList.add('has-value');
      } else {
        c2Result.textContent = '-';
        c2Bar.classList.remove('has-value');
      }
    };

    c2Val1.addEventListener('input', calc2);
    c2Val2.addEventListener('input', calc2);

    // Calculator 3 inputs
    const c3Val1 = document.getElementById('c3-val1');
    const c3Val2 = document.getElementById('c3-val2');
    const c3Result = document.getElementById('c3-result');
    const c3Bar = document.getElementById('c3-result-bar');
    const c3BadgeContainer = document.getElementById('c3-badge-container');

    const calc3 = () => {
      const v1 = parseFloat(c3Val1.value);
      const v2 = parseFloat(c3Val2.value);
      if (!isNaN(v1) && !isNaN(v2)) {
        if (v1 === 0) {
          c3Result.textContent = 'Infinite';
          c3BadgeContainer.innerHTML = `<span class="result-badge badge-neutral">Undefined (Start was 0)</span>`;
          c3Bar.classList.add('has-value');
          return;
        }
        const diff = v2 - v1;
        const pctChange = increaseDecrease(v1, v2);
        const sign = pctChange > 0 ? '+' : '';

        c3Result.textContent = `${sign}${this.formatNumber(pctChange)}%`;
        c3Bar.classList.add('has-value');

        if (pctChange > 0) {
          c3BadgeContainer.innerHTML = `<span class="result-badge badge-increase">↑ Increase by ${this.formatNumber(diff)}</span>`;
        } else if (pctChange < 0) {
          c3BadgeContainer.innerHTML = `<span class="result-badge badge-decrease">↓ Decrease by ${this.formatNumber(Math.abs(diff))}</span>`;
        } else {
          c3BadgeContainer.innerHTML = `<span class="result-badge badge-neutral">No Change</span>`;
        }
      } else {
        c3Result.textContent = '-';
        c3BadgeContainer.innerHTML = '';
        c3Bar.classList.remove('has-value');
      }
    };

    c3Val1.addEventListener('input', calc3);
    c3Val2.addEventListener('input', calc3);

    // Calculator 4 inputs
    const c4Val = document.getElementById('c4-val');
    const c4Op = document.getElementById('c4-op');
    const c4Pct = document.getElementById('c4-pct');
    const c4Result = document.getElementById('c4-result');
    const c4Bar = document.getElementById('c4-result-bar');

    const calc4 = () => {
      const val = parseFloat(c4Val.value);
      const op = c4Op.value;
      const pct = parseFloat(c4Pct.value);
      if (!isNaN(val) && !isNaN(pct)) {
        const res = adjustByPercentage(val, pct, op);
        c4Result.textContent = this.formatNumber(res);
        c4Bar.classList.add('has-value');
      } else {
        c4Result.textContent = '-';
        c4Bar.classList.remove('has-value');
      }
    };

    c4Val.addEventListener('input', calc4);
    c4Op.addEventListener('change', calc4);
    c4Pct.addEventListener('input', calc4);

    // Global Copy Button Handlers
    const copyBtns = document.querySelectorAll('.copy-btn-inline');
    copyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        if (targetElement && targetElement.textContent !== '-') {
          const textToCopy = targetElement.textContent.replace('%', '');
          navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
              // Change UI state to copied
              btn.classList.add('copied');
              const originalSvg = btn.innerHTML;
              btn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        `;
              setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = originalSvg;
              }, 1500);
            })
            .catch((err) => {
              console.error('Failed to copy text: ', err);
            });
        }
      });
    });
  },

  formatNumber(num) {
    if (num === 0) return '0';
    // If number has decimals, round to maximum 4 decimal places but avoid trailing zeros
    if (num % 1 !== 0) {
      return parseFloat(num.toFixed(4)).toString();
    }
    return num.toLocaleString();
  },

  destroy() {},
};

/**
 * Calculates what is X% of Y.
 * @param {number} pct
 * @param {number} val
 * @returns {number}
 */
export function percentOf(pct, val) {
  return (pct / 100) * val;
}

/**
 * Calculates what percentage Value 1 (Part) is of Value 2 (Whole).
 * @param {number} v1
 * @param {number} v2
 * @returns {number}
 */
export function percentageShare(v1, v2) {
  if (v2 === 0) return 0;
  return (v1 / v2) * 100;
}

/**
 * Calculates percentage change from Value 1 to Value 2.
 * @param {number} v1
 * @param {number} v2
 * @returns {number}
 */
export function increaseDecrease(v1, v2) {
  if (v1 === 0) return 0;
  const diff = v2 - v1;
  return (diff / Math.abs(v1)) * 100;
}

/**
 * Adjusts a base value by adding/subtracting a percentage.
 * @param {number} val
 * @param {number} pct
 * @param {string} op 'add' | 'sub'
 * @returns {number}
 */
export function adjustByPercentage(val, pct, op) {
  const multiplier = op === 'add' ? 1 + pct / 100 : 1 - pct / 100;
  return val * multiplier;
}
