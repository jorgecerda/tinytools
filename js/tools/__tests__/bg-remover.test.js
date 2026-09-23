import { describe, it, expect } from 'vitest';
import { isValidImageFile, formatOutputFilename, getFriendlyStatusMessage } from '../bg-remover.js';

describe('Background Image Remover Helper', () => {
  it('should validate allowed image file types', () => {
    const pngFile = { type: 'image/png', size: 1024 * 1024 };
    const jpgFile = { type: 'image/jpeg', size: 2 * 1024 * 1024 };
    const webpFile = { type: 'image/webp', size: 500 * 1024 };
    const pdfFile = { type: 'application/pdf', size: 1024 * 1024 };

    expect(isValidImageFile(pngFile)).toBe(true);
    expect(isValidImageFile(jpgFile)).toBe(true);
    expect(isValidImageFile(webpFile)).toBe(true);
    expect(isValidImageFile(pdfFile)).toBe(false);
    expect(isValidImageFile(null)).toBe(false);
  });

  it('should format transparent output PNG filenames correctly', () => {
    expect(formatOutputFilename('photo.jpg')).toBe('photo-no-bg.png');
    expect(formatOutputFilename('my-product-image.PNG')).toBe('my-product-image-no-bg.png');
    expect(formatOutputFilename('banner')).toBe('banner-no-bg.png');
  });

  it('should return user-friendly status messages for progress phases', () => {
    expect(getFriendlyStatusMessage('fetch:model', 20)).toBe('Loading local AI model into browser memory...');
    expect(getFriendlyStatusMessage('compute:mask', 50)).toBe('Analyzing photo & detecting subject boundaries...');
    expect(getFriendlyStatusMessage('encode:png', 80)).toBe('Removing background & refining transparent edges...');
  });
});
