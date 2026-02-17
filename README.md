# acquisition-fragility-dashboard

A weekend prototype for defense-acquisition teams to identify supply chain fragility, test what-if scenarios, and align on immediate mitigation priorities.

## Why this prototype exists
Program offices often track supplier risk in isolation, but have limited visibility into program-level fragility and portfolio blast radius. This dashboard is designed to make that risk visible in one place, with clear scoring and explainable drivers.

## What you can do in the demo
- Portfolio triage: scan portfolio KPIs and sort programs by health, SPOFs, and no-supplier issues.
- Explainable drivers: inspect top penalty components behind each program score.
- Scenario save/load/share: run what-if supplier failures, save to localStorage, and share a scenario via URL.
- Supplier critical nodes ranking: identify suppliers with the highest portfolio impact if they fail.
- Rules-based recommended mitigations: view concise next steps for SPOF and no-supplier components.

## What fragility means here
For this prototype, fragility is component-level supplier concentration risk:
- `Healthy`: component has 2+ active suppliers
- `SPOF`: component has exactly 1 active supplier
- `No Supplier`: component has 0 active suppliers

A program is more fragile when more required components are SPOF or have no supplier.

## Health score model (simple and transparent)
Each program gets a `0-100` score.

- Start at `100`
- For each required component:
  - `2+ active suppliers`: no penalty
  - `SPOF`: subtract `45 * criticalityWeight`
  - `No Supplier`: subtract `90 * criticalityWeight`
- Criticality weights:
  - `LOW = 1.0`
  - `MED = 1.5`
  - `HIGH = 2.0`
- Penalties are normalized across the program's total criticality weight
- Score is clamped to `0-100`

The UI also shows:
- `% of components with 2+ active suppliers`
- `SPOF component count`
- `No-supplier component count`
- top penalty drivers by component

## Weekend-scope tradeoffs
- Static JSON dataset (no backend, no auth)
- Scenario persistence in browser localStorage only
- URL-sharing is state-only (supplier activity map), not an audited collaboration workflow
- Plain table/tree visual design instead of heavy graphing
- Single-page app with focused decision-support loop rather than full enterprise workflow

## If evolving with a real customer
- Replace JSON with API + authoritative supplier/program data feeds
- Add user roles, access controls, and audit logs for scenario changes
- Add alerting and trend history for supplier status changes
- Extend scoring with lead time, capacity, qualification status, and geopolitical risk
- Add saved mitigation plans and workflow handoff tracking

## Seed dataset summary
Includes:
- 3 programs
- 6 components
- 6 suppliers
- Multiple true SPOFs at baseline
- Failure cases where deactivation can create `No Supplier` components

## Tech stack
- React + TypeScript + Vite
- Static-site compatible (GitHub Pages)

## Local run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages
This repository name is assumed to be `acquisition-fragility-dashboard`, and `vite.config.ts` already sets:
- `base: '/acquisition-fragility-dashboard/'`

Then deploy:

```bash
npm install
npm run deploy
```

Requirements:
- `gh-pages` package is included in `devDependencies`
- You have push access to the repository
- GitHub Pages is configured to serve from the `gh-pages` branch
