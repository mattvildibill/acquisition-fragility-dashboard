interface HeaderProps {
  isBaseline: boolean;
  onReset: () => void;
  onCopyLink: () => void;
  copyState: 'idle' | 'copied' | 'failed';
}

export function Header({ isBaseline, onReset, onCopyLink, copyState }: HeaderProps): JSX.Element {
  return (
    <header className="app-header card">
      <div className="app-header-top">
        <div className="app-header-title">
          <span className="project-eyebrow">Acquisition decision lab / 01</span>
          <h1>Acquisition Fragility Dashboard</h1>
          <span className="app-header-badge">Interactive model · synthetic data</span>
        </div>
        <div className="app-header-actions" aria-live="polite">
          <button type="button" onClick={onCopyLink} className="ghost-button">
            {copyState === 'copied' ? 'Link copied' : 'Copy link to this scenario'}
          </button>
          <button type="button" onClick={onReset} disabled={isBaseline} className="ghost-button">
            Reset to baseline
          </button>
        </div>
      </div>

      <p className="app-header-pitch">If one supplier stops, what breaks—and what could restore supply? Start with Cobalt, then compare the two recovery choices.</p>
    </header>
  );
}
