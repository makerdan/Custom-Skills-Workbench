"""Installation-only cooperative admission. No ordinary tiers or argv passthrough."""
import hashlib
import json
import math
import os
from pathlib import Path
import stat
import sys
import time
import uuid

from common import Blocked, alive, atomic_json, digest, encoded, incarnation, inside, read_bytes, read_json, writer_lock
from gate import Gate
from store import Store
from supervisor import LIMITS, run


PLAN = "docs/validation/failure-gate-bootstrap-plan.json"
APPROVAL = "docs/validation/failure-gate-bootstrap-approval.json"
ENTRY = "scripts/failure-gate-bootstrap.py"
KEY = "bounded-bootstrap-v1"
OPERATION = "installation.coordination-bootstrap"
EFFECTS = ["append bootstrap decision/reservation/evidence", "isolated fixture stores",
           "read coordinator health", "supervise exact owned cooperative children"]
ORDER = ("fixtures-1", "fixtures-2", "health-1", "health-2")
CONTAINMENT = ".agents/skills/failure-gate-v4/tests/authoring_supervision.py"
CONTAINMENT_HASH = "c759dee01e36b2ea0acee65d80b7e2a0d2b0977725f52d09dc6ccf2d672a7698"
HEALTH_LIMITS = dict(LIMITS, step_seconds=30, run_seconds=900,
                     installation_seconds=900, max_bytes=1048576)


def boot():
    return read_bytes("/proc/sys/kernel/random/boot_id", 100).decode().strip()


def closure(root):
    """Fixed finite graph, canonical sources only. Approval/output are not inputs."""
    root = Path(root)
    paths = {ENTRY, PLAN, "docs/validation/failure-gate-policy.json"}
    for base in ("scripts/failure_gate", ".agents/skills/failure-gate-v4",
                 ".agents/skills/port-authority"):
        paths.update(str(p.relative_to(root)) for p in (root / base).rglob("*")
                     if p.is_file() and "__pycache__" not in p.parts and p.suffix != ".pyc")
    if len(paths) > 200:
        raise Blocked("bootstrap closure exceeds fixed file bound")
    return {p: hashlib.sha256(read_bytes(inside(root, p))).hexdigest() for p in sorted(paths)}


def subject(root, store):
    plan = read_json(inside(root, PLAN))
    expected = {"schema": 1, "operation": OPERATION, "namespace": store.meta("namespace"),
                "local_id": store.meta("bootstrap_task"), "policy_version": "local-v1.1",
                "effects": EFFECTS, "order": list(ORDER), "parent_seconds": 900,
                "fixture_execution_seconds": 120, "fixture_grace_seconds": 0.2,
                "fixture_verification_seconds": 2, "fixture_capture_seconds": 1,
                "fixture_output_bytes": 1048576, "health_limits": HEALTH_LIMITS}
    policy = read_json(inside(root, "docs/validation/failure-gate-policy.json"))
    if plan != expected or policy.get("version") != "local-v1.1":
        raise Blocked("exact bootstrap operation/plan/policy mismatch")
    if store.meta("governance") != "STAGED" or not store.meta("installation_decision"):
        raise Blocked("registered staged installation required")
    store.task(plan["local_id"])
    files = closure(root)
    if files.get(CONTAINMENT) != CONTAINMENT_HASH:
        raise Blocked("unchanged independently verified fixture containment required")
    return {"plan": plan, "plan_digest": digest(plan), "source_files": files,
            "source_digest": digest(files), "policy_digest": digest(policy),
            "root": str(Path(root).resolve()), "namespace": plan["namespace"],
            "local_id": plan["local_id"], "operation": OPERATION,
            "execution": {"fixture": [sys.executable, "-B", "scripts/failure_gate/tests.py"],
                          "health": [sys.executable, "-B", ENTRY, "--private-health"]}}


def record(store, value, kind, run_id=None):
    store.set_meta(KEY, encoded(value))
    store.event(kind, value["binding"]["local_id"], run_id, value)


def review(root):
    """Preserve actual terminal review; never emulate it with pipes or flags."""
    if not sys.stdin.isatty():
        raise Blocked("actual interactive owner review required")
    with writer_lock(Path(root) / ".failure-gate"):
        store = Store(Path(root) / ".failure-gate")
        try:
            binding = subject(root, store)
            print(encoded(binding), flush=True)
            phrase = "approve bootstrap " + digest(binding)
            if input("Enter exactly after reviewing all bindings:\n" + phrase + "\n") != phrase:
                raise Blocked("bootstrap review declined")
            approve(store, binding, {"source": "actual interactive terminal review",
                                    "reference": "terminal:" + str(uuid.uuid4()),
                                    "action": phrase, "binding_digest": digest(binding)})
        finally:
            store.close()


def approve(store, binding, source):
    """Called only after real review; fixture calls are isolated simulations."""
    if store.meta(KEY) is not None:
        raise Blocked("bootstrap already decided; no renewal or replacement")
    if store.db.execute("SELECT 1 FROM runs WHERE recovery_required=1").fetchone():
        raise Blocked("retained competing ownership")
    now = time.monotonic()
    value = {"binding": binding, "source": source, "boot": boot(), "started": now,
             "deadline": now + 900, "next": 0, "phase": "ready", "attempts": []}
    with store.transaction():
        value["decision"] = store.decision("bounded_bootstrap_review", binding["local_id"],
                                          {"binding": binding, "source": source,
                                           "clock": {k: value[k] for k in ("boot", "started", "deadline")}})
        record(store, value, "bootstrap_review_reserved")
    return value


def capture_owner_decision(root):
    """Fixed local conversation receipt, never caller-selected evidence.

    Installation policy permits actual owner chat review. The implementing agent
    places this record only after a real response to the final pinned proposal.
    This is cooperative captured evidence, not protected platform authentication.
    """
    with writer_lock(Path(root) / ".failure-gate"):
        store = Store(Path(root) / ".failure-gate")
        try:
            binding = subject(root, store)
            actual = read_json(inside(root, APPROVAL))
            if (not isinstance(actual, dict) or set(actual) !=
                    {"schema", "source", "reference", "question", "answer", "binding"}
                    or actual["schema"] != 1
                    or actual["source"] != "actual owner response to final bootstrap approval form"
                    or actual["question"] != "Approve this exact bounded bootstrap proof?"
                    or actual["answer"] != "Approve the pinned bootstrap proof"
                    or not isinstance(actual["reference"], str) or not actual["reference"].strip()
                    or actual["binding"] != binding):
                raise Blocked("missing actual exact-bound owner decision")
            return approve(store, binding, actual)
        finally:
            store.close()


def context(root, store, allow_expired=False):
    value = json.loads(store.meta(KEY) or "null")
    if not isinstance(value, dict) or value.get("binding") != subject(root, store):
        raise Blocked("missing or drifted bootstrap binding")
    row = store.db.execute("SELECT * FROM decisions WHERE id=?", (value.get("decision"),)).fetchone()
    expected = {"binding": value["binding"], "source": value["source"],
                "clock": {k: value.get(k) for k in ("boot", "started", "deadline")}}
    if (row is None or row["kind"] != "bounded_bootstrap_review"
            or row["task_id"] != value["binding"]["local_id"]
            or row["payload"] != encoded(expected) or row["digest"] != digest(expected)):
        raise Blocked("decision evidence integrity mismatch")
    if value.get("boot") != boot():
        raise Blocked("changed boot cannot renew historical clocks")
    for name in ("started", "deadline"):
        if type(value.get(name)) not in (int, float) or not math.isfinite(value[name]):
            raise Blocked("invalid parent clock")
    if value["deadline"] != value["started"] + 900:
        raise Blocked("parent allowance enlarged or reset")
    if not allow_expired and time.monotonic() >= value["deadline"]:
        raise Blocked("bootstrap allowance exhausted")
    return value


def protected_state(store):
    """Health may read but cannot change tasks, policy or unrelated meta."""
    return digest({"tasks": [dict(r) for r in store.db.execute("SELECT * FROM tasks ORDER BY id")],
                   "repairs": [dict(r) for r in store.db.execute("SELECT * FROM repairs ORDER BY task_id,signature")],
                   "meta": [dict(r) for r in store.db.execute(
                       "SELECT * FROM meta WHERE key != ? ORDER BY key", (KEY,))]})


def reserve(root, store, caller):
    value = context(root, store)
    n = value["next"]
    if type(n) is not int or n not in range(4) or caller != ORDER[n] or value["phase"] != "ready":
        raise Blocked("wrong caller, consumed attempt or uncertain prior result")
    if len(value["attempts"]) != n:
        raise Blocked("attempt lineage incomplete")
    for number, previous in enumerate(value["attempts"]):
        row = store.db.execute("SELECT * FROM runs WHERE id=?", (previous.get("run"),)).fetchone()
        evidence = inside(store.directory, previous.get("evidence", ""))
        if (previous.get("caller") != ORDER[number] or previous.get("status") != "passed"
                or row is None or row["recovery_required"] != 0
                or row["payload"] != encoded(previous)
                or hashlib.sha256(read_bytes(evidence)).hexdigest() != previous.get("evidence_digest")):
            raise Blocked("prior bootstrap evidence missing or corrupt")
    if store.db.execute("SELECT 1 FROM runs WHERE recovery_required=1").fetchone():
        raise Blocked("single-flight/conflict exclusion retained")
    # Entire execution + startup/queue and cleanup/capture fit before dispatch.
    required = 123.2 if caller.startswith("fixtures") else 107
    if value["deadline"] - time.monotonic() <= required:
        raise Blocked("insufficient complete execution/cleanup/capture allowance")
    run_id = str(uuid.uuid4())
    end = min(value["deadline"] - 30, time.monotonic() + 29) if caller.startswith("health") else None
    attempt = {"caller": caller, "run": run_id, "deadline": end,
               "protected_before": protected_state(store), "events": [], "status": "reserved"}
    with store.transaction():
        store.db.execute("INSERT INTO runs VALUES(?,?,?,?,?,?,?,?)",
                         (run_id, value["binding"]["local_id"], OPERATION, 0,
                          "installation-only", "reserved", 1, encoded(attempt)))
        value["attempts"].append(attempt)
        value["phase"] = "reserved"
        value["next"] += 1
        record(store, value, "bootstrap_attempt_reserved", run_id)
    return value, attempt


def private_health(root):
    if (not stat.S_ISFIFO(os.fstat(sys.stdin.fileno()).st_mode)
            or "FAILURE_GATE_PARENT_DEADLINE" not in os.environ):
        raise Blocked("private health requires supervised IPC")
    gate = Gate(root, read_only=True)
    try:
        value = context(root, gate.store)
        attempt = value["attempts"][-1]
        deadline = float(os.environ["FAILURE_GATE_PARENT_DEADLINE"])
        if (value["phase"] != "reserved" or attempt["status"] != "reserved"
                or not attempt["caller"].startswith("health")
                or not time.monotonic() < deadline <= attempt["deadline"] < value["deadline"]):
            raise Blocked("missing reservation or enlarged inherited budget")
        row = gate.store.db.execute("SELECT * FROM runs WHERE id=?", (attempt["run"],)).fetchone()
        registered = attempt.get("registration", {})
        worker = registered.get("worker")
        watchdog = registered.get("watchdog")
        current = incarnation(os.getpid())
        if (row is None or row["recovery_required"] != 1
                or json.loads(row["payload"])["run"] != attempt["run"]
                or not isinstance(worker, dict) or not isinstance(watchdog, dict)
                or current is None or worker.get("pid") != current["pid"]
                or worker.get("start") != current["start"]
                or watchdog.get("pid") != current["parent"] or not alive(watchdog)):
            raise Blocked("worker reservation mismatch")
        print(encoded({"caller": attempt["caller"], "run": attempt["run"],
                       "health": gate.health()}), flush=True)
        return 0
    finally:
        gate.close()


def accept_outcome(outcome, fixture=False):
    flags = ("pass_", "known_stopped", "capture_complete") if fixture else (
        "pass", "registered", "stopped", "capture_complete", "healthy_release")
    if not isinstance(outcome, dict) or any(outcome.get(k) is not True for k in flags):
        return False
    if type(outcome.get("raw_exit")) is not int or outcome["raw_exit"] != 0:
        return False
    if fixture:
        return all(outcome.get(k) is False for k in
                   ("deadline", "surviving_work", "output_overflow", "exclusion")) and outcome.get("error") is None
    return outcome.get("reason") == "finished"


def dispatch(root, caller):
    state = Path(root) / ".failure-gate"
    with writer_lock(state):
        store = Store(state)
        try:
            value, attempt = reserve(root, store, caller)
        finally:
            store.close()
    target = state / "bootstrap" / value["decision"] / caller
    # Reservation is consumed before dispatch; any exception leaves exclusion.
    if target.exists():
        raise Blocked("evidence target already exists")
    target.mkdir(parents=True, mode=0o700)

    def event(kind, detail):
        with writer_lock(state):
            store = Store(state)
            try:
                current = context(root, store, allow_expired=True)
                if current["attempts"][-1]["run"] != attempt["run"] or current["phase"] != "reserved":
                    raise Blocked("supervisor reservation lost")
                with store.transaction():
                    current["attempts"][-1]["events"].append(kind)
                    if kind == "watchdog_registered":
                        current["attempts"][-1]["registration"] = detail
                    store.set_meta(KEY, encoded(current))
                    store.event(kind, value["binding"]["local_id"], attempt["run"], detail)
            finally:
                store.close()

    fixture = caller.startswith("fixtures")
    if fixture:
        sys.path.insert(0, str(Path(root) / Path(CONTAINMENT).parent))
        from authoring_supervision import supervise_static
        outcome = supervise_static([sys.executable, "-B", str(Path(root) / "scripts/failure_gate/tests.py")],
                                   execution=120, grace=0.2, verification=2, capture=1,
                                   max_bytes=1048576)
        output = outcome.pop("output")
        raw = {"outcome": outcome, "output": output, "proof_type": "isolated fixtures"}
        passed = accept_outcome(outcome, True)
        summaries = [json.loads(line) for line in output.splitlines()
                     if line.startswith('{"failure_gate_suite"')]
        passed = (passed and len(summaries) == 1 and summaries[0].get("failure_gate_suite") == "PASSED"
                  and type(summaries[0].get("tests")) is int and summaries[0]["tests"] > 0
                  and summaries[0].get("isolated_fixtures") is True)
    else:
        outcome = run([sys.executable, "-B", str(Path(root) / ENTRY), "--private-health"],
                      root, target, event, HEALTH_LIMITS, parent_deadline=attempt["deadline"])
        raw = {"outcome": outcome, "proof_type": "real read-only coordinator health caller"}
        passed = accept_outcome(outcome)
        output = read_json(target / "raw.log")
        passed = (passed and output.get("caller") == caller and output.get("run") == attempt["run"]
                  and output.get("health", {}).get("governance") == "STAGED")
    atomic_json(target / "outcome.json", raw)
    with writer_lock(state):
        store = Store(state)
        try:
            current = context(root, store, allow_expired=True)
            active = current["attempts"][-1]
            if active["run"] != attempt["run"] or current["phase"] != "reserved":
                raise Blocked("outcome lost its reservation")
            passed = passed and time.monotonic() < current["deadline"]
            passed = passed and protected_state(store) == active["protected_before"]
            if not fixture:
                passed = passed and active["events"] == [
                    "launch_intent", "watchdog_registered", "confirmed_start", "step_outcome"]
            active.update(status="passed" if passed else "failed",
                          evidence=str((target / "outcome.json").relative_to(state)),
                          evidence_digest=hashlib.sha256(read_bytes(target / "outcome.json")).hexdigest())
            with store.transaction():
                current["phase"] = ("complete" if current["next"] == 4 else "ready") if passed else "failed"
                store.db.execute("UPDATE runs SET status=?,recovery_required=?,payload=? WHERE id=?",
                                 (active["status"], 0 if passed else 1, encoded(active), active["run"]))
                record(store, current, "bootstrap_outcome_acknowledged", active["run"])
        finally:
            store.close()
    if not passed:
        raise Blocked("bootstrap failed/incomplete; retain exclusion and stop without retry")
    return {"caller": caller, "status": "PASSED", "run": attempt["run"],
            "ordinary": "STAGED", "api_codegen": "DENIED"}
