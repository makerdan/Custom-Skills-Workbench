#!/usr/bin/env python3
"""Scoped supervisor amendment; inherits original deadline and unused slots."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("format_route", ROOT / "scripts/failure-gate-format-recheck.py")
route = importlib.util.module_from_spec(spec)
spec.loader.exec_module(route)

REFERENCE = "inv_1iUbbTUza9TH3tv4aTAuxiiSQsxOcUxNlL:call_BTITuycaDGAFhIdvcg3GE9mP"
PARENT_REFERENCE = "inv_1iUbbTUza9TH1OYklXXmz6VHHX6kIwsgpj:call_COt2ujLvZvm1z4wVCGgVpfeD"
PARENT_KEY = "format-recheck:" + hashlib.sha256(PARENT_REFERENCE.encode()).hexdigest()
route.KEY = "completion-recheck:" + hashlib.sha256(REFERENCE.encode()).hexdigest()
route.REFERENCE = REFERENCE


def approval():
    actual = route.read_json(ROOT / "docs/validation/failure-gate-completion-observation-approval.json")
    if (actual["reference"] != REFERENCE or actual["answer"] != "Approve the fix and additional fixture pass"
            or actual["status"] != "APPROVED_LOCAL_CONVERSATION" or actual["new_time_budget"] is not False):
        raise route.Blocked("actual inherited-scope approval missing")
    return actual


route.approval = approval
original_bound = route.bound


def bound(store):
    value = original_bound(store)
    parent = json.loads(store.meta(PARENT_KEY) or "null")
    if (parent is None or value["parent"] != parent["operation"]
            or value["deadline"] != parent["deadline"] or value["deadline"] != approval()["deadline"]
            or parent["phase"] != "failed" or parent["attempts"] != 0 or parent["fixture_attempts"] != 1
            or value["controller_digest"] != hashlib.sha256(route.read_bytes(__file__)).hexdigest()):
        raise route.Blocked("parent accounting or scoped controller changed")
    return value


route.bound = bound


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--worker":
        return route.worker(int(sys.argv[2]))
    if len(sys.argv) != 1:
        raise route.Blocked("unknown invocation")
    actual = approval()
    with route.writer_lock(route.STATE):
        gate = route.Gate(ROOT)
        try:
            store = gate.store
            parent = json.loads(store.meta(PARENT_KEY) or "null")
            if (parent is None or parent["operation"] != actual["parent_operation"]
                    or parent["phase"] != "failed" or parent["attempts"] != 0
                    or parent["fixture_attempts"] != 1 or store.meta(route.KEY) is not None
                    or parent["deadline"] != actual["deadline"] or time.monotonic() + 94 >= parent["deadline"]
                    or store.meta("governance") != "STAGED"
                    or store.meta("namespace") != parent["namespace"]
                    or store.db.execute("SELECT count(*) FROM runs WHERE recovery_required=1").fetchone()[0]):
                raise route.Blocked("expired, changed, repeated or retained parent scope")
            definition = route.execution_definition(ROOT)
            old, new = parent["execution_definition"]["files"], definition["files"]
            changed = {path for path in set(old) | set(new) if old.get(path) != new.get(path)}
            if (changed != {"scripts/failure_gate/watchdog.py", "scripts/failure_gate/tests.py"}
                    or route.digest(gate.policy) != parent["policy_digest"]):
                raise route.Blocked("source change outside completion-observation amendment")
            value = {"operation": str(uuid.uuid4()), "parent": parent["operation"],
                     "task": parent["task"], "namespace": parent["namespace"], "approval": actual,
                     "started": time.monotonic(), "deadline": parent["deadline"], "boot": parent["boot"],
                     "attempts": 0, "fixtures": "STARTED", "phase": "fixtures", "runs": [],
                     "fixture_attempts": 1, "cumulative_fixture_attempts": 2,
                     "policy_digest": route.digest(gate.policy), "tooling_digest": route.tooling(ROOT),
                     "execution_definition": definition, "previous_binding": json.loads(store.meta("installation")),
                     "driver_digest": hashlib.sha256(route.read_bytes(route.__file__)).hexdigest(),
                     "controller_digest": hashlib.sha256(route.read_bytes(__file__)).hexdigest()}
            with store.transaction():
                value["decision"] = store.decision("completion_observation_amendment", value["task"], value)
                route.save(store, value, "completion_amendment_authorized")
        finally:
            gate.close()
    directory = route.STATE / "completion-rechecks" / value["operation"]
    directory.mkdir(parents=True, mode=0o700)
    sys.path.insert(0, str(ROOT / ".agents/skills/failure-gate-v4/tests"))
    from authoring_supervision import supervise_static
    canonical = ROOT / ".agents/skills/failure-gate-v4/tests/authoring_supervision.py"
    if hashlib.sha256(route.read_bytes(canonical)).hexdigest() != "c759dee01e36b2ea0acee65d80b7e2a0d2b0977725f52d09dc6ccf2d672a7698":
        raise route.Blocked("canonical isolated fixture supervisor changed")
    fixture = supervise_static([sys.executable, "-B", str(ROOT / "scripts/failure_gate/tests.py")],
                               execution=30, grace=0.2, verification=2, capture=1, max_bytes=1048576)
    output = fixture.pop("output")
    route.atomic_json(directory / "fixtures.json", {"outcome": fixture, "output": output,
                                                  "tooling_digest": value["tooling_digest"]})
    print(output, end="", flush=True)
    with route.writer_lock(route.STATE):
        store = route.Store(route.STATE)
        try:
            bound(store)
            value["fixtures"] = "PASSED" if fixture["pass_"] is True else "FAILED"
            value["phase"] = "fixtures_passed" if fixture["pass_"] is True else "failed"
            with store.transaction():
                route.save(store, value, "completion_fixtures_recorded")
                if fixture["pass_"] is True:
                    store.set_meta("installation", route.encoded({
                        **value["previous_binding"], "policy_digest": value["policy_digest"],
                        "tooling_digest": value["tooling_digest"],
                        "execution_definition": value["execution_definition"],
                        "governing_revision": value["decision"], "governing_revision_approval": actual}))
                    route.save(store, value, "completion_revision_acknowledged")
        finally:
            store.close()
    if fixture["pass_"] is not True:
        raise route.Blocked("additional fixtures failed; no rebind/callers/retry")
    readonly = route.Store(route.STATE, read_only=True)
    try:
        bound(readonly)
        if json.loads(readonly.meta("installation"))["governing_revision"] != value["decision"]:
            raise route.Blocked("amended authority readback missing")
    finally:
        readonly.close()
    for number in (1, 2):
        remaining = value["deadline"] - time.monotonic()
        if remaining <= 94:
            raise route.Blocked("inherited budget exhausted before caller")
        limits = dict(route.LIMITS, installation_seconds=1200,
                      step_seconds=min(480, int(remaining - 30)))
        target, ordinal = directory / f"caller-{number}", 0

        def event(kind, payload):
            nonlocal ordinal
            ordinal += 1
            route.atomic_json(target / "events" / f"{ordinal:06d}.json",
                              {"operation": value["operation"], "parent": value["parent"],
                               "approval_reference": REFERENCE, "ordinal": ordinal,
                               "kind": kind, "payload": payload})

        outcome = route.run([sys.executable, "-B", str(Path(__file__).resolve()), "--worker", str(number)],
                            ROOT, target, event, limits,
                            parent_deadline=time.monotonic() + limits["step_seconds"] - 1)
        route.atomic_json(target / "outcome.json", outcome)
        print(route.encoded({"completion_caller": number, "outcome": outcome}), flush=True)
        if outcome.get("pass") is not True:
            raise route.Blocked("caller failed/unknown; no further dispatch")
    print(route.encoded({"bootstrap_callers": "PASSED_TWICE", "ordinary_route": "STAGED",
                         "cutover": "NOT APPROVED", "operation": value["operation"]}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (route.Blocked, OSError, ValueError, KeyError, TypeError) as error:
        print(route.encoded({"status": "BLOCKED", "reason": str(error)}), flush=True)
        raise SystemExit(4)
