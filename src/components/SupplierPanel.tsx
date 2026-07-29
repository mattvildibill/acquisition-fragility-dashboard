import type { Supplier, SupplierActiveMap } from '../data/types';
import { formatExposureLabel } from '../lib/scoring';

interface SupplierPanelProps {
  suppliers: Supplier[];
  supplierActiveMap: SupplierActiveMap;
  onToggleSupplier: (supplierId: string) => void;
}

export function SupplierPanel({ suppliers, supplierActiveMap, onToggleSupplier }: SupplierPanelProps): JSX.Element {
  // Active suppliers first so the ones you're most likely to click - the ones
  // still delivering - aren't buried below whatever's already offline.
  const ordered = [...suppliers].sort((a, b) => {
    const aActive = supplierActiveMap[a.id] ?? a.isActive;
    const bActive = supplierActiveMap[b.id] ?? b.isActive;
    if (aActive === bActive) {
      return a.name.localeCompare(b.name);
    }
    return aActive ? -1 : 1;
  });

  return (
    <section className="card supplier-panel">
      <h2>Suppliers</h2>
      <p className="muted">Click a supplier to take it offline and see what breaks.</p>
      <div className="supplier-list">
        {ordered.map((supplier) => {
          const status = supplierActiveMap[supplier.id] ?? supplier.isActive;

          return (
            <div key={supplier.id} className={`supplier-row ${status ? '' : 'supplier-row-inactive'}`}>
              <div className="supplier-identity">
                <span className="supplier-title">{supplier.name}</span>
                <span className="muted supplier-location">{supplier.location}</span>
                {supplier.foreignExposure !== 'DOMESTIC' ? (
                  <span className={`exposure-tag exposure-${supplier.foreignExposure.toLowerCase()}`}>
                    {formatExposureLabel(supplier.foreignExposure)}
                  </span>
                ) : null}
              </div>
              <div className="supplier-actions">
                <span className={`status-pill ${status ? 'active' : 'inactive'}`}>{status ? 'Active' : 'Inactive'}</span>
                <button onClick={() => onToggleSupplier(supplier.id)}>{status ? 'Deactivate' : 'Activate'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
