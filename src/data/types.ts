export type Criticality = 'LOW' | 'MED' | 'HIGH';

/**
 * Ownership exposure of a supplier. Deliberately coarse — in a real system this
 * would be a resolved entity with a beneficial-ownership chain behind it, not an
 * enum someone typed into a JSON file.
 */
export type ForeignExposure = 'DOMESTIC' | 'ALLIED' | 'ADVERSARY_LINKED';

export interface Program {
  id: string;
  name: string;
}

export interface Component {
  id: string;
  name: string;
  criticality: Criticality;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  foreignExposure: ForeignExposure;
  riskScore?: number;
  isActive: boolean;
}

export interface ProgramComponentLink {
  programId: string;
  componentId: string;
}

export interface ComponentSupplierLink {
  componentId: string;
  supplierId: string;
  /**
   * Weeks to qualify this supplier for this specific component if they are not
   * already producing it. Lives on the link rather than the supplier because
   * qualification is per-part: the same vendor can be a drop-in for one board
   * and an 18-month first-article effort for another.
   */
  qualificationWeeks: number;
}

export interface Dataset {
  programs: Program[];
  components: Component[];
  suppliers: Supplier[];
  programComponentLinks: ProgramComponentLink[];
  componentSupplierLinks: ComponentSupplierLink[];
}

export type ComponentStatus = 'HEALTHY' | 'SPOF' | 'NO_SUPPLIER';

export type SupplierActiveMap = Record<string, boolean>;

export interface ProgramDriver {
  componentId: string;
  componentName: string;
  criticality: Criticality;
  status: ComponentStatus;
  penalty: number;
  /**
   * Weeks to get this component back to a healthy posture, or null when no
   * qualifiable alternate exists in the dataset at all. Null is the bad case,
   * not the good one — see RestoreOutlook.
   */
  recoveryWeeks: number | null;
  recommendedNextStep: string;
}

/**
 * The readiness half of the picture. The health score says how bad things are;
 * this says how long you are stuck there.
 */
export interface RestoreOutlook {
  gapComponents: number;
  longestRestoreWeeks: number | null;
  drivingComponent: string | null;
  unresolvableComponents: string[];
}

export interface ProgramBreakdown {
  programId: string;
  score: number;
  resilientCoveragePct: number;
  healthyCount: number;
  spofCount: number;
  noSupplierCount: number;
  totalPenalty: number;
  totalWeight: number;
  topDriverComponent: string;
  drivers: ProgramDriver[];
  restore: RestoreOutlook;
  explanation: string;
}

export interface PortfolioProgramRow {
  programId: string;
  programName: string;
  score: number;
  spofCount: number;
  noSupplierCount: number;
  longestRestoreWeeks: number | null;
  topDriverComponent: string;
}

export interface CriticalSupplierNode {
  supplierId: string;
  supplierName: string;
  foreignExposure: ForeignExposure;
  spofComponents: string[];
  affectedProgramsIfFails: string[];
}

export interface PortfolioSummary {
  averageHealthScore: number;
  programsAtRisk: number;
  totalNoSupplierComponents: number;
  totalSpofComponents: number;
  /**
   * Tracked and reported separately from the health score on purpose: folding an
   * ownership signal into a capacity score makes both numbers harder to act on.
   * Reasoning in the README.
   */
  adversaryLinkedSoleSources: string[];
  topCriticalSupplier: {
    supplierId: string;
    supplierName: string;
    score: number;
    reason: string;
  } | null;
  programRows: PortfolioProgramRow[];
  criticalNodes: CriticalSupplierNode[];
}
