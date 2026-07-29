import type { Dataset, Supplier, SupplierActiveMap } from '../data/types';
import { formatExposureLabel, getSupplierImpactSummary } from '../lib/scoring';

interface SupplierPanelProps {
  suppliers: Supplier[];
  supplierActiveMap: SupplierActiveMap;
  data: Dataset;
  onToggleSupplier: (supplierId: string) => void;
}

export function SupplierPanel({ suppliers, supplierActiveMap, data, onToggleSupplier }: SupplierPanelProps): JSX.Element {
  const activeSuppliers = suppliers.filter((supplier) => supplierActiveMap[supplier.id] ?? supplier.isActive);
  const inactiveSuppliers = suppliers.filter((supplier) => !(supplierActiveMap[supplier.id] ?? supplier.isActive));

  return (
    <section className="card supplier-panel">
      <h3>Simulate Supplier Failure</h3>
      <p className="muted">Toggle supplier status to simulate disruptions and mitigation scenarios.</p>
      <div className="supplier-columns">
        <SupplierColumn
          title="Active"
          suppliers={activeSuppliers}
          supplierActiveMap={supplierActiveMap}
          data={data}
          onToggleSupplier={onToggleSupplier}
        />
        <SupplierColumn
          title="Inactive"
          suppliers={inactiveSuppliers}
          supplierActiveMap={supplierActiveMap}
          data={data}
          onToggleSupplier={onToggleSupplier}
        />
      </div>
    </section>
  );
}

interface SupplierColumnProps {
  title: string;
  suppliers: Supplier[];
  supplierActiveMap: SupplierActiveMap;
  data: Dataset;
  onToggleSupplier: (supplierId: string) => void;
}

function SupplierColumn({ title, suppliers, supplierActiveMap, data, onToggleSupplier }: SupplierColumnProps): JSX.Element {
  return (
    <div>
      <h4>{title}</h4>
      <div className="supplier-list">
        {suppliers.map((supplier) => {
          const status = supplierActiveMap[supplier.id] ?? supplier.isActive;
          const impacts = getSupplierImpactSummary(supplier.id, supplierActiveMap, data);
          return (
            <div key={supplier.id} className="supplier-row">
              <div>
                <div className="supplier-title">
                  {supplier.name}
                  {supplier.foreignExposure !== 'DOMESTIC' ? (
                    <span className={`exposure-tag exposure-${supplier.foreignExposure.toLowerCase()}`}>
                      {formatExposureLabel(supplier.foreignExposure)}
                    </span>
                  ) : null}
                </div>
                <div className="muted">{supplier.location}</div>
                <div className="muted">
                  Impacts: {impacts.impactedPrograms} programs / {impacts.impactedComponents} components
                </div>
                {typeof supplier.riskScore === 'number' ? (
                  <div className="muted">Risk Score: {supplier.riskScore}</div>
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
    </div>
  );
}
