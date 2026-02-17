export function DemoIntro(): JSX.Element {
  return (
    <section className="card demo-intro" aria-label="Demo context">
      <div className="demo-intro-head">
        <h2>Quick Context</h2>
        <span className="demo-intro-badge">Synthetic data</span>
      </div>

      <p className="muted">
        I built this as a weekend prototype to show product thinking and front-end execution for an acquisition-risk workflow. The
        programs, components, and suppliers here are sample records for demo purposes.
      </p>

      <div className="demo-intro-points">
        <p><strong>What to look for:</strong> single points of failure, no-supplier gaps, and how those risks roll up into program health.</p>
        <p><strong>Try this:</strong> pick a program, toggle a supplier, and watch the baseline vs current impact update.</p>
      </div>
    </section>
  );
}
