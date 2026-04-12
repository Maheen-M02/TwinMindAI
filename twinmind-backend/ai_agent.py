"""
LangChain agent powered by Gemini 1.5 Flash.
Tools: get_machine_status, get_failure_history, run_whatif, get_cost_impact
"""
import json
import os
import sqlite3
import time
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
RATE_PER_HOUR = 800  # USD

SYSTEM_PROMPT = (
    "You are TwinMind, the AI brain of an industrial manufacturing facility. "
    "Be direct and data-driven. Max 4 sentences per response. "
    "Always cite specific sensor readings or probabilities. "
    "Always include a cost estimate when discussing failures or downtime."
)


# ── Tool implementations ──────────────────────────────────────────────────────

def _get_machine_status(machine_id: str) -> str:
    from simulator import MACHINES
    from ml_predictor import get_predictor
    if machine_id not in MACHINES:
        return f"Unknown machine: {machine_id}"
    sim = MACHINES[machine_id]
    raw = sim.step()
    ml = get_predictor().predict(machine_id, raw, raw["cycle"])
    merged = {**raw, **ml}
    return json.dumps({k: round(v, 3) if isinstance(v, float) else v for k, v in merged.items()})


def _get_failure_history(machine_id: str, hours: float = 24) -> str:
    cutoff = time.time() - hours * 3600
    con = sqlite3.connect("twinmind.db")
    rows = con.execute(
        "SELECT status, failure_prob, rul_cycles, top_driver, ts FROM events WHERE machine_id=? AND ts>? ORDER BY ts DESC LIMIT 20",
        (machine_id, cutoff),
    ).fetchall()
    con.close()
    if not rows:
        return f"No events for {machine_id} in the last {hours}h."
    events = [{"status": r[0], "failure_prob": r[1], "rul_cycles": r[2], "top_driver": r[3], "ts": r[4]} for r in rows]
    return json.dumps(events)


def _run_whatif(machine_id: str, overrides_json: str) -> str:
    try:
        overrides = json.loads(overrides_json)
    except Exception:
        return "Invalid JSON for overrides."
    from simulator import MACHINES
    from ml_predictor import get_predictor
    if machine_id not in MACHINES:
        return f"Unknown machine: {machine_id}"
    sim = MACHINES[machine_id]
    raw = sim.step()
    predictor = get_predictor()
    base_ml = predictor.predict(machine_id, raw, raw["cycle"])
    overridden = {**raw, **overrides}
    whatif_ml = predictor.predict(machine_id + "_whatif", overridden, raw["cycle"])
    return json.dumps({
        "baseline_failure_prob": base_ml["failure_prob"],
        "whatif_failure_prob": whatif_ml["failure_prob"],
        "delta": round(whatif_ml["failure_prob"] - base_ml["failure_prob"], 4),
    })


def _get_cost_impact(downtime_hours: float, rate_per_hour: float = RATE_PER_HOUR) -> str:
    cost = downtime_hours * rate_per_hour
    return f"Estimated cost of {downtime_hours}h downtime at ${rate_per_hour}/h: ${cost:,.0f}"


# ── LangChain agent ───────────────────────────────────────────────────────────

def _build_agent():
    if not GEMINI_API_KEY:
        return None
    try:
        from langchain.agents import AgentExecutor, create_tool_calling_agent
        from langchain.tools import tool
        from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
        from langchain_google_genai import ChatGoogleGenerativeAI

        # Use Gemini 2.0 Flash
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.3,
        )

        @tool
        def get_machine_status(machine_id: str) -> str:
            """Get current sensor readings and ML predictions for a machine."""
            return _get_machine_status(machine_id)

        @tool
        def get_failure_history(machine_id: str, hours: float = 24) -> str:
            """Get recent failure/warning events for a machine from the database."""
            return _get_failure_history(machine_id, hours)

        @tool
        def run_whatif(machine_id: str, overrides_json: str) -> str:
            """Run a what-if simulation with sensor overrides (JSON string)."""
            return _run_whatif(machine_id, overrides_json)

        @tool
        def get_cost_impact(downtime_hours: float, rate_per_hour: float = RATE_PER_HOUR) -> str:
            """Calculate cost impact of machine downtime."""
            return _get_cost_impact(downtime_hours, rate_per_hour)

        tools = [get_machine_status, get_failure_history, run_whatif, get_cost_impact]

        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder("chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ])

        agent = create_tool_calling_agent(llm, tools, prompt)
        return AgentExecutor(agent=agent, tools=tools, verbose=False, max_iterations=4)
    except Exception as e:
        print(f"[ai_agent] Failed to build agent: {e}")
        return None


_agent = None


async def chat(message: str, machine_context: Optional[dict] = None) -> dict:
    global _agent
    if _agent is None:
        _agent = _build_agent()

    if _agent is None:
        return {
            "reply": "AI agent not configured. Set GEMINI_API_KEY in .env to enable.",
            "tools_called": [],
        }

    context_prefix = ""
    if machine_context:
        mid = machine_context.get("machine_id", "")
        fp = machine_context.get("failure_prob", "?")
        rul = machine_context.get("rul_cycles", "?")
        context_prefix = f"[Context: Machine {mid}, failure_prob={fp}, rul={rul} cycles] "

    tools_called = []
    try:
        result = await _agent.ainvoke({"input": context_prefix + message})
        # Extract tool names from intermediate steps
        for step in result.get("intermediate_steps", []):
            if hasattr(step[0], "tool"):
                tools_called.append(step[0].tool)
        return {"reply": result["output"], "tools_called": tools_called}
    except Exception as e:
        return {"reply": f"Agent error: {e}", "tools_called": tools_called}
