interface HeaderProps {
  isBaseline: boolean;
  onReset: () => void;
  onCopyLink: () => void;
  copyState: 'idle' | 'copied';
}

export function Header({ isBaseline, onReset, onCopyLink, copyState }: HeaderProps): JSX.Element {
  return (
    <header className="app-header card">
      <div className="app-header-top">
        <div className="app-header-title">
          <h1>Acquisition Fragility Dashboard</h1>
          <span className="app-header-badge">Live demo · synthetic data</span>
        </div>
        <div className="app-header-actions">
          <button type="button" onClick={onCopyLink} className="ghost-button">
            {copyState === 'copied' ? 'Link copied' : 'Copy link to this scenario'}
          </button>
          <button type="button" onClick={onReset} disabled={isBaseline} className="ghost-button">
            Reset to baseline
          </button>
        </div>
      </div>

      <p className="app-header-pitch">
        Programs depend on components, components are sourced from suppliers. This traces that graph to show what
        breaks if a supplier goes down, and how long it stays broken.
      </p>
      <p className="app-header-hint">
        <strong>Try it:</strong> turn off <strong>Cobalt Dynamics</strong> in the supplier list, then look at Aegis
        Communications Node.
      </p>
    </header>
  );
}
