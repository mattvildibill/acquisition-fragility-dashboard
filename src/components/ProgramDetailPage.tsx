import type { Dataset, RestoreOutlook, SupplierActiveMap } from '../data/types';
import { RiskBadge } from '../components/RiskBadge';
import {
  computeProgramBreakdown,
  PROGRAM_AT_RISK_THRESHOLD,
  formatRestoreWeeks,
  getComponentMitigation
} from '../lib/scoring';

interface ProgramDetailPageProps {
  selectedProgramId: string;
  data: Dataset;
  supplierActiveMap: SupplierActiveMap;
  baselineScore: number;
}

export function ProgramDetailPage({
  selectedProgramId,
  data,
  supplierActiveMap,
  baselineScore
}: ProgramDetailPageProps): JSX.Element {
  const selectedProgram = data.programs.find((program) => program.id === selectedProgramId) ?? data.programs[0];
  const breakdown = computeProgramBreakdown(selectedProgram.id, supplierActiveMap, data);
  const scoreDelta = breakdown.score - baselineScore;
  const atRisk = breakdown.score < PROGRAM_AT_RISK_THRESHOLD;

  return (
    <section className="card impact-panel">
      <h2>Component evidence <span className="muted">/ {selectedProgram.name}</span></h2>
      <div className="score-strip">
        <div className="score-tile score-tile-primary">
          <span className="score-label">Illustrative health score</span>
          <span className={`score-value ${atRisk ? 'score-at-risk' : ''}`}>{breakdown.score}</span>
          {scoreDelta !== 0 ? (
            <span className={`score-delta ${scoreDelta < 0 ? 'negative' : 'positive'}`}>
              {scoreDelta > 0 ? '+' : ''}
              {scoreDelta} vs. baseline
            </span>
          ) : (
            <span className="muted score-delta">Baseline</span>
          )}
        </div>
        <div className="score-tile">
          <span className="score-tile-value">{breakdown.resilientCoveragePct}%</span>
          <span className="score-tile-label">2+ active suppliers</span>
        </div>
        <div className="score-tile">
          <span className="score-tile-value">{breakdown.spofCount}</span>
          <span className="score-tile-label">single-source components</span>
        </div>
        <div className="score-tile">
          <span className="score-tile-value">{breakdown.noSupplierCount}</span>
          <span className="score-tile-label">components without supply</span>
        </div>
      </div>

      <RestoreOutlookBanner restore={breakdown.restore} />

      <p className="muted scroll-hint">Scroll the table sideways for qualification paths and recommendations.</p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Component impact and recommendations">
        <table className="data-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Criticality</th>
              <th>Status</th>
              <th>Qualification path</th>
              <th>Recommended Next Step</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.drivers.map((driver) => (
              <tr
                key={driver.componentId}
                className={
                  driver.status === 'NO_SUPPLIER' ? 'row-red' : driver.status === 'SPOF' ? 'row-orange' : ''
                }
              >
                <td>{driver.componentName}</td>
                <td>{driver.criticality}</td>
                <td>
                  <RiskBadge status={driver.status} />
                </td>
                <td className={driver.recoveryWeeks === null ? 'restore-stranded' : ''}>
                  {driver.status === 'HEALTHY' ? 'No current gap' : formatRestoreWeeks(driver.recoveryWeeks)}
                </td>
                <td>{getComponentMitigation(driver.componentId, supplierActiveMap, data)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="accordion">
        <summary>How scoring works</summary>
        <p className="muted">{breakdown.explanation} Divide the total penalty by total criticality weight, then round. This is a 10–100 index, not a probability; below 60 is flagged at risk.</p>
        <p className="muted">SPOF means single point of failure: one supplier is still delivering. Qualification adds redundancy for a single source, or closes a gap when no supplier remains. Gap estimates assume parallel qualification, with no inventory, tooling or capacity constraints.</p>
        <p className="muted">Ownership stays separate: an alternate can restore supply without resolving ownership exposure. All suppliers, programs and lead times here are invented.</p>
      </details>
    </section>
  );
}

function RestoreOutlookBanner({ restore }: { restore: RestoreOutlook }): JSX.Element | null {
  if (restore.gapComponents === 0) {
    return null;
  }

  const stranded = restore.unresolvableComponents;

  return (
    <div className="restore-banner" role="status">
      <span className="restore-banner-label">Estimated gap closure</span>
      <span className="restore-banner-value">{stranded.length > 0 ? 'No complete recovery estimate' : formatRestoreWeeks(restore.longestRestoreWeeks)}</span>
      <span className="muted">
        {restore.drivingComponent
          ? `Driven by ${restore.drivingComponent}; ${restore.gapComponents} component(s) with no active supplier.`
          : `${restore.gapComponents} component(s) with no active supplier.`}
        {stranded.length > 0 ? ` No qualifiable alternate on file for ${stranded.join(', ')}.` : ''}
      </span>
    </div>
  );
}
