import { useMemo, useRef, useState } from 'react';
import { dataset } from './data';
import type { SupplierActiveMap } from './data/types';
import { DependencyTree } from './components/DependencyTree';
import { EvidenceDialog } from './components/EvidenceDialog';
import { RecoveryWorkspace } from './components/RecoveryWorkspace';
import { Header } from './components/Header';
import { SupplierPanel } from './components/SupplierPanel';
import { computePortfolioSummary, computeProgramBreakdown, createSupplierActiveMap } from './lib/scoring';
import { compareRecovery } from './lib/recovery';
import { buildScenarioShareUrl, clearScenarioFromUrl, scenarioMapFromUrl } from './lib/scenario';

export default function App(): JSX.Element {
  const baselineSupplierActiveMap = useMemo(() => createSupplierActiveMap(dataset), []);
  const supplierIds = useMemo(() => dataset.suppliers.map((supplier) => supplier.id), []);

  const [supplierActiveMap, setSupplierActiveMap] = useState<SupplierActiveMap>(() => scenarioMapFromUrl(supplierIds) ?? baselineSupplierActiveMap);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('p2');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copyRequest = useRef(0);
  const [shareUrl, setShareUrl] = useState('');
  const [invalidScenario, setInvalidScenario] = useState(() =>
    new URLSearchParams(window.location.search).has('sc') && !scenarioMapFromUrl(supplierIds)
  );

  const currentSummary = useMemo(() => computePortfolioSummary(supplierActiveMap, dataset), [supplierActiveMap]);
  const baselineSummary = useMemo(
    () => computePortfolioSummary(baselineSupplierActiveMap, dataset),
    [baselineSupplierActiveMap]
  );

  const baselineProgramScore = useMemo(
    () => computeProgramBreakdown(selectedProgramId, baselineSupplierActiveMap, dataset).score,
    [selectedProgramId, baselineSupplierActiveMap]
  );

  const comparison = useMemo(() => compareRecovery(selectedProgramId, supplierActiveMap, dataset), [selectedProgramId, supplierActiveMap]);

  const isBaselineScenario = useMemo(() => {
    return supplierIds.every((id) => (supplierActiveMap[id] ?? false) === (baselineSupplierActiveMap[id] ?? false));
  }, [supplierIds, supplierActiveMap, baselineSupplierActiveMap]);

  const handleToggleSupplier = (supplierId: string): void => {
    setSupplierActiveMap((current) => ({
      ...current,
      [supplierId]: !(current[supplierId] ?? false)
    }));
    copyRequest.current += 1;
    setCopyState('idle');
    setShareUrl('');
    setInvalidScenario(false);
  };

  const handleReset = (): void => {
    setSupplierActiveMap(baselineSupplierActiveMap);
    clearScenarioFromUrl();
    copyRequest.current += 1;
    setCopyState('idle');
    setShareUrl('');
    setInvalidScenario(false);
  };

  const handleCopyLink = async (): Promise<void> => {
    const request = ++copyRequest.current;
    const shareUrl = buildScenarioShareUrl(supplierActiveMap, supplierIds);
    setShareUrl(shareUrl);
    try {
      await navigator.clipboard.writeText(shareUrl);
      if (request === copyRequest.current) setCopyState('copied');
    } catch {
      if (request === copyRequest.current) setCopyState('failed');
    }
  };

  return (
    <main className="app-shell">
      <Header isBaseline={isBaselineScenario && !invalidScenario} onReset={handleReset} onCopyLink={handleCopyLink} copyState={copyState} />
      {invalidScenario ? <p className="notice" role="status">This scenario link is incomplete or invalid. Showing the baseline; reset to clear the link.</p> : null}
      {copyState === 'failed' ? (
        <label className="notice">Clipboard unavailable. Select and copy this scenario link:
          <input aria-label="Scenario link" value={shareUrl} readOnly onFocus={(event) => event.target.select()} />
        </label>
      ) : null}

      <section className="decision-controls" aria-label="Scenario controls">
        <SupplierPanel suppliers={dataset.suppliers} supplierActiveMap={supplierActiveMap} onToggleSupplier={handleToggleSupplier} />
        <div className="program-control"><label htmlFor="program-picker">2. Inspect a program</label>
          <select id="program-picker" value={selectedProgramId} onChange={e => setSelectedProgramId(e.target.value)}>
            {currentSummary.programRows.map(p => <option key={p.programId} value={p.programId}>{p.programName}{p.noSupplierCount ? ` · ${p.noSupplierCount} supply gap(s)` : ''}</option>)}
          </select><span className="control-note">{dataset.programs.length} synthetic programs · {dataset.components.length} components · {dataset.suppliers.length} suppliers</span>
        </div>
        <EvidenceDialog data={dataset} programId={selectedProgramId} supplierActiveMap={supplierActiveMap} baselineScore={baselineProgramScore} summary={currentSummary} />
      </section>
      <section className="mobile-outcome" aria-label="Quick outcome">
        <strong>{comparison.current.noSupplierCount ? `${comparison.current.noSupplierCount} supply gap(s)` : 'Supply is flowing'} · {comparison.current.spofCount} with one source</strong>
        <div><span>Now <b>{comparison.current.score}</b></span><span>After A <b>{comparison.closeGaps.breakdown.score}</b></span><span>After B <b>{comparison.harden.breakdown.score}</b></span></div>
        <p>Health / 100, after synthetic qualification. <a href="#recovery-comparison">Compare choices ↓</a></p>
      </section>
      <div className="decision-workspace">
        <DependencyTree programId={selectedProgramId} data={dataset} supplierActiveMap={supplierActiveMap} onSelectProgram={setSelectedProgramId} />
        <RecoveryWorkspace data={dataset} supplierActiveMap={supplierActiveMap} programId={selectedProgramId} onSelectProgram={setSelectedProgramId} />
      </div>

      <p className="muted portfolio-footnote">
        Portfolio average health: {currentSummary.averageHealthScore}
        {baselineSummary.averageHealthScore !== currentSummary.averageHealthScore
          ? ` (baseline ${baselineSummary.averageHealthScore})`
          : ''}
        {' · '}
        {currentSummary.programsAtRisk} of {dataset.programs.length} program(s) at risk
      </p>
    </main>
  );
}
