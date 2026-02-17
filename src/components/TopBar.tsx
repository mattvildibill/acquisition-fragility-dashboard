interface TopBarProps {
  scenarioName: string;
  lastUpdatedLabel: string;
  compareEnabled: boolean;
}

export function TopBar({ scenarioName, lastUpdatedLabel, compareEnabled }: TopBarProps): JSX.Element {
  return (
    <header className="topbar card">
      <div className="topbar-inline compact">
        <h1>Acquisition Fragility Dashboard</h1>
        <div className="topbar-meta">
          <span className="topbar-pill">Scenario: {scenarioName}</span>
          <span className="topbar-pill">Compare: {compareEnabled ? 'On' : 'Off'}</span>
          <span className="topbar-pill">Updated: {lastUpdatedLabel}</span>
        </div>
      </div>
    </header>
  );
}
