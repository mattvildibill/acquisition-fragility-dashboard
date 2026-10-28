import { describe, expect, it } from 'vitest';
import { dataset } from './index';
import { computeComponentStatus, computePortfolioSummary, computeProgramBreakdown, createSupplierActiveMap } from '../lib/scoring';
import { compareRecovery, disruptedPaths } from '../lib/recovery';

const baseline = createSupplierActiveMap(dataset);
const juniperDown = { ...baseline, s12: false };
describe('mapped synthetic topology cases', () => {
  it('preserves the original three program scores and adds two explicit baselines', () => {
    expect(dataset.programs.map(p => computeProgramBreakdown(p.id, baseline, dataset).score)).toEqual([79,71,65,65,70]);
    expect(computePortfolioSummary(baseline, dataset).averageHealthScore).toBe(70);
  });
  it('maps the shared timing failure to exactly two programs and controller to one', () => {
    expect(disruptedPaths(juniperDown, dataset).map(p => ({component:p.component.id, programs:p.programs.map(x => x.id)}))).toEqual([
      {component:'c7',programs:['p4','p5']}, {component:'c8',programs:['p4']}
    ]);
    expect(dataset.programs.filter(p => computeProgramBreakdown(p.id, juniperDown, dataset).score !== computeProgramBreakdown(p.id, baseline, dataset).score).map(p => p.id)).toEqual(['p4','p5']);
  });
  it('derives Orbital weights independently and cannot hide its unresolvable controller', () => {
    // c4 MED SPOF 67.5 + c7 HIGH gap 180 + c8 HIGH gap 180;
    // c9 MED healthy contributes weight 1.5 but no penalty. Total weight 7.
    const current = computeProgramBreakdown('p4', juniperDown, dataset);
    expect(current.totalWeight).toBe(7);
    expect(current.totalPenalty).toBe(427.5);
    expect(current.score).toBe(39);
    expect(current.restore.longestRestoreWeeks).toBeNull();
    expect(current.restore.unresolvableComponents).toEqual(['Radiation-Tolerant Controller']);
    const comparison = compareRecovery('p4', juniperDown, dataset);
    expect(comparison.closeGaps.supplierIds).toEqual(['s13']);
    expect(comparison.harden.supplierIds).toEqual(['s9','s13']);
    expect([comparison.closeGaps.breakdown.score,comparison.harden.breakdown.score]).toEqual([52,61]);
    expect(comparison.closeGaps.unmet).toEqual(['Radiation-Tolerant Controller']);
    expect(comparison.harden.unmet).toEqual(['Precision Timing Module','Radiation-Tolerant Controller']);
    expect(comparison.harden.breakdown.noSupplierCount).toBe(1);
    expect(comparison.harden.weeks).toBe(36);
  });
  it('accounts for supplier-wide spillover without promising redundancy on the timing gap', () => {
    const result = compareRecovery('p5', juniperDown, dataset);
    expect(result.current.score).toBe(50);
    expect(result.closeGaps.supplierIds).toEqual(['s13']);
    expect(result.closeGaps.breakdown.score).toBe(80);
    expect(result.harden.breakdown.score).toBe(80);
    expect(result.harden.unmet).toEqual(['Precision Timing Module']);
    expect(result.closeGaps.links.map(l => [l.componentId,l.qualificationWeeks])).toEqual([['c7',36],['c10',14]]);
    expect(computeComponentStatus('c10',result.closeGaps.map,dataset).status).toBe('HEALTHY');
  });
  it('shows a dual source survives one failure but has no reserve after both fail', () => {
    expect(computeComponentStatus('c9',{...baseline,s14:false},dataset).status).toBe('SPOF');
    const result = compareRecovery('p4',{...baseline,s14:false,s15:false},dataset);
    expect(result.current.noSupplierCount).toBe(1);
    expect(result.closeGaps.unmet).toContain('Deployable Antenna Assembly');
  });
});
