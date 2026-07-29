import { describe, expect, it } from 'vitest';
import { decodeScenarioMap, encodeScenarioMap } from './scenario';

/**
 * Only the pure encode/decode pair is covered here. The save/load helpers talk
 * to localStorage and the URL bar, and pulling in a DOM environment to test
 * three lines of window access was not worth it for a project this size.
 */
const supplierIds = ['s1', 's2', 's3'];

describe('scenario share links', () => {
  it('round-trips a scenario', () => {
    const original = { s1: true, s2: false, s3: true };
    expect(decodeScenarioMap(encodeScenarioMap(original, supplierIds), supplierIds)).toEqual(original);
  });

  it('defaults unknown suppliers to offline rather than guessing', () => {
    expect(decodeScenarioMap('s1:1', supplierIds)).toEqual({ s1: true, s2: false, s3: false });
  });

  it('ignores ids that are not in the current dataset', () => {
    // Otherwise a link shared from an older dataset injects phantom suppliers.
    expect(decodeScenarioMap('s1:1,ghost:1', supplierIds)).toEqual({
      s1: true,
      s2: false,
      s3: false
    });
  });

  it('survives a truncated or malformed parameter', () => {
    expect(decodeScenarioMap('s1:1,,s2', supplierIds)).toEqual({
      s1: true,
      s2: false,
      s3: false
    });
  });

  it('produces a stable encoding for the same map', () => {
    const map = { s1: false, s2: true, s3: false };
    expect(encodeScenarioMap(map, supplierIds)).toBe(encodeScenarioMap(map, supplierIds));
  });
});
