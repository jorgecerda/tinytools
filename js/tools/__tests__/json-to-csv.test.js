import { describe, test, expect } from 'vitest';
import {
  flattenObject,
  jsonToCsv,
  escapeCsvField,
  parseCsvRow,
} from '../json-to-csv.js';

describe('JSON to CSV Converter Utilities', () => {
  test('flattenObject flattens nested objects using dot notation', () => {
    const nested = {
      name: 'John',
      info: {
        age: 30,
        skills: {
          primary: 'JavaScript',
          secondary: 'CSS',
        },
      },
      tags: ['dev', 'seo'],
    };

    const flat = flattenObject(nested);
    expect(flat['name']).toBe('John');
    expect(flat['info.age']).toBe(30);
    expect(flat['info.skills.primary']).toBe('JavaScript');
    expect(flat['info.skills.secondary']).toBe('CSS');
    expect(flat['tags']).toEqual(['dev', 'seo']); // Arrays are not flattened, kept as values
  });

  test('escapeCsvField wraps fields with quotes if they contain delimiters', () => {
    expect(escapeCsvField('hello')).toBe('hello');
    expect(escapeCsvField('hello, world')).toBe('"hello, world"');
    expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""');
    expect(escapeCsvField('line\nbreak')).toBe('"line\nbreak"');
  });

  test('parseCsvRow splits a CSV line into cells respecting quotes and double quotes', () => {
    expect(parseCsvRow('name,role,location')).toEqual([
      'name',
      'role',
      'location',
    ]);
    expect(parseCsvRow('John,"Developer, Senior",NY')).toEqual([
      'John',
      'Developer, Senior',
      'NY',
    ]);
    expect(parseCsvRow('"say ""hello""",world')).toEqual([
      'say "hello"',
      'world',
    ]);
  });

  test('jsonToCsv converts objects or arrays of objects to CSV content', () => {
    const arr = [
      { name: 'Alice', age: 25, location: { city: 'London' } },
      { name: 'Bob', age: 30, details: 'Likes "sports"' },
    ];

    const csv = jsonToCsv(arr);
    const lines = csv.split('\n');

    // Headers should merge all unique fields
    expect(lines[0]).toBe('name,age,location.city,details');

    // Row 1
    expect(lines[1]).toBe('Alice,25,London,');

    // Row 2
    expect(lines[2]).toBe('Bob,30,,"Likes ""sports"""');
  });

  test('jsonToCsv converts a single object successfully', () => {
    const obj = { id: 1, type: 'widget' };
    const csv = jsonToCsv(obj);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,type');
    expect(lines[1]).toBe('1,widget');
  });

  test('jsonToCsv throws on invalid JSON primitives', () => {
    expect(() => jsonToCsv('plain string')).toThrow();
    expect(() => jsonToCsv(null)).toThrow();
  });
});
