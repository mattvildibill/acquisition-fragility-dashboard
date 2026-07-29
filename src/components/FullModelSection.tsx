import type { CriticalSupplierNode, Dataset, PortfolioProgramRow, SupplierActiveMap } from '../data/types';
import { CriticalNodes } from './CriticalNodes';
import { DependencyTree } from './DependencyTree';
import { ProgramTabs } from './ProgramTabs';

interface FullModelSectionProps {
  selectedProgramId: string;
  onSelectProgram: (programId: string) => void;
  programRows: PortfolioProgramRow[];
  data: Dataset;
  supplierActiveMap: SupplierActiveMap;
  criticalNodes: CriticalSupplierNode[];
  adversaryLinkedSoleSources: string[];
}

export function FullModelSection({
  selectedProgramId,
  onSelectProgram,
  programRows,
  data,
  supplierActiveMap,
  criticalNodes,
  adversaryLinkedSoleSources
}: FullModelSectionProps): JSX.Element {
  return (
    <details className="full-model">
      <summary>See the full model — dependency graph and supplier ranking</summary>
      <div className="full-model-body">
        {adversaryLinkedSoleSources.length > 0 ? (
          <p className="exposure-callout">
            {adversaryLinkedSoleSources.length} component(s) sole-sourced to an adversary-linked supplier:{' '}
            {adversaryLinkedSoleSources.join(', ')}. Tracked separately from the health score — second-sourcing fixes
            availability, not ownership.
          </p>
        ) : null}

        <div className="full-model-program-picker">
          <span className="muted full-model-program-label">Dependency graph for:</span>
          <ProgramTabs
            rows={programRows}
            selectedProgramId={selectedProgramId}
            onSelectProgram={onSelectProgram}
            ariaLabel="Select a program for the dependency graph"
          />
        </div>

        <DependencyTree programId={selectedProgramId} supplierActiveMap={supplierActiveMap} data={data} />
        <CriticalNodes nodes={criticalNodes} data={data} />
      </div>
    </details>
  );
}
