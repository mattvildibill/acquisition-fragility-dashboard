import { describe, expect, it } from 'vitest';
import type { Dataset } from './types';
import { dataset } from './index';

// Dataset contract: unique entities/edges, valid endpoints, complete reachability,
// and finite nonnegative per-part qualification times. Topology cases live in
// topology.test.ts; these checks must not assume every component has a reserve.
function violations(data: Dataset): string[] {
  const errors: string[] = [];
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) errors.push(`duplicate ${label}`);
  };
  unique(data.programs.map(p => p.id), 'program');
  unique(data.components.map(c => c.id), 'component');
  unique(data.suppliers.map(s => s.id), 'supplier');
  unique(data.programComponentLinks.map(l => `${l.programId}/${l.componentId}`), 'program edge');
  unique(data.componentSupplierLinks.map(l => `${l.componentId}/${l.supplierId}`), 'supplier edge');
  for (const l of data.programComponentLinks) {
    if (!data.programs.some(p => p.id === l.programId) || !data.components.some(c => c.id === l.componentId)) errors.push('invalid program edge');
  }
  for (const l of data.componentSupplierLinks) {
    if (!data.components.some(c => c.id === l.componentId) || !data.suppliers.some(s => s.id === l.supplierId)) errors.push('invalid supplier edge');
    if (!Number.isFinite(l.qualificationWeeks) || l.qualificationWeeks < 0) errors.push('invalid duration');
  }
  for (const p of data.programs) if (!data.programComponentLinks.some(l => l.programId === p.id)) errors.push('orphan program');
  for (const c of data.components) {
    if (!data.programComponentLinks.some(l => l.componentId === c.id)) errors.push('orphan component');
    if (!data.componentSupplierLinks.some(l => l.componentId === c.id)) errors.push('unsourced component');
  }
  for (const s of data.suppliers) if (!data.componentSupplierLinks.some(l => l.supplierId === s.id)) errors.push('orphan supplier');
  return errors;
}

describe('synthetic dataset mapping contract', () => {
  it('has unique entities and edges, valid references and no orphans', () => expect(violations(dataset)).toEqual([]));
  it('detects duplicate edges and missing endpoints', () => {
    const broken = structuredClone(dataset);
    broken.programComponentLinks.push(broken.programComponentLinks[0]);
    broken.componentSupplierLinks[0].supplierId = 'missing';
    expect(violations(broken)).toContain('duplicate program edge');
    expect(violations(broken)).toContain('invalid supplier edge');
  });
  it('detects orphan entities and invalid durations', () => {
    const broken = structuredClone(dataset);
    broken.programs.push({id:'orphan', name:'Unlinked'});
    broken.componentSupplierLinks[0].qualificationWeeks = -1;
    expect(violations(broken)).toContain('orphan program');
    expect(violations(broken)).toContain('invalid duration');
  });
});
