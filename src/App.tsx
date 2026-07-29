import { useEffect, useMemo, useState } from 'react';
import { dataset } from './data';
import type { SavedScenario, SupplierActiveMap } from './data/types';
import { CriticalNodes } from './components/CriticalNodes';
import { DemoIntro } from './components/DemoIntro';
import { ProgramRail } from './components/ProgramRail';
import { ScenarioControls } from './components/ScenarioControls';
import { SupplierPanel } from './components/SupplierPanel';
import { TopBar } from './components/TopBar';
import {
  computePortfolioSummary,
  computeProgramBreakdown,
  createSupplierActiveMap,
  formatScenarioTimestamp,
  getProgramName
} from './lib/scoring';
import {
  buildScenarioShareUrl,
  clearScenarioFromUrl,
  listSavedScenarios,
  loadScenarioById,
  saveScenario,
  scenarioMapFromUrl
} from './lib/scenario';
import { ProgramDetailPage } from './pages/ProgramDetailPage';
import { RiskOverviewPage } from './pages/RiskOverviewPage';

const DEFAULT_SHARED_SCENARIO_NAME = 'Shared Scenario';

export default function App(): JSX.Element {
  const baselineSupplierActiveMap = useMemo(() => createSupplierActiveMap(dataset), []);
  const supplierIds = useMemo(() => dataset.suppliers.map((supplier) => supplier.id), []);

  const [supplierActiveMap, setSupplierActiveMap] = useState<SupplierActiveMap>(baselineSupplierActiveMap);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(dataset.programs[0]?.id ?? '');

  const [scenarioName, setScenarioName] = useState<string>('Baseline');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [compareEnabled, setCompareEnabled] = useState<boolean>(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    setSavedScenarios(listSavedScenarios());

    const sharedMap = scenarioMapFromUrl(supplierIds);
    if (sharedMap) {
      setSupplierActiveMap(sharedMap);
      setScenarioName(DEFAULT_SHARED_SCENARIO_NAME);
      setSelectedScenarioId('');
      setLastUpdatedAt(new Date().toISOString());
    }
  }, [supplierIds]);

  const currentSummary = useMemo(() => computePortfolioSummary(supplierActiveMap, dataset), [supplierActiveMap]);
  const baselineSummary = useMemo(
    () => computePortfolioSummary(baselineSupplierActiveMap, dataset),
    [baselineSupplierActiveMap]
  );

  const currentProgramBreakdown = useMemo(
    () => computeProgramBreakdown(selectedProgramId, supplierActiveMap, dataset),
    [selectedProgramId, supplierActiveMap]
  );

  const baselineProgramBreakdown = useMemo(
    () => computeProgramBreakdown(selectedProgramId, baselineSupplierActiveMap, dataset),
    [selectedProgramId, baselineSupplierActiveMap]
  );

  const isBaselineScenario = useMemo(() => {
    return supplierIds.every((id) => (supplierActiveMap[id] ?? false) === (baselineSupplierActiveMap[id] ?? false));
  }, [supplierIds, supplierActiveMap, baselineSupplierActiveMap]);

  const lastUpdatedLabel = isBaselineScenario ? 'Baseline' : formatScenarioTimestamp(lastUpdatedAt);

  const handleToggleSupplier = (supplierId: string): void => {
    setSupplierActiveMap((current) => ({
      ...current,
      [supplierId]: !(current[supplierId] ?? false)
    }));
    setSelectedScenarioId('');
    setLastUpdatedAt(new Date().toISOString());
  };

  const handleSaveScenario = (): void => {
    const saved = saveScenario(scenarioName, supplierActiveMap, selectedScenarioId || null);
    setSelectedScenarioId(saved.scenarioId);
    setScenarioName(saved.name);
    setLastUpdatedAt(saved.updatedAt);
    setSavedScenarios(listSavedScenarios());
  };

  const handleLoadScenario = (scenarioId: string): void => {
    setSelectedScenarioId(scenarioId);
    if (!scenarioId) {
      return;
    }

    const loaded = loadScenarioById(scenarioId);
    if (!loaded) {
      return;
    }

    setSupplierActiveMap(loaded.supplierActiveMap);
    setScenarioName(loaded.name);
    setLastUpdatedAt(loaded.updatedAt);
  };

  const handleResetBaseline = (): void => {
    setSupplierActiveMap(baselineSupplierActiveMap);
    setScenarioName('Baseline');
    setSelectedScenarioId('');
    setLastUpdatedAt(null);
    clearScenarioFromUrl();
  };

  const handleCopyShareLink = async (): Promise<void> => {
    const shareUrl = buildScenarioShareUrl(supplierActiveMap, supplierIds);
    await navigator.clipboard.writeText(shareUrl);
  };

  const selectedProgramName = getProgramName(selectedProgramId, dataset);
  const spofDelta = currentSummary.totalSpofComponents - baselineSummary.totalSpofComponents;
  const noSupplierDelta = currentSummary.totalNoSupplierComponents - baselineSummary.totalNoSupplierComponents;
  const programScoreDelta = currentProgramBreakdown.score - baselineProgramBreakdown.score;

  const scenarioNarrative =
    noSupplierDelta > 0
      ? `Current scenario introduces ${noSupplierDelta} additional no-supplier component(s).`
      : spofDelta > 0
      ? `Current scenario introduces ${spofDelta} additional SPOF component(s).`
      : programScoreDelta < 0
      ? `${selectedProgramName} health drops by ${Math.abs(programScoreDelta)} points.`
      : 'Current scenario is stable versus baseline.';

  return (
    <main className="app-shell">
      <TopBar
        scenarioName={scenarioName}
        lastUpdatedLabel={lastUpdatedLabel}
        compareEnabled={compareEnabled}
        isBaseline={isBaselineScenario}
      />

      <DemoIntro />

      <div className="ark-layout">
        <aside className="control-rail">
          <ProgramRail
            rows={currentSummary.programRows}
            baselineRows={compareEnabled ? baselineSummary.programRows : undefined}
            compareEnabled={compareEnabled}
            selectedProgramId={selectedProgramId}
            onSelectProgram={setSelectedProgramId}
            scenarioNarrative={scenarioNarrative}
            portfolioCurrent={currentSummary.averageHealthScore}
            portfolioBaseline={baselineSummary.averageHealthScore}
            selectedProgramName={selectedProgramName}
            selectedProgramCurrent={currentProgramBreakdown.score}
            selectedProgramBaseline={baselineProgramBreakdown.score}
            spofCurrent={currentSummary.totalSpofComponents}
            spofBaseline={baselineSummary.totalSpofComponents}
            noSupplierCurrent={currentSummary.totalNoSupplierComponents}
            noSupplierBaseline={baselineSummary.totalNoSupplierComponents}
          />

          <SupplierPanel
            suppliers={dataset.suppliers}
            supplierActiveMap={supplierActiveMap}
            data={dataset}
            onToggleSupplier={handleToggleSupplier}
          />

          <section className="card scenario-utilities">
            <details>
              <summary>Scenario Tools</summary>
              <ScenarioControls
                scenarioName={scenarioName}
                onScenarioNameChange={setScenarioName}
                scenarios={savedScenarios}
                selectedScenarioId={selectedScenarioId}
                onLoadScenario={handleLoadScenario}
                onSaveScenario={handleSaveScenario}
                onResetBaseline={handleResetBaseline}
                compareEnabled={compareEnabled}
                onToggleCompare={setCompareEnabled}
                onCopyShareLink={handleCopyShareLink}
                compact
              />
            </details>
          </section>
        </aside>

        <section className="workspace-pane">
          <ProgramDetailPage
            selectedProgramId={selectedProgramId}
            data={dataset}
            supplierActiveMap={supplierActiveMap}
            baselineSupplierActiveMap={baselineSupplierActiveMap}
            compareEnabled={compareEnabled}
          />

          <section className="workspace-secondary-grid">
            <div className="secondary-panel">
              <RiskOverviewPage data={dataset} supplierActiveMap={supplierActiveMap} />
            </div>
            <div className="secondary-panel">
              <CriticalNodes nodes={currentSummary.criticalNodes} data={dataset} />
            </div>
          </section>

          <p className="muted workspace-timestamp">Last scenario update: {lastUpdatedLabel}</p>
        </section>
      </div>
    </main>
  );
}
