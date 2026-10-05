#!/usr/bin/env python3
"""One-shot owner-approved installation recovery, never ordinary activation."""
import hashlib
import json
import os
from pathlib import Path
import stat
import sys
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".failure-gate"
sys.path.insert(0, str(ROOT / "scripts/failure_gate"))
from common import Blocked, atomic_json, digest, encoded, incarnation, read_bytes, read_json, writer_lock
from gate import Gate, execution_definition, tooling
from store import Store
from supervisor import LIMITS, run

REFERENCE = "inv_1iUbbTUza9TH3WRkBmG0gfmnxk2hAhihqN:call_x8CRdZo4nKbuixIlkfGwGIzh"
KEY = "continuation:" + hashlib.sha256(REFERENCE.encode()).hexdigest()
PROPOSAL = "docs/validation/failure-gate-recovery-proposal.json"
APPROVAL = "docs/validation/failure-gate-recovery-approval.json"


def inputs():
    proposal, approval = read_json(ROOT / PROPOSAL), read_json(ROOT / APPROVAL)
    if (approval["reference"] != REFERENCE or approval["answer"] != "Approve recovery and rechecks"
            or approval["status"] != "APPROVED_LOCAL_CONVERSATION"
            or proposal["proposed_tooling_digest"] != tooling(ROOT)
            or proposal["proposed_execution_definition_digest"] != execution_definition(ROOT)["digest"]
            or proposal["original_boot"] != read_bytes("/proc/sys/kernel/random/boot_id", 100).decode().strip()):
        raise Blocked("approval, boot or proposed source bindings changed")
    return proposal, approval


def context(store):
    value = json.loads(store.meta(KEY) or "null")
    proposal, _ = inputs()
    if (not isinstance(value, dict) or value["proposal_digest"] != digest(proposal)
            or value["driver_digest"] != hashlib.sha256(read_bytes(__file__)).hexdigest()
            or store.meta("namespace") != proposal["namespace"]
            or store.meta("governance") != "STAGED"
            or time.monotonic() >= value["deadline"]):
        raise Blocked("continuation expired, unknown, altered or not staged")
    return value


def save(store, value, kind, run_id=None):
    store.set_meta(KEY, encoded(value))
    return store.event(kind, value["task_id"], run_id, {"operation": value["operation"], **value})


def recover(gate, value):
    proposal, approval = inputs()
    store = gate.store
    row = store.db.execute("SELECT * FROM runs WHERE id=?", (proposal["retained_run"],)).fetchone()
    if (row is None or row["task_id"] != proposal["local_task"] or row["purpose"] != "bootstrap"
            or row["status"] != "running" or row["recovery_required"] != 1
            or store.meta("bootstrap_task") != proposal["local_task"]
            or store.meta("installation_boot") != proposal["original_boot"]
            or store.meta("installation_attempts") != "1"
            or store.db.execute("SELECT count(*) FROM runs WHERE recovery_required=1").fetchone()[0] != 1):
        raise Blocked("original retained incident or contenders changed")
    observations = [{"recorded": item, "current": incarnation(item["pid"])}
                    for item in proposal["owned_incarnations"]]
    if any(item["current"] is not None for item in observations):
        raise Blocked("recorded PID is occupied; no age-based recovery or signals")
    step = store.db.execute("SELECT payload FROM events WHERE run_id=? AND kind='step_outcome'",
                            (row["id"],)).fetchone()
    outcome = json.loads(step[0])["payload"] if step else {}
    parent = read_json(STATE / "installer-caller/1/outcome.json")
    for actual in (outcome, parent):
        if any(actual.get(key) is not True for key in ("registered", "stopped", "capture_complete", "healthy_release")):
            raise Blocked("original supervised termination/capture remains unknown")
    if outcome.get("raw_exit") != 0 or parent.get("raw_exit") != 4:
        raise Blocked("original raw incident changed")
    store.check_journal()
    payload = json.loads(row["payload"])
    previous = json.loads(store.meta("installation"))
    if previous["policy_digest"] != proposal["policy_digest"] or digest(gate.policy) != proposal["policy_digest"]:
        raise Blocked("policy outside approved correction changed")
    recovery = {"operation": value["operation"], "approval": approval,
                "proposal_digest": digest(proposal), "observations": observations,
                "original_payload_digest": digest(payload), "original_binding": previous,
                "original_raw_typecheck": outcome, "original_raw_caller": parent,
                "disposition": "Recovered known stopped owned work; original caller FAILED, not PASS"}
    with store.transaction():
        decision = store.decision("scoped_installation_recovery", row["task_id"], recovery)
        payload["recovery"] = {"decision": decision, **recovery}
        store.db.execute("UPDATE runs SET status='recovered',recovery_required=0,payload=? WHERE id=?",
                         (encoded(payload), row["id"]))
        amended = {**previous, "tooling_digest": tooling(ROOT),
                   "execution_definition": execution_definition(ROOT),
                   "governing_revision": decision, "governing_revision_approval": approval}
        store.set_meta("installation", encoded(amended))
        value.update(phase="recovered", recovery_decision=decision)
        acknowledgement = save(store, value, "recovery_acknowledged", row["id"])
    # Fresh authoritative readback, not just a successful function return.
    readonly = Store(STATE, read_only=True)
    try:
        actual = readonly.db.execute("SELECT * FROM runs WHERE id=?", (row["id"],)).fetchone()
        if (actual["status"] != "recovered" or actual["recovery_required"] != 0
                or json.loads(actual["payload"])["recovery"]["decision"] != decision
                or not readonly.db.execute("SELECT 1 FROM events WHERE id=?", (acknowledgement,)).fetchone()):
            raise Blocked("recovery acknowledgement not verified; no new dispatch")
    finally:
        readonly.close()
    gate.bindings()


def worker(number):
    if (number not in (1, 2) or not stat.S_ISFIFO(os.fstat(sys.stdin.fileno()).st_mode)
            or "FAILURE_GATE_PARENT_DEADLINE" not in os.environ):
        raise Blocked("private continuation requires admitted IPC/deadline")
    with writer_lock(STATE):
        gate = Gate(ROOT)
        try:
            value = context(gate.store)
            if value["fixture_status"] != "PASSED" or value["attempts"] != number - 1:
                raise Blocked("fixture/attempt lineage invalid")
            if number == 1:
                recover(gate, value)
            elif value["phase"] != "first_passed":
                raise Blocked("first caller must pass; remaining slots are not retry permission")
            deadline = float(os.environ["FAILURE_GATE_PARENT_DEADLINE"])
            if not time.monotonic() < deadline <= value["deadline"]:
                raise Blocked("invalid inherited continuation deadline")
            remaining = deadline - time.monotonic() - 30
            if remaining <= 30:
                raise Blocked("no time for complete checked caller")
            value.update(attempts=number, phase="caller_running")
            with gate.store.transaction():
                save(gate.store, value, "continuation_caller_reserved")
            result = gate.execute(value["task_id"], "standard", "bootstrap_continuation", 0,
                                  min(1200, remaining))
            passed = result["assessment"] == "PASSED"
            value["caller_runs"].append(result["run_id"])
            value["phase"] = ("first_passed" if number == 1 else "passed_twice") if passed else "failed"
            with gate.store.transaction():
                save(gate.store, value, "continuation_caller_recorded", result["run_id"])
            print(encoded({"caller": number, "run": result["run_id"], "assessment": result["assessment"]}))
            return 0 if passed else 1
        finally:
            gate.close()


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--worker":
        return worker(int(sys.argv[2]))
    if len(sys.argv) != 1:
        raise Blocked("unknown continuation invocation")
    proposal, approval = inputs()
    # Reserve exactly this grant once, keeping original consumption untouched.
    with writer_lock(STATE):
        store = Store(STATE)
        try:
            if store.meta(KEY) is not None:
                raise Blocked("continuation already attempted; no automatic replacement/retry")
            if store.meta("namespace") != proposal["namespace"] or store.meta("governance") != "STAGED":
                raise Blocked("wrong coordinator namespace/governance")
            started = time.monotonic()
            value = {"operation": str(uuid.uuid4()), "task_id": proposal["local_task"],
                     "proposal_digest": digest(proposal), "approval": approval,
                     "driver_digest": hashlib.sha256(read_bytes(__file__)).hexdigest(),
                     "started": started, "deadline": started + 2400,
                     "original_started": store.meta("installation_started_monotonic"),
                     "original_attempts": store.meta("installation_attempts"),
                     "attempts": 0, "fixture_attempts": 1, "fixture_status": "STARTED",
                     "phase": "fixtures", "caller_runs": []}
            with store.transaction():
                store.decision("continuation_grant", value["task_id"], value)
                save(store, value, "continuation_authorized")
        finally:
            store.close()
    directory = STATE / "continuations" / value["operation"]
    directory.mkdir(mode=0o700, parents=True)
    sys.path.insert(0, str(ROOT / ".agents/skills/failure-gate-v4/tests"))
    from authoring_supervision import supervise_static
    canonical = ROOT / ".agents/skills/failure-gate-v4/tests/authoring_supervision.py"
    if hashlib.sha256(read_bytes(canonical)).hexdigest() != "c759dee01e36b2ea0acee65d80b7e2a0d2b0977725f52d09dc6ccf2d672a7698":
        raise Blocked("canonical initial fixture supervisor changed")
    result = supervise_static([sys.executable, "-B", str(ROOT / "scripts/failure_gate/tests.py")],
                              execution=30, grace=0.2, verification=2, capture=1, max_bytes=1048576)
    output = result.pop("output")
    atomic_json(directory / "fixtures.json", {"outcome": result, "raw_output": output,
                                            "tooling_digest": tooling(ROOT)})
    print(output, end="", flush=True)
    value["fixture_status"] = "PASSED" if result["pass_"] is True else "FAILED"
    with writer_lock(STATE):
        store = Store(STATE)
        try:
            with store.transaction():
                save(store, value, "corrective_fixtures_recorded")
        finally:
            store.close()
    if result["pass_"] is not True:
        raise Blocked("corrective fixtures failed; original exclusion retained, no retry")
    for number in (1, 2):
        target = directory / f"caller-{number}"
        remaining = value["deadline"] - time.monotonic()
        if remaining <= 64:
            raise Blocked("continuation time exhausted before caller")
        limits = dict(LIMITS, installation_seconds=2400,
                      step_seconds=min(480, int(remaining - 30)))
        ordinal = 0

        def event(kind, data):
            nonlocal ordinal
            ordinal += 1
            atomic_json(target / "events" / f"{ordinal:06d}.json",
                        {"operation": value["operation"], "approval_reference": REFERENCE,
                         "ordinal": ordinal, "kind": kind, "payload": data})

        outcome = run([sys.executable, "-B", str(Path(__file__).resolve()), "--worker", str(number)],
                      ROOT, target, event, limits,
                      parent_deadline=time.monotonic() + limits["step_seconds"] - 1)
        atomic_json(target / "outcome.json", outcome)
        print(encoded({"continuation_caller": number, "outcome": outcome}), flush=True)
        if outcome.get("pass") is not True:
            raise Blocked("caller failed/unknown; preserve evidence and stop new dispatch")
    print(encoded({"bootstrap_callers": "PASSED_TWICE", "ordinary_route": "STAGED",
                   "cutover": "NOT APPROVED", "operation": value["operation"]}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (Blocked, OSError, ValueError, KeyError, TypeError) as error:
        print(encoded({"status": "BLOCKED", "reason": str(error)}), flush=True)
        raise SystemExit(4)
