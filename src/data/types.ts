export type Criticality = 'LOW' | 'MED' | 'HIGH';

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
  recommendedNextStep: string;
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
  explanation: string;
}

export interface PortfolioProgramRow {
  programId: string;
  programName: string;
  score: number;
  spofCount: number;
  noSupplierCount: number;
  topDriverComponent: string;
}

export interface CriticalSupplierNode {
  supplierId: string;
  supplierName: string;
  spofComponents: string[];
  affectedProgramsIfFails: string[];
}

export interface PortfolioSummary {
  averageHealthScore: number;
  programsAtRisk: number;
  totalNoSupplierComponents: number;
  totalSpofComponents: number;
  topCriticalSupplier: {
    supplierId: string;
    supplierName: string;
    score: number;
    reason: string;
  } | null;
  programRows: PortfolioProgramRow[];
  criticalNodes: CriticalSupplierNode[];
}

export interface SavedScenario {
  scenarioId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  supplierActiveMap: SupplierActiveMap;
}
