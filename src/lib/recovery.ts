import type { Dataset, SupplierActiveMap } from '../data/types';
import { computeComponentStatus, computeProgramBreakdown, createSupplierActiveMap, getProgramComponents } from './scoring';

/** Two transparent heuristics, not a global optimizer. Supplier activation retains
 * the existing model's all-linked-parts semantics; timing includes every such link. */
export function compareRecovery(programId: string, current: SupplierActiveMap, data: Dataset) {
  const components = getProgramComponents(programId, data);
  const makeChoice = (harden: boolean) => {
    const map = { ...createSupplierActiveMap(data), ...current };
    const selected = new Set<string>();
    const targets = components.filter(c => {
      const status = computeComponentStatus(c.id, current, data).status;
      return status === 'NO_SUPPLIER' || (harden && status === 'SPOF');
    }).sort((a, b) => a.id.localeCompare(b.id));
    for (const component of targets) {
      const targetCount = harden ? 2 : 1;
      const candidates = data.componentSupplierLinks.filter(link => link.componentId === component.id)
        .filter(link => data.suppliers.some(s => s.id === link.supplierId && !s.isActive) && !map[link.supplierId])
        .filter(link => Number.isFinite(link.qualificationWeeks) && link.qualificationWeeks >= 0)
        .sort((a, b) => a.qualificationWeeks - b.qualificationWeeks || a.supplierId.localeCompare(b.supplierId));
      for (const candidate of candidates) {
        if (computeComponentStatus(component.id, map, data).activeSuppliers.length >= targetCount) break;
        map[candidate.supplierId] = true;
        selected.add(candidate.supplierId);
      }
    }
    const links = data.componentSupplierLinks.filter(link => selected.has(link.supplierId));
    const weeks = links.some(link => !Number.isFinite(link.qualificationWeeks) || link.qualificationWeeks < 0)
      ? null : Math.max(0, ...links.map(link => link.qualificationWeeks));
    return {
      supplierIds: [...selected], map, links, weeks,
      breakdown: computeProgramBreakdown(programId, map, data),
      unmet: targets.filter(c => computeComponentStatus(c.id, map, data).activeSuppliers.length < (harden ? 2 : 1)).map(c => c.name)
    };
  };
  return {
    baseline: computeProgramBreakdown(programId, createSupplierActiveMap(data), data),
    current: computeProgramBreakdown(programId, current, data),
    closeGaps: makeChoice(false), harden: makeChoice(true)
  };
}

export function disruptedPaths(current: SupplierActiveMap, data: Dataset) {
  return data.suppliers.filter(s => s.isActive && !(current[s.id] ?? s.isActive)).flatMap(supplier =>
    data.componentSupplierLinks.filter(link => link.supplierId === supplier.id).map(link => ({
      supplier,
      component: data.components.find(c => c.id === link.componentId)!,
      status: computeComponentStatus(link.componentId, current, data).status,
      programs: data.programs.filter(p => data.programComponentLinks.some(l => l.programId === p.id && l.componentId === link.componentId))
    }))
  );
}
