import type { Dataset, RestoreOutlook, SupplierActiveMap } from '../data/types';
import { RiskBadge } from '../components/RiskBadge';
import {
  computeProgramBreakdown,
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
  const atRisk = breakdown.score < 60;

  return (
    <section className="card impact-panel">
      <div className="health-grid">
        <div className="health-score">
          <div className="score-label">Program Health Score</div>
          <div className={`score-value ${atRisk ? 'score-at-risk' : ''}`}>{breakdown.score}</div>
          {scoreDelta !== 0 ? (
            <p className={`score-delta ${scoreDelta < 0 ? 'negative' : 'positive'}`}>
              {scoreDelta > 0 ? '+' : ''}
              {scoreDelta} vs. baseline
            </p>
          ) : (
            <p className="muted score-delta">Baseline</p>
          )}
        </div>
        <div>
          <ul className="metric-list">
            <li>{breakdown.resilientCoveragePct}% with 2+ active suppliers</li>
            <li>{breakdown.spofCount} SPOF component(s)</li>
            <li>{breakdown.noSupplierCount} no-supplier component(s)</li>
          </ul>
        </div>
      </div>

      <RestoreOutlookBanner restore={breakdown.restore} />

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Criticality</th>
              <th>Status</th>
              <th>Restore</th>
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
                  {formatRestoreWeeks(driver.recoveryWeeks)}
                </td>
                <td>{getComponentMitigation(driver.componentId, supplierActiveMap, data)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="accordion">
        <summary>How scoring works</summary>
        <p className="muted">{breakdown.explanation}</p>
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
      <span className="restore-banner-label">Time to restore</span>
      <span className="restore-banner-value">{formatRestoreWeeks(restore.longestRestoreWeeks)}</span>
      <span className="muted">
        {restore.drivingComponent
          ? `Driven by ${restore.drivingComponent}; ${restore.gapComponents} component(s) with no active supplier.`
          : `${restore.gapComponents} component(s) with no active supplier.`}
        {stranded.length > 0 ? ` No qualified alternate on file for ${stranded.join(', ')}.` : ''}
      </span>
    </div>
  );
}
