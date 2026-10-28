import { useRef, useState } from 'react';
import type { Dataset, PortfolioSummary, SupplierActiveMap } from '../data/types';
import { CriticalNodes } from './CriticalNodes';
import { ProgramDetailPage } from './ProgramDetailPage';

interface Props { data: Dataset; programId: string; supplierActiveMap: SupplierActiveMap; baselineScore: number; summary: PortfolioSummary }
export function EvidenceDialog({ data, programId, supplierActiveMap, baselineScore, summary }: Props): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<'program' | 'portfolio'>('program');
  return <>
    <button className="ghost-button" onClick={() => dialog.current?.showModal()}>Inspect calculations</button>
    <dialog ref={dialog} className="evidence-dialog" aria-labelledby="evidence-title">
      <div className="evidence-heading"><h2 id="evidence-title">Model evidence</h2><button className="ghost-button" onClick={() => dialog.current?.close()} autoFocus>Close evidence</button></div>
      <div className="evidence-nav" aria-label="Evidence views"><button className="ghost-button" aria-pressed={view === 'program'} onClick={() => setView('program')}>Program calculations</button><button className="ghost-button" aria-pressed={view === 'portfolio'} onClick={() => setView('portfolio')}>Supplier rankings</button></div>
      {view === 'program' ? <ProgramDetailPage selectedProgramId={programId} data={data} supplierActiveMap={supplierActiveMap} baselineScore={baselineScore} /> : <>
        {summary.adversaryLinkedSoleSources.length > 0 ? <p className="exposure-callout">Adversary-linked sole sources: {summary.adversaryLinkedSoleSources.join(', ')}. Ownership is tracked separately from availability.</p> : null}
        <CriticalNodes nodes={summary.criticalNodes} data={data} />
      </>}
    </dialog>
  </>;
}
