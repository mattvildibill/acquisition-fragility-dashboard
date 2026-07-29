import type { Dataset, RestoreOutlook, SupplierActiveMap } from '../data/types';
import { DependencyTree } from '../components/DependencyTree';
import { ProgramDrivers } from '../components/ProgramDrivers';
import { RiskBadge } from '../components/RiskBadge';
import {
  computeComponentStatus,
  computeProgramBreakdown,
  formatRestoreWeeks,
  getComponentMitigation,
  getProgramComponents
} from '../lib/scoring';

interface ProgramDetailPageProps {
  selectedProgramId: string;
  data: Dataset;
  supplierActiveMap: SupplierActiveMap;
  baselineSupplierActiveMap: SupplierActiveMap;
  compareEnabled: boolean;
}

export function ProgramDetailPage({
  selectedProgramId,
  data,
  supplierActiveMap,
  baselineSupplierActiveMap,
  compareEnabled
}: ProgramDetailPageProps): JSX.Element {
  const selectedProgram = data.programs.find((program) => program.id === selectedProgramId) ?? data.programs[0];

  const breakdown = computeProgramBreakdown(selectedProgram.id, supplierActiveMap, data);
  const baselineBreakdown = compareEnabled
    ? computeProgramBreakdown(selectedProgram.id, baselineSupplierActiveMap, data)
    : null;

  const scoreDelta = baselineBreakdown ? breakdown.score - baselineBreakdown.score : null;
  const requiredComponents = getProgramComponents(selectedProgram.id, data);

  return (
    <section className="card">
      <div className="program-head">
        <h2>Program Detail</h2>
        <span className="program-selected-label">{selectedProgram.name}</span>
      </div>

      <div className="health-grid">
        <div className="health-score">
          <div className="score-label">Program Health Score</div>
          <div className="score-value">{breakdown.score}</div>
          {baselineBreakdown ? (
            <p className="muted">
              Baseline {baselineBreakdown.score} | Current {breakdown.score} | Delta {scoreDelta && scoreDelta > 0 ? '+' : ''}
              {scoreDelta ?? 0}
            </p>
          ) : null}
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

      <details className="accordion">
        <summary>How scoring works</summary>
        <p className="muted">{breakdown.explanation}</p>
      </details>

      <DependencyTree programId={selectedProgram.id} supplierActiveMap={supplierActiveMap} data={data} />

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Criticality</th>
              <th>Status</th>
              <th>Active Suppliers</th>
              <th>Penalty</th>
              <th>Restore</th>
              <th>Recommended Next Step</th>
            </tr>
          </thead>
          <tbody>
            {requiredComponents.map((component) => {
              const componentStatus = computeComponentStatus(component.id, supplierActiveMap, data);
              const driver = breakdown.drivers.find((item) => item.componentId === component.id);
              return (
                <tr
                  key={component.id}
                  className={
                    componentStatus.status === 'NO_SUPPLIER'
                      ? 'row-red'
                      : componentStatus.status === 'SPOF'
                      ? 'row-orange'
                      : ''
                  }
                >
                  <td>{component.name}</td>
                  <td>{component.criticality}</td>
                  <td>
                    <RiskBadge status={componentStatus.status} />
                  </td>
                  <td>
                    {componentStatus.activeSuppliers.length > 0
                      ? componentStatus.activeSuppliers.map((supplier) => supplier.name).join(', ')
                      : 'None'}
                  </td>
                  <td>{driver?.penalty.toFixed(1) ?? '0.0'}</td>
                  {/* Not `driver?.recoveryWeeks ?? 0` — null means "no way back",
                      and ?? would quietly render that as "Restored". */}
                  <td className={driver && driver.recoveryWeeks === null ? 'restore-stranded' : ''}>
                    {driver ? formatRestoreWeeks(driver.recoveryWeeks) : '—'}
                  </td>
                  <td>{getComponentMitigation(component.id, supplierActiveMap, data)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ProgramDrivers drivers={breakdown.drivers} />
    </section>
  );
}

/**
 * The score says how bad it is. This says how long you are stuck there, which is
 * usually the number that actually drives a decision.
 */
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
