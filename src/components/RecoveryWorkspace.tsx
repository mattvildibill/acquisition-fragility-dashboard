import type { Dataset, SupplierActiveMap } from '../data/types';
import { compareRecovery, disruptedPaths } from '../lib/recovery';

interface Props { data: Dataset; supplierActiveMap: SupplierActiveMap; programId: string; onSelectProgram: (id: string) => void }
export function RecoveryWorkspace({ data, supplierActiveMap, programId, onSelectProgram }: Props): JSX.Element {
  const paths = disruptedPaths(supplierActiveMap, data);
  const { baseline, current, closeGaps, harden } = compareRecovery(programId, supplierActiveMap, data);
  const choices = [closeGaps, harden];
  const affectedPrograms = data.programs.filter(p => paths.some(path => path.programs.some(item => item.id === p.id)));
  const rows = [baseline, current, closeGaps.breakdown, harden.breakdown];
  return <section id="recovery-comparison" className="recovery-workspace" aria-label="Recovery comparison">
    <div className="comparison-panel">
      <span className="project-eyebrow">3. Compare the outcome</span>
      <h2>{current.noSupplierCount ? `${current.noSupplierCount} component${current.noSupplierCount === 1 ? '' : 's'} without supply` : 'Supply is flowing'}</h2>
      <p className="comparison-summary">{current.spofCount} component{current.spofCount === 1 ? '' : 's'} {current.spofCount === 1 ? 'depends' : 'depend'} on just one source. {current.noSupplierCount ? 'Closing a gap restores supply; a second source reduces fragility.' : 'A second source reduces fragility if a supplier fails.'}</p>
      <table className="data-table comparison-table">
        <caption className="sr-only">Selected program outcomes after assumed qualification completes</caption>
        <thead><tr><th scope="col">State</th><th scope="col">Health / 100</th><th scope="col">Supply gaps</th><th scope="col">One source</th></tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i} className={i > 1 ? 'choice-row' : ''}>
          <th scope="row">{['Baseline','Now','A · Restore','B · Reinforce'][i]}</th>
          <td className="comparison-score">{row.score}</td><td>{row.noSupplierCount}</td><td>{row.spofCount}</td>
        </tr>)}</tbody>
      </table>
      <div className="choice-ledger">{choices.map((choice, i) => <div key={i} className="choice-entry">
        <h3>{i === 0 ? 'A · Restore supply' : 'B · Also add second sources'}</h3>
        <p>{choice.supplierIds.map(id => data.suppliers.find(s => s.id === id)?.name).join(' + ') || 'No reserve additions'}<span className="choice-weeks">{choice.weeks === null ? 'Unknown qualification time' : choice.supplierIds.length ? `${choice.weeks} synthetic weeks` : 'No new qualification work'}</span></p>
        {choice.unmet.length ? <p className="residual-note">{i === 0 ? 'Still without supply: ' : 'Cannot reach two sources: '}{choice.unmet.join(', ')}.</p> : null}
      </div>)}</div>
      <p className="comparison-horizon">Choices preview <strong>after qualification completes</strong>; they do not change your scenario. Synthetic weeks assume parallel work, not forecast dates.</p>
      <details className="comparison-evidence"><summary>How these choices are calculated</summary>
        <p>A qualifies the fastest available reserves to close gaps. B also seeks two sources for every fragile component. Offline baseline producers are excluded. Components are processed by ID, reserves by per-part qualification time, with supplier-ID tie-breaking. This is a deterministic heuristic, not an optimal procurement plan.</p>
        <p>Activating a supplier covers every linked part, including outside this program. The qualification envelope is the longest such link, assuming unlimited parallel capacity; it is not the time to first restored supply. Health keeps the original criticality-weighted 45/90 penalties. Ownership, capacity, cost and sub-tier risk are separate limitations.</p>
        {choices.map((c, i) => <div key={i}><h3>Choice {i === 0 ? 'A' : 'B'} qualification links</h3>{c.links.length ? <ul>{c.links.map(l => <li key={`${l.componentId}-${l.supplierId}`}>{data.suppliers.find(s => s.id === l.supplierId)?.name} → {data.components.find(part => part.id === l.componentId)?.name}: {l.qualificationWeeks} weeks</li>)}</ul> : <p>No reserve qualifications added.</p>}</div>)}
      </details>
    </div>
    {paths.length > 0 ? <div className="affected-programs"><span className="path-label">Programs linked to offline producers</span><div className="path-list">{affectedPrograms.map(p => <button key={p.id} className="path-program" onClick={() => onSelectProgram(p.id)} aria-pressed={p.id === programId}>{p.name}</button>)}</div></div> : null}
  </section>;
}
