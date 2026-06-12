import { describe, test, expect } from 'vitest';
import {
  classifyStatusCode,
  parseHeaders,
  formatResultRow,
} from '../bulk-status.js';

describe('Bulk HTTP Status Utilities', () => {
  test('classifyStatusCode classifies status codes into categories', () => {
    expect(classifyStatusCode(200)).toBe('success');
    expect(classifyStatusCode(201)).toBe('success');
    expect(classifyStatusCode(301)).toBe('redirect');
    expect(classifyStatusCode(307)).toBe('redirect');
    expect(classifyStatusCode(400)).toBe('clientErr');
    expect(classifyStatusCode(404)).toBe('clientErr');
    expect(classifyStatusCode(500)).toBe('serverErr');
    expect(classifyStatusCode(503)).toBe('serverErr');
    expect(classifyStatusCode(0)).toBe('failed');
    expect(classifyStatusCode(null)).toBe('failed');
  });

  test('parseHeaders normalizes header objects and parses raw headers strings', () => {
    // Input is object
    const rawObj = {
      'Content-Type': 'application/json',
      Location: 'https://example.com',
    };
    const parsedObj = parseHeaders(rawObj);
    expect(parsedObj['content-type']).toBe('application/json');
    expect(parsedObj['location']).toBe('https://example.com');

    // Input is string
    const rawStr =
      'Content-Length: 512\r\nCache-Control: no-store\r\nServer: nginx';
    const parsedStr = parseHeaders(rawStr);
    expect(parsedStr['content-length']).toBe('512');
    expect(parsedStr['cache-control']).toBe('no-store');
    expect(parsedStr['server']).toBe('nginx');

    // Empty cases
    expect(parseHeaders(null)).toEqual({});
    expect(parseHeaders(undefined)).toEqual({});
  });

  test('formatResultRow produces the correct HTML structure for bulk results table', () => {
    const mockData = {
      url: 'https://original.com',
      redirected: true,
      chain: [
        {
          url: 'https://original.com',
          status: 301,
          statusText: 'Moved Permanently',
          responseTime: 120,
          headers: { location: 'https://final.com' },
        },
        {
          url: 'https://final.com',
          status: 200,
          statusText: 'OK',
          responseTime: 180,
          headers: { 'content-length': '2048' },
        },
      ],
    };

    const html = formatResultRow(0, mockData);

    // Verify row index
    expect(html).toContain('1');

    // Verify original and redirect target URL presence
    expect(html).toContain('original.com');
    expect(html).toContain('final.com');

    // Verify status label and category class
    expect(html).toContain('200 OK');
    expect(html).toContain('badge-2xx');

    // Verify total response time sum (120 + 180 = 300)
    expect(html).toContain('300ms');

    // Verify size formatting
    expect(html).toContain('2 KB');
  });
});
