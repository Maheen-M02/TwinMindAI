# TwinMind AI

> Real-time Digital Twin platform for predictive maintenance in manufacturing.

![Demo placeholder](https://via.placeholder.com/800x400/0f1117/00d4aa?text=TwinMind+AI+Demo)

## What it does

Three simulated factory machines stream 14 sensor readings per second. XGBoost ML models predict failure probability and remaining useful life in real-time. A Gemini-powered AI agent explains anomalies and estimates costs. Every WARNING/CRITICAL event is logged immutably on Polygon Mumbai.

## Architecture

```
Browser (React 18 + Vite)
  └── WebSocket ──► FastAPI (Python 3.11)
                      ├── MachineSimulator (14 sensors × 3 machines)
                      ├── TwinMindPredictor (XGBoost + IsolationForest)
                      ├── AI Agent (Gemini 1.5 Flash + LangChain)
                      └── Blockchain (Web3.py → Polygon Mumbai)
```

---

## Setup

### 1. Backend

```bash
cd twinmind-backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
```

### 2. Train ML models (requires CMAPSS dataset)

Download `train_FD001.txt` from [NASA CMAPSS](https://www.nasa.gov/content/prognostics-center-of-excellence-data-set-repository) and place it in `twinmind-backend/cmapss_data/`.

```bash
python train_models.py
# Prints AUC-ROC, RUL MAE, top features
# Saves models to ./ml_models/
```

> Without the dataset the app still runs — the simulator's own health/failure values are used as fallback.

### 3. Run backend

```bash
uvicorn main:app --reload --port 8000
```

Test WebSocket in browser console:
```js
const ws = new WebSocket("ws://localhost:8000/ws/factory")
ws.onmessage = e => console.log(JSON.parse(e.data))
```

### 4. Frontend

```bash
cd twinmind-frontend
npm install
cp .env.example .env
npm run dev
# Open http://localhost:5173
```

---

## Get a Gemini API key (free)

1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API key" → create a project
3. Copy the key into `twinmind-backend/.env` as `GEMINI_API_KEY`

---

## Deploy the smart contract

1. Open [Remix IDE](https://remix.ethereum.org)
2. Paste `contracts/MaintenanceLedger.sol`
3. Compile with Solidity 0.8.20
4. Deploy to Polygon Mumbai (get test MATIC from [faucet.polygon.technology](https://faucet.polygon.technology))
5. Copy the deployed address into `.env` as `CONTRACT_ADDRESS`

---

## Demo walkthrough (5 minutes)

| Time | Action |
|------|--------|
| 0:00 | Open the dashboard — 3 machines streaming live |
| 0:30 | Click **BREAK M3** — watch it go CRITICAL within 3s |
| 1:00 | Alert banner slides in, blockchain log populates |
| 1:30 | Open AI Copilot → "Why is M3 critical?" |
| 2:30 | Switch to What-If panel → raise M1 temperature +80° |
| 3:30 | Watch failure probability delta turn red |
| 4:00 | Cost Impact panel shows potential $6,400 loss |
| 4:30 | Click **Resolve** on blockchain event |

---

## Implementation order

1. `simulator.py` — no deps, test immediately
2. `train_models.py` → run → generates `ml_models/`
3. `ml_predictor.py` — test with fake sensor dict
4. `main.py` — FastAPI core + WebSocket
5. React: `App.jsx` + `useWebSocket` + `FactoryFloor` + `MachineTwin` + `SensorChart`
6. Confirm live data flows frontend ↔ backend
7. `ai_agent.py` → wire `POST /ai/chat`
8. `AICopilot.jsx`
9. `blockchain.py` → deploy contract → wire `BlockchainLog`
10. `WhatIfPanel` + `CostImpactPanel`
11. Demo mode + `AlertBanner` + final polish

---

## Quality bar

- WebSocket auto-reconnects (up to 10 retries, 2s delay)
- ML inference < 50ms per tick
- All sensor values rounded to 3 decimal places
- Dark theme consistent across all components (`#0f1117` bg, `#1a1d24` surface)
- BREAK button triggers CRITICAL within 3 seconds
- Blockchain writes debounced at 60s per machine
