import type { SavedScenario } from '../data/types';

export interface ScenarioControlsProps {
  scenarioName: string;
  onScenarioNameChange: (value: string) => void;
  scenarios: SavedScenario[];
  selectedScenarioId: string;
  onLoadScenario: (scenarioId: string) => void;
  onSaveScenario: () => void;
  onResetBaseline: () => void;
  compareEnabled: boolean;
  onToggleCompare: (value: boolean) => void;
  onCopyShareLink: () => void;
  compact?: boolean;
}

export function ScenarioControls({
  scenarioName,
  onScenarioNameChange,
  scenarios,
  selectedScenarioId,
  onLoadScenario,
  onSaveScenario,
  onResetBaseline,
  compareEnabled,
  onToggleCompare,
  onCopyShareLink,
  compact = false
}: ScenarioControlsProps): JSX.Element {
  const rootClassName = compact ? 'scenario-controls compact' : 'card scenario-controls';
  const gridClassName = compact ? 'scenario-controls-grid compact' : 'scenario-controls-grid';

  return (
    <section className={rootClassName}>
      {!compact ? <h3>Scenario Management</h3> : null}
      <div className={gridClassName}>
        <label className="field">
          Scenario Name
          <input
            type="text"
            value={scenarioName}
            onChange={(event) => onScenarioNameChange(event.target.value)}
            placeholder="Name current scenario"
          />
        </label>

        <label className="field">
          Load Scenario
          <select value={selectedScenarioId} onChange={(event) => onLoadScenario(event.target.value)}>
            <option value="">Select saved scenario</option>
            {scenarios.map((scenario) => (
              <option key={scenario.scenarioId} value={scenario.scenarioId}>
                {scenario.name}
              </option>
            ))}
          </select>
        </label>

        <div className="button-row">
          <button onClick={onSaveScenario}>Save Scenario</button>
          <button onClick={onResetBaseline}>Reset to Baseline</button>
          <button onClick={onCopyShareLink}>Copy Share Link</button>
        </div>

        <label className="compare-toggle">
          <input
            type="checkbox"
            checked={compareEnabled}
            onChange={(event) => onToggleCompare(event.target.checked)}
          />
          Compare Baseline vs Current
        </label>
      </div>
    </section>
  );
}
