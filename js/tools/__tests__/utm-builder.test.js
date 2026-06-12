import { describe, test, expect } from 'vitest';
import {
  buildUtmUrl,
  parseUtmUrl,
  classifyGa4Channel,
  isValidUrl,
} from '../utm-builder.js';

describe('UTM Builder & Verify Utilities', () => {
  test('buildUtmUrl compiles clean query parameters onto the URL', () => {
    const params = {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'black_friday',
    };

    expect(buildUtmUrl('example.com', params)).toBe(
      'http://example.com/?utm_source=google&utm_medium=cpc&utm_campaign=black_friday',
    );
    expect(buildUtmUrl('https://example.com/shop/', params)).toBe(
      'https://example.com/shop/?utm_source=google&utm_medium=cpc&utm_campaign=black_friday',
    );
  });

  test('buildUtmUrl preserves pre-existing query parameters', () => {
    const params = { utm_source: 'fb' };
    expect(buildUtmUrl('https://example.com/?ref=friend', params)).toBe(
      'https://example.com/?ref=friend&utm_source=fb',
    );
  });

  test('parseUtmUrl extracts base URL and query parameters successfully', () => {
    const url =
      'https://example.com/landing?utm_source=newsletter&utm_medium=email&utm_campaign=june2026';
    const parsed = parseUtmUrl(url);

    expect(parsed.baseUrl).toBe('https://example.com/landing');
    expect(parsed.params.utm_source).toBe('newsletter');
    expect(parsed.params.utm_medium).toBe('email');
    expect(parsed.params.utm_campaign).toBe('june2026');
  });

  test('parseUtmUrl returns empty data on null or invalid urls', () => {
    expect(parseUtmUrl(null)).toEqual({ baseUrl: '', params: {} });
    expect(parseUtmUrl('')).toEqual({ baseUrl: '', params: {} });
  });

  test('classifyGa4Channel categorizes direct traffic', () => {
    expect(classifyGa4Channel('', '')).toBe('Direct');
    expect(classifyGa4Channel('direct', '(none)')).toBe('Direct');
    expect(classifyGa4Channel('(direct)', 'none')).toBe('Direct');
  });

  test('classifyGa4Channel categorizes email, affiliates, and referrals', () => {
    expect(classifyGa4Channel('newsletter', 'email')).toBe('Email');
    expect(classifyGa4Channel('mail', 'e-mail')).toBe('Email');
    expect(classifyGa4Channel('partner', 'affiliate')).toBe('Affiliates');
    expect(classifyGa4Channel('some-blog', 'referral')).toBe('Referral');
  });

  test('classifyGa4Channel categorizes search engine channels', () => {
    expect(classifyGa4Channel('google', 'organic')).toBe('Organic Search');
    expect(classifyGa4Channel('duckduckgo', 'search')).toBe('Organic Search');
    expect(classifyGa4Channel('bing', 'cpc')).toBe('Paid Search');
    expect(classifyGa4Channel('yahoo', 'ppc')).toBe('Paid Search');
  });

  test('classifyGa4Channel categorizes social media channels', () => {
    expect(classifyGa4Channel('facebook', 'social')).toBe('Organic Social');
    expect(classifyGa4Channel('twitter', 'sm')).toBe('Organic Social');
    expect(classifyGa4Channel('t.co', 'none')).toBe('Organic Social'); // Twitter shortener
    expect(classifyGa4Channel('instagram', 'cpc')).toBe('Paid Social');
    expect(classifyGa4Channel('linkedin', 'paidshare')).toBe('Paid Social');
  });

  test('classifyGa4Channel categorizes video channels', () => {
    expect(classifyGa4Channel('youtube', 'organic')).toBe('Organic Video');
    expect(classifyGa4Channel('tiktok', 'cpc')).toBe('Paid Video');
  });

  test('isValidUrl validates url formats correctly', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/landing?q=1')).toBe(true);
    expect(isValidUrl('example.com')).toBe(true);
    expect(isValidUrl('http://localhost')).toBe(true);
    expect(isValidUrl('http://localhost:8888/path')).toBe(true);

    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl(null)).toBe(false);
    expect(isValidUrl('hello')).toBe(false);
    expect(isValidUrl('http://hello')).toBe(false);
    expect(isValidUrl('ftp://example.com')).toBe(false); // only web protocols are valid
  });
});
