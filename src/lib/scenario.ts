import type { SupplierActiveMap } from '../data/types';

export function encodeScenarioMap(supplierActiveMap: SupplierActiveMap, supplierIds: string[]): string {
  return supplierIds
    .map((id) => `${encodeURIComponent(id)}:${supplierActiveMap[id] ? '1' : '0'}`)
    .join(',');
}

export function decodeScenarioMap(rawValue: string, supplierIds: string[]): SupplierActiveMap {
  const defaultMap = supplierIds.reduce<SupplierActiveMap>((acc, id) => {
    acc[id] = false;
    return acc;
  }, {});

  const parts = rawValue.split(',').filter(Boolean);
  parts.forEach((part) => {
    const [rawId, rawState] = part.split(':');
    if (!rawId || !rawState) {
      return;
    }
    const id = decodeURIComponent(rawId);
    if (!supplierIds.includes(id)) {
      return;
    }
    defaultMap[id] = rawState === '1';
  });

  return defaultMap;
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
