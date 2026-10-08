#!/usr/bin/env python3
"""Project-local developer tool. Never invokes platform completion."""
import argparse
import json
from pathlib import Path
import sys

from common import Blocked, encoded
from gate import Gate


ROOT = Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=("install", "allocate", "guard", "review-plan", "activate",
        "run", "complete", "write", "owner-close", "health", "events", "export", "inspect",
        "reclaim", "cutover"))
    parser.add_argument("--task")
    parser.add_argument("--plan")
    parser.add_argument("--tier")
    parser.add_argument("--run")
    parser.add_argument("--edits")
    parser.add_argument("--output")
    parser.add_argument("--report-file")
    arguments = parser.parse_args()
    gate = None
    try:
        if arguments.operation == "inspect":
            if any((arguments.plan, arguments.tier, arguments.run,
                    arguments.edits, arguments.output)):
                raise Blocked("inspect accepts only --task and optional --report-file")
            from handoff import inspect_handoff
            result = inspect_handoff(ROOT, arguments.task, arguments.report_file)
            print(encoded(result))
            return 0 if result.get("overall") == "VERIFIED" else 1
        if arguments.operation == "reclaim":
            raise Blocked("live reclaim has no protected attestation/disruption-approval provider; no signals")
        if arguments.operation == "cutover":
            raise Blocked("cutover not approved; requires pinned live evidence and separate scoped approval")
        gate = Gate(ROOT, initialize=arguments.operation == "install",
                    read_only=arguments.operation in ("health", "events", "export"))
        operation = arguments.operation
        if operation == "install":
            result = gate.install()
        elif operation == "allocate":
            result = {"task_id": gate.store.allocate(), "namespace": gate.store.meta("namespace")}
        elif operation == "guard":
            from gate import guard_plan
            result = guard_plan(ROOT, gate.store, arguments.task, arguments.plan, gate.policy)
        elif operation == "review-plan":
            result = {"decision": gate.approve_plan(arguments.task, arguments.plan)}
        elif operation == "activate":
            result = gate.activate(arguments.task, arguments.plan)
        elif operation == "run":
            result = gate.required_run(arguments.task, arguments.plan, arguments.tier)
        elif operation == "complete":
            result = gate.complete(arguments.task, arguments.plan, arguments.run)
        elif operation == "write":
            result = gate.write(arguments.task, arguments.plan, arguments.edits)
        elif operation == "owner-close":
            result = gate.owner_close(arguments.task)
        elif operation == "health":
            result = gate.health()
        elif operation == "events":
            rows = gate.store.db.execute(
                "SELECT seq,payload FROM events WHERE (? IS NULL OR task_id=?) ORDER BY seq DESC LIMIT 200",
                (arguments.task, arguments.task)).fetchall()
            result = {"events": [json.loads(row["payload"]) for row in reversed(rows)],
                      "maximum": 200, "coverage": "managed local events only; older events remain indexed"}
        elif operation == "export":
            result = gate.export(arguments.task, arguments.output)
        print(encoded(result))
        return 1 if isinstance(result, dict) and result.get("assessment") == "FAILED" else 0
    except (Blocked, ValueError, OSError, TypeError, KeyError) as error:
        print(encoded({"status": "BLOCKED", "reason": str(error)}))
        return 4
    finally:
        if gate:
            gate.close()


if __name__ == "__main__":
    raise SystemExit(main())
