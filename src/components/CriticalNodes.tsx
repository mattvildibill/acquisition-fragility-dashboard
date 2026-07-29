import { useMemo, useState } from 'react';
import type { CriticalSupplierNode, Dataset } from '../data/types';
import { formatExposureLabel } from '../lib/scoring';

interface CriticalNodesProps {
  nodes: CriticalSupplierNode[];
  data: Dataset;
}

export function CriticalNodes({ nodes, data }: CriticalNodesProps): JSX.Element {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(nodes[0]?.supplierId ?? '');

  const selectedNode = useMemo(() => {
    return nodes.find((item) => item.supplierId === selectedSupplierId) ?? nodes[0] ?? null;
  }, [nodes, selectedSupplierId]);

  return (
    <section className="card">
      <h2>Critical Nodes</h2>
      <p className="muted">Suppliers ranked by potential program impact if they fail.</p>
      <div className="table-scroll">
        <table className="data-table clickable-rows compact-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Ownership</th>
              <th># SPOF Components</th>
              <th># Programs Impacted If Fails</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr
                key={node.supplierId}
                className={selectedNode?.supplierId === node.supplierId ? 'selected-row' : ''}
                onClick={() => setSelectedSupplierId(node.supplierId)}
              >
                <td>{node.supplierName}</td>
                <td>
                  <span className={`exposure-tag exposure-${node.foreignExposure.toLowerCase()}`}>
                    {formatExposureLabel(node.foreignExposure)}
                  </span>
                </td>
                <td>{node.spofComponents.length}</td>
                <td>{node.affectedProgramsIfFails.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedNode ? (
        <div className="critical-detail">
          <p className="critical-detail-heading">
            <strong>{selectedNode.supplierName}</strong>
            <span className="muted">
              {data.suppliers.find((supplier) => supplier.id === selectedNode.supplierId)?.location}
            </span>
          </p>
          <div className="detail-columns">
            <div>
              <h4>SPOF Components</h4>
              <ul className="simple-list">
                {selectedNode.spofComponents.length === 0 ? (
                  <li>None</li>
                ) : (
                  selectedNode.spofComponents.map((name) => <li key={name}>{name}</li>)
                )}
              </ul>
            </div>
            <div>
              <h4>Programs Affected If Fails</h4>
              <ul className="simple-list">
                {selectedNode.affectedProgramsIfFails.length === 0 ? (
                  <li>None</li>
                ) : (
                  selectedNode.affectedProgramsIfFails.map((name) => <li key={name}>{name}</li>)
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
