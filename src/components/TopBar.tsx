interface TopBarProps {
  scenarioName: string;
  lastUpdatedLabel: string;
  compareEnabled: boolean;
  isBaseline: boolean;
}

export function TopBar({ scenarioName, lastUpdatedLabel, compareEnabled, isBaseline }: TopBarProps): JSX.Element {
  // The scenario name only changes on save, so toggling a supplier used to leave
  // this reading "Baseline" over data that was no longer the baseline.
  const scenarioLabel = isBaseline ? scenarioName : `${scenarioName} (edited)`;

  return (
    <header className="topbar card">
      <div className="topbar-inline compact">
        <h1>Acquisition Fragility Dashboard</h1>
        <div className="topbar-meta">
          <span className={`topbar-pill ${isBaseline ? '' : 'topbar-pill-edited'}`}>Scenario: {scenarioLabel}</span>
          <span className="topbar-pill">Compare: {compareEnabled ? 'On' : 'Off'}</span>
          <span className="topbar-pill">Updated: {lastUpdatedLabel}</span>
        </div>
      </div>
    </header>
  );
}
