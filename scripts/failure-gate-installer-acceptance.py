#!/usr/bin/env python3
"""Owner-approved two-caller acceptance; no activation or automatic retries."""
import hashlib
import json
import os
from pathlib import Path
import stat
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".failure-gate"
sys.path.insert(0, str(ROOT / "scripts/failure_gate"))
from common import Blocked, atomic_json, encoded, read_bytes, read_json, writer_lock
from gate import Gate, execution_definition, tooling
from store import Store
from supervisor import LIMITS, run

REF = "inv_1iUbbTUza9TH2lmVbECcIvAD7xNJ4PuIs9:call_AWP3bWPubhTyMmYlQXlqanCz"
KEY = "installer-acceptance:" + hashlib.sha256(REF.encode()).hexdigest()


def receipt():
    value = read_json(ROOT / "docs/validation/failure-gate-installer-acceptance-approval.json")
    if (value["reference"] != REF or value["answer"] != "Approve bounded installation checks"
            or value["status"] != "APPROVED_LOCAL_CONVERSATION"
            or value["grant_seconds"] != 300):
        raise Blocked("actual bounded approval missing")
    return value


def bound(store):
    value = json.loads(store.meta(KEY) or "null")
    if (not isinstance(value, dict) or value["reference"] != REF
            or value["answer"] != receipt()["answer"]
            or value["namespace"] != store.meta("namespace")
            or value["boot"] != read_bytes("/proc/sys/kernel/random/boot_id", 100).decode().strip()
            or value["tooling"] != tooling(ROOT)
            or value["definition"] != execution_definition(ROOT)
            or store.meta("governance") != "STAGED" or time.monotonic() >= value["deadline"]):
        raise Blocked("expired, drifted or unbound acceptance")
    if value.get("driver") and (value["driver"] != hashlib.sha256(read_bytes(__file__)).hexdigest()
                              or value["approval"] != receipt()):
        raise Blocked("approved acceptance closure changed")
    return value


def save(store, value, kind, run_id=None):
    store.set_meta(KEY, encoded(value))
    return store.event(kind, value["task"], run_id, value)


def worker(number):
    if (number not in (1, 2) or not stat.S_ISFIFO(os.fstat(sys.stdin.fileno()).st_mode)
            or "FAILURE_GATE_PARENT_DEADLINE" not in os.environ):
        raise Blocked("private worker requires admitted IPC and deadline")
    with writer_lock(STATE):
        gate = Gate(ROOT)
        try:
            value = bound(gate.store)
            if (value["attempts"] != number or value["phase"] != "caller_reserved"
                    or len(value["runs"]) != number - 1):
                raise Blocked("caller reservation/lineage invalid")
            end = float(os.environ["FAILURE_GATE_PARENT_DEADLINE"])
            if not time.monotonic() + 60 < end <= value["deadline"]:
                raise Blocked("inherited allowance insufficient or enlarged")
            gate.bindings()
            with gate.store.transaction():
                value["phase"] = "caller_running"
                save(gate.store, value, "acceptance_worker_confirmed")
            result = gate.execute(value["task"], "standard", "bootstrap_installer_acceptance", 0,
                                  min(60, end - time.monotonic() - 30))
            passed = result["assessment"] == "PASSED"
            value["runs"].append(result["run_id"])
            value["phase"] = "worker_passed" if passed else "worker_failed"
            with gate.store.transaction():
                save(gate.store, value, "acceptance_worker_recorded", result["run_id"])
            print(encoded({"caller": number, "run": result["run_id"],
                           "assessment": result["assessment"]}), flush=True)
            return 0 if passed else 1
        finally:
            gate.close()


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--worker":
        return worker(int(sys.argv[2]))
    if len(sys.argv) != 1:
        raise Blocked("unknown invocation")
    with writer_lock(STATE):
        gate = Gate(ROOT)
        try:
            value = bound(gate.store)
            if value["phase"] != "authoring" or value["attempts"] != 0:
                raise Blocked("one-shot acceptance already entered")
            previous = json.loads(gate.store.meta(value["prior_grant_key"]))
            fixture = read_json(STATE / "watchdog-diagnostics" / previous["operation"] / "fixtures.json")
            if (previous["phase"] != "completed" or previous["tooling"] != value["tooling"]
                    or previous["definition"] != value["definition"]
                    or fixture["outcome"]["pass_"] is not True
                    or '"tests": 33' not in fixture["output"]
                    or gate.store.db.execute("SELECT count(*) FROM runs WHERE recovery_required=1").fetchone()[0]):
                raise Blocked("prior proven closure or quiescent coordinator changed")
            gate.bindings()
            value.update(driver=hashlib.sha256(read_bytes(__file__)).hexdigest(),
                         approval=receipt(), runs=[], phase="ready")
            with gate.store.transaction():
                value["decision"] = gate.store.decision("installer_acceptance_authorized", value["task"], value)
                save(gate.store, value, "acceptance_source_admitted")
        finally:
            gate.close()
    directory = STATE / "installer-acceptance" / value["operation"]
    for number in (1, 2):
        target = directory / f"caller-{number}"
        with writer_lock(STATE):
            store = Store(STATE)
            try:
                value = bound(store)
                if (value["phase"] != ("ready" if number == 1 else "first_passed")
                        or value["attempts"] != number - 1 or target.exists()
                        or store.db.execute("SELECT count(*) FROM runs WHERE recovery_required=1").fetchone()[0]):
                    raise Blocked("attempt consumed, retained run or unknown prior result")
                remaining = value["deadline"] - time.monotonic()
                if remaining < 125:
                    raise Blocked("no complete caller execution/cleanup/capture allowance")
                with store.transaction():
                    value.update(attempts=number, phase="caller_reserved")
                    save(store, value, "acceptance_caller_reserved")
            finally:
                store.close()
        ordinal = 0

        def record(kind, detail):
            nonlocal ordinal
            ordinal += 1
            atomic_json(target / "events" / f"{ordinal:06d}.json",
                        {"kind": kind, "payload": detail, "reference": REF, "caller": number})

        limits = dict(LIMITS, step_seconds=90, run_seconds=300, installation_seconds=300)
        outcome = run([sys.executable, "-B", str(Path(__file__).resolve()), "--worker", str(number)],
                      ROOT, target, record, limits, parent_deadline=time.monotonic() + 89)
        atomic_json(target / "outcome.json", outcome)
        print(encoded({"caller": number, "outcome": outcome}), flush=True)
        with writer_lock(STATE):
            store = Store(STATE)
            try:
                value = bound(store)
                if value["phase"] != "worker_passed" or outcome.get("pass") is not True:
                    with store.transaction():
                        value["phase"] = "failed"
                        save(store, value, "acceptance_caller_failed")
                    raise Blocked("caller failed/uncertain; stop without retry")
                with store.transaction():
                    value["phase"] = "first_passed" if number == 1 else "passed_twice"
                    save(store, value, "acceptance_caller_acknowledged", value["runs"][-1])
            finally:
                store.close()
    print(encoded({"installer_callers": "PASSED_TWICE", "ordinary_governance": "STAGED",
                   "activation": "NOT APPROVED", "live_reclaim": "BLOCKED"}), flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (Blocked, OSError, ValueError, KeyError, TypeError, RuntimeError) as error:
        print(encoded({"status": "BLOCKED", "reason": str(error)}), flush=True)
        raise SystemExit(4)
