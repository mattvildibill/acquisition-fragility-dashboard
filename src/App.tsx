import { useMemo, useRef, useState } from 'react';
import { dataset } from './data';
import type { SupplierActiveMap } from './data/types';
import { FullModelSection } from './components/FullModelSection';
import { Header } from './components/Header';
import { ProgramTabs } from './components/ProgramTabs';
import { SupplierPanel } from './components/SupplierPanel';
import { ProgramDetailPage } from './components/ProgramDetailPage';
import { computePortfolioSummary, computeProgramBreakdown, createSupplierActiveMap } from './lib/scoring';
import { buildScenarioShareUrl, clearScenarioFromUrl, scenarioMapFromUrl } from './lib/scenario';

export default function App(): JSX.Element {
  const baselineSupplierActiveMap = useMemo(() => createSupplierActiveMap(dataset), []);
  const supplierIds = useMemo(() => dataset.suppliers.map((supplier) => supplier.id), []);

  const [supplierActiveMap, setSupplierActiveMap] = useState<SupplierActiveMap>(() => scenarioMapFromUrl(supplierIds) ?? baselineSupplierActiveMap);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(dataset.programs[0]?.id ?? '');
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

      <div className="fold-layout">
        <SupplierPanel
          suppliers={dataset.suppliers}
          supplierActiveMap={supplierActiveMap}
          onToggleSupplier={handleToggleSupplier}
        />

        <section className="impact-column">
          <ProgramTabs
            rows={currentSummary.programRows}
            selectedProgramId={selectedProgramId}
            onSelectProgram={setSelectedProgramId}
          />
          <ProgramDetailPage
            selectedProgramId={selectedProgramId}
            data={dataset}
            supplierActiveMap={supplierActiveMap}
            baselineScore={baselineProgramScore}
          />
        </section>
      </div>

      <FullModelSection
        selectedProgramId={selectedProgramId}
        onSelectProgram={setSelectedProgramId}
        programRows={currentSummary.programRows}
        data={dataset}
        supplierActiveMap={supplierActiveMap}
        criticalNodes={currentSummary.criticalNodes}
        adversaryLinkedSoleSources={currentSummary.adversaryLinkedSoleSources}
      />

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
