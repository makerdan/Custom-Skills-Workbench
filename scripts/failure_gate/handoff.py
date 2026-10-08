"""Bounded, task-scoped and non-authorizing Failure Gate handoff inspection."""
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sqlite3
import stat
from urllib.parse import quote

from common import Blocked, digest, encoded, inside, read_bytes, read_json


STATUSES = {"VERIFIED", "MISMATCH", "MISSING", "UNAVAILABLE",
            "UNSUPPORTED", "NOT_APPLICABLE"}
TASK_ID = re.compile(r"FG-[0-9]{8}\Z")
SHA256 = re.compile(r"[0-9a-f]{64}\Z")
UUID = re.compile(
    r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\Z",
    re.IGNORECASE,
)
MAX_TASK_BYTES = 1024 * 1024
MAX_DECISION_BYTES = 1024 * 1024
MAX_RUN_BYTES = 4 * 1024 * 1024
MAX_EVENT_BYTES = 64 * 1024
MAX_REPAIR_BYTES = 256 * 1024
MAX_DECISIONS = 100
MAX_RUNS = 50
MAX_EVENTS = 200
MAX_REPAIRS = 100
MAX_EVENT_TOTAL = 2 * 1024 * 1024
MAX_LOG_TOTAL = 32 * 1024 * 1024
MAX_SNAPSHOT_TOTAL = 64 * 1024 * 1024
MAX_SNAPSHOT_FILE = 16 * 1024 * 1024
MAX_SQLITE_VM_STEPS = 5_000_000
MAX_DECISION_TOTAL = 8 * 1024 * 1024
MAX_RUN_TOTAL = 32 * 1024 * 1024
MAX_REPAIR_TOTAL = 8 * 1024 * 1024
MAX_REPORT_BYTES = 256 * 1024
OPTIONAL_LOCKS = {"package-lock.json", "yarn.lock"}
MISSING_LOCK_DIGEST = hashlib.sha256(b"failure-gate:missing-input").hexdigest()


class _Unavailable(Exception):
    pass


def _iso_timestamp(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        return None
    from datetime import datetime, timezone
    try:
        return datetime.fromtimestamp(value, timezone.utc).isoformat()
    except (OverflowError, OSError, ValueError):
        return None


def _row(name, status, location, records=(), timestamp=None, reader="json",
         result="not_read", digests=None, versions=None, required=True, detail=None):
    value = {
        "handoff": name,
        "status": status,
        "required": required,
        "source": {"location": location, "records": list(records)},
        "digests": digests or {},
        "versions": versions or {},
        "timestamp": timestamp,
        "reader": {"name": reader, "result": result},
    }
    if detail:
        value["detail"] = detail
    return value


def _safe_digest(value):
    return value if isinstance(value, str) and SHA256.fullmatch(value) else None


def _safe_integer(value):
    return value if type(value) is int and 0 <= value <= 2**31 - 1 else None


def _safe_label(value):
    return value if isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9._-]{1,64}", value) else None


def _safe_id(value):
    value = str(value or "")
    return value if UUID.fullmatch(value) else None


def _report_base(task_id, fixture, report_file=None):
    return {
        "schema": 1,
        "task_id": task_id,
        "evidence_context": "ISOLATED_FIXTURE_ONLY" if fixture else
                            "WORKSPACE_LOCAL_RECORDS_ONLY",
        "host_authority": "NOT_ESTABLISHED",
        "host_acceptance": "NOT_ESTABLISHED",
        "platform_task_binding": "NOT_CHECKED",
        "non_authorizing": True,
        "report_file": report_file,
        "redactions": ["raw logs", "secret values", "free-text event payloads",
                       "unrelated task records"],
        "bounds": {
            "decisions": MAX_DECISIONS,
            "runs": MAX_RUNS,
            "events": MAX_EVENTS,
            "repairs": MAX_REPAIRS,
            "task_bytes": MAX_TASK_BYTES,
            "decision_bytes": MAX_DECISION_BYTES,
            "decision_payload_bytes_total": MAX_DECISION_TOTAL,
            "run_bytes": MAX_RUN_BYTES,
            "run_payload_bytes_total": MAX_RUN_TOTAL,
            "event_bytes": MAX_EVENT_BYTES,
            "event_payload_bytes_total": MAX_EVENT_TOTAL,
            "event_file_bytes_total": MAX_EVENT_TOTAL,
            "repair_payload_bytes_total": MAX_REPAIR_TOTAL,
            "raw_log_bytes_total": MAX_LOG_TOTAL,
            "snapshot_bytes_total": MAX_SNAPSHOT_TOTAL,
            "snapshot_file_bytes": MAX_SNAPSHOT_FILE,
            "sqlite_vm_steps": MAX_SQLITE_VM_STEPS,
            "report_bytes": MAX_REPORT_BYTES,
        },
    }


def _unavailable_rows(report, detail):
    rows = [
        _row("plan_decision", "UNAVAILABLE", ".failure-gate/coordinator.sqlite3",
             reader="sqlite+json", result=detail),
        _row("decision_runner", "UNAVAILABLE", ".failure-gate/coordinator.sqlite3",
             reader="sqlite+json", result=detail),
        _row("runner_evidence", "UNAVAILABLE", ".failure-gate/runs/<run-id>/",
             reader="json+digest", result=detail),
        _row("evidence_completion", "UNAVAILABLE", ".failure-gate/coordinator.sqlite3",
             reader="sqlite+json", result=detail),
        _row("execution_monitor", "UNAVAILABLE", ".failure-gate/events/<event-id>.json",
             reader="sqlite+json", result=detail),
        _row("evidence_health_lineage_export", "UNAVAILABLE",
             ".failure-gate/coordinator.sqlite3; Gate.export",
             reader="sqlite+json", result=detail),
        _row("runtime_reclaim", "UNSUPPORTED",
             "scripts/failure_gate/cli.py:reclaim",
             reader="provider-discovery", result="no_inspector_supported_provider",
             required=False),
    ]
    report["rows"] = rows
    report["overall"] = "UNAVAILABLE"
    report["summary"] = "The requested local records could not be read within the inspector bounds."
    return report


def _open_database(root, state):
    if state.is_symlink() or not state.is_dir():
        raise _Unavailable("coordinator_unavailable")
    database = state / "coordinator.sqlite3"
    if database.is_symlink() or not database.is_file():
        raise _Unavailable("coordinator_unavailable")
    if any(Path(str(database) + suffix).exists()
           for suffix in ("-wal", "-shm", "-journal")):
        # A read-only SQLite open may create/use shared-memory files in WAL mode.
        # Do not risk a side effect or report a partial view.
        raise _Unavailable("wal_mode_read_only_view_not_available")
    try:
        info = database.stat()
    except OSError as error:
        raise _Unavailable("coordinator_unavailable") from error
    if not stat.S_ISREG(info.st_mode):
        raise _Unavailable("coordinator_unavailable")
    uri = "file:" + quote(str(database.resolve()), safe="/") + "?mode=ro"
    connection = None
    try:
        connection = sqlite3.connect(uri, uri=True, timeout=0.1)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA query_only=ON")
        connection.execute("PRAGMA busy_timeout=100")
        connection.execute("BEGIN")
        progress = {"steps": 0}

        def bounded_query():
            progress["steps"] += 1000
            return int(progress["steps"] > MAX_SQLITE_VM_STEPS)

        connection.set_progress_handler(bounded_query, 1000)
        return connection
    except sqlite3.Error as error:
        if connection is not None:
            connection.close()
        raise _Unavailable("coordinator_unavailable") from error


def _query_limited(connection, query, parameters, limit, preflight=None,
                   preflight_parameters=(), total_bytes=None):
    if preflight:
        sizes = connection.execute(
            preflight, (*preflight_parameters, limit + 1)).fetchall()
        if (len(sizes) > limit or
                sum((row[0] or 0) for row in sizes) > total_bytes):
            return [], True
    rows = connection.execute(query, (*parameters, limit + 1)).fetchall()
    return rows[:limit], len(rows) > limit


def _parse_json(text, byte_count, maximum):
    if (type(byte_count) is not int or byte_count < 0 or
            not isinstance(text, str)):
        return None, "malformed_record"
    if byte_count > maximum:
        return None, "over_limit"
    try:
        return json.loads(text), None
    except (TypeError, ValueError):
        return None, "malformed_record"


def _decode_task(row):
    task = dict(row)
    decision = task.get("decision")
    if decision is not None and not UUID.fullmatch(str(decision)):
        return task, None, "malformed_record"
    if task.get("plan_bytes") is not None:
        if task["plan_bytes"] > MAX_TASK_BYTES:
            return task, None, "over_limit"
        if task.get("plan") is not None:
            try:
                plan = json.loads(task["plan"])
            except (TypeError, ValueError):
                return task, None, "malformed_record"
            if not isinstance(plan, dict):
                return task, None, "malformed_record"
            return task, plan, None
    return task, None, None


def _event_records(root, state, db_rows, overflow, namespace):
    parsed = []
    total_bytes = 0
    if overflow:
        return parsed, "over_limit"
    directory = state / "events"
    if directory.is_symlink() or not directory.is_dir():
        return parsed, "segment_unavailable"
    for row in db_rows:
        event, error = _parse_json(row["payload"], row["payload_bytes"], MAX_EVENT_BYTES)
        if error:
            return parsed, error
        if (not isinstance(event, dict) or event.get("schema") != 1 or
                event.get("id") != row["id"] or event.get("kind") != row["kind"] or
                event.get("task_id") != row["task_id"] or
                event.get("run_id") != row["run_id"] or
                event.get("namespace") != namespace or
                _iso_timestamp(row["timestamp"]) is None or
                _iso_timestamp(event.get("timestamp")) != _iso_timestamp(row["timestamp"]) or
                not isinstance(event.get("payload"), dict) or
                not UUID.fullmatch(str(row["id"]))):
            return parsed, "record_binding_mismatch"
        segment = directory / (row["id"] + ".json")
        try:
            data = read_bytes(segment, MAX_EVENT_BYTES)
        except (Blocked, OSError):
            return parsed, "segment_unavailable"
        total_bytes += len(data)
        if total_bytes > MAX_EVENT_TOTAL:
            return parsed, "over_limit"
        if data.decode("utf-8", errors="replace").strip() != row["payload"]:
            return parsed, "segment_mismatch"
        parsed.append({"row": row, "event": event})
    return parsed, None


def _event_for(events, kind, predicate=lambda _event: True):
    return [entry for entry in events
            if entry["event"].get("kind") == kind and predicate(entry["event"])]


def _event_time(entries):
    times = [entry["event"].get("timestamp") for entry in entries]
    valid = [value for value in times if _iso_timestamp(value)]
    return _iso_timestamp(max(valid)) if valid else None


def _event_problem_status(problem):
    if problem in ("record_binding_mismatch", "segment_mismatch", "malformed_record"):
        return "MISMATCH"
    return "UNAVAILABLE"


def _check_plan(root, namespace, task_id, task, task_plan, decisions, events, policy):
    source_decisions = [entry for entry in decisions if entry["row"]["kind"] == "plan_review"]
    if not source_decisions:
        return None, _row("plan_decision", "MISSING",
                          ".failure-gate/coordinator.sqlite3 decisions(kind=plan_review)",
                          reader="sqlite+json", result="plan_review_missing")

    usable = []
    malformed = False
    unavailable = False
    for entry in source_decisions:
        row = entry["row"]
        payload, error = _parse_json(row["payload"], row["payload_bytes"], MAX_DECISION_BYTES)
        if error:
            if error == "over_limit":
                unavailable = True
            else:
                malformed = True
            continue
        if not isinstance(payload, dict) or digest(payload) != row["digest"]:
            malformed = True
            continue
        plan = payload.get("plan")
        if not isinstance(plan, dict) or payload.get("plan_digest") != digest(plan):
            malformed = True
            continue
        if (plan.get("task_id") == task_id and plan.get("namespace") == namespace and
                (task_plan is None or digest(plan) == task.get("plan_digest"))):
            usable.append((row, payload, plan))

    if malformed:
        return None, _row("plan_decision", "MISMATCH",
                          ".failure-gate/coordinator.sqlite3 decisions(kind=plan_review)",
                          reader="sqlite+json", result="malformed_or_unbound_decision")
    if unavailable:
        return None, _row("plan_decision", "UNAVAILABLE",
                          ".failure-gate/coordinator.sqlite3 decisions(kind=plan_review)",
                          reader="bounded-json", result="plan_decision_over_limit")
    if len(usable) != 1:
        status = "MISMATCH" if source_decisions else "MISSING"
        return None, _row("plan_decision", status,
                          ".failure-gate/coordinator.sqlite3 decisions(kind=plan_review)",
                          reader="sqlite+json", result="ambiguous_or_unmatched_plan_decision")

    decision_row, payload, plan = usable[0]
    if not UUID.fullmatch(str(decision_row["id"])):
        return plan, _row("plan_decision", "MISMATCH",
                          ".failure-gate/coordinator.sqlite3 decisions(kind=plan_review)",
                          reader="record-id-parser", result="invalid_decision_id")
    relative = payload.get("relative")
    if (not isinstance(relative, str) or len(relative) > 512 or
            not re.fullmatch(r"[A-Za-z0-9._/-]+", relative) or
            any(part in ("", ".", "..") for part in relative.split("/")) or
            (relative.startswith(".local/") and
             not relative.startswith(".local/tasks/"))):
        return plan, _row("plan_decision", "MISMATCH",
                          ".failure-gate/coordinator.sqlite3 decisions(kind=plan_review)",
                          records=[decision_row["id"]], reader="plan-path-parser",
                          result="unsafe_or_unbounded_plan_locator",
                          digests={"plan": _safe_digest(payload.get("plan_digest"))},
                          versions={"plan": plan.get("version")})
    required_plan = {"schema", "task_id", "namespace", "version", "tier", "changes",
                     "requirements", "regression_guard", "pre_existing_failures", "parameters"}
    if (set(plan) != required_plan or plan.get("schema") != 1 or
            type(plan.get("version")) is not int or plan["version"] < 1 or
            not isinstance(plan.get("tier"), str) or
            plan.get("tier") not in policy.get("tiers", {}) or
            plan.get("parameters") != {} or plan.get("pre_existing_failures") != [] or
            any(not isinstance(plan.get(field), list) or not plan[field] or
                not all(isinstance(item, str) and 0 < len(item) <= 1000
                        for item in plan[field]) for field in ("changes", "requirements")) or
            not isinstance(plan.get("regression_guard"), str) or
            len(plan["regression_guard"].strip()) < 20 or
            set(payload) != {"plan", "plan_digest", "policy_digest", "tier_digest",
                             "source", "parameters", "relative"} or
            payload.get("parameters") != {} or payload.get("source") !=
            "actual interactive local review; identity not authenticated" or
            payload.get("relative") is None):
        return plan, _row("plan_decision", "MISMATCH",
                          ".failure-gate/coordinator.sqlite3 decisions(kind=plan_review)",
                          records=[decision_row["id"]], reader="json-schema",
                          result="unsupported_or_invalid_plan_record",
                          digests={"plan": _safe_digest(payload.get("plan_digest"))},
                          versions={"plan": plan.get("version")})
    task_requires_bound_plan = (
        task.get("status") in ("active", "completed") and
        task.get("mode") != "owner_direction"
    )
    if task_requires_bound_plan and task_plan is None:
        return plan, _row("plan_decision", "MISMATCH",
                          ".failure-gate/coordinator.sqlite3 tasks.plan",
                          records=[decision_row["id"]], reader="task-plan-binding",
                          result="active_task_plan_missing",
                          digests={"reviewed_plan": _safe_digest(payload["plan_digest"])},
                          versions={"plan": plan["version"]})
    if task_plan is not None and task_plan != plan:
        return plan, _row("plan_decision", "MISMATCH",
                          ".failure-gate/coordinator.sqlite3 tasks.plan and decisions",
                          records=[decision_row["id"]], reader="json-digest",
                          result="task_plan_differs_from_reviewed_plan",
                          digests={"reviewed_plan": _safe_digest(payload["plan_digest"]),
                                   "task_plan": _safe_digest(task.get("plan_digest"))},
                          versions={"plan": plan["version"]})
    task_plan_digest = digest(task_plan if task_plan is not None else plan)
    if ((task_plan is not None or task_requires_bound_plan) and
            task.get("plan_digest") != task_plan_digest):
        return plan, _row("plan_decision", "MISMATCH",
                          ".failure-gate/coordinator.sqlite3 tasks.plan_digest",
                          records=[decision_row["id"]], reader="sha256",
                          result="task_plan_digest_mismatch",
                          digests={"reviewed_plan": _safe_digest(payload["plan_digest"]),
                                   "task_plan": _safe_digest(task.get("plan_digest"))},
                          versions={"plan": plan["version"]})
    try:
        plan_file = read_json(inside(root, relative))
    except (Blocked, OSError, TypeError, ValueError):
        return plan, _row("plan_decision", "UNAVAILABLE",
                          f".failure-gate/coordinator.sqlite3 decisions; {relative}",
                          records=[decision_row["id"]], reader="bounded-plan-json",
                          result="plan_source_unavailable",
                          digests={"reviewed_plan": _safe_digest(payload["plan_digest"])},
                          versions={"plan": plan["version"]})
    if not isinstance(plan_file, dict) or digest(plan_file) != payload["plan_digest"]:
        return plan, _row("plan_decision", "MISMATCH",
                          relative, records=[decision_row["id"]],
                          reader="sha256", result="current_plan_differs_from_review",
                          digests={"reviewed_plan": _safe_digest(payload["plan_digest"]),
                                   "current_plan": digest(plan_file) if isinstance(plan_file, dict) else None},
                          versions={"plan": plan["version"]})
    if (payload.get("policy_digest") != digest(policy) or
            plan.get("tier") not in policy.get("tiers", {}) or
            payload.get("tier_digest") != digest(policy["tiers"][plan["tier"]])):
        return plan, _row("plan_decision", "MISMATCH",
                          ".failure-gate/coordinator.sqlite3 decisions and docs/validation/failure-gate-policy.json",
                          records=[decision_row["id"]], reader="policy-digest",
                          result="policy_or_tier_binding_mismatch",
                          digests={"plan": _safe_digest(payload["plan_digest"]),
                                   "policy": _safe_digest(payload.get("policy_digest")),
                                   "current_policy": digest(policy),
                                   "tier": _safe_digest(payload.get("tier_digest"))},
                          versions={"plan": plan["version"]})
    reviewed = _event_for(events, "plan_reviewed",
                          lambda event: event.get("payload", {}).get("decision") == decision_row["id"])
    if len(reviewed) != 1:
        return plan, _row("plan_decision", "MISSING",
                          ".failure-gate/coordinator.sqlite3 events and .failure-gate/events",
                          records=[decision_row["id"]], reader="event-lineage",
                          result="review_event_missing_or_ambiguous",
                          digests={"plan": _safe_digest(payload["plan_digest"]),
                                   "policy": _safe_digest(payload["policy_digest"]),
                                   "tier": _safe_digest(payload["tier_digest"])},
                          versions={"plan": plan["version"]})
    return plan, _row("plan_decision", "VERIFIED",
                      f".failure-gate/coordinator.sqlite3 decisions(kind=plan_review); {relative}",
                      records=[decision_row["id"], reviewed[0]["row"]["id"]],
                      timestamp=_event_time(reviewed), reader="decision+plan-parser",
                      result="plan_and_review_bindings_match",
                      digests={"plan": _safe_digest(payload["plan_digest"]),
                               "policy": _safe_digest(payload["policy_digest"]),
                               "tier": _safe_digest(payload["tier_digest"]),
                               "decision_payload": _safe_digest(decision_row["digest"])},
                      versions={"plan": plan["version"],
                                "policy_schema": _safe_integer(policy.get("schema"))})


def _current_snapshot(root, recorded):
    if (not isinstance(recorded, dict) or recorded.get("schema") != 1 or
            not isinstance(recorded.get("files"), dict) or
            len(recorded["files"]) > 10000):
        return "mismatch", "malformed_snapshot"
    files = recorded["files"]
    if digest(files) != recorded.get("digest"):
        return "mismatch", "snapshot_digest_mismatch"
    total = 0
    for relative, expected in files.items():
        if not isinstance(relative, str) or not SHA256.fullmatch(str(expected)):
            return "mismatch", "malformed_snapshot_entry"
        try:
            path = inside(root, relative, must_exist=False)
            if not path.exists():
                actual = MISSING_LOCK_DIGEST if relative in OPTIONAL_LOCKS else None
            else:
                info = path.stat()
                if not stat.S_ISREG(info.st_mode):
                    return "mismatch", "snapshot_path_not_regular"
                if info.st_size > MAX_SNAPSHOT_FILE:
                    return "unavailable", "snapshot_file_over_limit"
                if total + info.st_size > MAX_SNAPSHOT_TOTAL:
                    return "unavailable", "snapshot_total_over_limit"
                data = read_bytes(path, MAX_SNAPSHOT_FILE)
                total += len(data)
                actual = hashlib.sha256(data).hexdigest()
        except (Blocked, OSError):
            return "unavailable", "snapshot_input_unavailable"
        if actual != expected:
            return "mismatch", "tested_snapshot_is_stale"
    return "verified", "recorded_snapshot_matches_current_inputs"


def _run_payload(row):
    return _parse_json(row["payload"], row["payload_bytes"], MAX_RUN_BYTES)


def _check_runs(task_id, task, plan, activation_status, runs, overflow, events, root, state,
                policy, activation_digest=None):
    if task.get("status") == "completed" and task.get("mode") == "owner_direction":
        return None, _row("decision_runner", "NOT_APPLICABLE",
                          ".failure-gate/coordinator.sqlite3 tasks(mode=owner_direction)",
                          reader="applicability-parser",
                          result="owner_direction_does_not_require_validation_runner",
                          required=False), _row(
                              "runner_evidence", "NOT_APPLICABLE",
                              ".failure-gate/coordinator.sqlite3 tasks(mode=owner_direction)",
                              reader="applicability-parser",
                              result="owner_direction_is_not_validation_evidence",
                              required=False)
    required_runs = [row for row in runs if row["purpose"] == "required_tier_validation"]
    active = [row for row in runs if row["recovery_required"] == 1]
    if len(active) > 1:
        duplicate_row = _row("decision_runner", "MISMATCH",
                             ".failure-gate/coordinator.sqlite3 runs(task_id)",
                             records=[row["id"] for row in active
                                      if UUID.fullmatch(str(row["id"]))],
                             reader="single-flight-record-check",
                             result="duplicate_active_run_records",
                             versions={"authorization": _safe_integer(task.get("auth"))})
        return None, duplicate_row, _row(
            "runner_evidence", "MISMATCH", ".failure-gate/coordinator.sqlite3 runs.payload",
            records=[row["id"] for row in active if UUID.fullmatch(str(row["id"]))],
            reader="run-evidence-parser",
            result="duplicate_active_run_records")
    if overflow:
        unavailable = _row("decision_runner", "UNAVAILABLE",
                           ".failure-gate/coordinator.sqlite3 runs(task_id)",
                           reader="bounded-sqlite",
                           result="run_record_or_payload_byte_limit_exceeded")
        return None, unavailable, _row(
            "runner_evidence", "UNAVAILABLE", ".failure-gate/coordinator.sqlite3 runs.payload",
            reader="run-evidence-parser",
            result="run_record_or_payload_byte_limit_exceeded")
    if activation_status != "VERIFIED":
        status = "MISSING" if activation_status == "MISSING" else activation_status
        return None, _row("decision_runner", status,
                          ".failure-gate/coordinator.sqlite3 decisions(policy_activation), tasks",
                          reader="authorization-binding",
                          result="local_activation_not_verified",
                          versions={"authorization": _safe_integer(task.get("auth"))}), _row(
                              "runner_evidence", "MISSING",
                              ".failure-gate/coordinator.sqlite3 runs.payload",
                              reader="run-evidence-parser", result="no_verified_activation")
    matching = [row for row in required_runs
                if row["auth"] == task.get("auth") and row["tier"] == plan.get("tier")]
    if not matching:
        return None, _row("decision_runner", "MISSING",
                          ".failure-gate/coordinator.sqlite3 runs(task_id)",
                          reader="authorization-binding", result="required_runner_record_missing",
                          versions={"authorization": _safe_integer(task.get("auth")),
                                    "tier": _safe_label(plan.get("tier"))}), _row(
                                        "runner_evidence", "MISSING",
                                        ".failure-gate/coordinator.sqlite3 runs.payload",
                                        reader="run-evidence-parser", result="required_run_missing")
    run = matching[-1]
    if not UUID.fullmatch(str(run["id"])):
        return run, _row(
            "decision_runner", "MISMATCH",
            ".failure-gate/coordinator.sqlite3 runs(task_id)",
            reader="record-id-parser", result="invalid_run_id"), _row(
                "runner_evidence", "MISMATCH",
                ".failure-gate/coordinator.sqlite3 runs.payload",
                reader="record-id-parser", result="invalid_run_id")
    payload, error = _run_payload(run)
    run_events = [entry for entry in events if entry["event"].get("run_id") == run["id"]]
    activation_records = [entry for entry in events
                         if entry["event"].get("kind") == "activated" and
                         entry["event"].get("task_id") == task_id and
                         entry["event"].get("payload", {}).get("decision") == task.get("decision")]
    if error:
        status = "UNAVAILABLE" if error == "over_limit" else "MISMATCH"
        return run, _row("decision_runner", status,
                         ".failure-gate/coordinator.sqlite3 runs and decisions",
                          records=[run["id"], _safe_id(task.get("decision"))],
                         timestamp=_event_time(activation_records),
                         reader="authorization-binding",
                         result="run_payload_unavailable_or_malformed",
                          versions={"authorization": _safe_integer(task.get("auth")),
                                    "run_authorization": _safe_integer(run["auth"])}), _row(
                                       "runner_evidence", status,
                                       ".failure-gate/coordinator.sqlite3 runs.payload",
                                       records=[run["id"]], timestamp=_event_time(run_events),
                                       reader="bounded-json", result=error)
    if not isinstance(payload, dict):
        return run, _row("decision_runner", "MISMATCH",
                         ".failure-gate/coordinator.sqlite3 runs.payload",
                         records=[run["id"]], reader="json", result="run_payload_not_object"), _row(
                             "runner_evidence", "MISMATCH",
                             ".failure-gate/coordinator.sqlite3 runs.payload",
                             records=[run["id"]], reader="json", result="run_payload_not_object")
    current_policy = digest(policy)
    expected_tier = digest(policy.get("tiers", {}).get(plan.get("tier"), {}))
    decision_ok = (
        run["task_id"] == task_id and run["auth"] == task.get("auth") and
        type(task.get("auth")) is int and task["auth"] >= 1 and
        type(run["auth"]) is int and run["auth"] >= 1 and
        run["tier"] == plan.get("tier") and payload.get("authorization") == task.get("auth") and
        payload.get("policy_digest") == current_policy and
        payload.get("tier_digest") == expected_tier and
        task.get("plan_digest") == digest(plan) and
        task.get("tier_digest") == expected_tier and
        task.get("policy_digest") == current_policy and
        (task.get("status") != "active" or
         (task.get("suspended") == 0 and task.get("tier") == plan.get("tier"))) and
        len(activation_records) == 1
    )
    decision_status = "VERIFIED" if decision_ok else "MISMATCH"
    decision_row = _row(
        "decision_runner", decision_status,
        ".failure-gate/coordinator.sqlite3 decisions(policy_activation), tasks, runs",
        records=[task.get("decision") if UUID.fullmatch(
            str(task.get("decision") or "")) else None, run["id"]] +
                [entry["row"]["id"] for entry in activation_records],
        timestamp=_event_time(activation_records),
        reader="authorization-binding",
        result="authorization_versions_match" if decision_ok else "authorization_or_version_mismatch",
        digests={"plan": _safe_digest(task.get("plan_digest")),
                 "tier": _safe_digest(task.get("tier_digest")),
                 "policy": _safe_digest(task.get("policy_digest")),
                 "activation": _safe_digest(activation_digest),
                 "run_tier": _safe_digest(payload.get("tier_digest")),
                 "run_policy": _safe_digest(payload.get("policy_digest"))},
        versions={"authorization": _safe_integer(task.get("auth")),
                  "run_authorization": _safe_integer(run.get("auth")),
                  "tier": _safe_label(plan.get("tier"))})
    if not decision_ok:
        return run, decision_row, _row(
            "runner_evidence", "MISMATCH", ".failure-gate/coordinator.sqlite3 runs.payload",
            records=[run["id"]], timestamp=_event_time(run_events),
            reader="run-evidence-parser", result="runner_binding_mismatch")

    definitions = policy.get("tiers", {}).get(plan.get("tier"), {}).get("steps")
    steps = payload.get("steps")
    if (not isinstance(definitions, list) or not definitions or not isinstance(steps, list)
            or len(steps) != len(definitions)):
        return run, decision_row, _row(
            "runner_evidence", "MISMATCH", ".failure-gate/coordinator.sqlite3 runs.payload",
            records=[run["id"]], timestamp=_event_time(run_events),
            reader="step-parser", result="missing_or_unsupported_step_definition")
    if run["status"] != "finished" or run["recovery_required"] != 0:
        return run, decision_row, _row(
            "runner_evidence", "MISMATCH", ".failure-gate/coordinator.sqlite3 runs",
            records=[run["id"]], timestamp=_event_time(run_events),
            reader="run-state-parser", result="run_incomplete_or_retained")

    snapshot_state, snapshot_result = _current_snapshot(root, payload.get("snapshot"))
    if snapshot_state != "verified":
        status = "UNAVAILABLE" if snapshot_state == "unavailable" else "MISMATCH"
        return run, decision_row, _row(
            "runner_evidence", status, ".failure-gate/runs/<run-id>/payload.snapshot",
            records=[run["id"]], timestamp=_event_time(run_events),
            reader="bounded-snapshot-digest", result=snapshot_result,
            digests={"tested_snapshot": _safe_digest((payload.get("snapshot") or {}).get("digest"))
                     if isinstance(payload.get("snapshot"), dict) else None})
    if (payload.get("assessment") != "PASSED" or payload.get("final_snapshot") != payload.get("snapshot")
            or payload.get("snapshot_integrity") !=
            "coordinated participants only; out-of-band edits unobservable"):
        return run, decision_row, _row(
            "runner_evidence", "MISMATCH", ".failure-gate/coordinator.sqlite3 runs.payload",
            records=[run["id"]], timestamp=_event_time(run_events),
            reader="snapshot+assessment-parser", result="failed_or_stale_run_snapshot",
            digests={"tested_snapshot": _safe_digest(payload.get("snapshot", {}).get("digest"))
                     if isinstance(payload.get("snapshot"), dict) else None,
                      "final_snapshot": _safe_digest(payload.get("final_snapshot", {}).get("digest"))
                     if isinstance(payload.get("final_snapshot"), dict) else None})

    total_log_bytes = 0
    log_digests = []
    from gate import parsed_result
    for expected, actual in zip(definitions, steps):
        if (not isinstance(expected, dict) or not isinstance(actual, dict) or
                actual.get("name") != expected.get("name") or
                actual.get("status") != "PASSED" or
                not isinstance(expected.get("parser"), str)):
            return run, decision_row, _row(
                "runner_evidence", "MISMATCH", ".failure-gate/coordinator.sqlite3 runs.payload",
                records=[run["id"]], timestamp=_event_time(run_events),
                reader="step-parser", result="step_name_or_status_mismatch")
        outcome = actual.get("outcome")
        relative = actual.get("raw_log")
        parts = Path(relative).parts if isinstance(relative, str) else ()
        if (not isinstance(outcome, dict) or len(parts) != 4 or
                parts[0] != "runs" or parts[1] != run["id"] or
                parts[2] != expected.get("name") or parts[3] != "raw.log" or
                outcome.get("pass") is not True or outcome.get("registered") is not True or
                outcome.get("healthy_release") is not True or outcome.get("raw_exit") != 0 or
                outcome.get("reason") != "finished"):
            return run, decision_row, _row(
                "runner_evidence", "MISMATCH", ".failure-gate/runs/<run-id>/<step>/raw.log",
                records=[run["id"]], timestamp=_event_time(run_events),
                reader="raw-evidence-binding", result="unsafe_or_nonpassing_step_record")
        try:
            log = inside(state, relative)
            info = log.stat()
            if not stat.S_ISREG(info.st_mode):
                raise Blocked("raw log is not regular")
            total_log_bytes += info.st_size
            if info.st_size > 8 * 1024 * 1024 or total_log_bytes > MAX_LOG_TOTAL:
                return run, decision_row, _row(
                    "runner_evidence", "UNAVAILABLE",
                    ".failure-gate/runs/<run-id>/<step>/raw.log",
                    records=[run["id"]], timestamp=_event_time(run_events),
                    reader="bounded-raw-log", result="raw_log_over_limit")
            if hashlib.sha256(read_bytes(log, 8 * 1024 * 1024)).hexdigest() != actual.get("log_digest"):
                return run, decision_row, _row(
                    "runner_evidence", "MISMATCH",
                    ".failure-gate/runs/<run-id>/<step>/raw.log",
                    records=[run["id"]], timestamp=_event_time(run_events),
                    reader="sha256", result="raw_log_digest_mismatch")
            log_digests.append(actual.get("log_digest"))
            parsed = parsed_result(expected["parser"], outcome, log)
        except (Blocked, OSError, ValueError, TypeError, KeyError):
            return run, decision_row, _row(
                "runner_evidence", "UNAVAILABLE",
                ".failure-gate/runs/<run-id>/<step>/raw.log",
                records=[run["id"]], timestamp=_event_time(run_events),
                reader="bounded-parser", result="raw_evidence_unavailable")
        if parsed != actual.get("report") or parsed.get("complete") is not True:
            return run, decision_row, _row(
                "runner_evidence", "MISMATCH",
                ".failure-gate/runs/<run-id>/<step>/raw.log",
                records=[run["id"]], timestamp=_event_time(run_events),
                reader=expected["parser"], result="stored_parser_report_mismatch")

    evidence_row = _row(
        "runner_evidence", "VERIFIED",
        ".failure-gate/coordinator.sqlite3 runs.payload; .failure-gate/runs/<run-id>/<step>/raw.log; snapshot inputs",
        records=[run["id"]] + [entry["row"]["id"] for entry in run_events],
        timestamp=_event_time(run_events), reader="run+snapshot+raw-log parsers",
        result="required_steps_and_current_snapshot_match",
        digests={"tested_snapshot": _safe_digest(payload["snapshot"]["digest"]),
                 "policy": payload["policy_digest"], "tier": payload["tier_digest"],
                 "raw_logs": digest(log_digests)},
        versions={"authorization": _safe_integer(run["auth"]), "tier": _safe_label(run["tier"]),
                  "step_count": len(steps)})
    return run, decision_row, evidence_row


def _check_completion(task_id, task, run, run_evidence, decisions, events,
                      decision_overflow=False):
    if decision_overflow:
        return _row("evidence_completion", "UNAVAILABLE",
                    ".failure-gate/coordinator.sqlite3 decisions(task_id)",
                    reader="bounded-sqlite",
                    result="decision_record_or_payload_byte_limit_exceeded")
    completion_events = _event_for(
        events, "completed",
        lambda event: event.get("task_id") == task_id and
        event.get("payload", {}).get("mode") == "validated")
    owner_events = _event_for(
        events, "owner_closed",
        lambda event: event.get("task_id") == task_id and
        event.get("payload", {}).get("mode") == "owner_direction")
    if task.get("status") != "completed":
        return _row("evidence_completion", "MISSING",
                    ".failure-gate/coordinator.sqlite3 tasks and events",
                    records=[entry["row"]["id"] for entry in completion_events + owner_events],
                    reader="completion-lineage", result="no_terminal_completion_record")
    if task.get("mode") == "validated":
        if not completion_events:
            return _row("evidence_completion", "MISSING",
                        ".failure-gate/coordinator.sqlite3 events(kind=completed)",
                        reader="completion-lineage", result="validated_completion_event_missing")
        if (task.get("assessment") != "PASSED" or run_evidence != "VERIFIED" or
                len(completion_events) != 1 or run is None or
                completion_events[0]["event"].get("run_id") != run["id"]):
            return _row("evidence_completion", "MISMATCH",
                        ".failure-gate/coordinator.sqlite3 tasks and events(kind=completed)",
                        records=[entry["row"]["id"] for entry in completion_events],
                        reader="completion-lineage", result="validated_completion_binding_mismatch",
                        versions={"mode": "validated"})
        return _row("evidence_completion", "VERIFIED",
                    ".failure-gate/coordinator.sqlite3 tasks and events(kind=completed)",
                    records=[run["id"], completion_events[0]["row"]["id"]],
                    timestamp=_event_time(completion_events), reader="completion-lineage",
                    result="validated_completion_links_to_verified_run",
                    digests={"plan": _safe_digest(task.get("plan_digest")),
                             "completion_event": hashlib.sha256(
                                 completion_events[0]["row"]["payload"].encode("utf-8")
                             ).hexdigest()},
                    versions={"mode": "validated",
                              "authorization": _safe_integer(task.get("auth"))})
    if task.get("mode") == "owner_direction":
        decision = next((row for row in decisions if row["id"] == task.get("decision")), None)
        if decision and not UUID.fullmatch(str(decision["id"])):
            decision = None
        parsed, error = _parse_json(decision["payload"], decision["payload_bytes"],
                                    MAX_DECISION_BYTES) if decision else (None, None)
        if decision and error == "over_limit":
            return _row("evidence_completion", "UNAVAILABLE",
                        ".failure-gate/coordinator.sqlite3 decisions(owner_direction)",
                        records=[decision["id"]], reader="bounded-json",
                        result="owner_decision_over_limit")
        valid = bool(
            decision and not error and decision["kind"] == "owner_direction" and
            isinstance(parsed, dict) and digest(parsed) == decision["digest"] and
            len(owner_events) == 1 and
            owner_events[0]["event"].get("payload", {}).get("decision") == decision["id"]
        )
        status = ("MISSING" if not owner_events or not decision else
                  "VERIFIED" if valid else "MISMATCH")
        return _row("evidence_completion", status,
                    ".failure-gate/coordinator.sqlite3 decisions(owner_direction), events",
                    records=([decision["id"]] if decision else []) +
                            [entry["row"]["id"] for entry in owner_events],
                    timestamp=_event_time(owner_events), reader="owner-closure-lineage",
                    result="owner_direction_recorded_not_validation_passed" if valid
                    else "owner_direction_binding_mismatch",
                    versions={"mode": "owner_direction"})
    return _row("evidence_completion", "MISMATCH",
                ".failure-gate/coordinator.sqlite3 tasks",
                reader="completion-lineage", result="unknown_completion_mode")


def _check_monitor(task_id, run, run_evidence, events, event_problem):
    if event_problem:
        return _row("execution_monitor", _event_problem_status(event_problem),
                    ".failure-gate/coordinator.sqlite3 events and .failure-gate/events/",
                    records=[entry["row"]["id"] for entry in events],
                    timestamp=_event_time(events), reader="event-journal-parser",
                    result=event_problem)
    if run is None:
        status = "MISSING" if run_evidence == "MISSING" else run_evidence
        return _row("execution_monitor", status,
                    ".failure-gate/coordinator.sqlite3 events and .failure-gate/events/",
                    reader="event-journal-parser", result="no_bound_run_to_monitor")
    run_events = [entry for entry in events
                  if entry["event"].get("task_id") == task_id and
                  entry["event"].get("run_id") == run["id"]]
    payload, error = _run_payload(run)
    if error:
        return _row("execution_monitor", "UNAVAILABLE" if error == "over_limit" else "MISMATCH",
                    ".failure-gate/coordinator.sqlite3 runs.payload and events",
                    records=[entry["row"]["id"] for entry in run_events],
                    timestamp=_event_time(run_events), reader="bounded-run-parser",
                    result="run_payload_unavailable_or_malformed")
    steps = payload.get("steps") if isinstance(payload, dict) else None
    if not isinstance(steps, list):
        return _row("execution_monitor", "MISMATCH",
                    ".failure-gate/coordinator.sqlite3 runs.payload and events",
                    records=[entry["row"]["id"] for entry in run_events],
                    reader="lifecycle-count-parser", result="run_step_inventory_missing")
    expected = {"run_reserved": 1, "run_finished": 1}
    for kind in ("launch_intent", "watchdog_registered", "confirmed_start", "step_outcome"):
        expected[kind] = len(steps)
    counts = {}
    for kind in expected:
        counts[kind] = sum(entry["event"].get("kind") == kind for entry in run_events)
    if counts != expected:
        return _row("execution_monitor", "MISSING",
                    ".failure-gate/coordinator.sqlite3 events and .failure-gate/events/",
                    records=[entry["row"]["id"] for entry in run_events],
                    timestamp=_event_time(run_events), reader="lifecycle-count-parser",
                    result="incomplete_or_duplicate_lifecycle_events")
    return _row("execution_monitor", "VERIFIED",
                ".failure-gate/coordinator.sqlite3 events and .failure-gate/events/<event-id>.json",
                records=[entry["row"]["id"] for entry in run_events],
                timestamp=_event_time(run_events), reader="event-journal-parser",
                result="task_scoped_local_lifecycle_segments_match",
                 digests={"event_set": digest([
                     hashlib.sha256(entry["row"]["payload"].encode("utf-8")).hexdigest()
                     for entry in run_events
                 ])},
                versions={"event_schema": 1, "run": run["id"]},
                detail="Cooperative local telemetry only; independent callers and platform coverage are not established.")


def _check_lineage(task_id, run, run_evidence, run_rows, repair_rows,
                   repair_overflow, run_overflow=False, timestamp=None):
    location = ".failure-gate/coordinator.sqlite3 repairs and runs.payload; Gate.export"
    if repair_overflow:
        return _row("evidence_health_lineage_export", "UNAVAILABLE", location,
                    reader="bounded-lineage-parser",
                    result="repair_record_or_payload_byte_limit_exceeded")
    if run_overflow:
        return _row("evidence_health_lineage_export", "UNAVAILABLE", location,
                    reader="bounded-lineage-parser", result="run_history_limit_prevents_lineage_check")
    records = []
    malformed = False
    unavailable = False
    for row in repair_rows:
        payload, error = _parse_json(row["payload"], row["payload_bytes"], MAX_REPAIR_BYTES)
        if error == "over_limit":
            unavailable = True
        elif error or not isinstance(payload, dict):
            malformed = True
        else:
            source = payload.get("source_run")
            if not isinstance(source, str) or not UUID.fullmatch(source):
                malformed = True
            records.append(row)
    if malformed:
        return _row("evidence_health_lineage_export", "MISMATCH", location,
                    records=[row["signature"] for row in records
                             if SHA256.fullmatch(str(row["signature"]))],
                    reader="repair-lineage-parser", result="malformed_repair_record")
    if unavailable:
        return _row("evidence_health_lineage_export", "UNAVAILABLE", location,
                    reader="bounded-json", result="repair_payload_over_limit")
    if run is not None and run_evidence == "VERIFIED":
        run_lineage = run["id"]
    else:
        run_lineage = None
    known_runs = {row["id"] for row in run_rows}
    for row in records:
        parsed, _ = _parse_json(row["payload"], row["payload_bytes"], MAX_REPAIR_BYTES)
        if (not SHA256.fullmatch(str(row["signature"])) or
                parsed.get("task_id", task_id) != task_id or
                parsed.get("source_run") not in known_runs):
            return _row("evidence_health_lineage_export", "MISMATCH", location,
                        records=[item["signature"] for item in records
                                 if SHA256.fullmatch(str(item["signature"]))],
                        reader="repair-lineage-parser",
                        result="repair_source_run_not_in_task_history")
    if any(not SHA256.fullmatch(str(row["signature"])) for row in records):
        return _row("evidence_health_lineage_export", "MISMATCH", location,
                    reader="repair-lineage-parser", result="repair_identity_missing")
    if run_lineage is None and not records:
        return _row(
            "evidence_health_lineage_export", "MISSING",
            location, timestamp=timestamp, reader="bounded-lineage-parser",
            result="no_run_or_repair_lineage_record")
    line_digests = {
        "repair_records": digest({
            row["signature"]: hashlib.sha256(row["payload"].encode("utf-8")).hexdigest()
            for row in records
        })
    }
    if run is not None:
        line_digests["run_payload"] = hashlib.sha256(
            run["payload"].encode("utf-8")).hexdigest()
    return _row(
        "evidence_health_lineage_export", "VERIFIED",
        location,
        records=([run["id"]] if run_lineage else []) +
                [row["signature"] for row in records],
        timestamp=timestamp, reader="bounded-lineage-parser",
        result="task_lineage_read; export_not_requested",
        digests=line_digests,
        versions={"repair_records": len(records), "export": "NOT_APPLICABLE"},
        detail=f"{len(records)} unresolved repair record(s) are preserved; export is separate and was not requested.")


def _overall(rows):
    required = [row["status"] for row in rows if row["required"]]
    if required and all(status == "VERIFIED" for status in required):
        return "VERIFIED"
    for status in ("MISMATCH", "UNAVAILABLE", "MISSING", "UNSUPPORTED"):
        if status in required:
            return status
    return "NOT_APPLICABLE"


def _write_report(root, relative, report):
    if not isinstance(relative, str) or not relative:
        raise Blocked("report path must be project-relative")
    if ".local" in Path(relative).parts:
        raise Blocked("report path cannot be inside .local")
    if ".failure-gate" in Path(relative).parts:
        raise Blocked("report path cannot be inside Failure Gate state")
    output = inside(root, relative, must_exist=False)
    if output.exists() or output.is_symlink():
        raise Blocked("report destination must be new")
    parent = output.parent
    if not parent.is_dir():
        raise Blocked("report parent directory must already exist")
    data = (encoded(report) + "\n").encode("utf-8")
    if len(data) > MAX_REPORT_BYTES:
        raise Blocked("report exceeds output bound")
    try:
        fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        directory_fd = os.open(parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    except FileExistsError as error:
        raise Blocked("report destination must be new") from error
    except OSError as error:
        raise Blocked("report destination unavailable") from error


def inspect_handoff(root, task_id, report_file=None, state=None, fixture=False):
    """Inspect only one real-format local ID and its bounded associated records."""
    root = Path(root).resolve()
    if not isinstance(task_id, str) or not TASK_ID.fullmatch(task_id):
        raise Blocked("a real local Failure Gate ID is required")
    report = _report_base(task_id, fixture, report_file)
    state = Path(state) if state is not None else root / ".failure-gate"
    if not state.is_absolute():
        state = root / state
    state = state.absolute()
    try:
        if state.is_symlink() or not state.resolve().is_relative_to(root):
            raise _Unavailable("coordinator_unavailable")
        connection = _open_database(root, state)
    except _Unavailable as error:
        report = _unavailable_rows(report, str(error))
        if report_file:
            _write_report(root, report_file, report)
        return report
    try:
        try:
            task_rows = connection.execute(
                "SELECT id,public_id,status,substr(plan,1,?) AS plan,"
                "length(CAST(plan AS BLOB)) AS plan_bytes,plan_digest,tier,"
                "tier_digest,policy_digest,auth,suspended,mode,assessment,decision "
                "FROM tasks WHERE public_id=? LIMIT 2", (MAX_TASK_BYTES + 1, task_id)).fetchall()
            if len(task_rows) != 1:
                raise Blocked("unknown local Failure Gate task ID")
            task, task_plan, task_error = _decode_task(task_rows[0])
            if task_error:
                report = _unavailable_rows(report, task_error)
                if task_error == "malformed_record":
                    for row in report["rows"]:
                        if row["status"] == "UNAVAILABLE":
                            row["status"] = "MISMATCH"
                            row["reader"]["result"] = task_error
                    report["overall"] = "MISMATCH"
                    report["summary"] = "The requested local task record is malformed."
                if report_file:
                    _write_report(root, report_file, report)
                return report
            namespace_row = connection.execute(
                "SELECT value FROM meta WHERE key='namespace'").fetchone()
            namespace = namespace_row["value"] if namespace_row else None
            namespace = namespace if UUID.fullmatch(str(namespace or "")) else None
            governance_row = connection.execute(
                "SELECT value FROM meta WHERE key='governance'").fetchone()
            governance = governance_row["value"] if governance_row else None
            governance = governance if governance in ("ACTIVE", "STAGED", "INACTIVE") else None
            decision_rows, decision_overflow = _query_limited(
                connection, "SELECT id,kind,task_id,digest,length(CAST(payload AS BLOB)) AS payload_bytes,"
                "substr(payload,1,?) AS payload FROM decisions WHERE task_id=? ORDER BY rowid LIMIT ?",
                (MAX_DECISION_BYTES + 1, task_id), MAX_DECISIONS,
                "SELECT length(CAST(payload AS BLOB)) FROM decisions "
                "WHERE task_id=? ORDER BY rowid LIMIT ?",
                (task_id,), MAX_DECISION_TOTAL)
            run_rows, run_overflow = _query_limited(
                connection, "SELECT id,task_id,purpose,auth,tier,status,recovery_required,"
                "length(CAST(payload AS BLOB)) AS payload_bytes,substr(payload,1,?) AS payload "
                "FROM runs WHERE task_id=? ORDER BY rowid LIMIT ?",
                (MAX_RUN_BYTES + 1, task_id), MAX_RUNS,
                "SELECT length(CAST(payload AS BLOB)) FROM runs "
                "WHERE task_id=? ORDER BY rowid LIMIT ?",
                (task_id,), MAX_RUN_TOTAL)
            event_rows, event_overflow = _query_limited(
                connection, "SELECT seq,id,timestamp,kind,task_id,run_id,"
                "length(CAST(payload AS BLOB)) AS payload_bytes,substr(payload,1,?) AS payload "
                "FROM events WHERE task_id=? ORDER BY seq LIMIT ?",
                (MAX_EVENT_BYTES + 1, task_id), MAX_EVENTS,
                "SELECT length(CAST(payload AS BLOB)) FROM events "
                "WHERE task_id=? ORDER BY seq LIMIT ?",
                (task_id,), MAX_EVENT_TOTAL)
            repair_rows, repair_overflow = _query_limited(
                connection, "SELECT task_id,signature,length(CAST(payload AS BLOB)) AS payload_bytes,"
                "substr(payload,1,?) AS payload FROM repairs WHERE task_id=? ORDER BY signature LIMIT ?",
                (MAX_REPAIR_BYTES + 1, task_id), MAX_REPAIRS,
                "SELECT length(CAST(payload AS BLOB)) FROM repairs "
                "WHERE task_id=? ORDER BY signature LIMIT ?",
                (task_id,), MAX_REPAIR_TOTAL)
            repair_rows = [dict(row) for row in repair_rows]
            policy = read_json(inside(root, "docs/validation/failure-gate-policy.json"))
            if not isinstance(policy, dict) or not isinstance(policy.get("tiers"), dict):
                raise _Unavailable("policy_unavailable")
        except sqlite3.Error as error:
            raise _Unavailable("task_scoped_query_unavailable") from error
        except (Blocked, OSError, ValueError, TypeError) as error:
            if isinstance(error, Blocked) and str(error) == "unknown local Failure Gate task ID":
                raise
            raise _Unavailable("policy_or_record_unavailable") from error

        decision_entries = [{"row": row} for row in decision_rows]
        parsed_events, event_problem = _event_records(
            root, state, event_rows, event_overflow, namespace)
        if decision_overflow:
            plan_row = _row("plan_decision", "UNAVAILABLE",
                            ".failure-gate/coordinator.sqlite3 decisions(task_id)",
                            reader="bounded-sqlite",
                            result="decision_record_or_payload_byte_limit_exceeded")
            plan = None
        else:
            plan, plan_row = _check_plan(root, namespace, task_id, task, task_plan,
                                         decision_entries, parsed_events, policy)
        if event_problem and plan_row["status"] == "VERIFIED":
            plan_row["status"] = _event_problem_status(event_problem)
            plan_row["reader"]["result"] = "review_event_journal_unavailable"
        elif event_problem and plan_row["status"] == "MISSING":
            plan_row["status"] = _event_problem_status(event_problem)
            plan_row["reader"]["result"] = "review_event_journal_unavailable"

        activation = next((row for row in decision_rows if row["id"] == task.get("decision")), None)
        review_decision_id = (
            plan_row["source"]["records"][0]
            if plan_row["status"] == "VERIFIED" and plan_row["source"]["records"]
            else None
        )
        activation_status = "MISSING"
        if task.get("status") in ("active", "completed") and activation is not None and plan is not None:
            activation_payload, activation_error = _parse_json(
                activation["payload"], activation["payload_bytes"], MAX_DECISION_BYTES)
            if activation_error:
                activation_status = "UNAVAILABLE" if activation_error == "over_limit" else "MISMATCH"
            elif (activation["kind"] == "policy_activation" and
                  activation["task_id"] == task_id and isinstance(activation_payload, dict) and
                  digest(activation_payload) == activation["digest"] and
                  set(activation_payload) == {"review", "plan", "policy_digest"} and
                  activation_payload.get("review") == review_decision_id and
                  activation_payload.get("plan") == plan and
                  activation_payload.get("policy_digest") == digest(policy)):
                activation_status = "VERIFIED"
            else:
                activation_status = "MISMATCH"
        elif task.get("status") not in ("draft", "active", "completed"):
            activation_status = "MISMATCH"
        if task.get("status") == "active" and governance != "ACTIVE":
            activation_status = "UNAVAILABLE" if governance is None else "MISMATCH"

        run, decision_runner_row, evidence_row = _check_runs(
            task_id, task, plan or {}, activation_status, run_rows, run_overflow,
            parsed_events, root, state, policy,
            activation.get("digest") if activation is not None else None)
        if decision_overflow:
            decision_runner_row["status"] = "UNAVAILABLE"
            decision_runner_row["reader"]["result"] = "decision_record_or_payload_byte_limit_exceeded"
        if event_problem and decision_runner_row["status"] == "VERIFIED":
            decision_runner_row["status"] = _event_problem_status(event_problem)
            decision_runner_row["reader"]["result"] = "activation_event_journal_unavailable"
        elif event_problem and decision_runner_row["status"] == "MISSING":
            decision_runner_row["status"] = _event_problem_status(event_problem)
            decision_runner_row["reader"]["result"] = "activation_event_journal_unavailable"

        completion_row = _check_completion(
            task_id, task, run, evidence_row["status"], decision_rows, parsed_events,
            decision_overflow)
        if event_problem and completion_row["status"] in ("VERIFIED", "MISSING"):
            completion_row["status"] = _event_problem_status(event_problem)
            completion_row["reader"]["result"] = "completion_event_journal_unavailable"
        monitor_row = _check_monitor(task_id, run, evidence_row["status"],
                                     parsed_events, event_problem)
        lineage_row = _check_lineage(
            task_id, run, evidence_row["status"], run_rows, repair_rows,
            repair_overflow, run_overflow,
            _event_time([entry for entry in parsed_events
                                          if entry["event"].get("run_id") ==
                                          (run["id"] if run else None)]))
        if task.get("status") == "completed" and task.get("mode") == "owner_direction":
            plan_row["required"] = False
            if decision_runner_row["status"] == "NOT_APPLICABLE":
                decision_runner_row["required"] = False
            if evidence_row["status"] == "NOT_APPLICABLE":
                evidence_row["required"] = False
            if monitor_row["status"] in ("MISSING", "NOT_APPLICABLE"):
                monitor_row["status"] = "NOT_APPLICABLE"
                monitor_row["required"] = False
                monitor_row["reader"]["result"] = "no_validation_run_was_required"
            if not repair_rows and lineage_row["status"] == "MISSING":
                lineage_row["status"] = "NOT_APPLICABLE"
                lineage_row["required"] = False
                lineage_row["reader"]["result"] = "owner_direction_has_no_validation_lineage"
        rows = [plan_row, decision_runner_row, evidence_row, completion_row,
                monitor_row, lineage_row,
                _row("runtime_reclaim", "UNSUPPORTED",
                     "scripts/failure_gate/cli.py:reclaim",
                     reader="provider-discovery", result="no_inspector_supported_provider",
                     required=False, detail="No protected reclaim provider is implemented or queried.")]
        report.update({
            "namespace": namespace,
            "observed_local_status": task.get("status")
            if task.get("status") in ("draft", "active", "completed", "failed", "cancelled")
            else "UNKNOWN",
            "observed_local_mode": task.get("mode")
            if task.get("mode") in ("validated", "owner_direction") else None,
            "observed_local_assessment": task.get("assessment")
            if task.get("assessment") in ("PASSED", "FAILED", "BLOCKED", "UNKNOWN") else None,
            "observed_local_governance_record": governance or "UNAVAILABLE",
            "rows": rows,
            "overall": _overall(rows),
            "scope_note": "Local record bindings only. This report does not establish platform task identity, "
                          "independent supervision, host acceptance, or current authorization.",
        })
        if event_problem:
            report["monitoring_coverage"] = "UNAVAILABLE: " + event_problem
        elif event_overflow:
            report["monitoring_coverage"] = "UNAVAILABLE: task event record limit exceeded"
        else:
            report["monitoring_coverage"] = "task-scoped local journal only"
    except Blocked:
        raise
    except (sqlite3.Error, OSError, ValueError, TypeError, KeyError):
        report = _unavailable_rows(report, "record_parser_or_source_unavailable")
    finally:
        connection.close()
    if report_file:
        _write_report(root, report_file, report)
    return report
