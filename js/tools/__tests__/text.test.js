import { describe, test, expect } from 'vitest';
import {
  charCount,
  wordCount,
  sentenceCount,
  readingTime,
  socialLimits,
} from '../text.js';

describe('Text Analyzer Utilities', () => {
  test('charCount counts characters including or excluding spaces', () => {
    expect(charCount('hello world')).toBe(11);
    expect(charCount('hello world', true)).toBe(10);
    expect(charCount('')).toBe(0);
    expect(charCount('   ', true)).toBe(0);
  });

  test('wordCount counts words correctly', () => {
    expect(wordCount('hello world')).toBe(2);
    expect(wordCount('  hello   world  ')).toBe(2);
    expect(wordCount('')).toBe(0);
    expect(wordCount('single')).toBe(1);
  });

  test('sentenceCount counts sentences based on ending punctuation', () => {
    expect(sentenceCount('Hello. How are you? I am fine! Thanks.')).toBe(4);
    expect(sentenceCount('No ending punctuation')).toBe(1);
    expect(sentenceCount('')).toBe(0);
  });

  test('readingTime estimates reading time in seconds', () => {
    expect(readingTime('hello')).toBe(1); // 1 word = Math.ceil((1/200)*60) = 1s
    const text200Words = Array(200).fill('word').join(' ');
    expect(readingTime(text200Words)).toBe(60); // 200 words = 60s
  });

  test('socialLimits computes limits and warning statuses', () => {
    const normalText = 'a'.repeat(50);
    const limitsNormal = socialLimits(normalText);
    expect(limitsNormal.twitter.current).toBe(50);
    expect(limitsNormal.twitter.max).toBe(280);
    expect(limitsNormal.twitter.status).toBe('normal');

    // Warning is >= 85% of max. For Twitter (280): 280 * 0.85 = 238
    const warningText = 'a'.repeat(240);
    expect(socialLimits(warningText).twitter.status).toBe('warning');

    // Danger is > max (280)
    const dangerText = 'a'.repeat(290);
    expect(socialLimits(dangerText).twitter.status).toBe('danger');
  });
});
