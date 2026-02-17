import type { SavedScenario, SupplierActiveMap } from '../data/types';

const STORAGE_KEY = 'acquisition-fragility-dashboard:scenarios';

export function listSavedScenarios(): SavedScenario[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SavedScenario[];
    return parsed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

function persistScenarios(scenarios: SavedScenario[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function saveScenario(
  name: string,
  supplierActiveMap: SupplierActiveMap,
  existingScenarioId?: string | null
): SavedScenario {
  const now = new Date().toISOString();
  const scenarios = listSavedScenarios();
  const trimmedName = name.trim() || 'Untitled Scenario';

  if (existingScenarioId) {
    const index = scenarios.findIndex((item) => item.scenarioId === existingScenarioId);
    if (index >= 0) {
      const updated: SavedScenario = {
        ...scenarios[index],
        name: trimmedName,
        updatedAt: now,
        supplierActiveMap
      };
      scenarios[index] = updated;
      persistScenarios(scenarios);
      return updated;
    }
  }

  const created: SavedScenario = {
    scenarioId: createScenarioId(),
    name: trimmedName,
    createdAt: now,
    updatedAt: now,
    supplierActiveMap
  };

  scenarios.push(created);
  persistScenarios(scenarios);
  return created;
}

export function loadScenarioById(scenarioId: string): SavedScenario | null {
  return listSavedScenarios().find((item) => item.scenarioId === scenarioId) ?? null;
}

function createScenarioId(): string {
  return `sc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

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
