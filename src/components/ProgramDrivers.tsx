import type { ProgramDriver } from '../data/types';
import { formatStatusLabel } from '../lib/scoring';

interface ProgramDriversProps {
  drivers: ProgramDriver[];
}

export function ProgramDrivers({ drivers }: ProgramDriversProps): JSX.Element {
  const penaltyDrivers = drivers.filter((item) => item.penalty > 0);
  const maxPenalty = Math.max(...penaltyDrivers.map((item) => item.penalty), 1);

  return (
    <section className="card">
      <h3>Top Drivers</h3>
      <p className="muted">Largest contributors to current program fragility score.</p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Criticality</th>
            <th>Status</th>
            <th>Penalty</th>
            <th>Magnitude</th>
          </tr>
        </thead>
        <tbody>
          {penaltyDrivers.length === 0 ? (
            <tr>
              <td colSpan={5}>No active penalty drivers for this program.</td>
            </tr>
          ) : (
            penaltyDrivers.map((driver) => (
              <tr key={driver.componentId}>
                <td>
                  <div>{driver.componentName}</div>
                  <small className="muted">{driver.recommendedNextStep}</small>
                </td>
                <td>{driver.criticality}</td>
                <td>{formatStatusLabel(driver.status)}</td>
                <td>{driver.penalty.toFixed(1)}</td>
                <td>
                  <div className="mini-bar-track">
                    <div className="mini-bar-fill" style={{ width: `${(driver.penalty / maxPenalty) * 100}%` }} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
