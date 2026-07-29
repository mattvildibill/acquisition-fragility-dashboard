export function DemoIntro(): JSX.Element {
  return (
    <section className="card demo-intro" aria-label="Demo context">
      <div className="demo-intro-head">
        <h2>Quick Context</h2>
        <span className="demo-intro-badge">Synthetic data</span>
      </div>

      <p className="muted">
        Programs depend on components, components are sourced from suppliers. This traces that graph to find where a single
        supplier failure turns into a program that stops — and how long it stays stopped. Every program, part, and vendor below
        is invented.
      </p>

      <div className="demo-intro-points">
        <p>
          <strong>Try this:</strong> deactivate Cobalt Dynamics, the sole source for the Secure RF Modem, then open Aegis
          Communications Node.
        </p>
        <p>
          <strong>What happens:</strong> two programs drop below the at-risk line, and the only qualified alternate is 64 weeks
          out.
        </p>
      </div>
    </section>
  );
}
