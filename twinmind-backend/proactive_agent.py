"""
Proactive Agent — runs in the background, monitors all machines,
auto-generates recommendations and action items without being asked.
Acts as a virtual plant manager / maintenance engineer.
"""
import asyncio
import json
import os
import time
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# How often to run a full factory scan (seconds) — longer = less quota usage
SCAN_INTERVAL = 30  # 30 seconds between scans (was 120)

# Only re-analyse a machine if its status changed or this many seconds passed
REANALYSE_AFTER = 60  # 1 minute minimum between same-status re-analysis (was 300)

SYSTEM_PROMPT = """You are TwinMind, the autonomous AI plant manager of an industrial manufacturing facility.
You act as a senior maintenance engineer AND operations manager combined.
When no human is present, you are fully responsible for the facility.

Your job:
1. Continuously monitor all machines
2. Issue specific, actionable maintenance recommendations
3. Prioritise by urgency (CRITICAL > WARNING > HEALTHY)
4. Estimate cost impact of inaction
5. Suggest exact maintenance actions (e.g. "Replace bearing on M3 within 4 hours")
6. Flag if a machine should be taken offline immediately
7. Coordinate across machines (e.g. "Shut down M3 before M2 reaches critical")

Rules:
- Be direct and specific. No vague advice.
- Always cite the sensor reading that triggered the recommendation.
- Always include time-to-action (immediate / within 4h / within 24h / monitor).
- Always include estimated cost of inaction.
- Max 3 sentences per recommendation.
- Use PRIORITY: CRITICAL / HIGH / MEDIUM / LOW prefix.
- If all machines are healthy, confirm status and give a brief outlook.
"""


class ProactiveAgent:
    def __init__(self, broadcast_fn):
        """
        broadcast_fn: async callable that sends a dict to all WS clients
        """
        self.broadcast = broadcast_fn
        self._last_analysis: dict[str, dict] = {}  # machine_id → {ts, status, recommendation}
        self._llm = None
        self._running = False
        self._init_llm()

    def _init_llm(self):
        if not GEMINI_API_KEY:
            print("[proactive_agent] No GEMINI_API_KEY — agent disabled.")
            return
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            
            # Use Gemini 2.0 Flash experimental
            self._llm = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=SYSTEM_PROMPT,
                generation_config={
                    "temperature": 0.3,
                    "max_output_tokens": 256,
                    "top_p": 0.8,
                    "top_k": 40
                },
            )
            print("[proactive_agent] Gemini 2.0 Flash ready.")
            
        except Exception as e:
            print(f"[proactive_agent] Init error: {e}")

    def _should_analyse(self, machine_id: str, current_status: str) -> bool:
        prev = self._last_analysis.get(machine_id)
        if not prev:
            return True
        if prev["status"] != current_status:
            return True
        if time.time() - prev["ts"] > REANALYSE_AFTER:
            return True
        return False

    async def _analyse_machine(self, machine_data: dict) -> Optional[dict]:
        if not self._llm:
            return None

        mid    = machine_data["machine_id"]
        status = machine_data["status"]
        fp     = machine_data.get("failure_prob", 0) * 100
        rul    = machine_data.get("rul_cycles", 999)
        health = machine_data.get("health_score", 100)
        anom   = machine_data.get("is_anomaly", False)
        drivers = machine_data.get("top_drivers", [])

        driver_str = ", ".join(f"{d['label']} ({d['importance']*100:.1f}%)" for d in drivers[:3]) if drivers else "N/A"

        prompt = f"""Machine {mid} live data:
- Status: {status}
- Health: {health:.1f}%
- Failure probability: {fp:.1f}%
- Remaining useful life: {rul} cycles
- Anomaly detected: {anom}
- Top failure drivers: {driver_str}
- Key sensors: HPC Temp={machine_data.get('s4', 0):.1f}°, Pressure={machine_data.get('s11', 0):.2f}, Enthalpy={machine_data.get('s9', 0):.0f}, Fuel={machine_data.get('s12', 0):.1f}

As the autonomous plant manager, provide your recommendation for this machine right now.
Include: PRIORITY level, specific action, time-to-action, and cost of inaction."""

        for attempt in range(3):
            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: self._llm.generate_content(prompt)
                )
                text = response.text.strip()

                priority = "LOW"
                if "PRIORITY: CRITICAL" in text.upper() or status == "CRITICAL":
                    priority = "CRITICAL"
                elif "PRIORITY: HIGH" in text.upper() or status == "WARNING":
                    priority = "HIGH"
                elif "PRIORITY: MEDIUM" in text.upper():
                    priority = "MEDIUM"

                return {
                    "machine_id": mid,
                    "status": status,
                    "priority": priority,
                    "recommendation": text,
                    "ts": time.time(),
                    "health": health,
                    "failure_prob": round(fp, 1),
                    "rul_cycles": rul,
                }
            except Exception as e:
                err = str(e)
                if "429" in err:
                    wait = 60 * (attempt + 1)
                    print(f"[proactive_agent] Rate limited on {mid}, waiting {wait}s (retry {attempt+1}/3)")
                    try:
                        await asyncio.sleep(wait)
                    except asyncio.CancelledError:
                        return None  # task was cancelled, exit cleanly
                else:
                    print(f"[proactive_agent] Analysis error for {mid}: {e}")
                    return None
        print(f"[proactive_agent] Skipping {mid} after 3 rate-limit retries")
        return None

    async def _factory_scan(self, machines_data: dict):
        """Analyse all machines that need it and broadcast recommendations."""
        recommendations = []
        
        # Analyze machines in parallel for faster results
        tasks = []
        machines_to_analyze = []
        
        for mid, mdata in machines_data.items():
            status = mdata.get("status", "HEALTHY")
            if self._should_analyse(mid, status):
                machines_to_analyze.append((mid, mdata, status))
        
        # Only analyze CRITICAL and WARNING machines for faster response
        # HEALTHY machines can wait
        priority_machines = [m for m in machines_to_analyze if m[2] in ("CRITICAL", "WARNING")]
        healthy_machines = [m for m in machines_to_analyze if m[2] == "HEALTHY"]
        
        # Analyze priority machines first
        for mid, mdata, status in priority_machines:
            try:
                rec = await self._analyse_machine(mdata)
                if rec:
                    self._last_analysis[mid] = {"ts": rec["ts"], "status": status, "recommendation": rec["recommendation"]}
                    recommendations.append(rec)
                await asyncio.sleep(0.2)  # Reduced delay between calls
            except asyncio.CancelledError:
                return
            except Exception as e:
                print(f"[proactive_agent] Unexpected error for {mid}: {e}")
                continue
        
        # Analyze healthy machines only if we have time (skip if too many)
        if len(healthy_machines) <= 1:
            for mid, mdata, status in healthy_machines:
                try:
                    rec = await self._analyse_machine(mdata)
                    if rec:
                        self._last_analysis[mid] = {"ts": rec["ts"], "status": status, "recommendation": rec["recommendation"]}
                        recommendations.append(rec)
                    await asyncio.sleep(0.2)
                except asyncio.CancelledError:
                    return
                except Exception as e:
                    print(f"[proactive_agent] Unexpected error for {mid}: {e}")
                    continue

        if recommendations:
            # Sort by priority
            order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
            recommendations.sort(key=lambda r: order.get(r["priority"], 4))

            await self.broadcast({
                "type": "proactive_recommendations",
                "ts": time.time(),
                "recommendations": recommendations,
                "agent": "TwinMind Autonomous Plant Manager",
            })

    async def run(self, get_machines_fn):
        """
        Main loop. get_machines_fn() returns current machines dict.
        """
        self._running = True
        print(f"[proactive_agent] Starting scan loop every {SCAN_INTERVAL}s")

        # Initial delay reduced to 2 seconds for faster first scan
        await asyncio.sleep(2)

        while self._running:
            try:
                machines = get_machines_fn()
                if machines:
                    await self._factory_scan(machines)
            except Exception as e:
                print(f"[proactive_agent] Scan error: {e}")
            await asyncio.sleep(SCAN_INTERVAL)

    def stop(self):
        self._running = False


# Singleton
_agent: Optional[ProactiveAgent] = None


def get_agent(broadcast_fn) -> ProactiveAgent:
    global _agent
    if _agent is None:
        _agent = ProactiveAgent(broadcast_fn)
    return _agent
