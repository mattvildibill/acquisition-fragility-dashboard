import type { ComponentStatus } from '../data/types';

interface RiskBadgeProps {
  status: ComponentStatus;
}

export function RiskBadge({ status }: RiskBadgeProps): JSX.Element {
  if (status === 'NO_SUPPLIER') {
    return <span className="badge badge-red">Supply gap</span>;
  }
  if (status === 'SPOF') {
    return <span className="badge badge-orange">One source</span>;
  }
  return <span className="badge badge-green">2+ sources</span>;
}
