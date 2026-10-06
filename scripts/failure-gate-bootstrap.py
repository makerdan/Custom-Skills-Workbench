#!/usr/bin/env python3
"""Fixed bootstrap review/proof. No commands, tier, selectors or approval flags."""
from pathlib import Path
import hashlib
import json
import sys
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts/failure_gate"))
from common import Blocked, atomic_json, digest, encoded, inside, read_bytes, read_json, writer_lock
from store import Store


def first_proof():
    """Do not import new governing code to prove its own safety.

    Initial fixture uses the unchanged existing Store/common and independently
    verified canonical containment. The fixed pinned review is checked by data
    readback before any new governing module is imported.
    """
    binding = read_json(ROOT / "docs/validation/failure-gate-bootstrap-review.json")
    if not isinstance(binding, dict):
        raise Blocked("invalid initial review envelope")
    readonly = Store(ROOT / ".failure-gate", read_only=True)
    try:
        prior = json.loads(readonly.meta("bounded-bootstrap-v1") or "null")
    finally:
        readonly.close()
    actual = prior["source"] if isinstance(prior, dict) else read_json(
        ROOT / "docs/validation/failure-gate-bootstrap-approval.json")
    files = {"scripts/failure-gate-bootstrap.py",
             "docs/validation/failure-gate-bootstrap-plan.json",
             "docs/validation/failure-gate-policy.json"}
    for base in ("scripts/failure_gate", ".agents/skills/failure-gate-v4",
                 ".agents/skills/port-authority"):
        files.update(str(p.relative_to(ROOT)) for p in (ROOT / base).rglob("*")
                     if p.is_file() and "__pycache__" not in p.parts and p.suffix != ".pyc")
    if len(files) > 200:
        raise Blocked("initial source closure exceeds finite file bound")
    manifest = {p: hashlib.sha256(read_bytes(inside(ROOT, p))).hexdigest() for p in sorted(files)}
    plan = read_json(ROOT / "docs/validation/failure-gate-bootstrap-plan.json")
    if not isinstance(plan, dict):
        raise Blocked("invalid initial plan envelope")
    policy = read_json(ROOT / "docs/validation/failure-gate-policy.json")
    canonical = ".agents/skills/failure-gate-v4/tests/authoring_supervision.py"
    if (manifest != binding.get("source_files") or digest(manifest) != binding.get("source_digest")
            or manifest[canonical] != "c759dee01e36b2ea0acee65d80b7e2a0d2b0977725f52d09dc6ccf2d672a7698"
            or binding.get("plan") != plan or binding.get("plan_digest") != digest(plan)
            or binding.get("root") != str(ROOT.resolve())
            or binding.get("operation") != "installation.coordination-bootstrap"
            or plan.get("operation") != binding["operation"]
            or plan.get("namespace") != binding.get("namespace")
            or plan.get("local_id") != binding.get("local_id")
            or not isinstance(policy, dict) or policy.get("version") != "local-v1.1"
            or binding.get("policy_digest") != digest(policy)
            or plan.get("order") != ["fixtures-1", "fixtures-2", "health-1", "health-2"]
            or plan.get("parent_seconds") != 900
            or binding.get("execution") != {
                "fixture": [sys.executable, "-B", "scripts/failure_gate/tests.py"],
                "health": [sys.executable, "-B", "scripts/failure-gate-bootstrap.py", "--private-health"]}):
        raise Blocked("initial proof exact source/plan/graph changed")
    terminal = (isinstance(actual, dict) and actual.get("source") == "actual interactive terminal review"
                and actual.get("action") == "approve bootstrap " + digest(binding)
                and actual.get("binding_digest") == digest(binding))
    conversation = (isinstance(actual, dict) and set(actual) ==
            {"schema", "source", "reference", "question", "answer", "binding"}
            and actual["schema"] == 1
            and actual["source"] == "actual owner response to final bootstrap approval form"
            and actual["question"] == "Approve this exact bounded bootstrap proof?"
            and actual["answer"] == "Approve the pinned bootstrap proof"
            and actual["binding"] == binding)
    if (not (terminal or conversation) or not isinstance(actual.get("reference"), str)
            or not actual["reference"].strip()):
        raise Blocked("actual final owner decision missing")
    state = ROOT / ".failure-gate"
    key = "bounded-bootstrap-v1"
    with writer_lock(state):
        store = Store(state)
        try:
            if (store.meta("governance") != "STAGED"
                    or store.meta("namespace") != binding["namespace"]
                    or store.meta("bootstrap_task") != binding["local_id"]
                    or not store.meta("installation_decision")
                    or store.db.execute("SELECT 1 FROM runs WHERE recovery_required=1").fetchone()):
                raise Blocked("first-proof replay/unregistered/conflicting scope")
            store.task(binding["local_id"])
            now = time.monotonic()
            # This fresh clock is reserved once, before any new code executes.
            value = {"binding": binding, "source": actual,
                     "boot": read_bytes("/proc/sys/kernel/random/boot_id", 100).decode().strip(),
                     "started": now, "deadline": now + 900,
                     "next": 1, "phase": "reserved", "attempts": []}
            if prior is not None:
                row = store.db.execute("SELECT * FROM decisions WHERE id=?", (prior.get("decision"),)).fetchone()
                expected = {"binding": binding, "source": actual,
                            "clock": {k: prior.get(k) for k in ("boot", "started", "deadline")}}
                if (not terminal or store.meta(key) != encoded(prior)
                        or prior.get("phase") != "ready" or prior.get("next") != 0
                        or prior.get("attempts") != [] or prior.get("binding") != binding
                        or row is None or row["kind"] != "bounded_bootstrap_review"
                        or row["payload"] != encoded(expected) or row["digest"] != digest(expected)
                        or prior.get("boot") != value["boot"]
                        or prior.get("deadline") != prior.get("started", 0) + 900
                        or prior["deadline"] - now <= 123.2):
                    raise Blocked("consumed, stale or unbound interactive review")
                value = dict(prior, next=1, phase="reserved", attempts=[])
            elif store.meta(key) is not None:
                raise Blocked("concurrent bootstrap decision")
            run_id = str(uuid.uuid4())
            protected = digest({
                "tasks": [dict(r) for r in store.db.execute("SELECT * FROM tasks ORDER BY id")],
                "repairs": [dict(r) for r in store.db.execute("SELECT * FROM repairs ORDER BY task_id,signature")],
                "meta": [dict(r) for r in store.db.execute(
                    "SELECT * FROM meta WHERE key != ? ORDER BY key", (key,))]})
            attempt = {"caller": "fixtures-1", "run": run_id, "deadline": None,
                       "protected_before": protected, "events": [], "status": "reserved"}
            value["attempts"].append(attempt)
            with store.transaction():
                if prior is None:
                    value["decision"] = store.decision("bounded_bootstrap_review", binding["local_id"],
                                                      {"binding": binding, "source": actual,
                                                       "clock": {k: value[k] for k in ("boot", "started", "deadline")}})
                store.db.execute("INSERT INTO runs VALUES(?,?,?,?,?,?,?,?)",
                                 (run_id, binding["local_id"], binding["operation"], 0,
                                  "installation-only", "reserved", 1, encoded(attempt)))
                store.set_meta(key, encoded(value))
                store.event("bootstrap_first_proof_reserved", binding["local_id"], run_id, value)
        finally:
            store.close()
    target = state / "bootstrap" / value["decision"] / "fixtures-1"
    sys.path.insert(0, str(ROOT / Path(canonical).parent))
    from authoring_supervision import supervise_static
    outcome = supervise_static([sys.executable, "-B", str(ROOT / "scripts/failure_gate/tests.py")],
                               execution=120, grace=0.2, verification=2, capture=1,
                               max_bytes=1048576)
    output = outcome.pop("output")
    atomic_json(target / "outcome.json", {"outcome": outcome, "output": output,
                                        "proof_type": "initial independently contained isolated fixtures"})
    print(output, end="", flush=True)
    # Only after the unchanged containment confirms complete quiescence/capture
    # and the initial tests pass may the newly exercised governing code be used.
    if (outcome.get("pass_") is not True or outcome.get("known_stopped") is not True
            or outcome.get("capture_complete") is not True or outcome.get("raw_exit") != 0
            or time.monotonic() >= value["deadline"]):
        raise Blocked("initial proof failed/uncertain; consumed reservation retained")
    summaries = [json.loads(line) for line in output.splitlines() if line.startswith('{"failure_gate_suite"')]
    if (len(summaries) != 1 or summaries[0].get("failure_gate_suite") != "PASSED"
            or type(summaries[0].get("tests")) is not int or summaries[0]["tests"] <= 0
            or summaries[0].get("isolated_fixtures") is not True):
        raise Blocked("initial proof report incomplete; retain reservation")
    from bootstrap import context, protected_state, record, accept_outcome
    with writer_lock(state):
        store = Store(state)
        try:
            current = context(ROOT, store)
            if (current != value or not accept_outcome(outcome, True)
                    or protected_state(store) != protected):
                raise Blocked("initial proof evidence/bindings changed")
            attempt.update(status="passed", evidence=str((target / "outcome.json").relative_to(state)),
                           evidence_digest=hashlib.sha256(read_bytes(target / "outcome.json")).hexdigest())
            current["attempts"][-1] = attempt
            current["phase"] = "ready"
            with store.transaction():
                store.db.execute("UPDATE runs SET status='passed',recovery_required=0,payload=? WHERE id=?",
                                 (encoded(attempt), run_id))
                record(store, current, "bootstrap_first_proof_acknowledged", run_id)
        finally:
            store.close()


def main():
    args = sys.argv[1:]
    if args == ["--private-health"]:
        from bootstrap import private_health
        return private_health(ROOT)
    if args == ["review"]:
        from bootstrap import review
        review(ROOT)
        return 0
    if args != ["prove"]:
        raise Blocked("only fixed review/prove entries exist; arbitrary dispatch denied")
    first_proof()
    from bootstrap import dispatch, ORDER
    for caller in ORDER[1:]:
        print(encoded(dispatch(ROOT, caller)), flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (Blocked, OSError, ValueError, KeyError, TypeError) as error:
        print(encoded({"status": "BLOCKED", "reason": str(error)}), flush=True)
        raise SystemExit(4)
