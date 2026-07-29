import { useEffect, useMemo, useState } from 'react';
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

  const [supplierActiveMap, setSupplierActiveMap] = useState<SupplierActiveMap>(baselineSupplierActiveMap);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(dataset.programs[0]?.id ?? '');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    const sharedMap = scenarioMapFromUrl(supplierIds);
    if (sharedMap) {
      setSupplierActiveMap(sharedMap);
    }
  }, [supplierIds]);

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
    setCopyState('idle');
  };

  const handleReset = (): void => {
    setSupplierActiveMap(baselineSupplierActiveMap);
    clearScenarioFromUrl();
    setCopyState('idle');
  };

  const handleCopyLink = async (): Promise<void> => {
    const shareUrl = buildScenarioShareUrl(supplierActiveMap, supplierIds);
    await navigator.clipboard.writeText(shareUrl);
    setCopyState('copied');
  };

  return (
    <main className="app-shell">
      <Header isBaseline={isBaselineScenario} onReset={handleReset} onCopyLink={handleCopyLink} copyState={copyState} />

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
