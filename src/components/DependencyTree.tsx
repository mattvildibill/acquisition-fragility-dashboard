import { useEffect, useMemo, useState } from 'react';
import type { Dataset, SupplierActiveMap } from '../data/types';
import {
  computeComponentStatus,
  computeProgramBreakdown,
  formatRestoreWeeks,
  getComponentSuppliers,
  getProgramComponents
} from '../lib/scoring';
import { RiskBadge } from './RiskBadge';

interface DependencyTreeProps {
  programId: string;
  supplierActiveMap: SupplierActiveMap;
  data: Dataset;
}

export function DependencyTree({ programId, supplierActiveMap, data }: DependencyTreeProps): JSX.Element {
  const program = data.programs.find((item) => item.id === programId);
  const components = getProgramComponents(programId, data);

  const [selectedComponentId, setSelectedComponentId] = useState<string>(components[0]?.id ?? '');
  const [showAllLinks, setShowAllLinks] = useState<boolean>(false);

  useEffect(() => {
    setSelectedComponentId(components[0]?.id ?? '');
    setShowAllLinks(false);
  }, [programId]);

  // Reuses the same breakdown the Impact panel renders, rather than
  // recomputing recovery weeks separately, so the two views can't drift.
  const breakdown = useMemo(
    () => computeProgramBreakdown(programId, supplierActiveMap, data),
    [programId, supplierActiveMap, data]
  );

  const componentEntries = useMemo(() => {
    return components.map((component) => {
      const details = computeComponentStatus(component.id, supplierActiveMap, data);
      const driver = breakdown.drivers.find((item) => item.componentId === component.id);
      return {
        component,
        status: details.status,
        activeSuppliers: details.activeSuppliers.length,
        totalSuppliers: details.allSuppliers.length,
        recoveryWeeks: driver?.recoveryWeeks ?? null
      };
    });
  }, [components, supplierActiveMap, data, breakdown]);

  const selectedComponent = components.find((item) => item.id === selectedComponentId) ?? components[0];
  const selectedComponentStatus = selectedComponent
    ? computeComponentStatus(selectedComponent.id, supplierActiveMap, data)
    : null;

  const selectedSuppliers = selectedComponent ? getComponentSuppliers(selectedComponent.id, data) : [];

  const summary = useMemo(() => {
    let spof = 0;
    let noSupplier = 0;

    componentEntries.forEach((entry) => {
      if (entry.status === 'SPOF') {
        spof += 1;
      }
      if (entry.status === 'NO_SUPPLIER') {
        noSupplier += 1;
      }
    });

    return {
      componentCount: componentEntries.length,
      spof,
      noSupplier,
      linkCount: componentEntries.reduce((sum, item) => sum + item.totalSuppliers, 0)
    };
  }, [componentEntries]);

  if (!program) {
    return <section className="card">Program not found.</section>;
  }

  return (
    <section className="card dependency-map">
      <div className="dependency-map-head">
        <h3>Dependency Map</h3>
        <label className="map-toggle">
          <input
            type="checkbox"
            checked={showAllLinks}
            onChange={(event) => setShowAllLinks(event.target.checked)}
          />
          Show all component links
        </label>
      </div>

      <div className="dependency-summary">
        <span>{summary.componentCount} components</span>
        <span>{summary.spof} SPOF</span>
        <span>{summary.noSupplier} no supplier</span>
        <span>{summary.linkCount} supplier links</span>
      </div>

      <div className="dependency-grid">
        <section className="dep-column">
          <h4>Program</h4>
          <article className="dep-node dep-program-node">
            <strong>{program.name}</strong>
            <small className="muted">Selected program baseline</small>
          </article>
        </section>

        <section className="dep-column">
          <h4>Components</h4>
          <div className="dep-list">
            {componentEntries.map((entry) => {
              const active = selectedComponent?.id === entry.component.id;
              const faded = !showAllLinks && !active;

              return (
                <button
                  key={entry.component.id}
                  type="button"
                  className={`dep-node dep-component-node ${active ? 'active' : ''} ${faded ? 'muted-node' : ''}`}
                  onClick={() => setSelectedComponentId(entry.component.id)}
                >
                  <ConnectorLink color={getStatusColor(entry.status)} />
                  <div className="dep-node-content">
                    <div className="dep-node-title-row">
                      <strong>{entry.component.name}</strong>
                      <RiskBadge status={entry.status} />
                    </div>
                    <small className="muted">
                      {entry.component.criticality} criticality | {entry.activeSuppliers}/{entry.totalSuppliers} active suppliers
                    </small>
                    {entry.status !== 'HEALTHY' ? (
                      <small className={entry.recoveryWeeks === null ? 'restore-stranded' : 'muted'}>
                        Restore: {formatRestoreWeeks(entry.recoveryWeeks)}
                      </small>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="dep-column">
          <h4>Suppliers {selectedComponent ? `for ${selectedComponent.name}` : ''}</h4>
          <div className="dep-list">
            {selectedSuppliers.length === 0 ? (
              <article className="dep-node dep-supplier-node">
                <div className="dep-node-content">
                  <strong>No linked suppliers</strong>
                </div>
              </article>
            ) : (
              selectedSuppliers.map((supplier) => {
                const isActive = supplierActiveMap[supplier.id] ?? supplier.isActive;

                return (
                  <article
                    key={supplier.id}
                    className={`dep-node dep-supplier-node ${isActive ? 'supplier-active' : 'supplier-inactive'}`}
                  >
                    <ConnectorLink color={isActive ? '#4f8f68' : '#b56c6c'} />
                    <div className="dep-node-content">
                      <div className="dep-node-title-row">
                        <strong>{supplier.name}</strong>
                        <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <small className="muted">{supplier.location}</small>
                      {typeof supplier.riskScore === 'number' ? (
                        <small className="muted">Risk score: {supplier.riskScore}</small>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {selectedComponentStatus ? (
        <p className="muted dependency-footnote">
          Focused view: <strong>{selectedComponent?.name}</strong> is currently{' '}
          {selectedComponentStatus.status === 'NO_SUPPLIER'
            ? 'without any active supplier'
            : selectedComponentStatus.status === 'SPOF'
            ? 'operating as a single point of failure'
            : 'supported by multiple active suppliers'}
          {selectedComponentStatus.status !== 'HEALTHY' ? (
            <>
              {' '}— restore estimate:{' '}
              <strong>
                {formatRestoreWeeks(
                  componentEntries.find((entry) => entry.component.id === selectedComponent?.id)?.recoveryWeeks ??
                    null
                )}
              </strong>
            </>
          ) : null}
          .
        </p>
      ) : null}
    </section>
  );
}

interface ConnectorLinkProps {
  color: string;
}

function ConnectorLink({ color }: ConnectorLinkProps): JSX.Element {
  return (
    <svg className="dep-link" viewBox="0 0 36 24" aria-hidden="true">
      <path d="M1 12 H12 Q18 12 22 8 L35 8" stroke={color} fill="none" strokeWidth="2" strokeLinecap="round" />
      <path d="M1 12 H12 Q18 12 22 16 L35 16" stroke={color} fill="none" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function getStatusColor(status: 'HEALTHY' | 'SPOF' | 'NO_SUPPLIER'): string {
  if (status === 'NO_SUPPLIER') {
    return '#b93d33';
  }
  if (status === 'SPOF') {
    return '#d9822b';
  }
  return '#6c879f';
}
