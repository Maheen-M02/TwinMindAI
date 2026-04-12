"""
TwinMind AI — FastAPI backend
WebSocket streams all 3 machines every 1s with ML predictions.
"""
import asyncio
import json
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from simulator import MACHINES
from ml_predictor import get_predictor

_predictor = None


# ── Database ──────────────────────────────────────────────────────────────────

# Try AWS DynamoDB first, fallback to SQLite if boto3 not installed
try:
    from aws_db import init_db, log_event, fetch_events, fetch_critical_events
    print("[main] Using AWS DynamoDB for event storage")
except ImportError:
    print("[main] boto3 not found, falling back to SQLite")
    import sqlite3
    
    DB_PATH = "twinmind.db"
    
    def init_db():
        con = sqlite3.connect(DB_PATH)
        con.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                machine_id TEXT,
                status TEXT,
                failure_prob REAL,
                rul_cycles INTEGER,
                top_driver TEXT,
                ts REAL
            )
        """)
        con.commit()
        con.close()
    
    def log_event(machine_id: str, status: str, failure_prob: float, rul_cycles: int, top_driver: str):
        con = sqlite3.connect(DB_PATH)
        con.execute(
            "INSERT INTO events (machine_id, status, failure_prob, rul_cycles, top_driver, ts) VALUES (?,?,?,?,?,?)",
            (machine_id, status, failure_prob, rul_cycles, top_driver, time.time()),
        )
        con.commit()
        con.close()
    
    def fetch_events(limit: int = 50, machine_id: Optional[str] = None) -> list[dict]:
        con = sqlite3.connect(DB_PATH)
        if machine_id:
            rows = con.execute(
                "SELECT * FROM events WHERE machine_id=? ORDER BY ts DESC LIMIT ?",
                (machine_id, limit),
            ).fetchall()
        else:
            rows = con.execute(
                "SELECT * FROM events ORDER BY ts DESC LIMIT ?", (limit,)
            ).fetchall()
        con.close()
        cols = ["id", "machine_id", "status", "failure_prob", "rul_cycles", "top_driver", "ts"]
        return [dict(zip(cols, r)) for r in rows]
    
    def fetch_critical_events(limit: int = 20) -> list[dict]:
        con = sqlite3.connect(DB_PATH)
        rows = con.execute(
            "SELECT * FROM events WHERE status IN ('CRITICAL', 'WARNING') ORDER BY ts DESC LIMIT ?",
            (limit,)
        ).fetchall()
        con.close()
        cols = ["id", "machine_id", "status", "failure_prob", "rul_cycles", "top_driver", "ts"]
        return [dict(zip(cols, r)) for r in rows]


# ── WebSocket manager ─────────────────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, payload: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)


manager = ConnectionManager()
_last_event_ts: dict[str, float] = {}
_latest_readings: dict = {}   # cache of last broadcast — used by proactive agent
EVENT_DEBOUNCE = 30.0


async def factory_broadcast_loop():
    predictor = get_predictor()
    while True:
        await _broadcast_tick(predictor)
        await asyncio.sleep(1.0)


async def _log_to_blockchain(machine_id, severity, failure_prob, rul, sensor_snapshot):
    try:
        from blockchain import log_failure_event
        await log_failure_event(machine_id, severity, failure_prob, rul, sensor_snapshot)
    except Exception as e:
        print(f"[main] blockchain log error: {e}")


async def _broadcast_tick(predictor):
    """Compute one tick and broadcast to all connected clients."""
    readings = {}
    for mid, sim in MACHINES.items():
        raw = sim.step()
        ml = predictor.predict(mid, raw, raw["cycle"])
        merged = {**raw, **ml}
        for k, v in merged.items():
            if isinstance(v, float):
                merged[k] = round(v, 3)
        readings[mid] = merged

        status = ml["status"]
        if status in ("WARNING", "CRITICAL"):
            now = time.time()
            if now - _last_event_ts.get(mid, 0) > EVENT_DEBOUNCE:
                _last_event_ts[mid] = now
                top_driver = ml["top_drivers"][0]["label"] if ml["top_drivers"] else "unknown"
                asyncio.get_event_loop().run_in_executor(
                    None, log_event, mid, status, ml["failure_prob"], ml["rul_cycles"], top_driver
                )
                # Also log to blockchain ledger (real or simulated)
                asyncio.create_task(_log_to_blockchain(mid, status, ml["failure_prob"], ml["rul_cycles"], merged))

    await manager.broadcast({"type": "factory_update", "ts": round(time.time(), 3), "machines": readings})
    _latest_readings.update(readings)
    return readings


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    get_predictor()  # warm up

    # Start broadcast loop
    broadcast_task = asyncio.create_task(factory_broadcast_loop())

    # Start proactive agent
    from proactive_agent import get_agent
    agent = get_agent(manager.broadcast)
    agent_task = asyncio.create_task(agent.run(lambda: _latest_readings))

    yield

    broadcast_task.cancel()
    agent_task.cancel()
    agent.stop()


app = FastAPI(title="TwinMind AI", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.websocket("/ws/factory")
async def ws_factory(websocket: WebSocket):
    await manager.connect(websocket)
    # Send current state immediately — don't make the client wait up to 1s
    try:
        predictor = get_predictor()
        readings = {}
        for mid, sim in MACHINES.items():
            raw = {**sim.__dict__}  # non-destructive peek
            # Use snapshot endpoint logic for immediate data
            snap_raw = sim.step()
            ml = predictor.predict(mid, snap_raw, snap_raw["cycle"])
            merged = {**snap_raw, **ml}
            for k, v in merged.items():
                if isinstance(v, float):
                    merged[k] = round(v, 3)
            readings[mid] = merged
        await websocket.send_json({"type": "factory_update", "ts": round(time.time(), 3), "machines": readings})
    except Exception:
        pass
    try:
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
            except asyncio.TimeoutError:
                pass
    except (WebSocketDisconnect, Exception):
        manager.disconnect(websocket)


@app.get("/machines")
def list_machines():
    return {"machines": list(MACHINES.keys())}


@app.get("/machines/{machine_id}/snapshot")
def machine_snapshot(machine_id: str):
    if machine_id not in MACHINES:
        raise HTTPException(404, "Machine not found")
    sim = MACHINES[machine_id]
    raw = sim.step()
    predictor = get_predictor()
    ml = predictor.predict(machine_id, raw, raw["cycle"])
    return {**raw, **ml}


@app.get("/events")
def get_events(limit: int = 50, machine_id: Optional[str] = None):
    return {"events": fetch_events(limit, machine_id)}


class WhatIfRequest(BaseModel):
    machine_id: str
    sensor_overrides: dict
    cycle: int = 0


@app.post("/whatif")
def whatif(req: WhatIfRequest):
    print(f"[whatif] Request: machine_id={req.machine_id}, overrides={req.sensor_overrides}, cycle={req.cycle}")
    
    if req.machine_id not in MACHINES:
        raise HTTPException(404, "Machine not found")

    # Use latest cached reading as baseline — don't step the simulator
    if req.machine_id in _latest_readings:
        base_raw = _latest_readings[req.machine_id]
    else:
        sim = MACHINES[req.machine_id]
        base_raw = sim.step()

    predictor = get_predictor()
    base_ml = predictor.predict(req.machine_id, base_raw, base_raw["cycle"])
    
    print(f"[whatif] Baseline: failure_prob={base_ml['failure_prob']}, rul={base_ml['rul_cycles']}")

    # Build what-if sensors by merging overrides onto baseline
    whatif_sensors = {**base_raw, **req.sensor_overrides}
    cycle = req.cycle or base_raw["cycle"]
    
    print(f"[whatif] What-if sensors: {list(req.sensor_overrides.keys())}")

    # Run what-if through an isolated predictor with a buffer pre-filled
    # with the override values so rolling stats reflect the new state
    from collections import deque
    import numpy as np

    MODEL_SENSORS = predictor.feature_names  # reuse feature list
    SENSOR_DEFAULTS = {"s6": 0.0, "s18": 400.0, "op1": 0.0, "op2": 0.0}

    if predictor._loaded:
        print("[whatif] Using trained ML models")
        # Pre-fill a buffer of 10 readings with the override values
        fake_buf = deque(maxlen=10)
        for _ in range(10):
            fake_buf.append({
                s: whatif_sensors.get(s, SENSOR_DEFAULTS.get(s, 0.0))
                for s in predictor.feature_names
                if not s.endswith("_roll_mean") and not s.endswith("_roll_std")
                and s not in ("op1", "op2", "cycle")
            })

        # Build feature vector manually using the override buffer
        from ml_predictor import MODEL_SENSORS as MS
        current = {s: whatif_sensors.get(s, SENSOR_DEFAULTS.get(s, 0.0)) for s in MS}
        buf_arr = np.array([[whatif_sensors.get(s, SENSOR_DEFAULTS.get(s, 0.0)) for s in MS]] * 10)
        roll_means = buf_arr.mean(axis=0)
        roll_stds  = buf_arr.std(axis=0)
        raw_vals   = [current[s] for s in MS]
        vec = raw_vals + [0.0, 0.0, cycle] + list(roll_means) + list(roll_stds)
        X = predictor.scaler.transform(np.array(vec, dtype=np.float32).reshape(1, -1))

        whatif_fp  = float(predictor.clf.predict_proba(X)[0, 1])
        whatif_rul = max(0, int(predictor.reg.predict(X)[0]))
        whatif_status = predictor._status(whatif_fp)
        whatif_ml = {
            "failure_prob": round(whatif_fp, 4),
            "rul_cycles":   whatif_rul,
            "health_score": round(max(0.0, (1.0 - whatif_fp) * 100), 1),
            "status":       whatif_status,
        }
    else:
        print("[whatif] Using fallback simulation (models not loaded)")
        # Fallback: use simulator sigmoid on a rough degradation estimate
        import math
        temp_delta = req.sensor_overrides.get("s4", 0) - base_raw.get("s4", 0)
        vib_delta  = req.sensor_overrides.get("s11", 0) - base_raw.get("s11", 0)
        rough_deg  = min(1.0, (abs(temp_delta) / 80 + abs(vib_delta) / 3) * 0.5 + base_ml["failure_prob"])
        whatif_fp  = round(1.0 / (1.0 + math.exp(-10 * (rough_deg - 0.5))), 4)
        whatif_ml  = {
            "failure_prob": whatif_fp,
            "rul_cycles":   max(0, base_ml["rul_cycles"] - int(abs(temp_delta))),
            "health_score": round(max(0.0, (1.0 - whatif_fp) * 100), 1),
            "status":       predictor._status(whatif_fp),
        }
    
    result = {
        "baseline": base_ml,
        "whatif":   whatif_ml,
        "delta_failure_prob": round(whatif_ml["failure_prob"] - base_ml["failure_prob"], 4),
    }
    
    print(f"[whatif] Result: delta={result['delta_failure_prob']}, whatif_fp={whatif_ml['failure_prob']}")
    
    return result


class ChatRequest(BaseModel):
    message: str
    machine_context: Optional[dict] = None


@app.post("/ai/chat")
async def ai_chat(req: ChatRequest):
    try:
        from ai_agent import chat
        result = await chat(req.message, req.machine_context)
        return result
    except Exception as e:
        return {"reply": f"AI agent unavailable: {e}", "tools_called": []}


@app.get("/blockchain/events")
async def blockchain_events():
    try:
        from blockchain import get_recent_events
        events = await get_recent_events(20)
        return {"events": events}
    except Exception as e:
        return {"events": [], "error": str(e)}


class ResolveEventRequest(BaseModel):
    event_id: int


@app.post("/blockchain/resolve")
async def blockchain_resolve(req: ResolveEventRequest):
    try:
        from blockchain import resolve_event
        tx = await resolve_event(req.event_id)
        return {"ok": True, "tx_hash": tx}
    except Exception as e:
        return {"ok": False, "error": str(e)}


class TriggerFailureRequest(BaseModel):
    machine_id: str
    duration_cycles: int = 60  # 60 cycles = ~60 seconds of CRITICAL state


@app.post("/demo/trigger-failure")
def trigger_failure(req: TriggerFailureRequest):
    if req.machine_id not in MACHINES:
        raise HTTPException(404, "Machine not found")
    MACHINES[req.machine_id].inject_failure(req.duration_cycles)
    return {"ok": True, "machine_id": req.machine_id, "duration_cycles": req.duration_cycles}


@app.get("/agent/recommendations")
async def get_recommendations():
    """Force an immediate proactive scan and return recommendations."""
    from proactive_agent import get_agent
    agent = get_agent(manager.broadcast)
    recs = []
    if _latest_readings:
        for mid, mdata in _latest_readings.items():
            rec = await agent._analyse_machine(mdata)
            if rec:
                recs.append(rec)
    order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    recs.sort(key=lambda r: order.get(r["priority"], 4))
    return {"recommendations": recs, "ts": time.time()}
