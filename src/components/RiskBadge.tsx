import type { ComponentStatus } from '../data/types';

interface RiskBadgeProps {
  status: ComponentStatus;
}

export function RiskBadge({ status }: RiskBadgeProps): JSX.Element {
  if (status === 'NO_SUPPLIER') {
    return <span className="badge badge-red">No Supplier</span>;
  }
  if (status === 'SPOF') {
    return <span className="badge badge-orange">SPOF</span>;
  }
  return <span className="badge badge-green">Healthy</span>;
}
