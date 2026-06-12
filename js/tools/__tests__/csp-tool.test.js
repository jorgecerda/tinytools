import { describe, test, expect } from 'vitest';
import {
  parseCsp,
  serializeCsp,
  mergeCsps,
  auditCsp
} from '../csp-tool.js';

describe('CSP Build, Merge & Verify Utilities', () => {
  
  describe('parseCsp', () => {
    test('parses a standard CSP string into key-value directives', () => {
      const csp = "default-src 'self' example.com; script-src 'self' 'unsafe-inline' https://cdn.js;";
      const parsed = parseCsp(csp);

      expect(parsed['default-src']).toEqual(["'self'", "example.com"]);
      expect(parsed['script-src']).toEqual(["'self'", "'unsafe-inline'", "https://cdn.js"]);
    });

    test('extracts CSP from an HTML meta tag', () => {
      const metaCsp = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; object-src \'none\';">';
      const parsed = parseCsp(metaCsp);

      expect(parsed['default-src']).toEqual(["'self'"]);
      expect(parsed['object-src']).toEqual(["'none'"]);
    });

    test('handles whitespace, newlines, and trailing semicolons cleanly', () => {
      const messyCsp = `
        default-src
          'self';
        img-src *   data:;
      `;
      const parsed = parseCsp(messyCsp);

      expect(parsed['default-src']).toEqual(["'self'"]);
      expect(parsed['img-src']).toEqual(["*", "data:"]);
    });

    test('returns empty object for invalid inputs', () => {
      expect(parseCsp(null)).toEqual({});
      expect(parseCsp('')).toEqual({});
    });
  });

  describe('serializeCsp', () => {
    test('converts key-value directives back to a standard string', () => {
      const obj = {
        'default-src': ["'self'"],
        'object-src': ["'none'"]
      };
      expect(serializeCsp(obj)).toBe("default-src 'self'; object-src 'none';");
    });

    test('returns empty string on empty inputs', () => {
      expect(serializeCsp(null)).toBe('');
      expect(serializeCsp({})).toBe('');
    });
  });

  describe('mergeCsps', () => {
    test('unions directive sources of two distinct CSPs', () => {
      const csp1 = "default-src 'self'; script-src 'self' https://trusted.com;";
      const csp2 = "default-src 'self'; connect-src https://api.stripe.com;";

      const { mergedObj } = mergeCsps(csp1, csp2);

      // script-src should be union of ['self', 'trusted.com'] and ['self'] (since default-src resolves to 'self' in CSP 2)
      expect(mergedObj['script-src']).toEqual(["'self'", "https://trusted.com"]);
      // connect-src should be union of ['self'] (fallback to default-src in CSP 1) and ['https://api.stripe.com']
      expect(mergedObj['connect-src']).toEqual(["'self'", "https://api.stripe.com"]);
      expect(mergedObj['default-src']).toEqual(["'self'"]);
    });

    test('resolves default-src fallback correctly when directive is missing', () => {
      const csp1 = "default-src 'self';";
      const csp2 = "script-src https://example.com;";

      const { mergedObj } = mergeCsps(csp1, csp2);

      // CSP 2 has default-src implicitly as * (unrestricted)
      // So merged default-src should be *
      expect(mergedObj['default-src']).toEqual(['*']);
      // script-src in CSP 1 falls back to 'self'; in CSP 2 it is https://example.com. Merged: 'self' and https://example.com
      expect(mergedObj['script-src']).toEqual(["'self'", "https://example.com"]);
    });

    test('deduplicates redundant wildcard subdomains and wildcard schemes', () => {
      const csp1 = "default-src 'self' https:; img-src https://example.com;";
      const csp2 = "default-src 'self' https://trusted.com; img-src *.example.com sub.example.com;";

      const { mergedObj } = mergeCsps(csp1, csp2);

      // default-src: union of ['self', 'https:'] and ['self', 'trusted.com']. Since https: is a wildcard, trusted.com is redundant
      expect(mergedObj['default-src']).toEqual(["'self'", "https:"]);
      // img-src: union of ['https://example.com'] and ['*.example.com', 'sub.example.com'].
      // sub.example.com is covered by *.example.com. https://example.com is covered by https: wildcard from default-src?
      // Wait, let's look at what is in img-src.
      // img-src in CSP 1 explicitly has 'https://example.com'.
      // img-src in CSP 2 explicitly has ['*.example.com', 'sub.example.com'].
      // The union is ['https://example.com', '*.example.com']. sub.example.com is removed.
      expect(mergedObj['img-src']).toContain('*.example.com');
      expect(mergedObj['img-src']).toContain('https://example.com');
      expect(mergedObj['img-src']).not.toContain('sub.example.com');
    });

    test('removes none keyword if other sources are added', () => {
      const csp1 = "object-src 'none';";
      const csp2 = "object-src https://example.com;";

      const { mergedObj } = mergeCsps(csp1, csp2);
      expect(mergedObj['object-src']).toEqual(["https://example.com"]);
    });
  });

  describe('auditCsp', () => {
    test('grades a robust CSP as Strong', () => {
      const csp = {
        'default-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'frame-ancestors': ["'none'"]
      };

      const { grade, warnings } = auditCsp(csp);
      expect(grade).toBe('Strong');
      expect(warnings.length).toBe(0);
    });

    test('grades a CSP with unsafe-inline in script-src as Weak', () => {
      const csp = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'object-src': ["'none'"]
      };

      const { grade, warnings } = auditCsp(csp);
      expect(grade).toBe('Weak');
      expect(warnings.some(w => w.directive === 'script-src' && w.severity === 'critical')).toBe(true);
    });

    test('grades a CSP with missing default-src and missing object-src as Weak or Moderate', () => {
      const csp = {
        'script-src': ["'self'"]
      };

      const { warnings } = auditCsp(csp);
      expect(warnings.some(w => w.directive === 'default-src' && w.severity === 'warning')).toBe(true);
      expect(warnings.some(w => w.directive === 'object-src' && w.severity === 'warning')).toBe(true);
    });
  });

});
