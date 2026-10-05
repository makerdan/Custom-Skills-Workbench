#!/usr/bin/env python3
"""One fixture pass, exact incident recovery, one non-tier diagnostic."""
import hashlib
import json
from pathlib import Path
import sys
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts/failure_gate"))
from common import Blocked, atomic_json, digest, encoded, incarnation, read_bytes, read_json, writer_lock
from gate import Gate, execution_definition, tooling
from store import Store
from supervisor import LIMITS, run

STATE = ROOT / ".failure-gate"
REF = "inv_1iUbbTUza9TH3mW8SiX3KiUISnua7B2Y93:call_1HrJtFPODmMlHQA8H43mlmr1"
KEY = "control-pipe:" + hashlib.sha256(REF.encode()).hexdigest()


def context(store):
    value = json.loads(store.meta(KEY) or "null")
    approval = read_json(ROOT / "docs/validation/failure-gate-control-pipe-approval.json")
    if (value is None or value["reference"] != REF or approval["reference"] != REF
            or approval["answer"] != value["answer"] or approval["status"] != "APPROVED_LOCAL_CONVERSATION"
            or value["boot"] != read_bytes("/proc/sys/kernel/random/boot_id", 100).decode().strip()
            or value["namespace"] != store.meta("namespace") or store.meta("governance") != "STAGED"
            or time.monotonic() >= value["deadline"]):
        raise Blocked("expired, stale or unknown diagnostic authority")
    if value.get("tooling") and (value["tooling"] != tooling(ROOT)
            or value["definition"] != execution_definition(ROOT)
            or value["driver"] != hashlib.sha256(read_bytes(__file__)).hexdigest()):
        raise Blocked("admitted diagnostic source drift")
    return value, approval


def save(store, value, kind, run_id=None):
    store.set_meta(KEY, encoded(value))
    return store.event(kind, value["task"], run_id, value)


def main():
    if len(sys.argv) != 1:
        raise Blocked("unknown invocation")
    with writer_lock(STATE):
        store = Store(STATE)
        try:
            value, approval = context(store)
            if value["phase"] != "authoring" or value["fixture_attempts"] != 0:
                raise Blocked("one-shot diagnostic already entered")
            definition = execution_definition(ROOT)
            old, new = value["base_definition"]["files"], definition["files"]
            changes = {p for p in set(old) | set(new) if old.get(p) != new.get(p)}
            if changes != {"scripts/failure_gate/supervisor.py", "scripts/failure_gate/tests.py"}:
                raise Blocked("unapproved source change")
            value.update(phase="fixtures", fixture_attempts=1, tooling=tooling(ROOT),
                         definition=definition, driver=hashlib.sha256(read_bytes(__file__)).hexdigest(),
                         approval=approval)
            with store.transaction():
                save(store, value, "diagnostic_fixture_reserved")
        finally:
            store.close()
    directory = STATE / "watchdog-diagnostics" / value["operation"]
    directory.mkdir(parents=True, mode=0o700)
    sys.path.insert(0, str(ROOT / ".agents/skills/failure-gate-v4/tests"))
    from authoring_supervision import supervise_static
    canonical = ROOT / ".agents/skills/failure-gate-v4/tests/authoring_supervision.py"
    if hashlib.sha256(read_bytes(canonical)).hexdigest() != "c759dee01e36b2ea0acee65d80b7e2a0d2b0977725f52d09dc6ccf2d672a7698":
        raise Blocked("canonical fixture supervisor changed")
    if time.monotonic() + 35 >= value["deadline"]:
        raise Blocked("no complete fixture allowance")
    fixture = supervise_static([sys.executable, "-B", str(ROOT / "scripts/failure_gate/tests.py")],
                               execution=30, grace=0.2, verification=2, capture=1, max_bytes=1048576)
    output = fixture.pop("output")
    atomic_json(directory / "fixtures.json", {"outcome": fixture, "output": output})
    print(output, end="", flush=True)
    with writer_lock(STATE):
        gate = Gate(ROOT)
        try:
            store = gate.store
            context(store)
            value["fixtures"] = "PASSED" if fixture["pass_"] is True else "FAILED"
            with store.transaction():
                save(store, value, "diagnostic_fixtures_recorded")
            if fixture["pass_"] is not True:
                raise Blocked("fixture failure; original incident retained; no retry")
            row = store.db.execute("SELECT * FROM runs WHERE id=?", (value["retained_run"],)).fetchone()
            if (row is None or row["task_id"] != value["task"] or row["status"] != "running"
                    or row["recovery_required"] != 1 or row["purpose"] != "bootstrap_format_amendment"
                    or store.db.execute("SELECT count(*) FROM runs WHERE recovery_required=1").fetchone()[0] != 1):
                raise Blocked("exact incident or contenders changed")
            prior_outcome = read_json(STATE / "completion-rechecks/3d658bf1-d839-4c0e-a8b4-0ab92d367d79/caller-1/outcome.json")
            if (prior_outcome.get("raw_exit") != 4 or prior_outcome.get("healthy_release") is not False
                    or any(prior_outcome.get(p) is not True for p in ("registered", "stopped", "capture_complete"))
                    or prior_outcome.get("gap") is not None):
                raise Blocked("recorded outer termination/capture uncertain")
            identities = []
            for raw, in store.db.execute("SELECT payload FROM events WHERE run_id=? AND kind='watchdog_registered'",
                                         (row["id"],)):
                item = json.loads(raw)["payload"]
                identities.extend([item["watchdog"], item["worker"]])
            events = STATE / "completion-rechecks/3d658bf1-d839-4c0e-a8b4-0ab92d367d79/caller-1/events"
            for path in events.glob("*.json"):
                item = read_json(path)
                if item["kind"] == "watchdog_registered":
                    identities.extend([item["payload"]["watchdog"], item["payload"]["worker"]])
            identities.extend(item["process"] for item in prior_outcome["signals"])
            if len(identities) != 8 or any(incarnation(item["pid"]) is not None for item in identities):
                raise Blocked("exact recorded PID occupancy/ownership remains uncertain; no signals")
            payload = json.loads(row["payload"])
            binding = json.loads(store.meta("installation"))
            if binding["tooling_digest"] != value["base_tooling"] or binding["policy_digest"] != digest(gate.policy):
                raise Blocked("original governing binding changed")
            with store.transaction():
                decision = store.decision("watchdog_exact_incident_recovery", value["task"],
                    {"approval": approval, "operation": value["operation"], "run": row["id"],
                     "prior_payload_digest": digest(payload), "original_outcome": prior_outcome,
                     "observed_absent": identities, "previous_binding": binding})
                payload["recovery"] = {"decision": decision, "original_failure_preserved": True,
                                       "disposition": "Exact owner-approved known-quiescent recovery; not PASS"}
                store.db.execute("UPDATE runs SET status='recovered',recovery_required=0,payload=? WHERE id=?",
                                 (encoded(payload), row["id"]))
                store.set_meta("installation", encoded({
                    **binding, "policy": gate.policy, "policy_digest": digest(gate.policy),
                    "tooling_digest": value["tooling"], "execution_definition": value["definition"],
                    "governing_revision": decision, "governing_revision_approval": approval}))
                value.update(phase="recovered", recovery_decision=decision)
                ack = save(store, value, "watchdog_recovery_acknowledged", row["id"])
            readonly = Store(STATE, read_only=True)
            try:
                actual = readonly.db.execute("SELECT * FROM runs WHERE id=?", (row["id"],)).fetchone()
                if (actual["status"] != "recovered" or actual["recovery_required"] != 0
                        or json.loads(actual["payload"])["recovery"]["decision"] != decision
                        or not readonly.db.execute("SELECT 1 FROM events WHERE id=?", (ack,)).fetchone()):
                    raise Blocked("exact recovery acknowledgement unknown")
            finally:
                readonly.close()
            gate.bindings()
            remaining = value["deadline"] - time.monotonic()
            if remaining <= 64:
                raise Blocked("no remaining diagnostic execution/cleanup allowance")
            identifier = str(uuid.uuid4())
            with store.transaction():
                value.update(phase="diagnostic_running", diagnostic_attempts=1, diagnostic_run=identifier)
                store.db.execute("INSERT INTO runs VALUES(?,?,?,?,?,?,?,?)",
                    (identifier, value["task"], "watchdog_diagnostic", 0, "diagnostic", "running", 1,
                     encoded({"assessment": "INCOMPLETE", "operation": value["operation"],
                              "command": ["pnpm", "test"], "eligible_for_tier": False})))
                save(store, value, "watchdog_diagnostic_reserved", identifier)
            limits = dict(LIMITS, step_seconds=min(180, int(remaining - 31)),
                          run_seconds=300, installation_seconds=300)
            def record(kind, detail):
                with store.transaction():
                    store.event(kind, value["task"], identifier, detail)
            outcome = run(["pnpm", "test"], ROOT, directory / "diagnostic", record, limits,
                          parent_deadline=time.monotonic() + limits["step_seconds"] - 1)
            atomic_json(directory / "diagnostic/outcome.json", outcome)
            with store.transaction():
                status = "finished" if outcome["healthy_release"] is True else "interrupted"
                store.db.execute("UPDATE runs SET status=?,recovery_required=?,payload=? WHERE id=?",
                    (status, 0 if outcome["healthy_release"] is True else 1,
                     encoded({"outcome": outcome, "eligible_for_tier": False,
                              "assessment": "DIAGNOSTIC_ONLY"}), identifier))
                value["phase"] = "diagnostic_recorded"
                save(store, value, "watchdog_diagnostic_recorded", identifier)
            print(encoded({"diagnostic": outcome, "installation_acceptance": False}), flush=True)
            return 0 if outcome["pass"] is True else 4
        finally:
            gate.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (Blocked, OSError, ValueError, KeyError, TypeError, RuntimeError) as error:
        print(encoded({"status": "BLOCKED", "reason": str(error)}), flush=True)
        raise SystemExit(4)
