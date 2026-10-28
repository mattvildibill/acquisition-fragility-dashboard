import type { Dataset, SupplierActiveMap } from '../data/types';
import { compareRecovery, disruptedPaths } from '../lib/recovery';
import { formatStatusLabel } from '../lib/scoring';

interface Props { data: Dataset; supplierActiveMap: SupplierActiveMap; programId: string; onSelectProgram: (id: string) => void }
export function RecoveryWorkspace({ data, supplierActiveMap, programId, onSelectProgram }: Props): JSX.Element {
  const paths = disruptedPaths(supplierActiveMap, data);
  const comparison = compareRecovery(programId, supplierActiveMap, data);
  const { baseline, current, closeGaps, harden } = comparison;
  const name = data.programs.find(p => p.id === programId)?.name;
  const columns = [baseline, current, closeGaps.breakdown, harden.breakdown];
  const choices = [closeGaps, harden];
  return <section className="recovery-workspace" aria-label="Dependency impact and recovery comparison">
    <div className="impact-paths">
      <span className="project-eyebrow">02 / Trace the disruption</span>
      <h2>Follow the dependency paths</h2>
      {paths.length === 0 ? <p className="path-empty">No baseline producers offline. Deactivate Cobalt Dynamics to trace a shared component into two programs.</p> :
        <ul className="path-list">{paths.map(path => <li key={`${path.supplier.id}-${path.component.id}`} className={`path-row path-${path.status.toLowerCase()}`}>
          <div><span className="path-label">Offline producer</span><strong>{path.supplier.name}</strong></div>
          <span className="path-arrow" aria-hidden="true">→</span>
          <div><span className="path-label">{formatStatusLabel(path.status)}</span><strong>{path.component.name}</strong></div>
          <span className="path-arrow" aria-hidden="true">→</span>
          <div><span className="path-label">Dependent programs</span>{path.programs.map(p => <button key={p.id} className="path-program" onClick={() => onSelectProgram(p.id)} aria-pressed={p.id === programId}>{p.name}</button>)}</div>
        </li>)}</ul>}
      <p className="muted">Paths show lost producers; a dependency can remain supplied by another active source.</p>
    </div>
    <div className="comparison-panel">
      <span className="project-eyebrow">03 / Compare recovery choices</span>
      <h2>{name}</h2>
      <p className="comparison-summary">{current.noSupplierCount} supply gap{current.noSupplierCount === 1 ? '' : 's'} now. Choice A closes {current.noSupplierCount - closeGaps.breakdown.noSupplierCount}; choice B leaves {harden.breakdown.spofCount} single-source component{harden.breakdown.spofCount === 1 ? '' : 's'}. Restored delivery does not guarantee redundancy.</p>
      <p className="comparison-horizon"><strong>Preview after qualification completes.</strong> Synthetic weeks assume all work runs in parallel; no dates, costs or capacity forecast.</p>
      <p className="muted scroll-hint">Scroll the comparison sideways to see both choices.</p>
      <div className="table-scroll" role="region" aria-label="Baseline and recovery choices" tabIndex={0}>
        <table className="data-table comparison-table">
          <caption className="sr-only">Selected program outcomes after all assumed qualification completes</caption>
          <thead><tr><th scope="col">Outcome</th><th scope="col">Baseline</th><th scope="col">Current</th><th scope="col">A · Close gaps</th><th scope="col">B · Add redundancy</th></tr></thead>
          <tbody>
            <tr><th scope="row">Health / 100</th>{columns.map((c, i) => <td key={i} className="comparison-score">{c.score}</td>)}</tr>
            <tr><th scope="row">Supply gaps</th>{columns.map((c, i) => <td key={i}>{c.noSupplierCount}</td>)}</tr>
            <tr><th scope="row">Single sources</th>{columns.map((c, i) => <td key={i}>{c.spofCount}</td>)}</tr>
            <tr><th scope="row">Qualification envelope</th><td>—</td><td>—</td>{choices.map((c, i) => <td key={i}>{c.weeks === null ? 'Unknown' : c.supplierIds.length ? `${c.weeks} wks` : 'No new work'}</td>)}</tr>
            <tr><th scope="row">Reserve suppliers added</th><td>—</td><td>—</td>{choices.map((c, i) => <td key={i}>{c.supplierIds.map(id => data.suppliers.find(s => s.id === id)?.name).join(', ') || 'None'}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <p className="muted">A qualifies the fastest available reserves to close gaps. B also seeks two sources for each fragile component. These are previews; your scenario stays unchanged.</p>
      {choices.map((c, i) => c.unmet.length ? <p className="residual-note" key={i}><strong>Choice {i === 0 ? 'A' : 'B'} limitation:</strong> {c.unmet.join(', ')} cannot reach {i === 0 ? 'one active source' : 'two active sources'} using available reserves.</p> : null)}
      <details className="comparison-evidence"><summary>Qualification assumptions &amp; calculation evidence</summary>
        <p>All times are synthetic weeks, not delivery forecasts or dates. Work starts together with unlimited qualification capacity. Activating a supplier covers every linked part in this model; the envelope is the longest of those links, including parts outside this program. It is not an estimate of when the first gap closes. Offline baseline producers are never recovery candidates.</p>
        <p>Selection is deterministic: components by ID, reserves by shortest per-part qualification, ties by supplier ID. This is a local heuristic, not an optimal procurement plan. Scores use the original weighted 45/90 penalties. Ownership, capacity, cost and sub-tier risk are not resolved by a higher score.</p>
        {choices.map((c, i) => <div key={i}><h3>Choice {i === 0 ? 'A' : 'B'} qualification links</h3>{c.links.length ? <ul>{c.links.map(l => <li key={`${l.componentId}-${l.supplierId}`}>{data.suppliers.find(s => s.id === l.supplierId)?.name} → {data.components.find(part => part.id === l.componentId)?.name}: {l.qualificationWeeks} weeks</li>)}</ul> : <p>No reserve qualifications added.</p>}</div>)}
      </details>
    </div>
  </section>;
}
