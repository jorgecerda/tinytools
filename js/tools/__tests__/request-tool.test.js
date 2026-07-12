import { describe, it, expect } from 'vitest';
import { buildPayload } from '../request-tool.js';

describe('Request Tool Payload Builder', () => {
  it('should construct correct payload without email', () => {
    const desc = 'A secure password generator';
    const email = '';
    const payload = buildPayload(desc, email);

    expect(payload).toEqual({
      _subject: 'tinytools - new tool request',
      _captcha: 'false',
      description: 'A secure password generator'
    });
  });

  it('should construct correct payload with email', () => {
    const desc = 'A JSON validator';
    const email = 'user@example.com';
    const payload = buildPayload(desc, email);

    expect(payload).toEqual({
      _subject: 'tinytools - new tool request',
      _captcha: 'false',
      description: 'A JSON validator',
      email: 'user@example.com',
      _replyto: 'user@example.com'
    });
  });
});
