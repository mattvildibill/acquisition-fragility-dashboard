import type { Dataset, SupplierActiveMap } from '../data/types';
import { RiskBadge } from '../components/RiskBadge';
import { computeComponentStatus, getImpactedPrograms, getComponentMitigation } from '../lib/scoring';

interface RiskOverviewPageProps {
  data: Dataset;
  supplierActiveMap: SupplierActiveMap;
}

export function RiskOverviewPage({ data, supplierActiveMap }: RiskOverviewPageProps): JSX.Element {
  const flaggedComponents = data.components
    .map((component) => {
      const details = computeComponentStatus(component.id, supplierActiveMap, data);
      const impactedPrograms = getImpactedPrograms(component.id, data);
      return {
        component,
        details,
        impactedPrograms,
        mitigation: getComponentMitigation(component.id, supplierActiveMap, data)
      };
    })
    .filter((item) => item.details.status === 'SPOF' || item.details.status === 'NO_SUPPLIER');

  return (
    <section className="card risk-panel">
      <h2>Risk Overview</h2>
      <p className="muted">Current SPOF and no-supplier components with impacted programs and suggested action.</p>

      {flaggedComponents.length === 0 ? (
        <p className="muted">No SPOF or no-supplier components in the current scenario.</p>
      ) : (
        <div className="risk-grid">
          {flaggedComponents.map(({ component, details, impactedPrograms, mitigation }) => (
            <article key={component.id} className={`risk-card ${details.status === 'NO_SUPPLIER' ? 'risk-card-red' : 'risk-card-orange'}`}>
              <div className="risk-card-head">
                <strong>{component.name}</strong>
                <RiskBadge status={details.status} />
              </div>
              <div className="risk-meta">Criticality: {component.criticality}</div>
              <div className="risk-meta">Programs: {impactedPrograms.map((program) => program.name).join(', ')}</div>
              <div className="risk-next-step">
                <span>Next step</span>
                <p>{mitigation}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
