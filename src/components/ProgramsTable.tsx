import { useMemo, useState } from 'react';
import type { PortfolioProgramRow } from '../data/types';

interface ProgramsTableProps {
  rows: PortfolioProgramRow[];
  baselineRows?: PortfolioProgramRow[];
  compareEnabled: boolean;
  onSelectProgram: (programId: string) => void;
  selectedProgramId: string;
  lastUpdatedLabel: string;
  compact?: boolean;
}

type SortKey = 'programName' | 'score' | 'spofCount' | 'noSupplierCount' | 'topDriverComponent';

export function ProgramsTable({
  rows,
  baselineRows,
  compareEnabled,
  onSelectProgram,
  selectedProgramId,
  lastUpdatedLabel,
  compact = false
}: ProgramsTableProps): JSX.Element {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [ascending, setAscending] = useState<boolean>(false);

  const baselineByProgramId = useMemo(() => {
    return new Map((baselineRows ?? []).map((row) => [row.programId, row]));
  }, [baselineRows]);

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      const direction = ascending ? 1 : -1;

      if (sortKey === 'programName' || sortKey === 'topDriverComponent') {
        return direction * a[sortKey].localeCompare(b[sortKey]);
      }

      return direction * (a[sortKey] - b[sortKey]);
    });

    return next;
  }, [rows, sortKey, ascending]);

  const updateSort = (key: SortKey): void => {
    if (sortKey === key) {
      setAscending((current) => !current);
      return;
    }
    setSortKey(key);
    setAscending(key === 'programName' || key === 'topDriverComponent');
  };

  return (
    <section className={`card ${compact ? 'compact-card' : ''}`}>
      <div className="section-head">
        <h3>Programs</h3>
        <span className="muted">Last Updated: {lastUpdatedLabel}</span>
      </div>
      <div className={`table-scroll ${compact ? 'table-scroll-compact' : ''}`}>
        <table className="data-table clickable-rows">
          <thead>
            <tr>
              <th>
                <button className="sort-button" onClick={() => updateSort('programName')}>Program</button>
              </th>
              <th>
                <button className="sort-button" onClick={() => updateSort('score')}>Health Score</button>
              </th>
              <th>
                <button className="sort-button" onClick={() => updateSort('spofCount')}># SPOF</button>
              </th>
              <th>
                <button className="sort-button" onClick={() => updateSort('noSupplierCount')}># No Supplier</button>
              </th>
              <th>
                <button className="sort-button" onClick={() => updateSort('topDriverComponent')}>Top Driver Component</button>
              </th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const baseline = baselineByProgramId.get(row.programId);
              const delta = baseline ? row.score - baseline.score : 0;
              return (
                <tr
                  key={row.programId}
                  className={row.programId === selectedProgramId ? 'selected-row' : ''}
                  onClick={() => onSelectProgram(row.programId)}
                >
                  <td>{row.programName}</td>
                  <td>
                    {row.score}
                    {compareEnabled && baseline ? <span className="delta-text"> ({formatDelta(delta)})</span> : null}
                  </td>
                  <td>{row.spofCount}</td>
                  <td>{row.noSupplierCount}</td>
                  <td>{row.topDriverComponent}</td>
                  <td>{lastUpdatedLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDelta(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}
