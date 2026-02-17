# 🚀 Acquisition Fragility Dashboard

**I built this prototype to demonstrate how I would approach building decision-support software for defense acquisition teams.**

The goal: translate supplier-level risk into clear, explainable program-level fragility insight — and make it interactive, transparent, and immediately actionable.

This project reflects how I think about complex, mission-critical systems: structured data models, explicit risk logic, and user-centered decision workflows.

---

## 🎯 Why I Built This

In acquisition environments, supplier risk is often tracked in isolation — spreadsheets, static reports, disconnected tools.

What’s harder to answer:

- Which programs are truly fragile right now?
- Where do we have hidden single points of failure?
- What happens if Supplier X becomes unavailable?
- How do we justify mitigation priorities with defensible logic?

This prototype is my answer to that problem.

It demonstrates how a lightweight, explainable analytics tool could help program offices move from raw supplier data to actionable fragility insight.

---

## 🔍 What This Prototype Does

- Models supplier → component → program dependencies
- Identifies:
  - **Single Points of Failure (SPOFs)**
  - **Components with no active supplier**
- Calculates a transparent **0–100 Program Health Score**
- Shows exactly *why* a program’s score dropped
- Enables interactive supplier failure simulation
- Surfaces cascading impact across programs

This is intentionally designed as a decision-support tool, not just a reporting dashboard.

---

## 📊 Health Score Model (Explainable by Design)

Each program receives a 0–100 score based on supplier concentration risk.

### Scoring Logic

- Start at **100**
- For each required component:
  - `2+ active suppliers` → no penalty  
  - `1 active supplier (SPOF)` → subtract `45 × criticalityWeight`  
  - `0 active suppliers` → subtract `90 × criticalityWeight`
- Criticality weights:
  - `LOW = 1.0`
  - `MED = 1.5`
  - `HIGH = 2.0`
- Penalties are normalized across total program criticality
- Final score clamped to `0–100`

This model prioritizes:

- High-criticality component failures  
- True capability gaps (no supplier)  
- Supplier concentration risk  

The logic is fully transparent — no black-box modeling — because explainability matters in mission and acquisition environments.

---

## 🧠 How I Think About the Problem

This prototype reflects several principles I prioritize:

### 1️⃣ Explainability Over Complexity  
Risk scores should be defensible and easy to walk through in a review.

### 2️⃣ Cascading Visibility  
Supplier-level issues must roll up clearly into program-level impact.

### 3️⃣ Scenario-Driven Insight  
Decision-makers need to ask “what if?” and see impact instantly.

### 4️⃣ Structured Data Modeling  
Programs, components, suppliers, and relationships are treated as first-class entities — not flattened tables.

---

## 📦 Seed Dataset

The demo includes:

- 3 programs  
- 6 components  
- 6 suppliers  
- True baseline SPOFs  
- Simulated “No Active Supplier” failure cases  

Example scenarios:
- Deactivating a secure RF supplier creates a full capability gap
- Certain components operate as true SPOFs at baseline
- Cascading supplier failures impact multiple programs simultaneously

---

## 🏗️ Engineering Decisions

To keep this focused and deployable:

- Static JSON dataset (no backend required)
- Pure TypeScript scoring logic
- Deterministic, testable calculations
- Single-page React app optimized for GitHub Pages
- Clear separation between data model, scoring engine, and UI

This reflects how I scope and build high-signal prototypes under constraints.

---

## 🌱 How This Would Evolve in Production

If integrated into a real acquisition environment, I would extend this with:

- API-backed supplier and program data feeds
- Scenario save / compare workflows
- Time-series supplier availability tracking
- Lead time and capacity weighting
- Role-based access controls and audit logs
- Portfolio-level risk heatmaps
- Executive-ready reporting outputs

---

## 🛠️ Tech Stack

- React  
- TypeScript  
- Vite  
- Static-site compatible (GitHub Pages)  

---

## 🚀 Run Locally

```bash
npm install
npm run dev
