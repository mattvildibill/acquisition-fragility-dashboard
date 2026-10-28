import type { Supplier, SupplierActiveMap } from '../data/types';
import { formatExposureLabel } from '../lib/scoring';

interface SupplierPanelProps {
  suppliers: Supplier[];
  supplierActiveMap: SupplierActiveMap;
  onToggleSupplier: (supplierId: string) => void;
}

export function SupplierPanel({ suppliers, supplierActiveMap, onToggleSupplier }: SupplierPanelProps): JSX.Element {
  // Baseline producers first; keep rows in place when toggled so focus and
  // scroll position stay useful when comparing a failure with its reversal.
  const ordered = [...suppliers].sort((a, b) =>
    Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name)
  );

  return (
    <section className="card supplier-panel">
      <h2>1. Disrupt a supplier</h2>
      <p className="muted">Take a producer offline, then inspect the program impact. Activating a reserve assumes its qualification is complete.</p>
      <div className="supplier-list" tabIndex={0} role="region" aria-label="Supplier scenario controls">
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
                <span className={`status-pill ${status ? 'active' : supplier.isActive ? 'inactive' : 'reserve'}`}>{status ? 'Active' : supplier.isActive ? 'Offline' : 'Reserve'}</span>
                <button
                  type="button"
                  aria-label={`${status ? 'Deactivate' : 'Activate'} ${supplier.name}`}
                  className={`toggle-button ${status ? 'toggle-button-deactivate' : 'toggle-button-activate'}`}
                  onClick={() => onToggleSupplier(supplier.id)}
                >
                  {status ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
