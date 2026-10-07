"""Checked lifecycle; absent approval/proof is BLOCKED, never a fallback."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import time
import uuid

from common import Blocked, atomic_json, digest, encoded, inside, read_bytes, read_json, writer_lock
from store import Store
from supervisor import LIMITS, run as supervised_run, validate_limits


CONFIG = "docs/validation/failure-gate-policy.json"
APPROVAL = "docs/validation/failure-gate-installation-approval.json"
SKIP = {"node_modules", ".git", ".local", ".cache", ".failure-gate", "__pycache__",
        "dist", "coverage", ".workspace-projections"}
DEPENDENCY_ARTIFACT_MAXIMUM = 16 * 1024 * 1024


def install_generated_dependency_files(root):
    """Return bounded esbuild install outputs which can affect checked commands."""
    root = Path(root)
    virtual_store = root / "node_modules/.pnpm"
    packages = sorted(virtual_store.glob("esbuild@*/node_modules/esbuild"))
    if not packages:
        raise Blocked("installed esbuild outputs unavailable")

    files = set()
    for package in packages:
        relative = str(package.relative_to(root))
        manifest = read_json(inside(root, f"{relative}/package.json"))
        if not isinstance(manifest, dict) or manifest.get("name") != "esbuild":
            raise Blocked("installed esbuild package identity unavailable")
        if any((package / name).exists() or (package / name).is_symlink()
               for name in ("npm-install", "bin-esbuild")):
            raise Blocked("incomplete esbuild install output")

        for name in ("bin/esbuild", "lib/main.js"):
            path = f"{relative}/{name}"
            inside(root, path)
            files.add(path)
        for path in package.glob("downloaded-*"):
            relative_path = str(path.relative_to(root))
            inside(root, relative_path)
            files.add(relative_path)

    for package in sorted(virtual_store.glob("@esbuild+*/node_modules/@esbuild/*")):
        if not package.is_dir():
            continue
        binaries = [package / "bin/esbuild", package / "esbuild.exe"]
        present = [path for path in binaries if path.exists()]
        if not present:
            raise Blocked("installed esbuild platform binary unavailable")
        for path in present:
            relative = str(path.relative_to(root))
            inside(root, relative)
            files.add(relative)
    return [root / relative for relative in sorted(files)]


def snapshot(root):
    """Source plus actual installed dependency metadata. No secret/env contents."""
    root = Path(root)
    result = {}
    total = 0
    inputs = ["scripts", "artifacts", "lib", "docs/validation",
              ".agents/skills/failure-gate-v4"]
    roots = [root / item for item in inputs]
    files = [root / item for item in ("package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml",
                                     "tsconfig.json", "tsconfig.base.json", "replit.md",
                                     "package-lock.json", "yarn.lock")]
    files.extend(install_generated_dependency_files(root))
    for directory in roots:
        for current, dirs, names in os.walk(directory, followlinks=False):
            dirs[:] = sorted(name for name in dirs if name not in SKIP and
                             not name.startswith((".api-server-test-", ".workspace-projections.")))
            for name in names:
                if not name.endswith((".tsbuildinfo", ".pyc")):
                    files.append(Path(current) / name)
    for path in sorted(set(files)):
        relative = str(path.relative_to(root))
        if relative in ("package-lock.json", "yarn.lock"):
            try:
                path.lstat()
            except FileNotFoundError:
                result[relative] = hashlib.sha256(b"failure-gate:missing-input").hexdigest()
                continue
            except OSError as error:
                raise Blocked(f"alternate lockfile state unavailable: {relative}") from error
            if path.is_symlink():
                inside(root, relative, must_exist=False)
        if not path.exists():
            continue
        inside(root, relative)
        maximum = (DEPENDENCY_ARTIFACT_MAXIMUM
                   if relative.startswith("node_modules/.pnpm/") else 8 * 1024 * 1024)
        data = read_bytes(path, maximum)
        total += len(data)
        if total > 64 * 1024 * 1024 or len(result) >= 10000:
            raise Blocked("input manifest size exceeded")
        result[relative] = hashlib.sha256(data).hexdigest()
    for relative in ("node_modules/.pnpm/lock.yaml", "node_modules/.modules.yaml"):
        path = root / relative
        if not path.is_file():
            raise Blocked("installed dependency identity unavailable")
        result[relative] = hashlib.sha256(read_bytes(path)).hexdigest()
    return {"schema": 1, "files": result, "digest": digest(result),
            "dependency_identity": "pnpm installed metadata and esbuild runtime outputs; no hostile-mutation attestation",
            "exclusions": sorted(SKIP), "external_state": "Tests use local mock DB/storage/model fixtures"}


def tooling(root):
    entries = {}
    for directory in ("scripts/failure_gate", "docs/validation"):
        base = Path(root) / directory
        for path in sorted(base.glob("*")):
            if path.is_file() and (directory != "docs/validation" or
                    str(path.relative_to(root)) in (CONFIG, APPROVAL)):
                entries[str(path.relative_to(root))] = hashlib.sha256(read_bytes(path)).hexdigest()
    return digest(entries)


def execution_definition(root):
    """Conservative graph pinning; modified hooks/discovery need renewed review."""
    root = Path(root)
    entries = {}
    for base in ("scripts", "lib", "artifacts"):
        for current, dirs, files in os.walk(root / base):
            dirs[:] = [name for name in dirs if name not in SKIP]
            for name in files:
                path = Path(current) / name
                relative = str(path.relative_to(root))
                if (name == "package.json" or name.startswith("tsconfig") or
                        name in ("build.mjs", "run-tests.mjs") or ".test." in name or
                        relative.startswith("scripts/failure_gate/") or
                        relative == "scripts/failure-gate-install.py"):
                    if name.endswith((".pyc", ".tsbuildinfo")):
                        continue
                    entries[relative] = hashlib.sha256(read_bytes(inside(root, relative))).hexdigest()
    for name in ("package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml",
                 "tsconfig.json", "tsconfig.base.json", "scripts/check-regression-guard.mjs"):
        if (root / name).is_file():
            entries[name] = hashlib.sha256(read_bytes(inside(root, name))).hexdigest()
    return {"digest": digest(entries), "files": entries,
            "scope": "pinned local command/hook/discovery definitions; not arbitrary child launch attestation"}


def configuration(root):
    value = read_json(inside(root, CONFIG))
    if not isinstance(value, dict) or value.get("schema") != 1 or value.get("parameters") != {}:
        raise Blocked("invalid policy")
    validate_limits(value.get("limits", {}))
    tiers = value.get("tiers")
    if not isinstance(tiers, dict) or set(tiers) != {"static", "standard"}:
        raise Blocked("unregistered tier definition")
    expected = {
        "static": [("typecheck", ["pnpm", "typecheck"], "exit")],
        "standard": [("typecheck", ["pnpm", "typecheck"], "exit"),
                     ("tests", ["pnpm", "test"], "node-native"),
                     ("gate-tests", ["python3", "-B", "scripts/failure_gate/tests.py"], "gate")],
    }
    for tier, steps in expected.items():
        if not isinstance(tiers[tier], dict):
            raise Blocked("invalid tier envelope")
        actual = tiers[tier].get("steps")
        if not isinstance(actual, list) or actual != [
            {"name": name, "argv": argv, "parser": parser} for name, argv, parser in steps
        ]:
            raise Blocked("unapproved command/selector expansion")
    return value


def guard_plan(root, store, task_id, relative, policy):
    task = store.task(task_id)
    plan = read_json(inside(root, relative))
    if not isinstance(plan, dict):
        raise Blocked("plan must be an object")
    required = {"schema", "task_id", "namespace", "version", "tier", "changes",
                "requirements", "regression_guard", "pre_existing_failures", "parameters"}
    if set(plan) != required or plan["schema"] != 1:
        raise Blocked("missing or unknown plan fields")
    if plan["task_id"] != task_id or plan["namespace"] != store.meta("namespace"):
        raise Blocked("wrong task/namespace plan")
    if type(plan["version"]) is not int or plan["version"] < 1:
        raise Blocked("invalid plan version")
    if not isinstance(plan["tier"], str) or plan["tier"] not in policy["tiers"] or plan["parameters"] != {}:
        raise Blocked("unknown tier/parameters")
    for field in ("changes", "requirements"):
        if not isinstance(plan[field], list) or not plan[field] or not all(
                isinstance(item, str) and 0 < len(item) <= 1000 for item in plan[field]):
            raise Blocked(f"invalid plan {field}")
    if not isinstance(plan["regression_guard"], str) or len(plan["regression_guard"].strip()) < 20:
        raise Blocked("missing regression protection")
    # No catalog or waiver authority has been approved for this project.
    if plan["pre_existing_failures"] != []:
        raise Blocked("no approved baseline-ignore route")
    for path in plan["changes"]:
        inside(root, path, must_exist=False)
        if path.startswith((".local/", ".failure-gate/", ".git/", "node_modules/")):
            raise Blocked("not a deliverable/source-write path")
        if plan["tier"] == "static" and (not path.endswith((".md", ".txt")) or
                path.startswith((".agents/", "docs/validation/")) or path == "replit.md"):
            raise Blocked("static tier does not cover this change")
    if task["status"] in ("completed", "failed", "cancelled"):
        raise Blocked("terminal task cannot reopen")
    return plan


def parsed_result(parser, outcome, log):
    data = read_bytes(log).decode("utf-8", errors="replace")
    result = {"complete": outcome.get("pass") is True, "parser": parser}
    if parser == "tap":
        counts = [int(value) for value in re.findall(r"(?m)^# tests (\d+)\s*$", data)]
        unsafe = re.findall(r"(?m)^# (?:fail|cancelled|skipped|todo) ([1-9]\d*)\s*$", data)
        result.update(test_counts=counts, unsupported_or_cancelled=unsafe)
        result["complete"] = result["complete"] and len(counts) >= 3 and all(counts) and not unsafe
    elif parser == "node-native":
        # Exact selected-package summaries, not arbitrary prefixed counters.
        states, reports, errors = {}, [], []
        required = {"tests", "suites", "pass", "fail", "cancelled", "skipped", "todo"}
        for raw in data.splitlines():
            line = re.sub(r"\x1b\[[0-9;]*m", "", raw)
            origin = "scripts"
            prefix = re.match(r"^(?:artifacts/|@workspace/)(api-server|skills-workbench) test: (.*)$", line)
            if prefix:
                origin, line = prefix.groups()
            statistic = re.fullmatch(r"(#|ℹ) (tests|suites|pass|fail|cancelled|skipped|todo) (\d+)\s*", line)
            ending = re.fullmatch(r"(#|ℹ) duration_ms (\d+(?:\.\d+)?)\s*", line)
            if not statistic and not ending:
                continue
            marker = (statistic or ending).group(1)
            state = states.setdefault(origin, {"format": marker})
            if state["format"] != marker:
                errors.append("mixed report formats")
            if statistic:
                key, value = statistic.group(2), int(statistic.group(3))
                if key in state:
                    errors.append("duplicate report field")
                state[key] = value
            else:
                if not required.issubset(state):
                    errors.append("incomplete summary")
                elif (state["tests"] <= 0 or state["pass"] != state["tests"]
                      or any(state[key] != 0 for key in ("fail", "cancelled", "skipped", "todo"))):
                    errors.append("failed, cancelled, empty or unsupported tests")
                reports.append({"origin": origin, **state})
                del states[origin]
        if states:
            errors.append("unterminated summary")
        if {entry["origin"] for entry in reports} != {"scripts", "api-server", "skills-workbench"}:
            errors.append("missing selected-package coverage")
        result.update(reports=reports, unsupported_or_cancelled=errors)
        result["complete"] = result["complete"] and not errors and len(reports) >= 3
    elif parser == "gate":
        result["complete"] = result["complete"] and '"failure_gate_suite": "PASSED"' in data
    elif parser != "exit":
        raise Blocked("missing result adapter")
    return result


class Gate:
    def __init__(self, root, initialize=False, state=None, read_only=False):
        self.root = Path(root).resolve()
        self.state = Path(state) if state is not None else self.root / ".failure-gate"
        self.policy = configuration(self.root)
        self.store = Store(self.state, initialize, read_only=read_only)

    def close(self):
        self.store.close()

    def install(self):
        approval = read_json(inside(self.root, APPROVAL))
        if approval.get("reference") != "inv_1iUbbTUza9TH58xPL4PH3cad9hYOhmvsMF:call_0C7pg6uWTpHoxjZo93mlN1Tl" or (
                approval.get("answer") != "Approve policy and installation checks"):
            raise Blocked("actual installation approval unavailable")
        with self.store.transaction():
            current = self.store.meta("installation")
            binding = {"approval": approval, "policy": self.policy,
                       "policy_digest": digest(self.policy), "tooling_digest": tooling(self.root),
                       "execution_definition": execution_definition(self.root)}
            if current:
                if json.loads(current) != binding:
                    raise Blocked("installation binding drift needs actual renewed approval")
                return binding
            decision = self.store.decision("installation", None, binding)
            self.store.set_meta("installation", encoded(binding))
            self.store.set_meta("installation_decision", decision)
            first = read_json(self.state / "first-proof.json")
            if first.get("status") != "PASSED" or first.get("approval_reference") != approval["reference"]:
                raise Blocked("safe initial fixture proof missing")
            current_boot = read_bytes("/proc/sys/kernel/random/boot_id", 100).decode().strip()
            if first.get("boot") != current_boot:
                raise Blocked("initial proof boot/accounting changed")
            self.store.set_meta("installation_started_wall", str(time.time()))
            self.store.set_meta("installation_boot", current_boot)
            self.store.set_meta("installation_started_monotonic", str(first["started_monotonic"]))
            self.store.set_meta("installation_attempts", "0")
            self.store.event("installation_authorized", payload={"decision": decision,
                             "policy_digest": digest(self.policy), "tooling_digest": tooling(self.root)})
        return binding

    def bindings(self):
        value = self.store.meta("installation")
        if value is None:
            raise Blocked("installation not registered")
        binding = json.loads(value)
        if binding["policy_digest"] != digest(self.policy) or binding["tooling_digest"] != tooling(self.root):
            raise Blocked("governing tooling/policy changed; approval renewal required")
        if "execution_definition" in binding and binding["execution_definition"] != execution_definition(self.root):
            raise Blocked("execution graph drift; renewed review required")
        return binding

    def approve_plan(self, task_id, relative):
        """Actual local terminal review; not available to unattended task agents."""
        plan = guard_plan(self.root, self.store, task_id, relative, self.policy)
        self.bindings()
        if not sys.stdin.isatty():
            raise Blocked("human review requires an interactive terminal; a caller flag is not approval")
        print(encoded(plan))
        phrase = f"approve {task_id} {digest(plan)}"
        if input(f"To record local human review, enter exactly:\n{phrase}\n") != phrase:
            raise Blocked("plan not approved")
        with self.store.transaction():
            binding = {"plan": plan, "plan_digest": digest(plan), "policy_digest": digest(self.policy),
                       "tier_digest": digest(self.policy["tiers"][plan["tier"]]),
                       "source": "actual interactive local review; identity not authenticated",
                       "parameters": {}, "relative": relative}
            decision = self.store.decision("plan_review", task_id, binding)
            self.store.event("plan_reviewed", task_id, payload={"decision": decision, **binding})
        return decision

    def activate(self, task_id, relative):
        self.bindings()
        if self.store.meta("governance") != "ACTIVE":
            raise Blocked("ordinary route awaits separately approved cutover")
        plan = guard_plan(self.root, self.store, task_id, relative, self.policy)
        with self.store.transaction():
            task = self.store.task(task_id)
            existing = self.store.db.execute(
                "SELECT id,payload FROM decisions WHERE task_id=? AND kind='plan_review'",
                (task_id,)).fetchall()
            matching = [row for row in existing if json.loads(row["payload"]) == {
                "plan": plan, "plan_digest": digest(plan), "policy_digest": digest(self.policy),
                "tier_digest": digest(self.policy["tiers"][plan["tier"]]),
                "source": "actual interactive local review; identity not authenticated",
                "parameters": {}, "relative": relative}]
            if not matching:
                raise Blocked("exact approved plan input missing")
            if task["status"] == "active":
                if task["plan_digest"] == digest(plan) and not task["suspended"]:
                    return {"already_active": True, "authorization": task["auth"]}
                raise Blocked("active amendment requires separately reviewed atomic transition")
            decision = self.store.decision("policy_activation", task_id,
                                          {"review": matching[-1]["id"], "plan": plan,
                                           "policy_digest": digest(self.policy)})
            self.store.db.execute(
                "UPDATE tasks SET status='active',plan=?,plan_digest=?,tier=?,tier_digest=?,"
                "policy_digest=?,auth=auth+1,decision=? WHERE public_id=?",
                (encoded(plan), digest(plan), plan["tier"], digest(self.policy["tiers"][plan["tier"]]),
                 digest(self.policy), decision, task_id))
            statuses = {name: "ALLOWED" if name == plan["tier"] else "NOT ALLOWED"
                        for name in self.policy["tiers"]}
            self.store.event("activated", task_id, payload={"decision": decision, "tiers": statuses,
                                                          "authorization": task["auth"] + 1})
        return {"authorization": task["auth"] + 1, "decision": decision}

    def check_authorization(self, task_id, relative, requested=None):
        self.bindings()
        task = self.store.task(task_id)
        plan = guard_plan(self.root, self.store, task_id, relative, self.policy)
        if (self.store.meta("governance") != "ACTIVE" or task["status"] != "active"
                or task["suspended"] or task["plan_digest"] != digest(plan)
                or task["tier_digest"] != digest(self.policy["tiers"][plan["tier"]])
                or task["policy_digest"] != digest(self.policy)
                or (requested is not None and requested != task["tier"])):
            raise Blocked("inactive, stale, suspended or mismatched one-tier authorization")
        return task

    def bootstrap(self):
        self.bindings()
        boot = read_bytes("/proc/sys/kernel/random/boot_id", 100).decode().strip()
        if boot != self.store.meta("installation_boot"):
            raise Blocked("boot changed; installation accounting cannot be renewed implicitly")
        remaining = self.policy["limits"]["installation_seconds"] - (
            time.monotonic() - float(self.store.meta("installation_started_monotonic")))
        inherited = os.environ.get("FAILURE_GATE_PARENT_DEADLINE")
        if inherited is not None:
            # This is a cooperative propagation channel, not proof of host identity.
            # The independent outer supervisor still enforces this earlier deadline.
            deadline = float(inherited)
            original = float(self.store.meta("installation_started_monotonic")) + self.policy["limits"]["installation_seconds"]
            if not (time.monotonic() < deadline <= original):
                raise Blocked("invalid/enlarged inherited installation deadline")
            remaining = min(remaining, deadline - time.monotonic())
        attempts = int(self.store.meta("installation_attempts"))
        if remaining <= 30 or attempts >= 2:
            raise Blocked("approved installation budget exhausted")
        if attempts:
            previous = self.store.db.execute("SELECT payload FROM runs WHERE purpose='bootstrap'").fetchall()
            if any(json.loads(row[0]).get("assessment") != "PASSED" for row in previous):
                raise Blocked("failed/uncertain acceptance needs scoped continuation approval, not automatic retry")
        task_id = self.store.meta("bootstrap_task")
        if task_id is None:
            task_id = self.store.allocate()
            with self.store.transaction():
                self.store.set_meta("bootstrap_task", task_id)
        with self.store.transaction():
            self.store.set_meta("installation_attempts", str(attempts + 1))
            self.store.event("bootstrap_attempt_reserved", task_id, payload={"attempt": attempts + 1,
                              "remaining_seconds": remaining})
        return self.execute(task_id, "standard", "bootstrap", 0,
                            min(remaining, self.policy["limits"]["run_seconds"]))

    def execute(self, task_id, tier, purpose, auth, run_seconds):
        identifier = str(uuid.uuid4())
        steps = self.policy["tiers"][tier]["steps"]
        with writer_lock(self.state, self.policy["limits"]["queue_seconds"]) as lock:
            self.store.check_journal()
            with self.store.transaction():
                active = self.store.db.execute(
                    "SELECT id,task_id FROM runs WHERE recovery_required=1").fetchall()
                if active:
                    raise Blocked(f"resource busy or retained uncertainty: {[dict(row) for row in active]}")
                before = snapshot(self.root)
                payload = {"schema": 1, "snapshot": before, "steps": [
                    {"name": step["name"], "status": "NOT_REACHED"} for step in steps],
                    "assessment": "INCOMPLETE", "tier_digest": digest(self.policy["tiers"][tier]),
                    "policy_digest": digest(self.policy), "tooling_digest": tooling(self.root),
                    "limits": self.policy["limits"], "purpose": purpose, "authorization": auth}
                payload["environment"] = {
                    "python": sys.version.split()[0], "platform": sys.platform,
                    "node_path": shutil.which("node"), "pnpm_path": shutil.which("pnpm"),
                    "dependency_metadata": before["dependency_identity"],
                    "fixtures": "mock DB/storage/model, loopback ephemeral listener",
                    "external_equivalence": "no production or external-service fixture admission",
                }
                self.store.db.execute("INSERT INTO runs VALUES(?,?,?,?,?,?,?,?)",
                    (identifier, task_id, purpose, auth, tier, "running", 1, encoded(payload)))
                self.store.event("run_reserved", task_id, identifier, payload={"purpose": purpose,
                                 "snapshot_digest": before["digest"], "auth": auth})
            start = time.monotonic()
            raw_failure = False
            healthy = True
            consumed_bytes = 0
            for index, step in enumerate(steps):
                remaining = run_seconds - (time.monotonic() - start)
                if remaining <= 30:
                    healthy = False
                    break
                self.bindings()
                if purpose == "required_tier_validation":
                    task = self.store.task(task_id)
                    if task["auth"] != auth or task["status"] != "active" or task["suspended"]:
                        raise Blocked("authorization changed before dispatch")
                effective = dict(self.policy["limits"])
                effective["run_seconds"] = min(effective["run_seconds"], int(remaining - 30))
                effective["max_bytes"] -= consumed_bytes
                if effective["max_bytes"] < 1:
                    healthy = False
                    break
                directory = self.state / "runs" / identifier / step["name"]

                def record(kind, value):
                    with self.store.transaction():
                        self.store.event(kind, task_id, identifier, {"step": step["name"], **value})

                outcome = supervised_run(step["argv"], self.root, directory, record, effective, lock)
                consumed_bytes += outcome["bytes"]
                parsed = parsed_result(step["parser"], outcome, directory / "raw.log")
                payload["steps"][index] = {"name": step["name"], "outcome": outcome, "report": parsed,
                    "status": "PASSED" if parsed["complete"] else "FAILED",
                    "log_digest": hashlib.sha256(read_bytes(directory / "raw.log")).hexdigest(),
                    "raw_log": str((directory / "raw.log").relative_to(self.state))}
                with self.store.transaction():
                    self.store.db.execute("UPDATE runs SET payload=? WHERE id=?", (encoded(payload), identifier))
                    self.store.event("step_recorded", task_id, identifier,
                                     {"step": step["name"], "status": payload["steps"][index]["status"]})
                raw_failure = raw_failure or not parsed["complete"]
                healthy = healthy and outcome["healthy_release"] is True
                if not parsed["complete"] and purpose == "required_tier_validation":
                    signature = digest({"step": step["name"], "reason": outcome["reason"],
                                        "raw_exit": outcome["raw_exit"]})
                    with self.store.transaction():
                        self.store.db.execute("INSERT OR IGNORE INTO repairs VALUES(?,?,?)",
                            (task_id, signature, encoded({"source_run": identifier,
                             "classification": "unresolved; no direct earlier-run/corroboration evidence",
                             "step": step["name"], "owned_until_resolved": True})))
                if not healthy:
                    break
            after = snapshot(self.root)
            unchanged = before["digest"] == after["digest"]
            complete = all(step["status"] == "PASSED" for step in payload["steps"])
            payload.update(elapsed=time.monotonic() - start, final_snapshot=after,
                           snapshot_integrity="coordinated participants only; out-of-band edits unobservable",
                           assessment="PASSED" if complete and unchanged and healthy else "FAILED",
                           raw_failure=raw_failure, consumed_bytes=consumed_bytes)
            with self.store.transaction():
                self.store.db.execute("UPDATE runs SET status='finished',recovery_required=?,payload=? WHERE id=?",
                    (0 if healthy else 1, encoded(payload), identifier))
                self.store.event("run_finished", task_id, identifier,
                                 {"assessment": payload["assessment"], "healthy_release": healthy,
                                  "snapshot_unchanged": unchanged, "elapsed": payload["elapsed"]})
            return {"run_id": identifier, **payload}

    def required_run(self, task_id, relative, requested=None):
        task = self.check_authorization(task_id, relative, requested)
        return self.execute(task_id, task["tier"], "required_tier_validation", task["auth"],
                            self.policy["limits"]["run_seconds"])

    def complete(self, task_id, relative, run_id):
        # Writer protection is held through manifest/evidence checks AND terminal commit.
        with writer_lock(self.state, self.policy["limits"]["queue_seconds"]):
            task = self.check_authorization(task_id, relative)
            self.store.check_journal()
            with self.store.transaction():
                row = self.store.db.execute("SELECT * FROM runs WHERE id=? AND task_id=?",
                                            (run_id, task_id)).fetchone()
                if row is None:
                    raise Blocked("unknown run")
                evidence = json.loads(row["payload"])
                if (row["purpose"] != "required_tier_validation" or row["auth"] != task["auth"]
                        or row["recovery_required"] != 0 or row["status"] != "finished"
                        or evidence["assessment"] != "PASSED"
                        or evidence["snapshot"]["digest"] != snapshot(self.root)["digest"]):
                    raise Blocked("missing, raw-failing, incomplete or stale required-tier evidence")
                definitions = self.policy["tiers"][task["tier"]]["steps"]
                if evidence.get("tier_digest") != digest(self.policy["tiers"][task["tier"]]) or (
                        evidence.get("policy_digest") != digest(self.policy) or
                        evidence.get("tooling_digest") != tooling(self.root) or
                        not isinstance(evidence.get("steps"), list) or
                        len(evidence["steps"]) != len(definitions)):
                    raise Blocked("incomplete or changed evidence definitions")
                for definition, actual in zip(definitions, evidence["steps"]):
                    outcome = actual.get("outcome", {})
                    if (actual.get("name") != definition["name"] or actual.get("status") != "PASSED"
                            or outcome.get("pass") is not True
                            or outcome.get("registered") is not True
                            or outcome.get("healthy_release") is not True
                            or outcome.get("raw_exit") != 0 or outcome.get("reason") != "finished"):
                        raise Blocked("missing affirmative step evidence")
                    log = inside(self.state, actual.get("raw_log", ""))
                    if hashlib.sha256(read_bytes(log)).hexdigest() != actual.get("log_digest"):
                        raise Blocked("missing/corrupt raw artifact")
                    if parsed_result(definition["parser"], outcome, log) != actual.get("report"):
                        raise Blocked("report/raw evidence mismatch")
                for kind in ("run_reserved", "launch_intent", "watchdog_registered", "confirmed_start",
                             "step_outcome", "run_finished"):
                    count = self.store.db.execute(
                        "SELECT count(*) FROM events WHERE run_id=? AND kind=?", (run_id, kind)).fetchone()[0]
                    expected = 1 if kind in ("run_reserved", "run_finished") else len(definitions)
                    if count != expected:
                        raise Blocked("incomplete lifecycle journal")
                if self.store.db.execute("SELECT 1 FROM repairs WHERE task_id=?", (task_id,)).fetchone():
                    raise Blocked("unresolved repair obligations cannot be waived by a later pass")
                if self.store.meta("writer_coverage") != "verified":
                    raise Blocked("all participating final-write routes not yet verified")
                self.store.db.execute("UPDATE tasks SET status='completed',tier=NULL,mode='validated',"
                                      "assessment='PASSED' WHERE public_id=?", (task_id,))
                self.store.event("completed", task_id, run_id, {"mode": "validated"})
        return {"task_id": task_id, "mode": "validated", "assessment": "PASSED"}

    def write(self, task_id, relative, edit_file):
        task = self.check_authorization(task_id, relative)
        edits = read_json(inside(self.root, edit_file))
        if not isinstance(edits, list) or not edits or len(edits) > 50:
            raise Blocked("bounded edit array required")
        plan = json.loads(task["plan"])
        with writer_lock(self.state, self.policy["limits"]["queue_seconds"]):
            self.check_authorization(task_id, relative)
            targets = []
            for edit in edits:
                if not isinstance(edit, dict) or set(edit) != {"path", "before", "content"}:
                    raise Blocked("invalid edit")
                if edit["path"] not in plan["changes"] or not isinstance(edit["content"], str):
                    raise Blocked("write outside approved change paths")
                path = inside(self.root, edit["path"], must_exist=False)
                previous = hashlib.sha256(read_bytes(path)).hexdigest() if path.exists() else None
                if previous != edit["before"] or len(edit["content"].encode()) > 1048576:
                    raise Blocked("stale or oversized edit")
                targets.append((path, edit["content"]))
            # Multi-file writes are journaled, not claimed to be an atomic filesystem transaction.
            with self.store.transaction():
                self.store.event("writer_intent", task_id, payload={"paths": [e["path"] for e in edits]})
            for path, content in targets:
                path.parent.mkdir(parents=True, exist_ok=True)
                fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
                with os.fdopen(fd, "w") as stream:
                    stream.write(content)
                    stream.flush()
                    os.fsync(stream.fileno())
            with self.store.transaction():
                self.store.event("writer_finished", task_id, payload={"paths": [e["path"] for e in edits]})
        return {"written": [edit["path"] for edit in edits]}

    def owner_close(self, task_id):
        task = self.store.task(task_id)
        if not sys.stdin.isatty():
            raise Blocked("owner closure needs actual scoped owner instruction; flags do not approve it")
        phrase = f"close {task_id} without validated completion"
        if input(f"{phrase}\n") != phrase:
            raise Blocked("owner did not direct closure")
        with writer_lock(self.state):
            with self.store.transaction():
                if self.store.db.execute("SELECT 1 FROM runs WHERE task_id=? AND recovery_required=1",
                                         (task_id,)).fetchone():
                    raise Blocked("owned work unresolved; safe closure persistence blocked")
                current = self.store.task(task_id)
                if current["status"] == "completed":
                    return {"already_completed": True, "mode": current["mode"]}
                if current["status"] in ("failed", "cancelled"):
                    raise Blocked("terminal history cannot be rewritten")
                decision = self.store.decision("owner_direction", task_id,
                    {"instruction": phrase, "source": "actual interactive owner direction",
                     "task_version": current["auth"], "plan_digest": current["plan_digest"]})
                self.store.db.execute("UPDATE tasks SET status='completed',tier=NULL,mode='owner_direction',"
                                      "decision=? WHERE public_id=?", (decision, task_id))
                self.store.event("owner_closed", task_id, payload={"mode": "owner_direction",
                                 "decision": decision, "validation": current["assessment"],
                                 "repairs_preserved": True})
        return {"task_id": task_id, "mode": "owner_direction", "validation_passed": False}

    def health(self):
        rows = self.store.db.execute("SELECT public_id,status,mode,assessment FROM tasks").fetchall()
        runs = self.store.db.execute("SELECT id,task_id,purpose,status,recovery_required FROM runs").fetchall()
        return {"schema": 1, "namespace": self.store.meta("namespace"),
                "governance": self.store.meta("governance"),
                "journal": "present and consistent at open", "tasks": [dict(row) for row in rows],
                "runs": [dict(row) for row in runs],
                "repairs": [dict(row) for row in self.store.db.execute("SELECT * FROM repairs")],
                "catalog": {"availability": "never_collected", "ignore_authority": False},
                "independent_callers": {"availability": "unknown", "coverage": "not observed"},
                "reclaim": {"availability": "unavailable", "status": "BLOCKED"},
                "backup": {"availability": "never_collected", "ready": False},
                "writer_coverage": self.store.meta("writer_coverage") or "unknown",
                "completion": "owner_direction is not validation passed"}

    def export(self, task_id, destination):
        task = self.store.task(task_id)
        decisions = [dict(row) for row in self.store.db.execute(
            "SELECT * FROM decisions WHERE task_id=?", (task_id,))]
        runs = [dict(row) for row in self.store.db.execute("SELECT * FROM runs WHERE task_id=?", (task_id,))]
        events = [dict(row) for row in self.store.db.execute(
            "SELECT * FROM events WHERE task_id=? ORDER BY seq", (task_id,))]
        repairs = [dict(row) for row in self.store.db.execute("SELECT * FROM repairs WHERE task_id=?", (task_id,))]
        bundle = {"schema": 1, "namespace": self.store.meta("namespace"),
                  "task": task, "decisions": decisions, "runs": runs, "events": events, "repairs": repairs,
                  "non_authorizing": True, "redactions": ["raw stdout/stderr retained only by protected reference"],
                  "self_contained": False, "absence": ["no baseline catalog", "independent telemetry unavailable"],
                  "completion_mode": task["mode"]}
        bundle["digest"] = digest(bundle)
        output = inside(self.root, destination, must_exist=False)
        if not destination.startswith("docs/validation/") or output.exists():
            raise Blocked("export requires a new scoped docs/validation destination")
        atomic_json(output, bundle)
        return {"path": destination, "digest": bundle["digest"], "non_authorizing": True}
