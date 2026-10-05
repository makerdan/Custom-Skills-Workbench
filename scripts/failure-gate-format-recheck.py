#!/usr/bin/env python3
"""One-shot approved format amendment. No ordinary cutover or live reclaim."""
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
from common import Blocked, atomic_json, digest, encoded, read_bytes, read_json, writer_lock
from gate import Gate, execution_definition, tooling
from store import Store
from supervisor import LIMITS, run

REFERENCE = "inv_1iUbbTUza9TH1OYklXXmz6VHHX6kIwsgpj:call_COt2ujLvZvm1z4wVCGgVpfeD"
KEY = "format-recheck:" + hashlib.sha256(REFERENCE.encode()).hexdigest()


def approval():
    value = read_json(ROOT / "docs/validation/failure-gate-test-format-approval.json")
    if (value["reference"] != REFERENCE or value["answer"] != "Approve fixes and bounded rechecks"
            or value["status"] != "APPROVED_LOCAL_CONVERSATION"):
        raise Blocked("actual scoped approval missing")
    return value


def save(store, value, kind, identifier=None):
    store.set_meta(KEY, encoded(value))
    return store.event(kind, value["task"], identifier, value)


def bound(store):
    value = json.loads(store.meta(KEY) or "null")
    if (not isinstance(value, dict) or value["approval"] != approval()
            or value["tooling_digest"] != tooling(ROOT)
            or value["execution_definition"] != execution_definition(ROOT)
            or value["driver_digest"] != hashlib.sha256(read_bytes(__file__)).hexdigest()
            or value["boot"] != read_bytes("/proc/sys/kernel/random/boot_id", 100).decode().strip()
            or value["namespace"] != store.meta("namespace")
            or store.meta("governance") != "STAGED" or time.monotonic() >= value["deadline"]):
        raise Blocked("stale, expired, changed or non-staged amendment")
    return value


def worker(number):
    if (number not in (1, 2) or not stat.S_ISFIFO(os.fstat(sys.stdin.fileno()).st_mode)
            or "FAILURE_GATE_PARENT_DEADLINE" not in os.environ):
        raise Blocked("private worker requires admitted IPC/deadline")
    with writer_lock(STATE):
        gate = Gate(ROOT)
        try:
            value = bound(gate.store)
            if (value["fixtures"] != "PASSED" or value["attempts"] != number - 1
                    or value["phase"] != ("fixtures_passed" if number == 1 else "first_passed")):
                raise Blocked("fixture/attempt lineage does not permit dispatch")
            deadline = float(os.environ["FAILURE_GATE_PARENT_DEADLINE"])
            if not time.monotonic() + 60 < deadline <= value["deadline"]:
                raise Blocked("inherited parent deadline invalid or insufficient")
            gate.bindings()
            value.update(attempts=number, phase="caller_running")
            with gate.store.transaction():
                save(gate.store, value, "format_caller_reserved")
            result = gate.execute(value["task"], "standard", "bootstrap_format_amendment", 0,
                                  min(1200, deadline - time.monotonic() - 30))
            passed = result["assessment"] == "PASSED"
            value["runs"].append(result["run_id"])
            value["phase"] = ("first_passed" if number == 1 else "passed_twice") if passed else "failed"
            with gate.store.transaction():
                save(gate.store, value, "format_caller_recorded", result["run_id"])
            print(encoded({"caller": number, "run": result["run_id"], "assessment": result["assessment"]}))
            return 0 if passed else 1
        finally:
            gate.close()


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--worker":
        return worker(int(sys.argv[2]))
    if len(sys.argv) != 1:
        raise Blocked("unknown invocation")
    actual = approval()
    with writer_lock(STATE):
        gate = Gate(ROOT)
        try:
            store = gate.store
            if (store.meta(KEY) is not None or store.meta("governance") != "STAGED"
                    or store.meta("namespace") != "d63a3d51-4dea-4a99-9e6a-d01410b7e017"
                    or store.meta("bootstrap_task") != "FG-00000001"
                    or store.db.execute("SELECT count(*) FROM runs WHERE recovery_required=1").fetchone()[0]):
                raise Blocked("already attempted, incompatible state or retained exclusion")
            prior = json.loads(store.meta("installation"))
            if (prior["tooling_digest"] != actual["base_tooling_digest"]
                    or prior["policy_digest"] != actual["base_policy_digest"]):
                raise Blocked("approved base binding changed")
            original_policy = json.loads(encoded(gate.policy))
            original_policy["version"] = "local-v1"
            original_policy["tiers"]["standard"]["steps"][1]["parser"] = "tap"
            if digest(original_policy) != actual["base_policy_digest"] or gate.policy["version"] != "local-v1.1":
                raise Blocked("policy amendment exceeded result-adapter scope")
            definition = execution_definition(ROOT)
            old = prior["execution_definition"]["files"]
            new = definition["files"]
            changed = {path for path in set(old) | set(new) if old.get(path) != new.get(path)}
            if changed != {"scripts/failure_gate/gate.py", "scripts/failure_gate/tests.py"}:
                raise Blocked("unrelated command/hook/discovery source drift")
            started = time.monotonic()
            value = {"operation": str(uuid.uuid4()), "task": store.meta("bootstrap_task"),
                     "namespace": store.meta("namespace"), "approval": actual,
                     "started": started, "deadline": started + 1200, "attempts": 0,
                     "boot": read_bytes("/proc/sys/kernel/random/boot_id", 100).decode().strip(),
                     "fixtures": "STARTED", "phase": "fixtures", "runs": [],
                     "fixture_attempts": 1, "policy_digest": digest(gate.policy),
                     "tooling_digest": tooling(ROOT), "execution_definition": definition,
                     "driver_digest": hashlib.sha256(read_bytes(__file__)).hexdigest(),
                     "previous_binding": prior,
                     "original_attempts": store.meta("installation_attempts"),
                     "original_started": store.meta("installation_started_monotonic")}
            with store.transaction():
                decision = store.decision("format_amendment_grant", value["task"], value)
                value["decision"] = decision
                save(store, value, "format_amendment_authorized")
        finally:
            gate.close()
    directory = STATE / "format-rechecks" / value["operation"]
    directory.mkdir(parents=True, mode=0o700)
    sys.path.insert(0, str(ROOT / ".agents/skills/failure-gate-v4/tests"))
    from authoring_supervision import supervise_static
    canonical = ROOT / ".agents/skills/failure-gate-v4/tests/authoring_supervision.py"
    if hashlib.sha256(read_bytes(canonical)).hexdigest() != "c759dee01e36b2ea0acee65d80b7e2a0d2b0977725f52d09dc6ccf2d672a7698":
        raise Blocked("canonical fixture supervisor changed")
    fixture = supervise_static([sys.executable, "-B", str(ROOT / "scripts/failure_gate/tests.py")],
                               execution=30, grace=0.2, verification=2, capture=1, max_bytes=1048576)
    output = fixture.pop("output")
    atomic_json(directory / "fixtures.json", {"outcome": fixture, "output": output,
                                            "tooling_digest": value["tooling_digest"]})
    print(output, end="", flush=True)
    with writer_lock(STATE):
        store = Store(STATE)
        try:
            bound(store)
            value["fixtures"] = "PASSED" if fixture["pass_"] is True else "FAILED"
            value["phase"] = "fixtures_passed" if fixture["pass_"] is True else "failed"
            with store.transaction():
                save(store, value, "format_fixtures_recorded")
                if fixture["pass_"] is True:
                    revised = {**value["previous_binding"], "policy_digest": value["policy_digest"],
                               "tooling_digest": value["tooling_digest"],
                               "execution_definition": value["execution_definition"],
                               "governing_revision": value["decision"],
                               "governing_revision_approval": actual}
                    store.set_meta("installation", encoded(revised))
                    save(store, value, "format_revision_acknowledged")
        finally:
            store.close()
    if fixture["pass_"] is not True:
        raise Blocked("amended fixtures failed; no rebind/callers/retry")
    readonly = Store(STATE, read_only=True)
    try:
        bound(readonly)
        if json.loads(readonly.meta("installation"))["governing_revision"] != value["decision"]:
            raise Blocked("governing revision readback missing")
    finally:
        readonly.close()
    for number in (1, 2):
        remaining = value["deadline"] - time.monotonic()
        if remaining <= 94:
            raise Blocked("additional parent budget exhausted")
        limits = dict(LIMITS, installation_seconds=1200,
                      step_seconds=min(480, int(remaining - 30)))
        target = directory / f"caller-{number}"
        ordinal = 0

        def event(kind, payload):
            nonlocal ordinal
            ordinal += 1
            atomic_json(target / "events" / f"{ordinal:06d}.json",
                        {"operation": value["operation"], "approval_reference": REFERENCE,
                         "ordinal": ordinal, "kind": kind, "payload": payload})

        outcome = run([sys.executable, "-B", str(Path(__file__).resolve()), "--worker", str(number)],
                      ROOT, target, event, limits,
                      parent_deadline=time.monotonic() + limits["step_seconds"] - 1)
        atomic_json(target / "outcome.json", outcome)
        print(encoded({"format_caller": number, "outcome": outcome}), flush=True)
        if outcome.get("pass") is not True:
            raise Blocked("amended caller failed/unknown; stop new dispatch, no retry")
    print(encoded({"bootstrap_callers": "PASSED_TWICE", "ordinary_route": "STAGED",
                   "cutover": "NOT APPROVED", "operation": value["operation"]}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (Blocked, OSError, ValueError, KeyError, TypeError) as error:
        print(encoded({"status": "BLOCKED", "reason": str(error)}), flush=True)
        raise SystemExit(4)
