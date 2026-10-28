import type { SupplierActiveMap } from '../data/types';

export function encodeScenarioMap(supplierActiveMap: SupplierActiveMap, supplierIds: string[]): string {
  return supplierIds
    .map((id) => `${encodeURIComponent(id)}:${supplierActiveMap[id] ? '1' : '0'}`)
    .join(',');
}

// A share link is a complete snapshot. Reject stale or damaged snapshots rather
// than quietly turning missing suppliers off and inventing a disruption.
export function decodeScenarioMap(rawValue: string, supplierIds: string[]): SupplierActiveMap | null {
  const entries = rawValue.split(',');
  if (entries.length !== supplierIds.length) return null;
  const result: SupplierActiveMap = {};
  try {
    for (const entry of entries) {
      const parts = entry.split(':');
      if (parts.length !== 2 || !['0', '1'].includes(parts[1])) return null;
      const id = decodeURIComponent(parts[0]);
      if (!supplierIds.includes(id) || Object.prototype.hasOwnProperty.call(result, id)) return null;
      Object.defineProperty(result, id, { value: parts[1] === '1', enumerable: true });
    }
  } catch {
    return null;
  }
  return result;
}

export function scenarioMapFromUrl(supplierIds: string[]): SupplierActiveMap | null {
  const params = new URLSearchParams(window.location.search);
  const scValue = params.get('sc');
  if (!scValue) {
    return null;
  }

  return decodeScenarioMap(scValue, supplierIds);
}

export function buildScenarioShareUrl(supplierActiveMap: SupplierActiveMap, supplierIds: string[]): string {
  const url = new URL(window.location.href);
  const encoded = encodeScenarioMap(supplierActiveMap, supplierIds);
  url.searchParams.set('sc', encoded);
  return url.toString();
}

export function clearScenarioFromUrl(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('sc')) {
    return;
  }
  url.searchParams.delete('sc');
  window.history.replaceState({}, '', url.toString());
}
