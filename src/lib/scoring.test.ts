import { describe, expect, it } from 'vitest';
import type { Dataset, SupplierActiveMap } from '../data/types';
import { dataset as demoDataset } from '../data';
import {
  computeComponentStatus,
  computePortfolioSummary,
  computeProgramBreakdown,
  createSupplierActiveMap,
  getComponentMitigation
} from './scoring';

/**
 * Hand-built fixture with numbers chosen to divide evenly, so the expected
 * scores below are readable rather than magic. The demo dataset gets exercised
 * separately at the bottom — I did not want every scoring assertion to break
 * the next time I reword a supplier name.
 *
 * Baseline shape:
 *   K High  HIGH  v1 + v2 both producing        -> HEALTHY
 *   K Med   MED   v4 producing, v3 on the shelf -> SPOF, 16wk path back
 *   K Low   LOW   v1 producing, no alternate    -> SPOF, no path back
 */
const fixture: Dataset = {
  programs: [{ id: 'pa', name: 'Program A' }],
  components: [
    { id: 'k_high', name: 'K High', criticality: 'HIGH' },
    { id: 'k_med', name: 'K Med', criticality: 'MED' },
    { id: 'k_low', name: 'K Low', criticality: 'LOW' }
  ],
  suppliers: [
    { id: 'v1', name: 'Vendor One', location: 'Denver, CO', foreignExposure: 'DOMESTIC', isActive: true },
    { id: 'v2', name: 'Vendor Two', location: 'Mesa, AZ', foreignExposure: 'DOMESTIC', isActive: true },
    { id: 'v3', name: 'Vendor Three', location: 'Erie, PA', foreignExposure: 'DOMESTIC', isActive: false },
    { id: 'v4', name: 'Vendor Four', location: 'Offshore', foreignExposure: 'ADVERSARY_LINKED', isActive: true }
  ],
  programComponentLinks: [
    { programId: 'pa', componentId: 'k_high' },
    { programId: 'pa', componentId: 'k_med' },
    { programId: 'pa', componentId: 'k_low' }
  ],
  componentSupplierLinks: [
    { componentId: 'k_high', supplierId: 'v1', qualificationWeeks: 12 },
    { componentId: 'k_high', supplierId: 'v2', qualificationWeeks: 20 },
    { componentId: 'k_med', supplierId: 'v4', qualificationWeeks: 30 },
    { componentId: 'k_med', supplierId: 'v3', qualificationWeeks: 16 },
    { componentId: 'k_low', supplierId: 'v1', qualificationWeeks: 8 }
  ]
};

const baseline = createSupplierActiveMap(fixture);

function withOffline(...supplierIds: string[]): SupplierActiveMap {
  return supplierIds.reduce<SupplierActiveMap>(
    (map, id) => ({ ...map, [id]: false }),
    baseline
  );
}

describe('component status', () => {
  it('treats two or more producing suppliers as healthy', () => {
    expect(computeComponentStatus('k_high', baseline, fixture).status).toBe('HEALTHY');
  });

  it('flags a single producing supplier as a SPOF', () => {
    expect(computeComponentStatus('k_med', baseline, fixture).status).toBe('SPOF');
  });

  it('flags zero producing suppliers as a capability gap', () => {
    expect(computeComponentStatus('k_med', withOffline('v4'), fixture).status).toBe('NO_SUPPLIER');
  });

  it('does not count shelf alternates as producing', () => {
    const status = computeComponentStatus('k_med', baseline, fixture);
    expect(status.activeSuppliers.map((s) => s.id)).toEqual(['v4']);
    expect(status.inactiveSuppliers.map((s) => s.id)).toEqual(['v3']);
  });
});

describe('program scoring', () => {
  it('scores the fixture baseline at 75', () => {
    // weights 2 + 1.5 + 1 = 4.5; penalties 45*1.5 + 45*1 = 112.5; 112.5/4.5 = 25
    const breakdown = computeProgramBreakdown('pa', baseline, fixture);
    expect(breakdown.score).toBe(75);
    expect(breakdown.spofCount).toBe(2);
    expect(breakdown.noSupplierCount).toBe(0);
  });

  it('weights a gap more heavily than a SPOF on the same component', () => {
    const before = computeProgramBreakdown('pa', baseline, fixture).score;
    const after = computeProgramBreakdown('pa', withOffline('v4'), fixture).score;
    expect(after).toBe(60);
    expect(after).toBeLessThan(before);
  });

  it('scales penalties by criticality', () => {
    // Losing v1 breaks a LOW component outright and drops a HIGH one to SPOF.
    expect(computeProgramBreakdown('pa', withOffline('v1'), fixture).score).toBe(45);
  });

  it('bottoms out at 10 rather than 0 when every supplier is gone', () => {
    // Not a rounding artifact. Penalties are normalised by total weight, and the
    // worst per-component penalty is 90, so total collapse lands at 100-90=10.
    // Pinning it here because a "10/100" program is really a zero, and any UI
    // that colours on absolute thresholds needs to know the floor is not 0.
    const allDown = computeProgramBreakdown('pa', withOffline('v1', 'v2', 'v3', 'v4'), fixture);
    expect(allDown.score).toBe(10);
    expect(allDown.noSupplierCount).toBe(3);
  });

  it('reports resilient coverage as a share of components, not of penalty', () => {
    expect(computeProgramBreakdown('pa', baseline, fixture).resilientCoveragePct).toBe(33);
  });

  it('orders drivers by penalty so the top one is the worst one', () => {
    const drivers = computeProgramBreakdown('pa', withOffline('v4'), fixture).drivers;
    expect(drivers[0].componentName).toBe('K Med');
    expect(drivers[0].penalty).toBeGreaterThan(drivers[1].penalty);
  });
});

describe('restore outlook', () => {
  it('is empty when nothing has actually gone to zero suppliers', () => {
    // Two SPOFs at baseline, but both are still delivering.
    const { restore } = computeProgramBreakdown('pa', baseline, fixture);
    expect(restore.gapComponents).toBe(0);
    expect(restore.longestRestoreWeeks).toBeNull();
  });

  it('reports the fastest qualified alternate for a gap', () => {
    const { restore } = computeProgramBreakdown('pa', withOffline('v4'), fixture);
    expect(restore.gapComponents).toBe(1);
    expect(restore.longestRestoreWeeks).toBe(16);
    expect(restore.drivingComponent).toBe('K Med');
  });

  it('takes the slowest gap, not the sum of them', () => {
    // Gaps close in parallel; the program is back when the last one lands.
    const twoGaps = computeProgramBreakdown('pa', withOffline('v4', 'v1'), fixture).restore;
    expect(twoGaps.gapComponents).toBe(2);
    expect(twoGaps.longestRestoreWeeks).toBe(16);
  });

  it('does not offer the supplier that just failed as its own replacement', () => {
    // v1 is the only source for K Low. Knocking it offline must not produce
    // "requalify Vendor One in 8 weeks" — that was the first version's bug.
    const { restore } = computeProgramBreakdown('pa', withOffline('v1'), fixture);
    expect(restore.unresolvableComponents).toContain('K Low');
    expect(restore.longestRestoreWeeks).toBeNull();
  });

  it('separates "no path back" from "restored" instead of collapsing both to zero', () => {
    const drivers = computeProgramBreakdown('pa', baseline, fixture).drivers;
    const healthy = drivers.find((d) => d.componentName === 'K High');
    const stranded = drivers.find((d) => d.componentName === 'K Low');
    expect(healthy?.recoveryWeeks).toBe(0);
    expect(stranded?.recoveryWeeks).toBeNull();
  });
});

describe('mitigation guidance', () => {
  it('names the fastest alternate and its qualification time', () => {
    expect(getComponentMitigation('k_med', withOffline('v4'), fixture)).toBe(
      'Qualify Vendor Three to close the gap (~16 weeks)'
    );
  });

  it('says so plainly when there is no alternate on file', () => {
    expect(getComponentMitigation('k_low', baseline, fixture)).toBe(
      'No qualifiable alternate on file — sole source with no recovery path'
    );
  });
});

describe('portfolio summary', () => {
  it('counts adversary-linked sole sources separately from the health score', () => {
    const summary = computePortfolioSummary(baseline, fixture);
    expect(summary.adversaryLinkedSoleSources).toEqual(['K Med']);
    // K Low is also a sole source, but a domestic one — different problem.
    expect(summary.totalSpofComponents).toBe(2);
  });

  it('ranks critical nodes by blast radius', () => {
    const summary = computePortfolioSummary(baseline, fixture);
    const ranked = summary.criticalNodes.map((node) => node.supplierId);
    // v1 and v4 both strand the program if they fail. v2 only leaves a SPOF
    // behind, and v3 is on the shelf so it cannot fail at all — both sort last.
    expect(ranked.slice(0, 2).sort()).toEqual(['v1', 'v4']);
    expect(ranked.slice(2).sort()).toEqual(['v2', 'v3']);
  });

  it('agrees with its own critical-nodes table on ties', () => {
    // These used to be two separate passes with different tie-breaks, so the
    // headline supplier and the top table row could name different vendors.
    const summary = computePortfolioSummary(baseline, fixture);
    expect(summary.topCriticalSupplier?.supplierId).toBe(summary.criticalNodes[0].supplierId);
  });
});

describe('demo dataset', () => {
  const demoBaseline = createSupplierActiveMap(demoDataset);

  it('starts with no program below the at-risk threshold', () => {
    const summary = computePortfolioSummary(demoBaseline, demoDataset);
    expect(summary.programsAtRisk).toBe(0);
    expect(summary.averageHealthScore).toBe(72);
  });

  it('opens with the Secure RF Modem sole-sourced to an adversary-linked vendor', () => {
    const summary = computePortfolioSummary(demoBaseline, demoDataset);
    expect(summary.adversaryLinkedSoleSources).toEqual(['Secure RF Modem']);
  });

  it('puts two programs at risk when Cobalt Dynamics goes offline', () => {
    // The scripted walkthrough in the README depends on this staying true.
    const summary = computePortfolioSummary({ ...demoBaseline, s3: false }, demoDataset);
    expect(summary.programsAtRisk).toBe(2);
  });

  it('prices the Secure RF Modem gap at 64 weeks via the allied second source', () => {
    const breakdown = computeProgramBreakdown('p2', { ...demoBaseline, s3: false }, demoDataset);
    expect(breakdown.restore.longestRestoreWeeks).toBe(64);
    expect(breakdown.restore.drivingComponent).toBe('Secure RF Modem');
  });

  it('keeps every component reachable from a program', () => {
    const linked = new Set(demoDataset.programComponentLinks.map((link) => link.componentId));
    expect(demoDataset.components.every((component) => linked.has(component.id))).toBe(true);
  });

  it('has a qualification lead time on every supplier link', () => {
    expect(
      demoDataset.componentSupplierLinks.every((link) => Number.isFinite(link.qualificationWeeks))
    ).toBe(true);
  });
});
