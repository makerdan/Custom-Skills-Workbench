#!/usr/bin/env python3
"""Separately approved bounded installer caller; never ordinary activation."""
import argparse
import json
import os
from pathlib import Path
import stat
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts/failure_gate"))
from common import Blocked, atomic_json, encoded, read_json, writer_lock
from gate import Gate, tooling
from supervisor import LIMITS, run


def worker():
    if not stat.S_ISFIFO(os.fstat(sys.stdin.fileno()).st_mode) or "FAILURE_GATE_PARENT_DEADLINE" not in os.environ:
        raise Blocked("private installer requires its admitted parent IPC/deadline")
    with writer_lock(ROOT / ".failure-gate"):
        gate = Gate(ROOT, True)
        try:
            gate.install()
            result = gate.bootstrap()
            print(encoded({"bootstrap_run": result["run_id"], "assessment": result["assessment"]}))
            return 0 if result["assessment"] == "PASSED" else 1
        finally:
            gate.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--worker", action="store_true")
    args = parser.parse_args()
    if args.worker:
        return worker()
    state = ROOT / ".failure-gate"
    initial = read_json(state / "first-proof.json")
    fixtures = read_json(state / "caller-fixtures.json")
    if initial.get("status") != "PASSED" or fixtures.get("status") != "PASSED":
        raise Blocked("both contained supervision fixture stages must pass")
    if fixtures.get("tooling_digest") != tooling(ROOT):
        raise Blocked("caller-fixture source changed")
    original_deadline = initial["started_monotonic"] + LIMITS["installation_seconds"]
    for number in (1, 2):
        target = state / "installer-caller" / str(number)
        if target.exists():
            raise Blocked("installer caller already attempted; no automatic retry/replacement")
        remaining = original_deadline - time.monotonic()
        if remaining <= 34:
            raise Blocked("original installation budget exhausted")
        # Narrow each admitted entire caller to 8 minutes, including inner checks.
        effective = dict(LIMITS, step_seconds=min(480, int(remaining - 30)))
        end = time.monotonic() + effective["step_seconds"] - 1
        ordinal = 0

        def event(kind, value):
            nonlocal ordinal
            ordinal += 1
            atomic_json(target / "events" / f"{ordinal:06d}.json",
                        {"schema": 1, "kind": kind, "payload": value,
                         "approval_reference": initial["approval_reference"],
                         "caller": str(Path(__file__).relative_to(ROOT)), "ordinal": ordinal})

        outcome = run([sys.executable, "-B", str(Path(__file__).resolve()), "--worker"],
                      ROOT, target, event, effective, parent_deadline=end)
        atomic_json(target / "outcome.json", outcome)
        print(encoded({"installer_caller": number, "outcome": outcome}))
        if outcome.get("pass") is not True:
            raise Blocked("installer acceptance failed; preserve raw outcomes and request exact continuation")
    print(encoded({"bootstrap_callers": "PASSED_TWICE", "ordinary_route": "STAGED",
                   "cutover": "NOT APPROVED", "live_reclaim": "BLOCKED"}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (Blocked, OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "BLOCKED", "reason": str(error)}))
        raise SystemExit(4)
