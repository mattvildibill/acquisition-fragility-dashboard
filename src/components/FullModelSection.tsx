import type { CriticalSupplierNode, Dataset, SupplierActiveMap } from '../data/types';
import { CriticalNodes } from './CriticalNodes';
import { DependencyTree } from './DependencyTree';

interface FullModelSectionProps {
  selectedProgramId: string;
  data: Dataset;
  supplierActiveMap: SupplierActiveMap;
  criticalNodes: CriticalSupplierNode[];
  adversaryLinkedSoleSources: string[];
}

export function FullModelSection({
  selectedProgramId,
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

        <DependencyTree programId={selectedProgramId} supplierActiveMap={supplierActiveMap} data={data} />
        <CriticalNodes nodes={criticalNodes} data={data} />
      </div>
    </details>
  );
}
