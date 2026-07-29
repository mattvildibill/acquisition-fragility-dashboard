import type { PortfolioProgramRow } from '../data/types';
import { PROGRAM_AT_RISK_THRESHOLD } from '../lib/scoring';

interface ProgramTabsProps {
  rows: PortfolioProgramRow[];
  selectedProgramId: string;
  onSelectProgram: (programId: string) => void;
  ariaLabel?: string;
}

export function ProgramTabs({
  rows,
  selectedProgramId,
  onSelectProgram,
  ariaLabel = 'Select a program'
}: ProgramTabsProps): JSX.Element {
  return (
    <div className="program-tabs" role="tablist" aria-label={ariaLabel}>
      {rows.map((row) => {
        const atRisk = row.score < PROGRAM_AT_RISK_THRESHOLD;
        const isSelected = row.programId === selectedProgramId;

        return (
          <button
            key={row.programId}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={`program-tab ${isSelected ? 'active' : ''}`}
            onClick={() => onSelectProgram(row.programId)}
          >
            {atRisk ? <span className="program-tab-dot" aria-hidden="true" /> : null}
            <span className="program-tab-name">{row.programName}</span>
            <span className="program-tab-score">{row.score}</span>
          </button>
        );
      })}
    </div>
  );
}
