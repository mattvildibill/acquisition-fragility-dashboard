import type { PortfolioProgramRow } from '../data/types';

interface ProgramRailProps {
  rows: PortfolioProgramRow[];
  baselineRows?: PortfolioProgramRow[];
  compareEnabled: boolean;
  selectedProgramId: string;
  onSelectProgram: (programId: string) => void;
  scenarioNarrative: string;
  portfolioCurrent: number;
  portfolioBaseline: number;
  selectedProgramName: string;
  selectedProgramCurrent: number;
  selectedProgramBaseline: number;
  spofCurrent: number;
  spofBaseline: number;
  noSupplierCurrent: number;
  noSupplierBaseline: number;
}

export function ProgramRail({
  rows,
  baselineRows,
  compareEnabled,
  selectedProgramId,
  onSelectProgram,
  scenarioNarrative,
  portfolioCurrent,
  portfolioBaseline,
  selectedProgramName,
  selectedProgramCurrent,
  selectedProgramBaseline,
  spofCurrent,
  spofBaseline,
  noSupplierCurrent,
  noSupplierBaseline
}: ProgramRailProps): JSX.Element {
  const baselineById = new Map((baselineRows ?? []).map((row) => [row.programId, row]));

  return (
    <section className="card program-rail">
      <div className="section-head">
        <h3>Programs</h3>
        <span className="muted">Select to inspect impact</span>
      </div>

      <div className="rail-impact-summary">
        <p className="muted rail-impact-narrative">{scenarioNarrative}</p>
        <div className="rail-impact-grid">
          <ImpactPill label="Portfolio" baseline={portfolioBaseline} current={portfolioCurrent} />
          <ImpactPill label={selectedProgramName} baseline={selectedProgramBaseline} current={selectedProgramCurrent} />
          <ImpactPill label="SPOF" baseline={spofBaseline} current={spofCurrent} invert />
          <ImpactPill label="No Supplier" baseline={noSupplierBaseline} current={noSupplierCurrent} invert />
        </div>
        {!compareEnabled ? <p className="muted rail-impact-note">Enable compare in Scenario Tools for baseline deltas.</p> : null}
      </div>

      <div className="program-rail-list">
        {rows.map((row) => {
          const baseline = baselineById.get(row.programId);
          const delta = baseline ? row.score - baseline.score : 0;
          const isSelected = row.programId === selectedProgramId;

          return (
            <button
              key={row.programId}
              type="button"
              className={`program-rail-item ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectProgram(row.programId)}
            >
              <div className="program-rail-top">
                <strong>{row.programName}</strong>
                <span className="program-score-pill">{row.score}</span>
              </div>
              <div className="program-rail-meta">
                <span>SPOF: {row.spofCount}</span>
                <span>No supplier: {row.noSupplierCount}</span>
                {row.longestRestoreWeeks !== null ? (
                  <span className="rail-restore">Restore: {row.longestRestoreWeeks}w</span>
                ) : null}
              </div>
              <div className="program-rail-meta">
                <span className="muted">Top driver: {row.topDriverComponent}</span>
                {compareEnabled && baseline ? <span>{formatDelta(delta)}</span> : <span className="muted"> </span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface ImpactPillProps {
  label: string;
  baseline: number;
  current: number;
  invert?: boolean;
}

function ImpactPill({ label, baseline, current, invert = false }: ImpactPillProps): JSX.Element {
  const delta = current - baseline;
  const improving = invert ? delta <= 0 : delta >= 0;

  return (
    <article className="rail-impact-pill">
      <span>{label}</span>
      <strong>{current}</strong>
      <small className={improving ? 'positive' : 'negative'}>
        {delta > 0 ? '+' : ''}
        {delta}
      </small>
    </article>
  );
}

function formatDelta(value: number): string {
  if (value > 0) {
    return `Delta +${value}`;
  }
  return `Delta ${value}`;
}
