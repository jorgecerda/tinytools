import { describe, test, expect } from 'vitest';
import { parseRedirectChain, buildSeoAnalysis } from '../redirect-checker.js';

describe('Redirect Checker Utilities', () => {
  test('parseRedirectChain extracts chain array from data response', () => {
    const mockData = {
      chain: [
        { url: 'http://example.com', status: 301 },
        { url: 'https://example.com', status: 200 },
      ],
    };

    expect(parseRedirectChain(mockData)).toEqual(mockData.chain);
    expect(parseRedirectChain(null)).toEqual([]);
    expect(parseRedirectChain({})).toEqual([]);
  });

  test('buildSeoAnalysis analyzes direct URLs correctly', () => {
    const directChain = [
      {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        responseTime: 80,
      },
    ];
    const analysis = buildSeoAnalysis(directChain);
    expect(analysis.alertClass).toBe('seo-alert-success');
    expect(analysis.icon).toBe('[SUCCESS]');
    expect(analysis.title).toContain('Perfect: No Redirects Found');
  });

  test('buildSeoAnalysis analyzes 1 redirect hop as optimal path', () => {
    const optimalChain = [
      {
        url: 'http://example.com',
        status: 301,
        statusText: 'Moved Permanently',
        responseTime: 100,
      },
      {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        responseTime: 80,
      },
    ];
    const analysis = buildSeoAnalysis(optimalChain);
    expect(analysis.alertClass).toBe('seo-alert-success');
    expect(analysis.icon).toBe('[OPTIMAL]');
  });

  test('buildSeoAnalysis flags 2 to 3 redirect hops as suboptimal', () => {
    const suboptimalChain = [
      { url: 'http://example.com', status: 301, responseTime: 50 },
      { url: 'https://example.com', status: 302, responseTime: 50 },
      { url: 'https://example.com/dest', status: 200, responseTime: 50 },
    ];
    const analysis = buildSeoAnalysis(suboptimalChain);
    expect(analysis.alertClass).toBe('seo-alert-warning');
    expect(analysis.icon).toBe('[WARNING]');
  });

  test('buildSeoAnalysis flags more than 3 redirects as critical issues', () => {
    const longChain = [
      { url: '1', status: 301, responseTime: 50 },
      { url: '2', status: 302, responseTime: 50 },
      { url: '3', status: 301, responseTime: 50 },
      { url: '4', status: 302, responseTime: 50 },
      { url: '5', status: 200, responseTime: 50 },
    ];
    const analysis = buildSeoAnalysis(longChain);
    expect(analysis.alertClass).toBe('seo-alert-danger');
    expect(analysis.icon).toBe('[CRITICAL]');
  });

  test('buildSeoAnalysis detects redirect loops', () => {
    const loopChain = [
      {
        url: 'http://example.com',
        status: 301,
        statusText: 'Redirect Loop Detected',
        responseTime: 50,
      },
    ];
    const analysis = buildSeoAnalysis(loopChain);
    expect(analysis.alertClass).toBe('seo-alert-danger');
    expect(analysis.icon).toBe('[LOOP]');
  });

  test('buildSeoAnalysis handles connection/resolution errors', () => {
    const errorChain = [
      {
        url: 'http://invalid-domain.xyz',
        error: true,
        statusText: 'getaddrinfo ENOTFOUND',
        responseTime: 150,
      },
    ];
    const analysis = buildSeoAnalysis(errorChain);
    expect(analysis.alertClass).toBe('seo-alert-danger');
    expect(analysis.icon).toBe('[ERROR]');
  });
});
