import { describe, test, expect } from 'vitest';
import {
  percentOf,
  percentageShare,
  increaseDecrease,
  adjustByPercentage,
} from '../percentage.js';

describe('Percentage Calculator Utilities', () => {
  test('percentOf calculates what is X% of Y', () => {
    expect(percentOf(15, 200)).toBe(30);
    expect(percentOf(0, 100)).toBe(0);
    expect(percentOf(100, 50)).toBe(50);
    expect(percentOf(250, 40)).toBe(100);
  });

  test('percentageShare calculates what percentage X is of Y', () => {
    expect(percentageShare(50, 200)).toBe(25);
    expect(percentageShare(0, 100)).toBe(0);
    expect(percentageShare(100, 50)).toBe(200);
    expect(percentageShare(10, 0)).toBe(0); // Handles division by zero
  });

  test('increaseDecrease calculates percentage change from X to Y', () => {
    expect(increaseDecrease(100, 150)).toBe(50); // 50% increase
    expect(increaseDecrease(100, 50)).toBe(-50); // 50% decrease
    expect(increaseDecrease(50, 50)).toBe(0); // No change
    expect(increaseDecrease(0, 100)).toBe(0); // Start is 0 (returns 0 to avoid Infinity)
  });

  test('adjustByPercentage adjusts a value by a percentage', () => {
    expect(adjustByPercentage(200, 10, 'add')).toBeCloseTo(220);
    expect(adjustByPercentage(200, 10, 'sub')).toBeCloseTo(180);
    expect(adjustByPercentage(100, 0, 'add')).toBeCloseTo(100);
    expect(adjustByPercentage(50, 50, 'sub')).toBeCloseTo(25);
  });
});
