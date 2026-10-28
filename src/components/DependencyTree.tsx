import { useState } from 'react';
import type { Dataset, SupplierActiveMap } from '../data/types';
import { computeComponentStatus, getProgramComponents } from '../lib/scoring';
import { RiskBadge } from './RiskBadge';

interface Props {
  programId: string;
  supplierActiveMap: SupplierActiveMap;
  data: Dataset;
  onSelectProgram: (id: string) => void;
}

/** All edges for the selected program remain visible. Selecting a component
 * reveals its cross-program use without hiding any of its supplier mappings. */
export function DependencyTree({ programId, supplierActiveMap, data, onSelectProgram }: Props): JSX.Element {
  const components = getProgramComponents(programId, data);
  const [focusId, setFocusId] = useState('');
  const focus = components.find(c => c.id === focusId) ?? components[0];
  const programs = data.programs.filter(p => data.programComponentLinks.some(l => l.programId === p.id && l.componentId === focus?.id));
  const program = data.programs.find(p => p.id === programId);
  return <section className="dependency-map" aria-label="Full dependency model">
    <header className="model-heading">
      <div><span className="project-eyebrow">Dependency model</span><h2>{program?.name}</h2></div>
      <span className="muted">{components.length} components · all supplier links visible</span>
    </header>
    <div className="model-column-labels" aria-hidden="true"><span>Required component</span><span>Mapped suppliers · qualification weeks</span></div>
    <div className="model-rows">{components.map(component => {
      const status = computeComponentStatus(component.id, supplierActiveMap, data);
      const links = data.componentSupplierLinks.filter(l => l.componentId === component.id);
      return <div className={`model-row model-${status.status.toLowerCase()} ${focus?.id === component.id ? 'model-focused' : ''}`} key={component.id}>
        <button className="model-component" onClick={() => setFocusId(component.id)} aria-pressed={focus?.id === component.id}>
          <strong>{component.name}</strong><span><RiskBadge status={status.status} /> <small>{component.criticality} criticality</small></span>
        </button>
        <span className="model-connector" aria-hidden="true">→</span>
        <ul className="model-suppliers" aria-label={`${component.name} suppliers`}>{links.map(link => {
          const supplier = data.suppliers.find(s => s.id === link.supplierId)!;
          const active = supplierActiveMap[supplier.id] ?? supplier.isActive;
          const state = active ? 'Active' : supplier.isActive ? 'Offline' : 'Reserve';
          return <li key={supplier.id} className={`model-supplier model-supplier-${state.toLowerCase()}`}><strong>{supplier.name}</strong><span><span className={`status-pill ${state.toLowerCase() === 'offline' ? 'inactive' : state.toLowerCase()}`}>{state}</span><span className="muted">{link.qualificationWeeks} wks</span></span></li>;
        })}</ul>
      </div>;
    })}</div>
    {focus ? <div className="model-shared"><span><strong>{focus.name}</strong> required by:</span>{programs.map(p => <button className="path-program" key={p.id} onClick={() => onSelectProgram(p.id)} aria-pressed={p.id === programId}>{p.name}</button>)}</div> : null}
    <p className="model-note">Synthetic mappings. Weeks are per-part qualification assumptions, not delivery dates. Select a component to trace shared use.</p>
  </section>;
}
