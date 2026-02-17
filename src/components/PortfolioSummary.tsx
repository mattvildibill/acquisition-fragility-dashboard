import type { PortfolioSummary as PortfolioSummaryType } from '../data/types';
import { ProgramsTable } from './ProgramsTable';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType;
  baselineSummary?: PortfolioSummaryType;
  compareEnabled: boolean;
  selectedProgramId: string;
  onSelectProgram: (programId: string) => void;
  lastUpdatedLabel: string;
  compact?: boolean;
  mode?: 'full' | 'list';
}

export function PortfolioSummary({
  summary,
  baselineSummary,
  compareEnabled,
  selectedProgramId,
  onSelectProgram,
  lastUpdatedLabel,
  compact = false,
  mode = 'full'
}: PortfolioSummaryProps): JSX.Element {
  const scoreDelta = compareEnabled && baselineSummary
    ? summary.averageHealthScore - baselineSummary.averageHealthScore
    : null;
  const riskDelta = compareEnabled && baselineSummary
    ? summary.programsAtRisk - baselineSummary.programsAtRisk
    : null;
  const noSupplierDelta = compareEnabled && baselineSummary
    ? summary.totalNoSupplierComponents - baselineSummary.totalNoSupplierComponents
    : null;
  const spofDelta = compareEnabled && baselineSummary
    ? summary.totalSpofComponents - baselineSummary.totalSpofComponents
    : null;

  if (mode === 'list') {
    return (
      <ProgramsTable
        rows={summary.programRows}
        baselineRows={baselineSummary?.programRows}
        compareEnabled={compareEnabled}
        onSelectProgram={onSelectProgram}
        selectedProgramId={selectedProgramId}
        lastUpdatedLabel={lastUpdatedLabel}
        compact
      />
    );
  }

  return (
    <section className={`card ${compact ? 'compact-card' : ''}`}>
      <h2>{compact ? 'Portfolio' : 'Portfolio Summary'}</h2>
      <div className={`kpi-grid ${compact ? 'kpi-grid-compact' : ''}`}>
        <KpiCard
          title="Portfolio Avg Health"
          value={summary.averageHealthScore}
          delta={scoreDelta}
        />
        <KpiCard
          title="Programs At Risk"
          value={summary.programsAtRisk}
          delta={riskDelta}
          risk
        />
        <KpiCard
          title="No-Supplier Components"
          value={summary.totalNoSupplierComponents}
          delta={noSupplierDelta}
          risk
        />
        <KpiCard
          title="SPOF Components"
          value={summary.totalSpofComponents}
          delta={spofDelta}
          risk
        />
        <article className="kpi-card">
          <h4>Top Critical Supplier</h4>
          <p className="kpi-value kpi-text">{summary.topCriticalSupplier?.supplierName ?? 'None'}</p>
          <p className="muted">{summary.topCriticalSupplier?.reason ?? 'No elevated supplier risk in current scenario.'}</p>
        </article>
      </div>

      <ProgramsTable
        rows={summary.programRows}
        baselineRows={baselineSummary?.programRows}
        compareEnabled={compareEnabled}
        onSelectProgram={onSelectProgram}
        selectedProgramId={selectedProgramId}
        lastUpdatedLabel={lastUpdatedLabel}
        compact={compact}
      />
    </section>
  );
}

interface KpiCardProps {
  title: string;
  value: number;
  delta: number | null;
  risk?: boolean;
}

function KpiCard({ title, value, delta, risk = false }: KpiCardProps): JSX.Element {
  return (
    <article className="kpi-card">
      <h4>{title}</h4>
      <p className={`kpi-value ${risk ? 'risk' : ''}`}>{value}</p>
      {delta !== null ? <p className="delta-text">{delta > 0 ? `+${delta}` : delta}</p> : <p className="muted">Baseline comparison off</p>}
    </article>
  );
}
