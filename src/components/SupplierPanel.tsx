import { useState } from 'react';
import type { Supplier, SupplierActiveMap } from '../data/types';

interface Props { suppliers: Supplier[]; supplierActiveMap: SupplierActiveMap; onToggleSupplier: (id: string) => void }
export function SupplierPanel({ suppliers, supplierActiveMap, onToggleSupplier }: Props): JSX.Element {
  const [selectedId, setSelectedId] = useState('s3');
  const selected = suppliers.find(s => s.id === selectedId) ?? suppliers[0];
  const active = supplierActiveMap[selected.id] ?? selected.isActive;
  const state = active ? 'Active' : selected.isActive ? 'Offline' : 'Reserve';
  const label = (s: Supplier) => `${s.name} · ${(supplierActiveMap[s.id] ?? s.isActive) ? 'Active' : s.isActive ? 'Offline' : 'Reserve'}`;
  return <div className="supplier-control">
    <label htmlFor="supplier-picker">1. Change a supplier</label>
    <div className="supplier-control-row">
      <select id="supplier-picker" value={selected.id} onChange={e => setSelectedId(e.target.value)}>
        <optgroup label="Baseline producers">{suppliers.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{label(s)}</option>)}</optgroup>
        <optgroup label="Reserve suppliers">{suppliers.filter(s => !s.isActive).map(s => <option key={s.id} value={s.id}>{label(s)}</option>)}</optgroup>
      </select>
      <button type="button" className={`toggle-button ${active ? 'toggle-button-deactivate' : 'toggle-button-activate'}`} aria-label={`${active ? 'Deactivate' : 'Activate'} ${selected.name}`} onClick={() => onToggleSupplier(selected.id)}>{active ? 'Take offline' : 'Activate'}</button>
    </div>
    <span className="control-note">{state === 'Reserve' ? 'Activation assumes qualification is complete.' : state === 'Offline' ? 'Offline in this scenario. Activate to restore it.' : 'Producing now. Take offline to trace the effect.'}</span>
  </div>;
}
