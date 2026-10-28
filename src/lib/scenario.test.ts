import { describe, expect, it } from 'vitest';
import { decodeScenarioMap, encodeScenarioMap } from './scenario';
const supplierIds = ['s1', 's2', 's3'];

describe('scenario share links', () => {
  it('round-trips every supplier state', () => {
    for (let mask = 0; mask < 8; mask++) {
      const map = Object.fromEntries(supplierIds.map((id, i) => [id, Boolean(mask & (1 << i))]));
      expect(decodeScenarioMap(encodeScenarioMap(map, supplierIds), supplierIds)).toEqual(map);
    }
  });
  it.each(['s1:1', 's1:1,s2:0,ghost:1', 's1:1,,s2', '%:1,s2:0,s3:1',
    's1:1,s1:0,s3:1', 's1:yes,s2:0,s3:1', 's1:1:0,s2:0,s3:1', ''])
    ('rejects incomplete or malformed snapshot %s', (raw) => {
      expect(decodeScenarioMap(raw, supplierIds)).toBeNull();
    });
  it('round-trips encoded punctuation in IDs', () => {
    const ids = ['a:b,c%'];
    expect(decodeScenarioMap(encodeScenarioMap({ [ids[0]]: true }, ids), ids)).toEqual({ [ids[0]]: true });
  });
});
