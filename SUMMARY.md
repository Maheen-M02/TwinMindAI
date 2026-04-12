# TwinMind AI — Project Summary

## What It Is

TwinMind AI is a real-time Digital Twin platform for predictive maintenance in manufacturing. It creates a live virtual copy of every machine on the factory floor, continuously monitors sensor data, predicts failures before they happen, explains them in plain English, and logs every critical event immutably on the blockchain.

The core idea: instead of reacting to machine failures after they occur, TwinMind gives engineers a 30–100 cycle warning window to act — turning unplanned downtime into scheduled maintenance.

---

## The Problem It Solves

Manufacturing plants lose over $50 billion annually to unplanned downtime. A single 8-hour machine failure costs roughly $6,400 in lost production. Engineers currently have no way to know a machine is degrading until it breaks. There is also no tamper-proof audit trail for maintenance decisions, which creates liability and compliance gaps.

---

## How It Works

The system runs a continuous loop:

1. Three simulated machines each emit 14 sensor readings every second via WebSocket
2. An XGBoost ML model predicts failure probability and remaining useful life (RUL) in under 50ms
3. An IsolationForest flags anomalies against a healthy baseline
4. A Gemini 1.5 Flash AI agent explains what is happening and estimates cost impact
5. Every WARNING or CRITICAL event is written to a Solidity smart contract on Polygon Mumbai

---

## Architecture

```
Browser (React 18 + Vite)
  └── WebSocket (1s tick) ──► FastAPI (Python 3.11)
                                ├── MachineSimulator  — 14 sensors × 3 machines
                                ├── TwinMindPredictor — XGBoost + IsolationForest
                                ├── AI Agent          — Gemini 1.5 Flash + LangChain
                                ├── SQLite            — event log
                                └── Blockchain        — Web3.py → Polygon Mumbai
```

---

## Tech Stack

**Frontend:** React 18, Vite, Recharts, Framer Motion, GSAP, Lucide React

**Backend:** Python 3.11, FastAPI, uvicorn, asyncio, SQLite

**Machine Learning:** XGBoost (classifier + regressor), IsolationForest, scikit-learn, trained on NASA CMAPSS turbofan dataset

**AI Agent:** Google Gemini 1.5 Flash, LangChain tool-calling

**Blockchain:** Solidity smart contract, Web3.py, Polygon Mumbai testnet

---

## Machine Learning

The models are trained on the NASA CMAPSS FD001 dataset, which contains run-to-failure data from turbofan engines. 14 sensors are used after dropping near-constant ones. Rolling mean and standard deviation features are engineered over a 10-cycle window, producing 51 total features.

- **XGBClassifier** predicts whether a machine will fail within 30 cycles (AUC-ROC: 0.999)
- **XGBRegressor** predicts exact remaining useful life in cycles
- **IsolationForest** detects anomalies by comparing current readings against healthy-only training data
- Inference runs in under 50ms per tick
- The top 3 feature importances are surfaced in the UI so engineers know which sensor is driving the prediction

---

## AI Agent

The Gemini-powered agent has four live tools it can call:

- `get_machine_status` — fetches the current sensor snapshot for any machine
- `get_failure_history` — queries the SQLite event log for recent alerts
- `run_whatif` — simulates what happens if sensor values change
- `get_cost_impact` — calculates financial exposure from downtime

It is instructed to be direct, cite specific sensor readings, and always include a cost estimate. Responses are capped at 4 sentences — built for engineers on the floor, not for chatbots.

---

## Blockchain

Every WARNING or CRITICAL event triggers a write to a Solidity smart contract deployed on Polygon Mumbai. Each record stores the machine ID, severity, failure probability in basis points, predicted RUL, and a SHA-256 hash of the full sensor snapshot. Events can be marked as resolved on-chain when maintenance is completed. A 60-second debounce prevents gas waste on every tick. All records are permanently verifiable on Polygonscan.

---

## Dashboard Pages

The dashboard is split into six focused pages:

- **Overview** — factory-wide KPIs, Google Maps-style floor plan, machine health tiles
- **Digital Twin** — animated SVG cross-section of the selected machine with live sensor bars and ML stats
- **Analytics** — What-If simulator with sliders, ML driver breakdown, filterable event log
- **Cost Impact** — animated ROI counter, per-machine financial risk, blockchain audit trail
- **Blockchain** — full on-chain event table with resolve button and Polygonscan links
- **AI Copilot** — full-page chat interface with live machine context and quick-action prompts

---

## Landing Page

A 240-frame scroll-driven cinematic animation plays as the user scrolls. Frames are rendered on a canvas at 60fps using GSAP ScrollTrigger for scrubbing. Four text overlays appear at key moments: THE MACHINE → DEGRADATION → DIGITAL TWIN → TWINMIND AI. At 95% scroll progress, an "Enter Dashboard" button fades in. Clicking it triggers a fade-to-black transition into the dashboard.

---

## Key Numbers

| Metric | Value |
|---|---|
| Sensors per machine | 14 |
| ML features | 51 |
| ML inference time | < 50ms |
| Failure classifier AUC-ROC | 0.999 |
| WebSocket tick rate | 1 second |
| Time to CRITICAL after demo trigger | ~3 seconds |
| Landing animation frames | 240 |
| Dashboard pages | 6 |
| Blockchain debounce | 60 seconds |
| Estimated cost of 8h downtime | $6,400 |
