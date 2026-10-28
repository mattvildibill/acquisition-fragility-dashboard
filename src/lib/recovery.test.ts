import { describe, expect, it } from 'vitest';
import { dataset } from '../data';
import { compareRecovery, disruptedPaths } from './recovery';
import { createSupplierActiveMap } from './scoring';

const baseline = createSupplierActiveMap(dataset);
describe('recovery comparison', () => {
  it('keeps scoring and current state intact, comparing delivery with redundancy', () => {
    const current = { ...baseline, s3: false };
    const result = compareRecovery('p2', current, dataset);
    expect([result.baseline.score, result.current.score, result.closeGaps.breakdown.score, result.harden.breakdown.score]).toEqual([71, 55, 71, 84]);
    expect(result.closeGaps.supplierIds).toEqual(['s7']);
    expect(result.harden.supplierIds).toEqual(['s7', 's9']);
    expect(result.closeGaps.weeks).toBe(64);
    expect(result.harden.weeks).toBe(64);
    expect(result.closeGaps.breakdown.spofCount).toBe(2);
    expect(result.harden.unmet).toEqual(['Secure RF Modem']);
    expect(current).toEqual({ ...baseline, s3: false });
  });
  it('shows all affected paths and never treats reserves as lost producers', () => {
    const paths = disruptedPaths({ ...baseline, s3: false }, dataset);
    expect(paths).toHaveLength(1);
    expect(paths[0].programs.map(p => p.id)).toEqual(['p2', 'p3']);
    expect(disruptedPaths(baseline, dataset)).toEqual([]);
    expect(disruptedPaths({ ...baseline, s2: false }, dataset).map(p => p.status)).toEqual(['SPOF', 'SPOF']);
  });
  it('reports unavailable recovery instead of substituting an offline producer', () => {
    const noReserve = { ...dataset, componentSupplierLinks: dataset.componentSupplierLinks.filter(l => l.supplierId !== 's7') };
    const result = compareRecovery('p2', { ...baseline, s3: false }, noReserve);
    expect(result.closeGaps.supplierIds).toEqual([]);
    expect(result.closeGaps.breakdown.noSupplierCount).toBe(1);
    expect(result.closeGaps.unmet).toEqual(['Secure RF Modem']);
  });
  it('includes outside-program links in supplier-wide qualification envelopes', () => {
    const data = { ...dataset, componentSupplierLinks: dataset.componentSupplierLinks.map(l => l.componentId === 'c6' && l.supplierId === 's7' ? { ...l, qualificationWeeks: 90 } : l) };
    const result = compareRecovery('p2', { ...baseline, s3: false }, data);
    expect(result.closeGaps.weeks).toBe(90);
    expect(result.closeGaps.links).toHaveLength(2);
  });
  it('handles all producers offline and distinguishes remaining gaps from single sources', () => {
    const current = Object.fromEntries(dataset.suppliers.map(s => [s.id, false]));
    const result = compareRecovery('p2', current, dataset);
    expect(result.current.score).toBe(10);
    expect(result.closeGaps.breakdown.noSupplierCount).toBe(0);
    expect(result.harden.breakdown.spofCount).toBe(3);
    expect(result.harden.unmet).toHaveLength(3);
    expect(result.harden.supplierIds.every(id => !dataset.suppliers.find(s => s.id === id)!.isActive)).toBe(true);
  });
  it('does not add redundant work to an already fully sourced program', () => {
    const current = Object.fromEntries(dataset.suppliers.map(s => [s.id, true]));
    const result = compareRecovery('p2', current, dataset);
    expect(result.closeGaps.supplierIds).toEqual([]);
    expect(result.harden.supplierIds).toEqual([]);
    expect(result.harden.weeks).toBe(0);
    expect(result.harden.breakdown.score).toBe(100);
  });
  it('breaks equal qualification ties by supplier ID regardless of link ordering', () => {
    const data = { ...dataset, componentSupplierLinks: [...dataset.componentSupplierLinks, { componentId: 'c2', supplierId: 's8', qualificationWeeks: 64 }].reverse() };
    expect(compareRecovery('p2', { ...baseline, s3: false }, data).closeGaps.supplierIds).toEqual(['s7']);
  });
  it('treats an incomplete map like the scoring engine baseline fallback', () => {
    expect(compareRecovery('p2', {}, dataset)).toEqual(compareRecovery('p2', baseline, dataset));
  });
  it('does not silently zero unknown or invalid qualification duration', () => {
    const data = { ...dataset, componentSupplierLinks: dataset.componentSupplierLinks.map(l => l.componentId === 'c6' && l.supplierId === 's7' ? { ...l, qualificationWeeks: NaN } : l) };
    expect(compareRecovery('p2', { ...baseline, s3: false }, data).closeGaps.weeks).toBeNull();
  });
});
