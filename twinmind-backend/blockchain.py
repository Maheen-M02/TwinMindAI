"""
Blockchain integration — real Polygon Mumbai or SQLite simulation fallback.
Produces identical data structure either way.
"""
import hashlib
import json
import os
import sqlite3
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

POLYGON_RPC_URL    = os.getenv("POLYGON_RPC_URL", "")
CONTRACT_ADDRESS   = os.getenv("CONTRACT_ADDRESS", "")
WALLET_PRIVATE_KEY = os.getenv("WALLET_PRIVATE_KEY", "")
ABI_PATH = Path(__file__).parent / "contracts" / "MaintenanceLedger.abi.json"
DB_PATH  = "twinmind.db"

DEBOUNCE_SECONDS = 60
_last_log_ts: dict[str, float] = {}
_w3         = None
_contract   = None
_initialized = False


# ── SQLite simulation ledger ──────────────────────────────────────────────────

def _init_ledger_table():
    con = sqlite3.connect(DB_PATH)
    con.execute("""
        CREATE TABLE IF NOT EXISTS blockchain_ledger (
            event_id         INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp        REAL,
            machine_id       TEXT,
            severity         TEXT,
            failure_prob_bps INTEGER,
            predicted_rul    INTEGER,
            data_hash        TEXT,
            resolved         INTEGER DEFAULT 0,
            tx_hash          TEXT
        )
    """)
    con.commit()
    con.close()

_init_ledger_table()


def _sim_tx_hash(seed: str) -> str:
    return "0x" + hashlib.sha256(f"{seed}:{time.time()}".encode()).hexdigest()


def _ledger_insert(machine_id, severity, fp_bps, rul, data_hash, tx_hash):
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "INSERT INTO blockchain_ledger "
        "(timestamp, machine_id, severity, failure_prob_bps, predicted_rul, data_hash, tx_hash) "
        "VALUES (?,?,?,?,?,?,?)",
        (time.time(), machine_id, severity, fp_bps, rul, data_hash, tx_hash),
    )
    con.commit()
    con.close()


def _ledger_fetch(count: int = 20) -> list[dict]:
    con = sqlite3.connect(DB_PATH)
    rows = con.execute(
        "SELECT event_id, timestamp, machine_id, severity, failure_prob_bps, "
        "predicted_rul, data_hash, resolved, tx_hash "
        "FROM blockchain_ledger ORDER BY event_id DESC LIMIT ?",
        (count,),
    ).fetchall()
    con.close()
    return [
        {
            "event_id": r[0], "timestamp": r[1], "machine_id": r[2],
            "severity": r[3], "failure_prob_bps": r[4], "predicted_rul": r[5],
            "data_hash": r[6], "resolved": bool(r[7]), "tx_hash": r[8],
            "simulated": True,
        }
        for r in rows
    ]


def _ledger_resolve(event_id: int) -> str:
    tx = _sim_tx_hash(f"resolve:{event_id}")
    con = sqlite3.connect(DB_PATH)
    con.execute("UPDATE blockchain_ledger SET resolved=1 WHERE event_id=?", (event_id,))
    con.commit()
    con.close()
    return tx


# ── Web3 init ─────────────────────────────────────────────────────────────────

def _init_web3() -> bool:
    global _w3, _contract, _initialized
    placeholder = (
        not CONTRACT_ADDRESS
        or CONTRACT_ADDRESS.startswith("0x_")
        or not WALLET_PRIVATE_KEY
        or WALLET_PRIVATE_KEY.startswith("0x_")
    )
    if placeholder:
        print("[blockchain] Using SQLite simulation ledger (contract not deployed).")
        _initialized = False
        return False
    try:
        from web3 import Web3
        w3 = Web3(Web3.HTTPProvider(POLYGON_RPC_URL, request_kwargs={"timeout": 5}))
        if not w3.is_connected():
            print("[blockchain] RPC unreachable — using simulation ledger.")
            _initialized = False
            return False
        with open(ABI_PATH) as f:
            abi = json.load(f)
        _w3       = w3
        _contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=abi)
        _initialized = True
        print("[blockchain] Connected to Polygon Mumbai.")
        return True
    except Exception as e:
        print(f"[blockchain] Init error: {e} — using simulation ledger.")
        _initialized = False
        return False


_init_web3()


# ── Public API ────────────────────────────────────────────────────────────────

async def log_failure_event(
    machine_id: str,
    severity: str,
    failure_prob: float,
    rul: int,
    sensor_snapshot: dict,
) -> Optional[str]:
    now = time.time()
    if now - _last_log_ts.get(machine_id, 0) < DEBOUNCE_SECONDS:
        return None
    _last_log_ts[machine_id] = now

    snapshot_str = json.dumps(
        {k: v for k, v in sensor_snapshot.items() if isinstance(v, (int, float, str, bool))},
        sort_keys=True,
    )
    data_hash = "0x" + hashlib.sha256(snapshot_str.encode()).hexdigest()
    fp_bps    = int(failure_prob * 10000)

    if _initialized and _contract and _w3:
        try:
            from web3 import Web3
            account = _w3.eth.account.from_key(WALLET_PRIVATE_KEY)
            nonce   = _w3.eth.get_transaction_count(account.address)
            tx_built = _contract.functions.logFailure(
                machine_id, severity, fp_bps, rul, data_hash,
            ).build_transaction({
                "from": account.address, "nonce": nonce,
                "gas": 200000, "gasPrice": _w3.to_wei("1", "gwei"),
            })
            signed  = _w3.eth.account.sign_transaction(tx_built, WALLET_PRIVATE_KEY)
            tx_hash = _w3.to_hex(_w3.eth.send_raw_transaction(signed.rawTransaction))
            _ledger_insert(machine_id, severity, fp_bps, rul, data_hash, tx_hash)
            print(f"[blockchain] On-chain: {machine_id} {severity} tx={tx_hash[:18]}…")
            return tx_hash
        except Exception as e:
            print(f"[blockchain] On-chain write failed: {e} — falling back to simulation")

    # Simulation path
    tx_hash = _sim_tx_hash(f"{machine_id}:{severity}:{now}")
    _ledger_insert(machine_id, severity, fp_bps, rul, data_hash, tx_hash)
    print(f"[blockchain] Simulated: {machine_id} {severity} fp={failure_prob:.2f} tx={tx_hash[:18]}…")
    return tx_hash


async def get_recent_events(count: int = 20) -> list[dict]:
    if _initialized and _contract:
        try:
            total = _contract.functions.getEventsCount().call()
            start = max(0, total - count)
            events = []
            for i in range(start, total):
                ev = _contract.functions.getEvent(i).call()
                events.append({
                    "event_id": i, "timestamp": ev[0], "machine_id": ev[1],
                    "severity": ev[2], "failure_prob_bps": ev[3],
                    "predicted_rul": ev[4], "data_hash": ev[5],
                    "resolved": ev[6], "simulated": False,
                })
            return list(reversed(events))
        except Exception as e:
            print(f"[blockchain] get_recent_events error: {e}")

    return _ledger_fetch(count)


async def resolve_event(event_id: int) -> Optional[str]:
    if _initialized and _contract and _w3:
        try:
            from web3 import Web3
            account = _w3.eth.account.from_key(WALLET_PRIVATE_KEY)
            nonce   = _w3.eth.get_transaction_count(account.address)
            tx_built = _contract.functions.resolveEvent(event_id).build_transaction({
                "from": account.address, "nonce": nonce,
                "gas": 100000, "gasPrice": _w3.to_wei("1", "gwei"),
            })
            signed  = _w3.eth.account.sign_transaction(tx_built, WALLET_PRIVATE_KEY)
            tx_hash = _w3.to_hex(_w3.eth.send_raw_transaction(signed.rawTransaction))
            _ledger_resolve(event_id)
            return tx_hash
        except Exception as e:
            print(f"[blockchain] resolve error: {e}")

    return _ledger_resolve(event_id)
