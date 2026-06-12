// CSP Build, Merge & Verify Tool Module

import { escapeHtml } from '../shared/utils.js';

// Fallback list of directives that fall back to default-src in browser CSP
export const FALLBACK_DIRECTIVES = [
  'script-src',
  'style-src',
  'img-src',
  'connect-src',
  'font-src',
  'frame-src',
  'media-src',
  'manifest-src',
  'object-src',
  'worker-src',
  'prefetch-src',
  'child-src'
];

/**
 * Parses a Content Security Policy string or meta tag content.
 * @param {string} cspStr 
 * @returns {Object} Directive-to-sources dictionary
 */
export function parseCsp(cspStr) {
  if (!cspStr) return {};

  let cleanStr = cspStr.trim();

  // If a full HTML <meta> tag is pasted, extract the content attribute
  if (cleanStr.toLowerCase().startsWith('<meta')) {
    const contentMatch = cleanStr.match(/content=(["'])(.*?)\1/i);
    if (contentMatch && contentMatch[2]) {
      cleanStr = contentMatch[2];
    }
  }

  const directives = {};
  const parts = cleanStr.split(';');

  parts.forEach(part => {
    const trimmed = part.trim();
    if (!trimmed) return;

    // Split by whitespace to separate directive name from its sources
    const tokens = trimmed.split(/\s+/);
    const directiveName = tokens[0].toLowerCase();
    const sources = tokens.slice(1).filter(s => s.trim().length > 0);

    if (directiveName) {
      directives[directiveName] = sources;
    }
  });

  return directives;
}

/**
 * Converts a directive dictionary back into a CSP string.
 * @param {Object} cspObj 
 * @returns {string} Semicolon-separated CSP string
 */
export function serializeCsp(cspObj) {
  if (!cspObj || Object.keys(cspObj).length === 0) return '';

  return Object.entries(cspObj)
    .map(([directive, sources]) => {
      if (!sources || sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ') + ';';
}

function getHostFromSource(src) {
  if (src.startsWith("'") || src.endsWith(':') || src === '*') return null;
  // Strip scheme if present
  let host = src.replace(/^https?:\/\//i, '');
  // Strip port if present
  host = host.split(':')[0];
  // Strip path if present
  host = host.split('/')[0];
  return host.toLowerCase();
}

function isSubdomain(parentHost, childHost) {
  if (!parentHost.startsWith('*.')) return false;
  const domain = parentHost.substring(2); // e.g. 'example.com'
  return childHost.endsWith('.' + domain);
}

/**
 * Clean up and optimize sources array (deduplicate, remove redundant entries)
 * @param {string[]} sources 
 * @returns {string[]} Optimized sources
 */
function optimizeSources(sources) {
  if (!sources || sources.length === 0) return [];

  // Deduplicate
  let unique = Array.from(new Set(sources));

  // If '*' is present, it overrides everything else except specific keywords
  if (unique.includes('*')) {
    const keywords = unique.filter(s => s.startsWith("'") && s !== "'self'" && s !== "'none'");
    return ['*', ...keywords];
  }

  // Remove 'none' if there are other allowed sources
  if (unique.includes("'none'") && unique.length > 1) {
    unique = unique.filter(s => s !== "'none'");
  }

  // Optimize redundant schemes (e.g., if we have https: and https://example.com, keep only https:)
  const hasHttpsWildcard = unique.includes('https:');
  const hasHttpWildcard = unique.includes('http:');

  unique = unique.filter(s => {
    if (s.startsWith('https://') && hasHttpsWildcard) return false;
    if (s.startsWith('http://') && hasHttpWildcard) return false;
    return true;
  });

  // Optimize redundant subdomains (e.g. *.example.com redundantizes sub.example.com but NOT example.com)
  const hosts = unique.map(s => ({ src: s, host: getHostFromSource(s) }));
  const wildcardHosts = hosts.filter(h => h.host && h.host.startsWith('*.'));

  unique = unique.filter(s => {
    const host = getHostFromSource(s);
    if (!host) return true;
    if (host.startsWith('*.')) return true; // Keep wildcard hosts themselves
    // If it's a subdomain of an existing wildcard host, filter it out
    if (wildcardHosts.some(wh => isSubdomain(wh.host, host))) {
      return false;
    }
    return true;
  });

  return unique;
}

/**
 * Merges two CSP strings or directive objects into one single policy representation.
 * @param {string|Object} csp1 
 * @param {string|Object} csp2 
 * @returns {Object} Object with { mergedObj, logs }
 */
export function mergeCsps(csp1, csp2) {
  const obj1 = typeof csp1 === 'string' ? parseCsp(csp1) : { ...csp1 };
  const obj2 = typeof csp2 === 'string' ? parseCsp(csp2) : { ...csp2 };

  const logs = [];
  const mergedObj = {};

  // Get union of all directives mentioned anywhere
  const allDirectives = Array.from(new Set([...Object.keys(obj1), ...Object.keys(obj2)]));

  // We must always resolve default-src if defined in either policy
  const hasDefaultSrc1 = 'default-src' in obj1;
  const hasDefaultSrc2 = 'default-src' in obj2;

  // 1. Resolve default-src first
  const def1 = obj1['default-src'] || ['*'];
  const def2 = obj2['default-src'] || ['*'];
  const mergedDefault = optimizeSources([...def1, ...def2]);
  mergedObj['default-src'] = mergedDefault;
  logs.push(`Merged default-src to: [${mergedDefault.join(' ') || 'none'}]`);

  // 2. Resolve all other directives
  allDirectives.forEach(directive => {
    if (directive === 'default-src') return;

    const fallsBack = FALLBACK_DIRECTIVES.includes(directive);

    // Resolve sources for policy 1
    let val1;
    if (directive in obj1) {
      val1 = obj1[directive];
    } else if (fallsBack && hasDefaultSrc1) {
      val1 = obj1['default-src'];
      logs.push(`Directive ${directive} missing in CSP 1; inherited default-src values: [${val1.join(' ')}]`);
    } else {
      val1 = ['*']; // Unrestricted
    }

    // Resolve sources for policy 2
    let val2;
    if (directive in obj2) {
      val2 = obj2[directive];
    } else if (fallsBack && hasDefaultSrc2) {
      val2 = obj2['default-src'];
      logs.push(`Directive ${directive} missing in CSP 2; inherited default-src values: [${val2.join(' ')}]`);
    } else {
      val2 = ['*']; // Unrestricted
    }

    // Merged sources for this directive is the union
    const mergedVal = optimizeSources([...val1, ...val2]);
    mergedObj[directive] = mergedVal;
  });

  // 3. Optimize the output: if any fallback directive has the EXACT same values as default-src,
  // we can omit it from the final dictionary since the browser will fall back to default-src.
  const optimizedObj = { 'default-src': mergedObj['default-src'] };

  Object.entries(mergedObj).forEach(([directive, values]) => {
    if (directive === 'default-src') return;

    const fallsBack = FALLBACK_DIRECTIVES.includes(directive);
    const sameAsDefault = fallsBack && 
      JSON.stringify(values.sort()) === JSON.stringify(mergedObj['default-src'].sort());

    if (sameAsDefault) {
      logs.push(`Omitted redundant ${directive} since it matches default-src fallback`);
    } else {
      optimizedObj[directive] = values;
    }
  });

  return { mergedObj: optimizedObj, logs };
}

/**
 * Audits a Content Security Policy for security weaknesses.
 * @param {Object} cspObj 
 * @returns {Object} { grade, warnings }
 */
export function auditCsp(cspObj) {
  const warnings = [];
  let score = 100; // 0-100 score to map to A, B, C grades

  const defaultSrc = cspObj['default-src'] || [];
  const hasDefaultSrc = 'default-src' in cspObj;

  // Helper to check unsafe configs
  const checkUnsafe = (directiveName, sources, descName) => {
    if (sources.includes("'unsafe-inline'")) {
      score -= 35;
      warnings.push({
        severity: 'critical',
        directive: directiveName,
        message: `${descName} allows 'unsafe-inline'. This bypasses protection against Inline Script/Style execution, enabling basic Cross-Site Scripting (XSS) attacks.`
      });
    }
    if (sources.includes("'unsafe-eval'")) {
      score -= 15;
      warnings.push({
        severity: 'warning',
        directive: directiveName,
        message: `${descName} allows 'unsafe-eval'. This allows running code from strings (e.g. eval()), increasing the risk of code execution exploits.`
      });
    }
    if (sources.includes('*') || sources.includes('http:') || sources.includes('https:')) {
      score -= 30;
      warnings.push({
        severity: 'critical',
        directive: directiveName,
        message: `${descName} allows wildcards (*, http:, or https:). This means scripts or resources can be loaded from any external server.`
      });
    }
  };

  // 1. Check default-src
  if (!hasDefaultSrc) {
    score -= 20;
    warnings.push({
      severity: 'warning',
      directive: 'default-src',
      message: "Policy does not define a 'default-src' directive. Unmatched directives will fall back to unrestricted (allowing any source)."
    });
  } else {
    checkUnsafe('default-src', defaultSrc, 'default-src');
  }

  // 2. Check script-src
  if ('script-src' in cspObj) {
    checkUnsafe('script-src', cspObj['script-src'], 'script-src');
  } else if (hasDefaultSrc) {
    // Falls back to default-src, check if that was unsafe
    if (defaultSrc.includes("'unsafe-inline'") || defaultSrc.includes('*')) {
      warnings.push({
        severity: 'warning',
        directive: 'script-src',
        message: "script-src falls back to default-src which contains insecure configurations."
      });
    }
  }

  // 3. Check object-src
  const objectSrc = cspObj['object-src'] || (hasDefaultSrc ? defaultSrc : ['*']);
  if (!objectSrc.includes("'none'")) {
    score -= 15;
    warnings.push({
      severity: 'warning',
      directive: 'object-src',
      message: "object-src is not set to 'none'. Flash/ActiveX plugins can execute scripts and bypass XSS protections."
    });
  }

  // 4. Check base-uri
  if (!('base-uri' in cspObj)) {
    score -= 10;
    warnings.push({
      severity: 'info',
      directive: 'base-uri',
      message: "base-uri is missing. Attacker can inject <base> tags to redirect relative script/resource URLs to malicious domains."
    });
  }

  // 5. Check frame-ancestors
  if (!('frame-ancestors' in cspObj)) {
    score -= 10;
    warnings.push({
      severity: 'info',
      directive: 'frame-ancestors',
      message: "frame-ancestors is missing. The site can be embedded in arbitrary iframes, making it vulnerable to clickjacking."
    });
  }

  // Determine Grade
  let grade = 'A';
  if (score < 50 || warnings.some(w => w.severity === 'critical')) {
    grade = 'Weak';
  } else if (score < 80 || warnings.some(w => w.severity === 'warning')) {
    grade = 'Moderate';
  } else {
    grade = 'Strong';
  }

  return { grade, warnings };
}

// Preset library
const PRESETS = {
  'google-fonts': {
    name: 'Google Fonts',
    directives: {
      'style-src': ['https://fonts.googleapis.com'],
      'font-src': ['https://fonts.gstatic.com']
    }
  },
  'google-analytics': {
    name: 'Google Analytics (GA4)',
    directives: {
      'script-src': ['https://www.googletagmanager.com'],
      'connect-src': ['https://www.google-analytics.com', 'https://region1.google-analytics.com']
    }
  },
  'youtube': {
    name: 'YouTube Embeds',
    directives: {
      'frame-src': ['https://www.youtube.com', 'https://www.youtube-nocookie.com'],
      'img-src': ['https://s.ytimg.com']
    }
  },
  'stripe': {
    name: 'Stripe Payments',
    directives: {
      'script-src': ['https://js.stripe.com'],
      'frame-src': ['https://js.stripe.com', 'https://hooks.stripe.com'],
      'connect-src': ['https://api.stripe.com']
    }
  },
  'gtm': {
    name: 'Google Tag Manager',
    directives: {
      'script-src': ['https://www.googletagmanager.com', "'unsafe-inline'"]
    }
  }
};

export default {
  id: 'csp-build-combine-verify',

  render(container) {
    container.innerHTML = `
      <div class="csp-container">
        <div class="csp-tabs">
          <button class="csp-tab-btn active" id="btnCspTabBuild">Build Policy</button>
          <button class="csp-tab-btn" id="btnCspTabMerge">Combine Policies</button>
          <button class="csp-tab-btn" id="btnCspTabVerify">Verify Policy</button>
        </div>

        <!-- Tab 1: Build Panel -->
        <div id="cspBuildPanel" class="csp-tab-panel active">
          <div class="csp-layout-grid">
            <!-- Left: Configurator Form -->
            <div class="card-premium">
              <h3 style="margin-bottom:16px;">CSP Configurator</h3>
              <div class="csp-form">
                
                <!-- default-src -->
                <div class="csp-form-group">
                  <label class="csp-form-label">default-src (Fallback rule)</label>
                  <input type="text" id="build-default-src" class="input-premium" placeholder="e.g. 'self'">
                  <div class="csp-checkbox-group">
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-default-src" value="'self'"> 'self'</label>
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-default-src" value="'none'"> 'none'</label>
                  </div>
                </div>

                <!-- script-src -->
                <div class="csp-form-group">
                  <label class="csp-form-label">script-src (Javascript sources)</label>
                  <input type="text" id="build-script-src" class="input-premium" placeholder="e.g. 'self' https://trusted.com">
                  <div class="csp-checkbox-group">
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-script-src" value="'self'"> 'self'</label>
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-script-src" value="'unsafe-inline'"> 'unsafe-inline'</label>
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-script-src" value="'unsafe-eval'"> 'unsafe-eval'</label>
                  </div>
                </div>

                <!-- style-src -->
                <div class="csp-form-group">
                  <label class="csp-form-label">style-src (CSS stylesheets)</label>
                  <input type="text" id="build-style-src" class="input-premium" placeholder="e.g. 'self'">
                  <div class="csp-checkbox-group">
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-style-src" value="'self'"> 'self'</label>
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-style-src" value="'unsafe-inline'"> 'unsafe-inline'</label>
                  </div>
                </div>

                <!-- img-src -->
                <div class="csp-form-group">
                  <label class="csp-form-label">img-src (Image sources)</label>
                  <input type="text" id="build-img-src" class="input-premium" placeholder="e.g. 'self' data:">
                  <div class="csp-checkbox-group">
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-img-src" value="'self'"> 'self'</label>
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-img-src" value="data:"> data:</label>
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-img-src" value="https:"> https:</label>
                  </div>
                </div>

                <!-- connect-src -->
                <div class="csp-form-group">
                  <label class="csp-form-label">connect-src (APIs, WebSockets, fetch)</label>
                  <input type="text" id="build-connect-src" class="input-premium" placeholder="e.g. 'self'">
                  <div class="csp-checkbox-group">
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-connect-src" value="'self'"> 'self'</label>
                  </div>
                </div>

                <!-- object-src -->
                <div class="csp-form-group">
                  <label class="csp-form-label">object-src (Plugins like Flash/Java)</label>
                  <input type="text" id="build-object-src" class="input-premium" placeholder="e.g. 'none'">
                  <div class="csp-checkbox-group">
                    <label class="csp-checkbox-label"><input type="checkbox" class="csp-kw-check" data-target="build-object-src" value="'none'"> 'none'</label>
                  </div>
                </div>

                <!-- Presets selection -->
                <div class="csp-presets-section">
                  <div class="csp-presets-title">Quick-Add Service Presets</div>
                  <div class="csp-presets-grid" id="cspBuildPresets">
                    <button class="csp-preset-btn" data-preset="google-fonts">Google Fonts</button>
                    <button class="csp-preset-btn" data-preset="google-analytics">Google Analytics</button>
                    <button class="csp-preset-btn" data-preset="youtube">YouTube Embeds</button>
                    <button class="csp-preset-btn" data-preset="stripe">Stripe Payments</button>
                    <button class="csp-preset-btn" data-preset="gtm">GTM</button>
                  </div>
                </div>

                <div style="margin-top:12px;">
                  <button class="btn-secondary" id="clearBuildFieldsBtn">Reset Configurator</button>
                </div>
              </div>
            </div>

            <!-- Right: Real-time Output & Format options -->
            <div class="csp-output-card">
              <h3 style="margin-bottom:4px;">Generated Policy</h3>
              <p class="tool-desc">Updates in real-time as you tweak the directives.</p>

              <div style="display:flex; gap:16px; margin: 8px 0;">
                <label class="csp-checkbox-label">
                  <input type="radio" name="cspOutputFormat" value="header" checked> HTTP Header
                </label>
                <label class="csp-checkbox-label">
                  <input type="radio" name="cspOutputFormat" value="meta"> HTML Meta Tag
                </label>
              </div>

              <div class="csp-display" id="cspBuildOutput">default-src 'self';</div>

              <div class="csp-input-group">
                <button class="btn-primary" style="width:100%; justify-content:center;" id="copyCspBuildBtn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copy Policy
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Combine Panel -->
        <div id="cspMergePanel" class="csp-tab-panel">
          <div class="card-premium">
            <h3 style="margin-bottom:8px;">Combine CSP Policies</h3>
            <p class="tool-desc" style="margin-bottom:20px;">Combine two independent Content Security Policies into a single consolidated policy. The engine resolves browser fallbacks and deduplicates directives.</p>

            <div class="csp-merge-grid">
              <div class="csp-form-group">
                <label class="csp-form-label">Policy 1 (Header or Meta Tag)</label>
                <textarea id="cspMergeInput1" class="input-premium csp-merge-textarea" placeholder="e.g. default-src 'self'; script-src 'self' 'unsafe-inline';"></textarea>
              </div>
              <div class="csp-form-group">
                <label class="csp-form-label">Policy 2 (Header or Meta Tag)</label>
                <textarea id="cspMergeInput2" class="input-premium csp-merge-textarea" placeholder="e.g. default-src 'self'; connect-src https://api.stripe.com;"></textarea>
              </div>
            </div>

            <div class="csp-merge-actions">
              <button class="btn-primary" id="btnMergeCsps">Combine Policies</button>
            </div>

            <!-- Merge Outputs -->
            <div id="cspMergeOutputSection" style="display:none; flex-direction:column; gap:16px; margin-top:20px;">
              <hr style="border:none; border-top:1px solid var(--border-color); margin: 10px 0;">
              
              <div class="csp-layout-grid">
                <!-- Left Column: Resulted policy and Copy button -->
                <div style="display:flex; flex-direction:column; gap:10px;">
                  <label class="csp-form-label">Combined Content Security Policy</label>
                  <textarea id="cspMergeOutputStr" class="input-premium csp-merge-textarea" readonly style="min-height:140px;"></textarea>
                  <button class="btn-primary" id="btnCopyMergedCsp" style="width:fit-content;">Copy Combined CSP</button>
                </div>

                <!-- Right Column: Optimizations log -->
                <div class="csp-merge-breakdown">
                  <div class="csp-merge-log-title">Merge Optimization Log</div>
                  <ul class="csp-merge-log-list" id="cspMergeLogList">
                    <!-- Javascript dynamic items -->
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Verify Panel -->
        <div id="cspVerifyPanel" class="csp-tab-panel">
          <div class="card-premium">
            <h3 style="margin-bottom:8px;">Verify Policy</h3>
            <p class="tool-desc" style="margin-bottom:20px;">Paste a policy string, meta tag, or analyze a website URL to fetch its live headers directly.</p>

            <div class="csp-form-group" style="margin-bottom:20px;">
              <label class="csp-form-label">Enter CSP string, &lt;meta&gt; tag, or Website URL</label>
              <div class="csp-input-group">
                <input type="text" id="cspVerifyInput" class="input-premium" placeholder="e.g. default-src 'self' or https://example.com">
                <button class="btn-primary" id="btnRunCspVerify">Analyze</button>
              </div>
              <div id="cspVerifyError" style="display:none; color:var(--danger); font-size:0.75rem; margin-top:2px;"></div>
            </div>

            <!-- Analysis results target -->
            <div id="cspVerifyResultsSection" class="csp-verify-results" style="display:none;">
              
              <!-- Extracted CSP Textbox (Only displayed if fetched from URL) -->
              <div id="cspExtractedContainer" class="csp-form-group" style="display:none; margin-bottom:12px;">
                <label class="csp-form-label">Extracted Content Security Policy</label>
                <div class="csp-input-group">
                  <textarea id="cspExtractedOutput" class="input-premium csp-merge-textarea" readonly style="min-height:80px; flex:1;"></textarea>
                  <button class="btn-primary" id="btnCopyExtractedCsp">Copy</button>
                </div>
              </div>

              <!-- Grade Box -->
              <div class="csp-grade-container">
                <div class="csp-grade-badge grade-strong" id="cspGradeBadge">A</div>
                <div class="csp-grade-info">
                  <span class="csp-grade-title" id="cspGradeTitle">Strong Policy</span>
                  <span class="csp-grade-desc" id="cspGradeDesc">The policy does not expose major vulnerabilities.</span>
                </div>
              </div>

              <!-- Breakdown and warnings grid -->
              <div class="csp-layout-grid">
                <!-- Directives Breakdown -->
                <div class="csp-table-container">
                  <table class="csp-table">
                    <thead>
                      <tr>
                        <th>Directive</th>
                        <th>Allowed Sources</th>
                      </tr>
                    </thead>
                    <tbody id="cspVerifyDirectivesTable">
                      <!-- Dynamic rows -->
                    </tbody>
                  </table>
                </div>

                <!-- Audit Checklist -->
                <div style="display:flex; flex-direction:column; gap:16px;">
                  <h4 style="margin:0;">Security Checklist &amp; Recommendations</h4>
                  <div class="csp-audit-warnings" id="cspAuditWarningsContainer">
                    <!-- Dynamic Warnings -->
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    `;

    this.initTabSwitcher();
    this.initBuilder();
    this.initMerger();
    this.initVerifier();
  },

  initTabSwitcher() {
    const tabs = [
      { btn: 'btnCspTabBuild', panel: 'cspBuildPanel' },
      { btn: 'btnCspTabMerge', panel: 'cspMergePanel' },
      { btn: 'btnCspTabVerify', panel: 'cspVerifyPanel' }
    ];

    tabs.forEach(tab => {
      const btn = document.getElementById(tab.btn);
      if (btn) {
        btn.addEventListener('click', () => {
          // Deactivate all
          tabs.forEach(t => {
            document.getElementById(t.btn).classList.remove('active');
            document.getElementById(t.panel).classList.remove('active');
          });
          // Activate clicked
          btn.classList.add('active');
          document.getElementById(tab.panel).classList.add('active');
        });
      }
    });
  },

  initBuilder() {
    const inputs = [
      'build-default-src',
      'build-script-src',
      'build-style-src',
      'build-img-src',
      'build-connect-src',
      'build-object-src'
    ];

    const getFormState = () => {
      const state = {};
      inputs.forEach(id => {
        const key = id.replace('build-', '');
        const val = document.getElementById(id).value.trim();
        if (val) {
          state[key] = val.split(/\s+/).filter(Boolean);
        }
      });
      return state;
    };

    const updateOutput = () => {
      const state = getFormState();
      const serialized = serializeCsp(state);
      const outputFormat = document.querySelector('input[name="cspOutputFormat"]:checked').value;
      const displayEl = document.getElementById('cspBuildOutput');

      if (!serialized) {
        displayEl.textContent = 'default-src *;';
        return;
      }

      if (outputFormat === 'meta') {
        displayEl.textContent = `<meta http-equiv="Content-Security-Policy" content="${serialized}">`;
      } else {
        displayEl.textContent = serialized;
      }
    };

    // Listen to text input changes
    inputs.forEach(id => {
      const input = document.getElementById(id);
      input.addEventListener('input', () => {
        // Sync checkboxes
        const currentVals = input.value.split(/\s+/);
        const checks = document.querySelectorAll(`input.csp-kw-check[data-target="${id}"]`);
        checks.forEach(check => {
          check.checked = currentVals.includes(check.value);
        });
        updateOutput();
      });
    });

    // Listen to checkboxes
    const checkboxes = document.querySelectorAll('input.csp-kw-check');
    checkboxes.forEach(check => {
      check.addEventListener('change', () => {
        const targetId = check.getAttribute('data-target');
        const input = document.getElementById(targetId);
        let vals = input.value.split(/\s+/).filter(Boolean);

        if (check.checked) {
          if (!vals.includes(check.value)) {
            vals.push(check.value);
          }
        } else {
          vals = vals.filter(v => v !== check.value);
        }

        input.value = vals.join(' ');
        updateOutput();
      });
    });

    // Listen to format toggles
    document.getElementsByName('cspOutputFormat').forEach(radio => {
      radio.addEventListener('change', updateOutput);
    });

    // Listen to presets
    const activePresets = new Set();
    const presetButtons = document.querySelectorAll('#cspBuildPresets .csp-preset-btn');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        const preset = PRESETS[presetKey];
        if (!preset) return;

        if (activePresets.has(presetKey)) {
          // Deactivate preset
          activePresets.delete(presetKey);
          btn.classList.remove('active');
          
          // Remove values from input fields
          Object.entries(preset.directives).forEach(([dir, sources]) => {
            const inputId = `build-${dir}`;
            const input = document.getElementById(inputId);
            if (input) {
              let vals = input.value.split(/\s+/).filter(Boolean);
              vals = vals.filter(v => !sources.includes(v));
              input.value = vals.join(' ');
              // trigger inputs sync
              input.dispatchEvent(new Event('input'));
            }
          });
        } else {
          // Activate preset
          activePresets.add(presetKey);
          btn.classList.add('active');

          // Add values to input fields
          Object.entries(preset.directives).forEach(([dir, sources]) => {
            const inputId = `build-${dir}`;
            const input = document.getElementById(inputId);
            if (input) {
              let vals = input.value.split(/\s+/).filter(Boolean);
              sources.forEach(src => {
                if (!vals.includes(src)) {
                  vals.push(src);
                }
              });
              input.value = vals.join(' ');
              // trigger inputs sync
              input.dispatchEvent(new Event('input'));
            }
          });
        }
      });
    });

    // Clear Button
    document.getElementById('clearBuildFieldsBtn').addEventListener('click', () => {
      inputs.forEach(id => {
        document.getElementById(id).value = '';
      });
      checkboxes.forEach(c => c.checked = false);
      presetButtons.forEach(b => b.classList.remove('active'));
      activePresets.clear();
      updateOutput();
    });

    // Copy Button
    const copyBtn = document.getElementById('copyCspBuildBtn');
    copyBtn.addEventListener('click', () => {
      const outputText = document.getElementById('cspBuildOutput').textContent;
      navigator.clipboard.writeText(outputText).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Copied!
        `;
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.classList.remove('copied');
        }, 1500);
      });
    });
  },

  initMerger() {
    const btnMerge = document.getElementById('btnMergeCsps');
    const input1 = document.getElementById('cspMergeInput1');
    const input2 = document.getElementById('cspMergeInput2');
    const outputSection = document.getElementById('cspMergeOutputSection');
    const outputInput = document.getElementById('cspMergeOutputStr');
    const logList = document.getElementById('cspMergeLogList');

    btnMerge.addEventListener('click', () => {
      const val1 = input1.value.trim();
      const val2 = input2.value.trim();

      if (!val1 && !val2) {
        return;
      }

      const { mergedObj, logs } = mergeCsps(val1 || 'default-src *;', val2 || 'default-src *;');
      const serialized = serializeCsp(mergedObj);

      outputInput.value = serialized;
      logList.innerHTML = '';

      logs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'csp-merge-log-item';
        li.innerHTML = `
          <svg class="csp-merge-log-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>${escapeHtml(log)}</span>
        `;
        logList.appendChild(li);
      });

      outputSection.style.display = 'flex';
    });

    const copyBtn = document.getElementById('btnCopyMergedCsp');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(outputInput.value).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.classList.remove('copied');
        }, 1500);
      });
    });
  },

  initVerifier() {
    const btnVerify = document.getElementById('btnRunCspVerify');
    const inputVerify = document.getElementById('cspVerifyInput');
    const errorEl = document.getElementById('cspVerifyError');
    const resultsSection = document.getElementById('cspVerifyResultsSection');
    const extractedContainer = document.getElementById('cspExtractedContainer');
    const extractedOutput = document.getElementById('cspExtractedOutput');
    const btnCopyExtracted = document.getElementById('btnCopyExtractedCsp');

    if (btnCopyExtracted) {
      btnCopyExtracted.addEventListener('click', () => {
        navigator.clipboard.writeText(extractedOutput.value).then(() => {
          const originalText = btnCopyExtracted.textContent;
          btnCopyExtracted.textContent = 'Copied!';
          btnCopyExtracted.classList.add('copied');
          setTimeout(() => {
            btnCopyExtracted.textContent = originalText;
            btnCopyExtracted.classList.remove('copied');
          }, 1500);
        });
      });
    }

    btnVerify.addEventListener('click', async () => {
      const val = inputVerify.value.trim();
      errorEl.style.display = 'none';
      resultsSection.style.display = 'none';
      if (extractedContainer) extractedContainer.style.display = 'none';

      if (!val) return;

      // Check if it's a website URL
      const isUrl = /^https?:\/\//i.test(val) || (/^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test(val));

      let cspStringToAudit = val;

      if (isUrl) {
        // Standardize URL
        let urlToCheck = val;
        if (!/^https?:\/\//i.test(urlToCheck)) {
          urlToCheck = 'https://' + urlToCheck;
        }

        btnVerify.setAttribute('disabled', 'true');
        btnVerify.textContent = 'Fetching headers...';

        try {
          const response = await fetch('/api/check-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlToCheck, followRedirects: true })
          });

          if (!response.ok) {
            throw new Error(`Failed to check remote site: HTTP ${response.status}`);
          }

          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }

          // Get headers of the final redirect destination
          const finalHop = data.chain[data.chain.length - 1];
          const headers = finalHop.headers || {};
          const cspHeader = headers['content-security-policy'] || headers['content-security-policy-report-only'];

          if (!cspHeader) {
            throw new Error(`No Content Security Policy (CSP) header found on ${urlToCheck}`);
          }

          cspStringToAudit = cspHeader;

          // Display extracted CSP
          if (extractedContainer && extractedOutput) {
            extractedOutput.value = cspHeader;
            extractedContainer.style.display = 'block';
          }
        } catch (err) {
          errorEl.textContent = err.message;
          errorEl.style.display = 'block';
          btnVerify.removeAttribute('disabled');
          btnVerify.textContent = 'Analyze';
          return;
        } finally {
          btnVerify.removeAttribute('disabled');
          btnVerify.textContent = 'Analyze';
        }
      } else {
        if (extractedContainer) extractedContainer.style.display = 'none';
      }

      // Parse, Audit & Display
      const cspObj = parseCsp(cspStringToAudit);
      const { grade, warnings } = auditCsp(cspObj);

      // 1. Grade display
      const badge = document.getElementById('cspGradeBadge');
      const title = document.getElementById('cspGradeTitle');
      const desc = document.getElementById('cspGradeDesc');

      badge.className = 'csp-grade-badge'; // reset
      badge.textContent = grade === 'Strong' ? 'A' : (grade === 'Moderate' ? 'B' : 'F');

      if (grade === 'Strong') {
        badge.classList.add('grade-strong');
        title.textContent = 'Strong Policy';
        desc.textContent = 'The policy restricts execution of arbitrary inline scripts and locks down external host permissions.';
      } else if (grade === 'Moderate') {
        badge.classList.add('grade-moderate');
        title.textContent = 'Moderate Policy';
        desc.textContent = 'Some safety improvements can be made, but no immediate critical compromises detected.';
      } else {
        badge.classList.add('grade-weak');
        title.textContent = 'Weak Policy';
        desc.textContent = 'Critical vulnerabilities found. Insecure scripts, style rules, or wildcards detected.';
      }

      // 2. Directives Table
      const tableBody = document.getElementById('cspVerifyDirectivesTable');
      tableBody.innerHTML = '';

      if (Object.keys(cspObj).length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--text-muted);">Empty CSP policy parsed.</td></tr>';
      } else {
        Object.entries(cspObj).forEach(([directive, sources]) => {
          const tr = document.createElement('tr');
          const tdName = document.createElement('td');
          tdName.className = 'csp-directive-name';
          tdName.textContent = directive;

          const tdVal = document.createElement('td');
          tdVal.className = 'csp-directive-values';

          sources.forEach(src => {
            const badgeItem = document.createElement('span');
            badgeItem.className = 'csp-badge-item';
            badgeItem.textContent = src;

            if (src.startsWith("'")) {
              badgeItem.classList.add('csp-keyword');
              if (src === "'unsafe-inline'" || src === "'unsafe-eval'") {
                badgeItem.classList.add('csp-unsafe');
              } else if (src === "'none'" || src === "'strict-dynamic'") {
                badgeItem.classList.add('csp-safe');
              }
            } else if (src === '*' || src === 'http:' || src === 'https:') {
              badgeItem.classList.add('csp-unsafe');
            }

            tdVal.appendChild(badgeItem);
          });

          tr.appendChild(tdName);
          tr.appendChild(tdVal);
          tableBody.appendChild(tr);
        });
      }

      // 3. Warnings checklist
      const warningsContainer = document.getElementById('cspAuditWarningsContainer');
      warningsContainer.innerHTML = '';

      if (warnings.length === 0) {
        warningsContainer.innerHTML = `
          <div class="csp-audit-warning-item severity-info">
            <svg class="csp-audit-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success);"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <div>All core security checklist audits passed! Outstanding setup.</div>
          </div>
        `;
      } else {
        warnings.forEach(w => {
          const item = document.createElement('div');
          item.className = `csp-audit-warning-item severity-${w.severity}`;
          
          let icon = '';
          if (w.severity === 'critical') {
            icon = `<svg class="csp-audit-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
          } else if (w.severity === 'warning') {
            icon = `<svg class="csp-audit-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
          } else {
            icon = `<svg class="csp-audit-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
          }

          item.innerHTML = `
            ${icon}
            <div>
              <strong style="text-transform:uppercase;">${w.directive}</strong>: ${escapeHtml(w.message)}
            </div>
          `;
          warningsContainer.appendChild(item);
        });
      }

      resultsSection.style.display = 'flex';
    });
  }
};
