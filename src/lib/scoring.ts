import type {
  Component,
  ComponentStatus,
  CriticalSupplierNode,
  Dataset,
  ForeignExposure,
  PortfolioSummary,
  Program,
  ProgramBreakdown,
  ProgramDriver,
  RestoreOutlook,
  Supplier,
  SupplierActiveMap
} from '../data/types';

export const PROGRAM_AT_RISK_THRESHOLD = 60;

const SPOF_PENALTY = 45;
const NO_SUPPLIER_PENALTY = 90;

const criticalityWeight: Record<Component['criticality'], number> = {
  LOW: 1,
  MED: 1.5,
  HIGH: 2
};

export interface ComponentStatusResult {
  status: ComponentStatus;
  component: Component;
  activeSuppliers: Supplier[];
  inactiveSuppliers: Supplier[];
  allSuppliers: Supplier[];
}

function getSupplierActiveState(supplierId: string, supplierActiveMap: SupplierActiveMap, data: Dataset): boolean {
  if (supplierId in supplierActiveMap) {
    return supplierActiveMap[supplierId];
  }
  const supplier = data.suppliers.find((item) => item.id === supplierId);
  return supplier?.isActive ?? false;
}

function getComponentById(componentId: string, data: Dataset): Component {
  const component = data.components.find((item) => item.id === componentId);
  if (!component) {
    throw new Error(`Unknown component id: ${componentId}`);
  }
  return component;
}

function getProgramById(programId: string, data: Dataset): Program {
  const program = data.programs.find((item) => item.id === programId);
  if (!program) {
    throw new Error(`Unknown program id: ${programId}`);
  }
  return program;
}

export function getProgramComponents(programId: string, data: Dataset): Component[] {
  const ids = data.programComponentLinks
    .filter((item) => item.programId === programId)
    .map((item) => item.componentId);
  return data.components.filter((item) => ids.includes(item.id));
}

export function getComponentSuppliers(componentId: string, data: Dataset): Supplier[] {
  const ids = data.componentSupplierLinks
    .filter((item) => item.componentId === componentId)
    .map((item) => item.supplierId);
  return data.suppliers.filter((item) => ids.includes(item.id));
}

function getQualificationWeeks(componentId: string, supplierId: string, data: Dataset): number | null {
  const link = data.componentSupplierLinks.find(
    (item) => item.componentId === componentId && item.supplierId === supplierId
  );
  return link?.qualificationWeeks ?? null;
}

/**
 * Alternates you could actually turn to: suppliers linked to the component that
 * are on the shelf rather than in the fire.
 *
 * The distinction matters. `inactiveSuppliers` includes anyone the scenario just
 * knocked offline, and the first cut of this happily recommended requalifying
 * the supplier that had failed a moment earlier. A vendor who is down because we
 * simulated losing them is not the recovery path — so candidates are restricted
 * to suppliers that are inactive in the source data too.
 */
function getShelfAlternates(inactiveSuppliers: Supplier[]): Supplier[] {
  return inactiveSuppliers.filter((supplier) => !supplier.isActive);
}

/**
 * Weeks to get a component back to a healthy posture by standing up the fastest
 * alternate source that is not already producing.
 *
 * Returns null when no qualified alternate exists in the dataset. That is the
 * worst case, not the best one: it means the only path forward is sourcing a
 * supplier the model does not know about. Callers must not treat null as zero.
 */
function computeRecoveryWeeks(
  componentId: string,
  status: ComponentStatus,
  inactiveSuppliers: Supplier[],
  data: Dataset
): number | null {
  if (status === 'HEALTHY') {
    return 0;
  }

  const candidateWeeks = getShelfAlternates(inactiveSuppliers)
    .map((supplier) => getQualificationWeeks(componentId, supplier.id, data))
    .filter((weeks): weeks is number => weeks !== null);

  if (candidateWeeks.length === 0) {
    return null;
  }

  return Math.min(...candidateWeeks);
}

export function computeComponentStatus(
  componentId: string,
  supplierActiveMap: SupplierActiveMap,
  data: Dataset
): ComponentStatusResult {
  const component = getComponentById(componentId, data);
  const allSuppliers = getComponentSuppliers(componentId, data);
  const activeSuppliers = allSuppliers.filter((supplier) =>
    getSupplierActiveState(supplier.id, supplierActiveMap, data)
  );
  const inactiveSuppliers = allSuppliers.filter((supplier) =>
    !getSupplierActiveState(supplier.id, supplierActiveMap, data)
  );

  let status: ComponentStatus = 'HEALTHY';
  if (activeSuppliers.length === 1) {
    status = 'SPOF';
  }
  if (activeSuppliers.length === 0) {
    status = 'NO_SUPPLIER';
  }

  return {
    status,
    component,
    activeSuppliers,
    inactiveSuppliers,
    allSuppliers
  };
}

function getPenalty(component: Component, status: ComponentStatus): number {
  const weight = criticalityWeight[component.criticality];
  if (status === 'SPOF') {
    return SPOF_PENALTY * weight;
  }
  if (status === 'NO_SUPPLIER') {
    return NO_SUPPLIER_PENALTY * weight;
  }
  return 0;
}

function getRecommendedNextStep(
  componentId: string,
  status: ComponentStatus,
  inactiveSuppliers: Supplier[],
  data: Dataset
): string {
  if (status === 'HEALTHY') {
    return 'Monitor supplier resiliency posture';
  }

  // Recommend the fastest path back, not just the first alternate we happen to
  // find. An 18-month qualification and a 3-month one are not the same advice.
  const ranked = getShelfAlternates(inactiveSuppliers)
    .map((supplier) => ({ supplier, weeks: getQualificationWeeks(componentId, supplier.id, data) }))
    .filter((item): item is { supplier: Supplier; weeks: number } => item.weeks !== null)
    .sort((a, b) => a.weeks - b.weeks);

  const fastest = ranked[0];

  if (status === 'NO_SUPPLIER') {
    if (fastest) {
      return `Qualify ${fastest.supplier.name} to close the gap (~${fastest.weeks} weeks)`;
    }
    return 'No qualifiable alternate on file — source a new supplier';
  }

  if (fastest) {
    return `Qualify ${fastest.supplier.name} as a second source (~${fastest.weeks} weeks)`;
  }
  return 'No qualifiable alternate on file — sole source with no recovery path';
}

const EMPTY_RESTORE_OUTLOOK: RestoreOutlook = {
  gapComponents: 0,
  longestRestoreWeeks: null,
  drivingComponent: null,
  unresolvableComponents: []
};

/**
 * Restore outlook is driven only by components with zero active suppliers.
 * A SPOF is fragile but still delivering; a gap is the thing that actually stops
 * a line. Mixing the two produced a headline number that never moved, so the
 * scope here is deliberately narrow.
 */
function computeRestoreOutlook(drivers: ProgramDriver[]): RestoreOutlook {
  const gaps = drivers.filter((driver) => driver.status === 'NO_SUPPLIER');

  if (gaps.length === 0) {
    return EMPTY_RESTORE_OUTLOOK;
  }

  const unresolvable = gaps.filter((driver) => driver.recoveryWeeks === null);
  const resolvable = gaps.filter(
    (driver): driver is ProgramDriver & { recoveryWeeks: number } => driver.recoveryWeeks !== null
  );

  // The program is back when its slowest gap closes, so this is a max, not a sum.
  const slowest = resolvable.reduce<(ProgramDriver & { recoveryWeeks: number }) | null>(
    (worst, driver) => (!worst || driver.recoveryWeeks > worst.recoveryWeeks ? driver : worst),
    null
  );

  return {
    gapComponents: gaps.length,
    longestRestoreWeeks: slowest?.recoveryWeeks ?? null,
    drivingComponent: slowest?.componentName ?? null,
    unresolvableComponents: unresolvable.map((driver) => driver.componentName)
  };
}

export function computeProgramBreakdown(
  programId: string,
  supplierActiveMap: SupplierActiveMap,
  data: Dataset
): ProgramBreakdown {
  const components = getProgramComponents(programId, data);

  if (components.length === 0) {
    return {
      programId,
      score: 100,
      resilientCoveragePct: 100,
      healthyCount: 0,
      spofCount: 0,
      noSupplierCount: 0,
      totalPenalty: 0,
      totalWeight: 0,
      topDriverComponent: 'None',
      drivers: [],
      restore: EMPTY_RESTORE_OUTLOOK,
      explanation: 'No components mapped to this program yet; score defaults to 100.'
    };
  }

  let healthyCount = 0;
  let spofCount = 0;
  let noSupplierCount = 0;

  const totalWeight = components.reduce((sum, component) => {
    return sum + criticalityWeight[component.criticality];
  }, 0);

  const drivers: ProgramDriver[] = components.map((component) => {
    const componentStatus = computeComponentStatus(component.id, supplierActiveMap, data);
    const penalty = getPenalty(component, componentStatus.status);

    if (componentStatus.status === 'HEALTHY') {
      healthyCount += 1;
    }
    if (componentStatus.status === 'SPOF') {
      spofCount += 1;
    }
    if (componentStatus.status === 'NO_SUPPLIER') {
      noSupplierCount += 1;
    }

    return {
      componentId: component.id,
      componentName: component.name,
      criticality: component.criticality,
      status: componentStatus.status,
      penalty,
      recoveryWeeks: computeRecoveryWeeks(
        component.id,
        componentStatus.status,
        componentStatus.inactiveSuppliers,
        data
      ),
      recommendedNextStep: getRecommendedNextStep(
        component.id,
        componentStatus.status,
        componentStatus.inactiveSuppliers,
        data
      )
    };
  });

  const totalPenalty = drivers.reduce((sum, driver) => sum + driver.penalty, 0);
  const normalizedPenalty = totalWeight === 0 ? 0 : totalPenalty / totalWeight;
  const score = Math.max(0, Math.round(100 - normalizedPenalty));
  const resilientCoveragePct = Math.round((healthyCount / components.length) * 100);

  const sortedDrivers = [...drivers].sort((a, b) => b.penalty - a.penalty || a.componentName.localeCompare(b.componentName));
  const topDriver = sortedDrivers.find((driver) => driver.penalty > 0);
  const topDriverComponent = topDriver?.componentName ?? 'None';

  const explanation =
    'Score starts at 100 and subtracts weighted fragility penalties: SPOF=45 and No Supplier=90, scaled by criticality (LOW=1, MED=1.5, HIGH=2).';

  return {
    programId,
    score,
    resilientCoveragePct,
    healthyCount,
    spofCount,
    noSupplierCount,
    totalPenalty,
    totalWeight,
    topDriverComponent,
    drivers: sortedDrivers,
    restore: computeRestoreOutlook(sortedDrivers),
    explanation
  };
}

export function computeProgramScore(programId: string, supplierActiveMap: SupplierActiveMap, data: Dataset): number {
  return computeProgramBreakdown(programId, supplierActiveMap, data).score;
}

export function getComponentMitigation(
  componentId: string,
  supplierActiveMap: SupplierActiveMap,
  data: Dataset
): string {
  const details = computeComponentStatus(componentId, supplierActiveMap, data);
  return getRecommendedNextStep(componentId, details.status, details.inactiveSuppliers, data);
}

export function getImpactedPrograms(componentId: string, data: Dataset): Program[] {
  const programIds = data.programComponentLinks
    .filter((item) => item.componentId === componentId)
    .map((item) => item.programId);
  return data.programs.filter((item) => programIds.includes(item.id));
}

function getProgramsImpactedIfSupplierFails(
  supplierId: string,
  supplierActiveMap: SupplierActiveMap,
  data: Dataset
): Program[] {
  const currentlyActive = getSupplierActiveState(supplierId, supplierActiveMap, data);
  if (!currentlyActive) {
    return [];
  }

  const simulatedMap: SupplierActiveMap = {
    ...supplierActiveMap,
    [supplierId]: false
  };

  return data.programs.filter((program) => {
    const components = getProgramComponents(program.id, data);
    return components.some((component) => {
      const currentStatus = computeComponentStatus(component.id, supplierActiveMap, data).status;
      const simulatedStatus = computeComponentStatus(component.id, simulatedMap, data).status;
      return currentStatus !== 'NO_SUPPLIER' && simulatedStatus === 'NO_SUPPLIER';
    });
  });
}

function getSpofComponentsForSupplier(
  supplierId: string,
  supplierActiveMap: SupplierActiveMap,
  data: Dataset
): string[] {
  return data.components
    .filter((component) => {
      const details = computeComponentStatus(component.id, supplierActiveMap, data);
      return details.status === 'SPOF' && details.activeSuppliers.some((supplier) => supplier.id === supplierId);
    })
    .map((component) => component.name);
}

/**
 * Blast radius dominates: a supplier whose loss stops two programs outranks one
 * sitting on three SPOFs that all still have a second source somewhere. The 2x
 * is a judgement call, not a calibrated weight.
 */
function criticalityScore(node: CriticalSupplierNode): number {
  return node.affectedProgramsIfFails.length * 2 + node.spofComponents.length;
}

/**
 * Derived from the ranked node list rather than computed in its own pass.
 * These were two separate loops with different tie-breaks, so on a tie the
 * headline callout named one supplier while the table underneath it put a
 * different one on top. Same ordering now feeds both.
 */
function toTopCriticalSupplier(rankedNodes: CriticalSupplierNode[]): PortfolioSummary['topCriticalSupplier'] {
  const top = rankedNodes[0];
  if (!top) {
    return null;
  }

  const score = criticalityScore(top);
  if (score === 0) {
    return null;
  }

  return {
    supplierId: top.supplierId,
    supplierName: top.supplierName,
    score,
    reason: `${top.affectedProgramsIfFails.length} program(s) impacted if fails; ${top.spofComponents.length} SPOF component(s)`
  };
}

export function computePortfolioSummary(
  supplierActiveMap: SupplierActiveMap,
  data: Dataset
): PortfolioSummary {
  const breakdowns = data.programs.map((program) => ({
    program,
    breakdown: computeProgramBreakdown(program.id, supplierActiveMap, data)
  }));

  const averageHealthScore = Math.round(
    breakdowns.reduce((sum, item) => sum + item.breakdown.score, 0) / (breakdowns.length || 1)
  );

  const programsAtRisk = breakdowns.filter((item) => item.breakdown.score < PROGRAM_AT_RISK_THRESHOLD).length;

  const componentStatuses = data.components.map((component) => ({
    component,
    details: computeComponentStatus(component.id, supplierActiveMap, data)
  }));

  const totalNoSupplierComponents = componentStatuses.filter((item) => item.details.status === 'NO_SUPPLIER').length;
  const totalSpofComponents = componentStatuses.filter((item) => item.details.status === 'SPOF').length;

  // A sole source that is also adversary-linked is a different problem from a
  // sole source that is merely fragile: you cannot buy your way out of it with
  // more volume. Counted separately rather than rolled into the health score.
  const adversaryLinkedSoleSources = componentStatuses
    .filter(
      (item) =>
        item.details.status === 'SPOF' &&
        item.details.activeSuppliers[0]?.foreignExposure === 'ADVERSARY_LINKED'
    )
    .map((item) => item.component.name);

  const programRows = breakdowns.map((item) => ({
    programId: item.program.id,
    programName: item.program.name,
    score: item.breakdown.score,
    spofCount: item.breakdown.spofCount,
    noSupplierCount: item.breakdown.noSupplierCount,
    longestRestoreWeeks: item.breakdown.restore.longestRestoreWeeks,
    topDriverComponent: item.breakdown.topDriverComponent
  }));

  const criticalNodes = data.suppliers.map((supplier) => ({
    supplierId: supplier.id,
    supplierName: supplier.name,
    foreignExposure: supplier.foreignExposure,
    spofComponents: getSpofComponentsForSupplier(supplier.id, supplierActiveMap, data),
    affectedProgramsIfFails: getProgramsImpactedIfSupplierFails(supplier.id, supplierActiveMap, data).map(
      (program) => program.name
    )
  }));

  criticalNodes.sort((a, b) => {
    return (
      criticalityScore(b) - criticalityScore(a) ||
      b.affectedProgramsIfFails.length - a.affectedProgramsIfFails.length ||
      a.supplierName.localeCompare(b.supplierName)
    );
  });

  return {
    averageHealthScore,
    programsAtRisk,
    totalNoSupplierComponents,
    totalSpofComponents,
    adversaryLinkedSoleSources,
    topCriticalSupplier: toTopCriticalSupplier(criticalNodes),
    programRows,
    criticalNodes
  };
}

export function createSupplierActiveMap(data: Dataset): SupplierActiveMap {
  return data.suppliers.reduce<SupplierActiveMap>((acc, supplier) => {
    acc[supplier.id] = supplier.isActive;
    return acc;
  }, {});
}

export function getSupplierImpactSummary(
  supplierId: string,
  supplierActiveMap: SupplierActiveMap,
  data: Dataset
): { impactedPrograms: number; impactedComponents: number } {
  const isActive = getSupplierActiveState(supplierId, supplierActiveMap, data);
  if (!isActive) {
    return {
      impactedPrograms: 0,
      impactedComponents: 0
    };
  }

  const componentIds = data.componentSupplierLinks
    .filter((item) => item.supplierId === supplierId)
    .filter((item) => computeComponentStatus(item.componentId, supplierActiveMap, data).activeSuppliers.some((s) => s.id === supplierId))
    .map((item) => item.componentId);

  const uniqueComponentIds = [...new Set(componentIds)];

  const programIds = data.programComponentLinks
    .filter((item) => uniqueComponentIds.includes(item.componentId))
    .map((item) => item.programId);

  return {
    impactedPrograms: new Set(programIds).size,
    impactedComponents: uniqueComponentIds.length
  };
}

export function formatExposureLabel(exposure: ForeignExposure): string {
  if (exposure === 'ADVERSARY_LINKED') {
    return 'Adversary-linked';
  }
  if (exposure === 'ALLIED') {
    return 'Allied';
  }
  return 'Domestic';
}

export function formatRestoreWeeks(weeks: number | null): string {
  if (weeks === null) {
    return 'No known path';
  }
  if (weeks === 0) {
    return 'Restored';
  }
  return `${weeks} wks`;
}

export function formatStatusLabel(status: ComponentStatus): string {
  if (status === 'NO_SUPPLIER') {
    return 'No Supplier';
  }
  if (status === 'SPOF') {
    return 'SPOF';
  }
  return 'Healthy';
}

export function formatScenarioTimestamp(value: string | null): string {
  if (!value) {
    return 'Baseline';
  }
  return new Date(value).toLocaleString();
}

export function getProgramName(programId: string, data: Dataset): string {
  return getProgramById(programId, data).name;
}
