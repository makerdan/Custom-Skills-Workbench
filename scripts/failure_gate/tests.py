"""Isolated contract fixtures. Never approve/activate the actual host."""
import hashlib
import fcntl
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import Blocked, atomic_json, digest, encoded, incarnation, inside, read_bytes, read_json, writer_lock
from gate import Gate, configuration, execution_definition, guard_plan, parsed_result, snapshot, tooling
from store import Store
from supervisor import LIMITS, run, validate_limits
from unittest.mock import patch
import bootstrap
from run_codegen import STAGED_OUTPUTS, cleanup_stages, promote_staged_outputs
from run_writer import run_command, write_if_unchanged

ROOT = Path(__file__).resolve().parents[2]


class BootstrapTests(unittest.TestCase):
    """Simulated authority only in isolated stores; never host approval."""
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        for base in ("scripts/failure_gate", ".agents/skills/failure-gate-v4",
                     ".agents/skills/port-authority"):
            shutil.copytree(ROOT / base, self.root / base,
                            ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        for file in (bootstrap.PLAN, bootstrap.ENTRY, "docs/validation/failure-gate-policy.json"):
            target = self.root / file
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / file, target)
        self.store = Store(self.root / ".failure-gate", True)
        task = self.store.allocate()
        with self.store.transaction():
            self.store.set_meta("bootstrap_task", task)
            self.store.set_meta("installation_decision", "isolated-fixture-registration")
        plan = read_json(self.root / bootstrap.PLAN)
        plan.update(namespace=self.store.meta("namespace"), local_id=task)
        atomic_json(self.root / bootstrap.PLAN, plan)

    def tearDown(self):
        self.store.close()
        self.temporary.cleanup()

    def authorize(self):
        binding = bootstrap.subject(self.root, self.store)
        return bootstrap.approve(self.store, binding,
                                 {"source": "ISOLATED TEST SIMULATION", "reference": "fixture"})

    def test_bootstrap_missing_wrong_operation_namespace_policy_and_graph_denied(self):
        with self.assertRaises(Blocked):
            bootstrap.reserve(self.root, self.store, "health-1")
        for key, bad in (("operation", "run"), ("namespace", "other"),
                         ("local_id", "65"), ("policy_version", "other"),
                         ("effects", ["codegen"]), ("order", ["health-1"]),
                         ("parent_seconds", 901)):
            original = read_json(self.root / bootstrap.PLAN)
            altered = dict(original, **{key: bad})
            atomic_json(self.root / bootstrap.PLAN, altered)
            with self.assertRaises(Blocked):
                bootstrap.subject(self.root, self.store)
            atomic_json(self.root / bootstrap.PLAN, original)
        self.authorize()
        (self.root / bootstrap.ENTRY).write_text("changed governing source")
        with self.assertRaises(Blocked):
            bootstrap.reserve(self.root, self.store, "fixtures-1")
        self.assertEqual(self.store.db.execute("SELECT count(*) FROM runs").fetchone()[0], 0)

    def test_bootstrap_arbitrary_callers_and_receipt_flags_do_not_authorize(self):
        for actual in ({}, {"approved": True}, {"reference": "invented"}, []):
            atomic_json(self.root / bootstrap.APPROVAL, actual)
            with self.assertRaises(Blocked):
                bootstrap.capture_owner_decision(self.root)
        self.authorize()
        for caller in ("run", "standard", "codegen", "fixtures-2", "health-1", ["fixtures-1"]):
            with self.assertRaises(Blocked):
                bootstrap.reserve(self.root, self.store, caller)
        self.assertEqual(self.store.db.execute("SELECT count(*) FROM runs").fetchone()[0], 0)

    def test_bootstrap_replay_conflict_and_concurrent_reservation_share_one_slot(self):
        self.authorize()
        results = []
        def contender():
            store = Store(self.root / ".failure-gate")
            try:
                with writer_lock(store.directory):
                    try:
                        bootstrap.reserve(self.root, store, "fixtures-1")
                        results.append("reserved")
                    except Blocked:
                        results.append("denied")
            finally:
                store.close()
        threads = [threading.Thread(target=contender) for _ in range(2)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=5)
        self.assertEqual(sorted(results), ["denied", "reserved"])
        self.assertEqual(self.store.db.execute("SELECT count(*) FROM runs").fetchone()[0], 1)
        with self.assertRaises(Blocked):
            self.authorize()
        with self.assertRaises(Blocked):
            bootstrap.reserve(self.root, self.store, "fixtures-1")

    def test_bootstrap_boot_expiry_enlargement_and_cleanup_reservation_deny(self):
        value = self.authorize()
        original = encoded(value)
        for changed in (dict(value, boot="resumed-other-boot"),
                        dict(value, deadline=value["deadline"] + 1),
                        dict(value, started=value["started"] + 100, deadline=value["deadline"] + 100),
                        dict(value, started=0, deadline=900)):
            with self.store.transaction():
                self.store.set_meta(bootstrap.KEY, encoded(changed))
            with self.assertRaises(Blocked):
                bootstrap.reserve(self.root, self.store, "fixtures-1")
        with self.store.transaction():
            self.store.set_meta(bootstrap.KEY, original)
        with patch("bootstrap.time.monotonic", return_value=value["deadline"] - 120):
            with self.assertRaises(Blocked):
                bootstrap.reserve(self.root, self.store, "fixtures-1")
        self.assertEqual(self.store.db.execute("SELECT count(*) FROM runs").fetchone()[0], 0)

    def test_bootstrap_decision_mutation_and_missing_registration_fail_closed(self):
        value = self.authorize()
        self.store.db.execute("UPDATE decisions SET digest='corrupt' WHERE id=?", (value["decision"],))
        with self.assertRaises(Blocked):
            bootstrap.context(self.root, self.store)
        with patch("bootstrap.sys.stdin.isatty", return_value=False):
            with self.assertRaises(Blocked):
                bootstrap.review(self.root)
        with self.assertRaises(Blocked):
            bootstrap.private_health(self.root)

    def test_bootstrap_typed_capture_termination_evidence_not_truthiness(self):
        healthy = {"pass": True, "registered": True, "stopped": True,
                   "capture_complete": True, "healthy_release": True,
                   "raw_exit": 0, "reason": "finished"}
        self.assertTrue(bootstrap.accept_outcome(healthy))
        for key in healthy:
            for bad in (None, "true", "unknown", {}, False):
                self.assertFalse(bootstrap.accept_outcome(dict(healthy, **{key: bad})))
        fixture = {"pass_": True, "known_stopped": True, "capture_complete": True,
                   "raw_exit": 0, "deadline": False, "surviving_work": False,
                   "output_overflow": False, "exclusion": False, "error": None}
        self.assertTrue(bootstrap.accept_outcome(fixture, True))
        self.assertFalse(bootstrap.accept_outcome(dict(fixture, exclusion=True), True))
        self.assertFalse(bootstrap.accept_outcome(dict(fixture, output_overflow=True), True))

    def test_bootstrap_failed_capture_retains_consumption_and_exclusion(self):
        self.authorize()
        failed = {"pass_": False, "known_stopped": True, "capture_complete": False,
                  "raw_exit": 0, "output": "", "error": None}
        sys.path.insert(0, str(ROOT / ".agents/skills/failure-gate-v4/tests"))
        with patch("authoring_supervision.supervise_static", return_value=failed):
            with self.assertRaises(Blocked):
                bootstrap.dispatch(self.root, "fixtures-1")
        value = json.loads(self.store.meta(bootstrap.KEY))
        self.assertEqual(value["phase"], "failed")
        self.assertEqual(value["next"], 1)
        self.assertEqual(self.store.db.execute(
            "SELECT recovery_required FROM runs").fetchone()[0], 1)
        with self.assertRaises(Blocked):
            bootstrap.reserve(self.root, self.store, "fixtures-1")

    def test_bootstrap_health_evidence_does_not_change_protected_state(self):
        before = bootstrap.protected_state(self.store)
        self.authorize()
        bootstrap.reserve(self.root, self.store, "fixtures-1")
        self.assertEqual(before, bootstrap.protected_state(self.store))
        with self.store.transaction():
            self.store.set_meta("writer_coverage", "invented")
        self.assertNotEqual(before, bootstrap.protected_state(self.store))

    def test_bootstrap_prior_raw_evidence_required_before_next_caller(self):
        self.authorize()
        fixture = {"pass_": True, "known_stopped": True, "capture_complete": True,
                   "raw_exit": 0, "deadline": False, "surviving_work": False,
                   "output_overflow": False, "exclusion": False, "error": None,
                   "output": '{"failure_gate_suite":"PASSED","tests":1,"isolated_fixtures":true}\n'}
        sys.path.insert(0, str(ROOT / ".agents/skills/failure-gate-v4/tests"))
        with patch("authoring_supervision.supervise_static", return_value=fixture):
            result = bootstrap.dispatch(self.root, "fixtures-1")
        self.assertEqual(result["status"], "PASSED")
        value = json.loads(self.store.meta(bootstrap.KEY))
        evidence = self.store.directory / value["attempts"][0]["evidence"]
        evidence.write_text('{"altered":true}')
        with self.assertRaises(Blocked):
            bootstrap.reserve(self.root, self.store, "fixtures-2")
        self.assertEqual(self.store.db.execute("SELECT count(*) FROM runs").fetchone()[0], 1)

    def test_bootstrap_private_health_requires_original_narrowing_and_real_registration(self):
        value = self.authorize()
        end = time.monotonic() + 10
        attempt = {"caller": "health-1", "run": "isolated-health", "deadline": end,
                   "status": "reserved", "events": []}
        value.update(phase="reserved", attempts=[attempt])
        with self.store.transaction():
            self.store.set_meta(bootstrap.KEY, encoded(value))
            self.store.db.execute("INSERT INTO runs VALUES(?,?,?,?,?,?,?,?)",
                                  ("isolated-health", value["binding"]["local_id"],
                                   bootstrap.OPERATION, 0, "installation-only", "reserved", 1,
                                   encoded(attempt)))
        # Synthetic IPC is deliberately insufficient. Even a narrower budget
        # needs the exact independently registered worker/watchdog incarnations.
        with patch("bootstrap.stat.S_ISFIFO", return_value=True):
            for deadline in (end + 1, end - 1, float("inf"), float("nan")):
                with patch.dict(os.environ, {"FAILURE_GATE_PARENT_DEADLINE": str(deadline)}):
                    with self.assertRaises(Blocked):
                        bootstrap.private_health(self.root)


class InputTests(unittest.TestCase):
    def test_limits_reject_missing_disabled_invalid_and_enlarged(self):
        validate_limits(dict(LIMITS))
        for value in (0, -1, True, None, float("inf"), float("nan"), 2147483648, 481):
            values = dict(LIMITS, step_seconds=value)
            with self.assertRaises(Blocked):
                validate_limits(values)
        with self.assertRaises(Blocked):
            validate_limits({})
        with self.assertRaises(Blocked):
            validate_limits(None)

    def test_bounded_regular_inputs_and_traversal(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "good").write_text("{}")
            (root / "link").symlink_to(root / "good")
            os.mkfifo(root / "pipe")
            self.assertEqual(read_json(root / "good"), {})
            for path in ("../good", "/tmp/no", "link", "pipe"):
                with self.assertRaises((Blocked, OSError)):
                    read_bytes(inside(root, path), 100)
            with self.assertRaises(Blocked):
                read_bytes(root / "good", 1)

    def test_lock_inode_and_bounded_contention(self):
        with tempfile.TemporaryDirectory() as temporary:
            with writer_lock(temporary):
                denied = []

                def contender():
                    try:
                        with writer_lock(temporary, 0.05):
                            denied.append(False)
                    except Blocked:
                        denied.append(True)

                thread = threading.Thread(target=contender)
                thread.start()
                thread.join(timeout=1)
                self.assertEqual(denied, [True])
            original = (Path(temporary) / "writers.lock").stat().st_ino
            with writer_lock(temporary):
                self.assertEqual((Path(temporary) / "writers.lock").stat().st_ino, original)

    def test_external_writer_uses_gate_lock_and_preserves_child_exit(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            started = root / "started"
            outcome = []

            def contender():
                try:
                    outcome.append(run_command(
                        [sys.executable, "-c", "from pathlib import Path; Path('started').write_text('yes')"],
                        root=root,
                        cwd=root,
                        timeout=0.05,
                    ))
                except Blocked:
                    outcome.append("blocked")

            with writer_lock(root / ".failure-gate"):
                thread = threading.Thread(target=contender)
                thread.start()
                thread.join(timeout=1)
                self.assertFalse(thread.is_alive())
                self.assertEqual(outcome, ["blocked"])
                self.assertFalse(started.exists())

            self.assertEqual(
                run_command(
                    [sys.executable, "-c", "raise SystemExit(17)"],
                    root=root,
                    cwd=root,
                    timeout=1,
                ),
                17,
            )

    def test_writer_command_passes_the_active_lock_descriptor_to_children(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            lock_directory = root / ".failure-gate"
            command = (
                "import fcntl, os; from pathlib import Path; "
                "fd=int(os.environ['FAILURE_GATE_WRITER_FD']); "
                "lock=Path('.failure-gate/writers.lock'); "
                "assert (os.fstat(fd).st_dev, os.fstat(fd).st_ino) == "
                "(lock.stat().st_dev, lock.stat().st_ino); "
                "fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB); "
                "Path('child-wrote').write_text('locked')"
            )
            with writer_lock(lock_directory):
                self.assertEqual(
                    run_command(
                        [sys.executable, "-c", command],
                        root=root,
                        cwd=root,
                    ),
                    0,
                )
                self.assertEqual((root / "child-wrote").read_text(), "locked")

    def test_inherited_writer_descriptor_is_workspace_bound_and_effective(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            writer_directory = root / "scripts" / "failure_gate"
            writer_directory.mkdir(parents=True)
            for name in ("run_writer.py", "common.py"):
                shutil.copyfile(
                    ROOT / "scripts" / "failure_gate" / name,
                    writer_directory / name,
                )
            writer_script = writer_directory / "run_writer.py"
            lock_directory = root / ".failure-gate"
            lock_directory.mkdir()
            output = root / "must-not-write"
            command = [
                sys.executable,
                "-B",
                str(writer_script),
                "--inherited-lock-fd",
            ]
            with writer_lock(lock_directory) as held_fd:
                result = subprocess.run(
                    command + [str(held_fd), "--verify-lock-fd"],
                    cwd=root,
                    pass_fds=(held_fd,),
                    check=False,
                )
                self.assertEqual(result.returncode, 0)

                other_fd = os.open(
                    lock_directory / "writers.lock",
                    os.O_RDWR | os.O_NOFOLLOW,
                )
                try:
                    denied = subprocess.run(
                        command + [
                            str(other_fd),
                            "--",
                            sys.executable,
                            "-c",
                            f"from pathlib import Path; Path({str(output)!r}).write_text('bad')",
                        ],
                        cwd=root,
                        pass_fds=(other_fd,),
                        check=False,
                    )
                    self.assertEqual(denied.returncode, 2)
                    self.assertFalse(output.exists())
                finally:
                    os.close(other_fd)

    def test_regression_guard_writer_rejects_stale_plan_and_writes_under_gate_lock(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            plan = root / "plan.md"
            plan.write_text("before")
            before = hashlib.sha256(plan.read_bytes()).hexdigest()
            write_if_unchanged(root, "plan.md", before, b"after")
            self.assertEqual(plan.read_text(), "after")

            with self.assertRaises(Blocked):
                write_if_unchanged(root, "plan.md", before, b"lost update")
            self.assertEqual(plan.read_text(), "after")

    def test_writer_creates_only_an_explicitly_missing_generated_file(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            output = root / "src" / "generated.ts"
            write_if_unchanged(root, "src/generated.ts", "missing", b"generated")
            self.assertEqual(output.read_bytes(), b"generated")
            with self.assertRaises(Blocked):
                write_if_unchanged(
                    root, "src/generated.ts", "missing", b"stale generated",
                )
            self.assertEqual(output.read_bytes(), b"generated")


class CodegenWriterTests(unittest.TestCase):
    def test_orval_output_promotion_is_complete_and_preserves_declarations(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            stage_id = "fixture-123"
            stages = []
            for stage_parent_relative, source_relative, destination_relative, required in STAGED_OUTPUTS:
                source_root = root / source_relative
                stage_parent = root / stage_parent_relative
                stage_root = stage_parent / f".orval-stage-{stage_id}"
                staged = stage_root / "generated"
                destination = root / destination_relative
                staged.mkdir(parents=True)
                destination.mkdir(parents=True)
                (destination / "kept.d.ts").write_text("declaration")
                (destination / "old.ts").write_text("stale generated file")
                (destination.parent / "index.ts").write_text("old barrel")
                (stage_root / "index.ts").write_text("new barrel")
                for relative in required:
                    output = staged / relative
                    output.parent.mkdir(parents=True, exist_ok=True)
                    output.write_text(f"new {relative}")
                stages.append((stage_root, staged))

            promote_staged_outputs(root, stage_id)

            for (_, _, destination_relative, required), (stage_root, staged) in zip(
                    STAGED_OUTPUTS, stages):
                destination = root / destination_relative
                self.assertFalse(staged.exists())
                self.assertFalse((stage_root / "index.ts").exists())
                self.assertFalse((destination / "old.ts").exists())
                self.assertEqual((destination / "kept.d.ts").read_text(), "declaration")
                self.assertEqual(
                    (destination.parent / "index.ts").read_text(),
                    "new barrel",
                )
                for relative in required:
                    self.assertEqual(
                        (destination / relative).read_text(),
                        f"new {relative}",
                    )

            cleanup_stages(root, stage_id)
            for stage_root, _ in stages:
                self.assertFalse(stage_root.exists())

    def test_incomplete_orval_stage_does_not_replace_accepted_output(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            stage_id = "fixture-incomplete"
            for index, (
                    stage_parent_relative, source_relative, destination_relative, required,
            ) in enumerate(STAGED_OUTPUTS):
                source_root = root / source_relative
                stage_parent = root / stage_parent_relative
                stage_root = stage_parent / f".orval-stage-{stage_id}"
                staged = stage_root / "generated"
                staged.mkdir(parents=True)
                destination = root / destination_relative
                destination.mkdir(parents=True)
                (destination / "current.ts").write_text("accepted")
                (destination.parent / "index.ts").write_text("accepted barrel")
                (stage_root / "index.ts").write_text("staged barrel")
                for relative in required:
                    if index == 1 and relative == "types/index.ts":
                        continue
                    output = staged / relative
                    output.parent.mkdir(parents=True, exist_ok=True)
                    output.write_text("new")

            with self.assertRaises(Blocked):
                promote_staged_outputs(root, stage_id)
            for _, _, destination_relative, _ in STAGED_OUTPUTS:
                self.assertEqual(
                    (root / destination_relative / "current.ts").read_text(),
                    "accepted",
                )
                self.assertEqual(
                    (root / destination_relative.parent / "index.ts").read_text(),
                    "accepted barrel",
                )

    def test_failed_orval_promotion_restores_all_accepted_outputs(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            stage_id = "fixture-rollback"
            stages = []
            for stage_parent_relative, source_relative, destination_relative, required in STAGED_OUTPUTS:
                stage_root = root / stage_parent_relative / f".orval-stage-{stage_id}"
                staged = stage_root / "generated"
                destination = root / destination_relative
                staged.mkdir(parents=True)
                destination.mkdir(parents=True)
                (destination / "current.ts").write_text("accepted generated tree")
                (destination.parent / "index.ts").write_text("accepted barrel")
                (stage_root / "index.ts").write_text("staged barrel")
                for relative in required:
                    output = staged / relative
                    output.parent.mkdir(parents=True, exist_ok=True)
                    output.write_text("new generated output")
                stages.append((stage_root, staged, destination))

            stage_root, _, destination = stages[0]
            staged_index = stage_root / "index.ts"
            destination_index = destination.parent / "index.ts"
            real_replace = os.replace

            def fail_on_first_barrel_promotion(source, target):
                if Path(source) == staged_index and Path(target) == destination_index:
                    raise OSError("injected barrel promotion failure")
                return real_replace(source, target)

            with patch(
                    "run_codegen.os.replace",
                    side_effect=fail_on_first_barrel_promotion):
                with self.assertRaisesRegex(OSError, "injected barrel promotion failure"):
                    promote_staged_outputs(root, stage_id)

            for _, _, output_root in stages:
                self.assertEqual(
                    (output_root / "current.ts").read_text(),
                    "accepted generated tree",
                )
                self.assertEqual(
                    (output_root.parent / "index.ts").read_text(),
                    "accepted barrel",
                )
            cleanup_stages(root, stage_id)


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.path = Path(self.temporary.name) / "state"
        self.store = Store(self.path, True)

    def tearDown(self):
        self.store.close()
        self.temporary.cleanup()

    def test_allocator_survives_restart_terminal_records_and_concurrency(self):
        first = self.store.allocate()
        with self.store.transaction():
            self.store.db.execute("UPDATE tasks SET status='cancelled' WHERE public_id=?", (first,))
            self.store.event("fixture_cancel", first)
        allocated = []
        errors = []

        def allocate():
            store = None
            try:
                store = Store(self.path)
                allocated.append(store.allocate())
            except Exception as error:
                errors.append(str(error))
            finally:
                if store:
                    store.close()

        # Journal reconciliation is protected by the same writer lock in production.
        def coordinated():
            with writer_lock(self.path):
                allocate()

        threads = [threading.Thread(target=coordinated) for _ in range(4)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=3)
        self.assertFalse(errors)
        self.assertEqual(len(set([first, *allocated])), 5)
        self.store.check_journal()

    def test_failed_transaction_leaves_visible_projection_gap(self):
        with self.assertRaises(RuntimeError):
            with self.store.transaction():
                self.store.event("injected_commit_failure")
                raise RuntimeError("injected")
        with self.assertRaises(Blocked):
            self.store.check_journal()

    def test_missing_or_mutated_journal_cannot_be_healthy(self):
        file = next((self.path / "events").glob("*.json"))
        file.write_text("{}")
        with self.assertRaises(Blocked):
            self.store.check_journal()

    def test_real_checkpoint_and_stale_isolated_restore_remain_fenced(self):
        first = self.store.allocate()
        checkpoint = Path(self.temporary.name) / "checkpoint.sqlite3"
        report = self.store.checkpoint(checkpoint)
        second = self.store.allocate()
        restored_path = Path(self.temporary.name) / "restored"
        restored_report = Store.restore_fenced(checkpoint, restored_path)
        restored = Store(restored_path)
        try:
            self.assertEqual(restored_report["namespace"], self.store.meta("namespace"))
            self.assertEqual(report["high_water"], 1)
            self.assertEqual(restored.task(first)["status"], "draft")
            with self.assertRaises(Blocked):
                restored.allocate()
            with self.assertRaises(Blocked):
                restored.task(second)
            self.assertEqual(restored.meta("governance"), "STAGED")
        finally:
            restored.close()

    def test_single_flight_retains_uncertainty_across_restart(self):
        task = self.store.allocate()
        with self.store.transaction():
            self.store.db.execute("INSERT INTO runs VALUES('r',?,'fixture',0,'standard','running',1,'{}')", (task,))
            self.store.event("fixture_run", task, "r")
        with self.assertRaises(Exception):
            with self.store.transaction():
                self.store.db.execute("INSERT INTO runs VALUES('other',?,'fixture',0,'standard','running',1,'{}')", (task,))
        self.assertEqual(self.store.db.execute("SELECT recovery_required FROM runs").fetchone()[0], 1)


class PostMergeTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        writer_directory = self.root / "scripts/failure_gate"
        writer_directory.mkdir(parents=True)
        for name in ("run_writer.py", "common.py"):
            shutil.copyfile(ROOT / "scripts/failure_gate" / name, writer_directory / name)
        post_merge = self.root / "scripts/post-merge.sh"
        post_merge.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / "scripts/post-merge.sh", post_merge)
        self.fake_bin = self.root / "fake-bin"
        self.fake_bin.mkdir()
        self.call_log = self.root / "pnpm-calls.jsonl"
        fake_pnpm = self.fake_bin / "pnpm"
        fake_pnpm.write_text(
            "#!/usr/bin/env python3\n"
            "import fcntl, json, os, pathlib, sys\n"
            "root = pathlib.Path(os.environ['TEST_ROOT'])\n"
            "fd = os.open(root / '.failure-gate/writers.lock', os.O_RDWR)\n"
            "try:\n"
            "    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)\n"
            "except BlockingIOError:\n"
            "    locked = True\n"
            "else:\n"
            "    locked = False\n"
            "    fcntl.flock(fd, fcntl.LOCK_UN)\n"
            "finally:\n"
            "    os.close(fd)\n"
            "with open(os.environ['CALL_LOG'], 'a') as stream:\n"
            "    stream.write(json.dumps({'args': sys.argv[1:], 'locked': locked}) + chr(10))\n"
            "if os.environ.get('FAIL_INSTALL') == '1' and sys.argv[1:] == ['install', '--frozen-lockfile']:\n"
            "    raise SystemExit(17)\n"
        )
        fake_pnpm.chmod(0o700)

    def tearDown(self):
        self.temporary.cleanup()

    def invoke_hook(self, fail_install=False):
        environment = {
            "PATH": str(self.fake_bin) + os.pathsep + os.environ.get("PATH", ""),
            "TEST_ROOT": str(self.root),
            "CALL_LOG": str(self.call_log),
        }
        if fail_install:
            environment["FAIL_INSTALL"] = "1"
        return subprocess.run(
            ["bash", "scripts/post-merge.sh"],
            cwd=self.root,
            env=environment,
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )

    def recorded_calls(self):
        return [json.loads(line) for line in self.call_log.read_text().splitlines()]

    def test_post_merge_commands_share_gate_lock_and_keep_order(self):
        result = self.invoke_hook()
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.recorded_calls()
        self.assertEqual(
            [call["args"] for call in calls],
            [["install", "--frozen-lockfile"], ["--filter", "db", "push"]],
        )
        self.assertEqual([call["locked"] for call in calls], [True, True])

    def test_post_merge_install_failure_still_prevents_schema_push(self):
        result = self.invoke_hook(fail_install=True)
        self.assertEqual(result.returncode, 17, result.stderr)
        calls = self.recorded_calls()
        self.assertEqual([call["args"] for call in calls], [["install", "--frozen-lockfile"]])
        self.assertEqual([call["locked"] for call in calls], [True])


class GateTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "docs/validation").mkdir(parents=True)
        for name in ("failure-gate-policy.json", "failure-gate-installation-approval.json"):
            shutil.copyfile(ROOT / "docs/validation" / name, self.root / "docs/validation" / name)
        (self.root / "node_modules/.pnpm").mkdir(parents=True)
        (self.root / "node_modules/.pnpm/lock.yaml").write_text("fixture only\n")
        (self.root / "node_modules/.modules.yaml").write_text("fixture only\n")
        esbuild = self.root / "node_modules/.pnpm/esbuild@fixture/node_modules/esbuild"
        (esbuild / "bin").mkdir(parents=True)
        (esbuild / "lib").mkdir()
        (esbuild / "package.json").write_text(json.dumps({"name": "esbuild", "version": "fixture"}))
        self.esbuild_binary = esbuild / "bin/esbuild"
        self.esbuild_binary.write_bytes(b"fixture generated esbuild binary\n")
        (esbuild / "lib/main.js").write_text("fixture esbuild entrypoint\n")
        self.esbuild_platform_binary = (
            self.root / "node_modules/.pnpm/@esbuild+linux-x64@fixture"
            "/node_modules/@esbuild/linux-x64/bin/esbuild"
        )
        self.esbuild_platform_binary.parent.mkdir(parents=True)
        self.esbuild_platform_binary.write_bytes(b"fixture platform esbuild binary\n")
        (self.root / "a.md").write_text("initial")
        self.gate = Gate(self.root, True)
        self.task = self.gate.store.allocate()
        self.plan = {"schema": 1, "task_id": self.task, "namespace": self.gate.store.meta("namespace"),
                     "version": 1, "tier": "static", "changes": ["a.md"],
                     "requirements": ["fixture coverage"], "regression_guard": "fixture guards prevent stale evidence",
                     "pre_existing_failures": [], "parameters": {}}
        atomic_json(self.root / "plan.json", self.plan)
        # Explicit isolated policy simulation: not actual owner/platform approval.
        with self.gate.store.transaction():
            self.gate.store.set_meta("installation", encoded({
                "policy_digest": digest(self.gate.policy), "tooling_digest": tooling(self.root)}))
            self.gate.store.event("fixture_binding")

    def tearDown(self):
        self.gate.close()
        self.temporary.cleanup()

    def test_snapshot_tracks_presence_and_removal_of_alternate_lockfiles(self):
        initial = snapshot(self.root)
        lockfile = self.root / "package-lock.json"
        lockfile.write_text("{}\n")
        present = snapshot(self.root)
        lockfile.unlink()
        removed = snapshot(self.root)

        self.assertNotEqual(initial["digest"], present["digest"])
        self.assertNotEqual(initial["digest"], removed["digest"])
        self.assertIn("package-lock.json", initial["files"])
        self.assertIn("yarn.lock", initial["files"])

    def fixture_activate(self):
        with self.gate.store.transaction():
            self.gate.store.set_meta("governance", "ACTIVE")
            self.gate.store.decision("plan_review", self.task, {
                "plan": self.plan, "plan_digest": digest(self.plan), "policy_digest": digest(self.gate.policy),
                "tier_digest": digest(self.gate.policy["tiers"]["static"]),
                "source": "actual interactive local review; identity not authenticated",
                "parameters": {}, "relative": "plan.json"})
            self.gate.store.event("fixture_review", self.task, payload={"simulation_only": True})
        return self.gate.activate(self.task, "plan.json")

    def fixture_review_payload(self, plan=None, relative="plan.json", **overrides):
        plan = self.plan if plan is None else plan
        payload = {
            "plan": plan,
            "plan_digest": digest(plan),
            "policy_digest": digest(self.gate.policy),
            "tier_digest": digest(self.gate.policy["tiers"][plan["tier"]]),
            "source": "actual interactive local review; identity not authenticated",
            "parameters": {},
            "relative": relative,
        }
        payload.update(overrides)
        return payload

    def fixture_record_review(self, task_id, plan=None, relative="plan.json",
                              kind="plan_review", **overrides):
        """Synthetic coordinator rows only; never evidence of a host approval event."""
        payload = self.fixture_review_payload(plan, relative, **overrides)
        with self.gate.store.transaction():
            return self.gate.store.decision(kind, task_id, payload)

    def test_stale_review_and_another_tasks_decision_cannot_authorize_activation(self):
        with self.gate.store.transaction():
            self.gate.store.set_meta("governance", "ACTIVE")
        self.fixture_record_review(self.task)

        self.plan["version"] = 2
        atomic_json(self.root / "plan.json", self.plan)
        with self.assertRaises(Blocked):
            self.gate.activate(self.task, "plan.json")

        other_task = self.gate.store.allocate()
        other_plan = dict(self.plan, task_id=other_task)
        atomic_json(self.root / "other-plan.json", other_plan)
        # The row is deliberately attached to the first task to simulate a replay.
        self.fixture_record_review(self.task, other_plan, "other-plan.json")
        with self.assertRaises(Blocked):
            self.gate.activate(other_task, "other-plan.json")

    def test_mismatched_tier_policy_or_unregistered_decision_kind_cannot_authorize(self):
        with self.gate.store.transaction():
            self.gate.store.set_meta("governance", "ACTIVE")

        # No review decision or approval contents is not an authorization.
        with self.assertRaises(Blocked):
            self.gate.activate(self.task, "plan.json")

        self.fixture_record_review(self.task, kind="unregistered_approval_event")
        with self.assertRaises(Blocked):
            self.gate.activate(self.task, "plan.json")

        self.fixture_record_review(self.task, tier_digest="not-the-registered-tier-digest")
        with self.assertRaises(Blocked):
            self.gate.activate(self.task, "plan.json")

        self.fixture_record_review(self.task, policy_digest="stale-policy-digest")
        with self.assertRaises(Blocked):
            self.gate.activate(self.task, "plan.json")

        self.plan["tier"] = "standard"
        atomic_json(self.root / "plan.json", self.plan)
        with self.assertRaises(Blocked):
            self.gate.activate(self.task, "plan.json")

    def test_task_status_and_lifecycle_events_alone_cannot_authorize_activation(self):
        with self.gate.store.transaction():
            self.gate.store.set_meta("governance", "ACTIVE")

        for status, event_kind in (("draft", "plan_drafted"), ("active", "task_activated")):
            with self.subTest(status=status, event_kind=event_kind):
                with self.gate.store.transaction():
                    self.gate.store.db.execute(
                        "UPDATE tasks SET status=? WHERE public_id=?", (status, self.task))
                    self.gate.store.event(event_kind, self.task, payload={"simulation_only": True})
                    self.gate.store.event("command_approved", self.task,
                                          payload={"simulation_only": True})
                    self.gate.store.event("merge_applied", self.task,
                                          payload={"simulation_only": True})
                with self.assertRaises(Blocked):
                    self.gate.activate(self.task, "plan.json")

    def test_no_cutover_no_self_review_no_tier_fallback(self):
        with self.assertRaises(Blocked):
            self.gate.activate(self.task, "plan.json")
        with self.assertRaises(Blocked):
            self.gate.approve_plan(self.task, "plan.json")
        self.fixture_activate()
        with self.assertRaises(Blocked):
            self.gate.check_authorization(self.task, "plan.json", "standard")
        self.assertEqual(self.gate.check_authorization(self.task, "plan.json")["tier"], "static")

    def test_activation_exact_bindings_idempotency_and_derived_tiers(self):
        result = self.fixture_activate()
        self.assertEqual(result["authorization"], 1)
        self.assertTrue(self.gate.activate(self.task, "plan.json")["already_active"])
        event = self.gate.store.db.execute("SELECT payload FROM events WHERE kind='activated'").fetchone()[0]
        self.assertEqual(json.loads(event)["payload"]["tiers"], {"static": "ALLOWED", "standard": "NOT ALLOWED"})
        second = self.gate.store.allocate()
        with self.assertRaises(Blocked):
            self.gate.check_authorization(second, "plan.json")
        self.plan["version"] = 2
        atomic_json(self.root / "plan.json", self.plan)
        with self.assertRaises(Blocked):
            self.gate.check_authorization(self.task, "plan.json")

    def test_policy_tooling_drift_and_static_coverage_fail_closed(self):
        self.plan["changes"] = ["app.ts"]
        atomic_json(self.root / "plan.json", self.plan)
        with self.assertRaises(Blocked):
            guard_plan(self.root, self.gate.store, self.task, "plan.json", self.gate.policy)
        self.gate.policy["limits"]["step_seconds"] = 100
        with self.assertRaises(Blocked):
            self.gate.bindings()

    def test_compiler_caches_never_change_execution_authority_but_real_configs_do(self):
        directory = self.root / "artifacts" / "fixture"
        directory.mkdir(parents=True)
        cache = directory / "tsconfig.tsbuildinfo"
        config = directory / "tsconfig.json"
        config.write_text('{"compilerOptions":{}}')
        cache.write_text("old compiler cache")
        before = execution_definition(self.root)
        cache.write_text("new compiler cache")
        self.assertEqual(execution_definition(self.root), before)
        config.write_text('{"compilerOptions":{"strict":true}}')
        self.assertNotEqual(execution_definition(self.root), before)

    def test_completed_step_persists_when_next_dispatch_is_blocked(self):
        from unittest.mock import patch
        count = 0

        def bindings():
            nonlocal count
            count += 1
            if count == 2:
                raise Blocked("injected next-step definition drift")

        def fake_supervision(argv, cwd, directory, record, effective, lock):
            directory.mkdir(parents=True)
            (directory / "raw.log").write_text("isolated simulated compile result")
            return {"pass": True, "registered": True, "healthy_release": True,
                    "raw_exit": 0, "reason": "finished", "bytes": 0}

        with patch.object(self.gate, "bindings", bindings), patch("gate.supervised_run", fake_supervision):
            with self.assertRaises(Blocked):
                self.gate.execute(self.task, "standard", "bootstrap", 0, 90)
        payload = json.loads(self.gate.store.db.execute("SELECT payload FROM runs").fetchone()[0])
        self.assertEqual(payload["steps"][0]["status"], "PASSED")
        self.assertEqual(payload["steps"][1]["status"], "NOT_REACHED")
        self.assertEqual(self.gate.store.db.execute("SELECT recovery_required FROM runs").fetchone()[0], 1)

    def test_unknown_shapes_and_baseline_labels_are_not_authority(self):
        for value in (None, [], 1, "plan", {"schema": 1}):
            atomic_json(self.root / "plan.json", value)
            with self.assertRaises(Blocked):
                guard_plan(self.root, self.gate.store, self.task, "plan.json", self.gate.policy)
        self.plan["pre_existing_failures"] = ["caller says pre-existing"]
        atomic_json(self.root / "plan.json", self.plan)
        with self.assertRaises(Blocked):
            guard_plan(self.root, self.gate.store, self.task, "plan.json", self.gate.policy)

    def test_completion_denies_bootstrap_stale_and_missing_writer_proof(self):
        self.fixture_activate()
        before = snapshot(self.root)
        payload = {"assessment": "PASSED", "snapshot": before}
        with self.gate.store.transaction():
            self.gate.store.db.execute("INSERT INTO runs VALUES('fixture',?,'bootstrap',1,'static','finished',0,?)",
                                      (self.task, encoded(payload)))
            self.gate.store.event("fixture_result", self.task)
        with self.assertRaises(Blocked):
            self.gate.complete(self.task, "plan.json", "fixture")
        with self.gate.store.transaction():
            self.gate.store.db.execute("UPDATE runs SET purpose='required_tier_validation' WHERE id='fixture'")
        with self.assertRaises(Blocked):
            self.gate.complete(self.task, "plan.json", "fixture")
        with self.gate.store.transaction():
            self.gate.store.set_meta("writer_coverage", "verified")
        (self.root / "a.md").write_text("changed after validation")
        with self.assertRaises(Blocked):
            self.gate.complete(self.task, "plan.json", "fixture")
        self.assertEqual(self.gate.store.task(self.task)["status"], "active")

    def test_completion_rejects_esbuild_artifact_mutated_after_validation(self):
        self.fixture_activate()
        validation_snapshot = snapshot(self.root)
        self.assertIn(str(self.esbuild_binary.relative_to(self.root)), validation_snapshot["files"])
        self.assertIn(
            str(self.esbuild_platform_binary.relative_to(self.root)), validation_snapshot["files"])
        log = self.gate.state / "runs" / "fixture" / "typecheck" / "raw.log"
        log.parent.mkdir(parents=True)
        log.write_text("isolated fixture compiler result\n")
        outcome = {"pass": True, "registered": True, "healthy_release": True,
                   "raw_exit": 0, "reason": "finished"}
        payload = {"assessment": "PASSED", "snapshot": validation_snapshot,
                   "tier_digest": digest(self.gate.policy["tiers"]["static"]),
                   "policy_digest": digest(self.gate.policy), "tooling_digest": tooling(self.root),
                   "steps": [{"name": "typecheck", "status": "PASSED", "outcome": outcome,
                              "report": parsed_result("exit", outcome, log),
                              "raw_log": "runs/fixture/typecheck/raw.log",
                              "log_digest": hashlib.sha256(read_bytes(log)).hexdigest()}]}
        with self.gate.store.transaction():
            self.gate.store.db.execute(
                "INSERT INTO runs VALUES('fixture',?,'required_tier_validation',1,'static','finished',0,?)",
                (self.task, encoded(payload)))
            for name in ("run_reserved", "launch_intent", "watchdog_registered", "confirmed_start",
                         "step_outcome", "run_finished"):
                self.gate.store.event(name, self.task, "fixture", {"simulation_only": True})

        self.esbuild_binary.write_bytes(b"mutated after validation\n")
        with self.assertRaisesRegex(Blocked, "stale"):
            self.gate.complete(self.task, "plan.json", "fixture")
        self.assertEqual(self.gate.store.task(self.task)["status"], "active")
        self.assertIsNone(self.gate.store.meta("writer_coverage"))

    def test_coordinated_terminal_commit_and_repairs_preserved(self):
        self.fixture_activate()
        payload = {"assessment": "PASSED", "snapshot": snapshot(self.root)}
        with self.gate.store.transaction():
            self.gate.store.db.execute("INSERT INTO runs VALUES('fixture',?,'required_tier_validation',1,'static','finished',0,?)",
                                      (self.task, encoded(payload)))
            self.gate.store.set_meta("writer_coverage", "verified")
            self.gate.store.db.execute("INSERT INTO repairs VALUES(?,'signature','{}')", (self.task,))
        with self.assertRaises(Blocked):
            self.gate.complete(self.task, "plan.json", "fixture")
        self.assertEqual(self.gate.store.db.execute("SELECT count(*) FROM repairs").fetchone()[0], 1)

    def test_atomic_validated_completion_with_complete_fixture_evidence(self):
        self.fixture_activate()
        log = self.gate.state / "runs" / "fixture" / "typecheck" / "raw.log"
        log.parent.mkdir(parents=True)
        log.write_text("isolated fixture compiler result\n")
        outcome = {"pass": True, "registered": True, "healthy_release": True,
                   "raw_exit": 0, "reason": "finished"}
        payload = {"assessment": "PASSED", "snapshot": snapshot(self.root),
                   "tier_digest": digest(self.gate.policy["tiers"]["static"]),
                   "policy_digest": digest(self.gate.policy), "tooling_digest": tooling(self.root),
                   "steps": [{"name": "typecheck", "status": "PASSED", "outcome": outcome,
                              "report": parsed_result("exit", outcome, log),
                              "raw_log": "runs/fixture/typecheck/raw.log",
                              "log_digest": hashlib.sha256(read_bytes(log)).hexdigest()}]}
        with self.gate.store.transaction():
            self.gate.store.db.execute("INSERT INTO runs VALUES('fixture',?,'required_tier_validation',1,'static','finished',0,?)",
                                      (self.task, encoded(payload)))
            self.gate.store.set_meta("writer_coverage", "verified")
            for name in ("run_reserved", "launch_intent", "watchdog_registered", "confirmed_start",
                         "step_outcome", "run_finished"):
                self.gate.store.event(name, self.task, "fixture", {"simulation_only": True})
        result = self.gate.complete(self.task, "plan.json", "fixture")
        self.assertEqual(result["mode"], "validated")
        self.assertIsNone(self.gate.store.task(self.task)["tier"])
        with self.assertRaises(Blocked):
            self.gate.check_authorization(self.task, "plan.json")

    def test_health_and_export_are_readonly_non_authorizing(self):
        before = self.gate.store.task(self.task)
        health = self.gate.health()
        result = self.gate.export(self.task, "docs/validation/fixture-export.json")
        self.assertEqual(health["catalog"]["availability"], "never_collected")
        self.assertTrue(result["non_authorizing"])
        self.assertEqual(self.gate.store.task(self.task), before)

    def test_parser_rejects_zero_tests_cancellation_swallowed_failure_and_missing_reports(self):
        log = self.root / "raw.log"
        outcome = {"pass": True}
        for data in ("", "# tests 0\n", "# tests 1\n# tests 2\n# tests 3\n# cancelled 1\n",
                     "# tests 1\n# tests 2\n# tests 3\n# fail 1\n"):
            log.write_text(data)
            self.assertFalse(parsed_result("tap", outcome, log)["complete"])
        log.write_text("# tests 1\n# tests 2\n# tests 3\n")
        self.assertTrue(parsed_result("tap", outcome, log)["complete"])

    def test_native_report_adapter_accepts_complete_known_package_formats(self):
        log = self.root / "native.log"
        for marker in ("#", "ℹ"):
            lines = []
            for prefix in ("", "artifacts/api-server test: ", "artifacts/skills-workbench test: "):
                for key, value in (("tests", 3), ("suites", 0), ("pass", 3), ("fail", 0),
                                   ("cancelled", 0), ("skipped", 0), ("todo", 0)):
                    lines.append(f"{prefix}{marker} {key} {value}")
                lines.append(f"{prefix}{marker} duration_ms 1.5")
            log.write_text("\n".join(lines))
            self.assertTrue(parsed_result("node-native", {"pass": True}, log)["complete"])
            self.assertFalse(parsed_result("node-native", {"pass": False}, log)["complete"])

    def test_native_report_adapter_rejects_partial_unsafe_and_unrecognized_summaries(self):
        log = self.root / "native.log"
        valid = "\n".join(
            f"{prefix}ℹ {key} {value}"
            for prefix in ("", "artifacts/api-server test: ", "artifacts/skills-workbench test: ")
            for key, value in (("tests", 3), ("suites", 0), ("pass", 3), ("fail", 0),
                               ("cancelled", 0), ("skipped", 0), ("todo", 0), ("duration_ms", 1)))
        invalid = ["", valid.replace("ℹ tests 3", "ℹ tests 0"),
                   valid.replace("ℹ pass 3", "ℹ pass 2"),
                   valid.replace("artifacts/api-server", "artifacts/unknown"),
                   valid.replace("ℹ duration_ms 1", ""), valid.replace("ℹ todo 0", ""),
                   valid.replace("ℹ suites 0", "ℹ tests 3"),
                   valid.replace("ℹ pass 3", "# pass 3")]
        invalid += [valid.replace(f"ℹ {key} 0", f"ℹ {key} 1")
                    for key in ("fail", "cancelled", "skipped", "todo")]
        for text in invalid:
            log.write_text(text)
            self.assertFalse(parsed_result("node-native", {"pass": True}, log)["complete"])
        log.write_text(valid)
        for malformed in ("true", 1, {}, None):
            self.assertFalse(parsed_result("node-native", {"pass": malformed}, log)["complete"])


class SupervisorTests(unittest.TestCase):
    def control_pipe_fixture(self, complete):
        from unittest.mock import patch
        import supervisor
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            helper = directory / "watchdog.py"
            helper.write_text(
                "import os,sys,json,time\n"
                "config=json.load(open(sys.argv[1]))\n"
                "os.close(0)\n"
                "time.sleep(0.1)\n" +
                ("print(json.dumps({'event':'result','raw_exit':7,'pass':False,"
                 "'healthy_release':True,'stopped':True,'capture_complete':True}),flush=True)\n"
                 if complete else "print('{\"event\":',end='',flush=True)\n") +
                "time.sleep(0.15)\n")
            events = []
            with patch.object(supervisor, "__file__", str(directory / "supervisor.py")):
                return run([sys.executable, "-c", "pass"], ROOT, directory / "output",
                           lambda *args: events.append(args),
                           dict(LIMITS, step_seconds=2, cleanup_seconds=1, capture_seconds=1))

    def test_closed_control_complete_result_preserves_raw_failure(self):
        result = self.control_pipe_fixture(True)
        self.assertEqual(result["raw_exit"], 7)
        self.assertFalse(result["pass"])
        self.assertTrue(result["healthy_release"])

    def test_closed_control_partial_result_never_passes(self):
        with self.assertRaisesRegex(Blocked, "watchdog lost"):
            self.control_pipe_fixture(False)

    def test_error_evidence_bounded_typed_and_without_messages_or_environment(self):
        from watchdog import error_evidence
        from supervisor import preserve_error
        try:
            raise OSError(3, "DO_NOT_PERSIST_SECRET")
        except OSError as error:
            value = error_evidence(error)
        self.assertEqual(value["errno"], 3)
        self.assertEqual(value["error_type"], "ProcessLookupError")
        self.assertTrue(value["frames"])
        self.assertNotIn("DO_NOT_PERSIST_SECRET", encoded(value))
        with tempfile.TemporaryDirectory() as directory:
            events = []
            preserve_error(directory, lambda *args: events.append(args),
                           {**value, "environment": "DO_NOT_PERSIST_SECRET", "pass": True}, "fixture")
            evidence = read_json(Path(directory) / "watchdog-error.json")
            self.assertFalse(evidence["accepted_for_success"])
            self.assertNotIn("DO_NOT_PERSIST_SECRET", encoded(evidence))
            preserve_error(directory, lambda *_: None,
                           {"event": "error", "reason": "x" * 100000}, "fixture")
            self.assertLessEqual(len(read_bytes(Path(directory) / "watchdog-error.json")), 8192)

    def test_typed_watchdog_error_and_journal_failure_preserve_owned_cleanup(self):
        from unittest.mock import patch
        import supervisor
        for failed_journal in (False, True):
            with self.subTest(failed_journal=failed_journal), tempfile.TemporaryDirectory() as temporary:
                directory = Path(temporary)
                marker = directory / "started"
                helper = directory / "watchdog.py"
                helper.write_text(
                    "import sys,time;from pathlib import Path\n"
                    f"sys.path.insert(0,{str(ROOT / 'scripts/failure_gate')!r})\n"
                    "import watchdog\n"
                    "def fail_owned(known,root_pid=None):\n"
                    f" if Path({str(marker)!r}).exists(): raise OSError(3,'DO_NOT_PERSIST_SECRET')\n"
                    " return [watchdog.incarnation(root_pid)]\n"
                    "watchdog.observe=fail_owned\n"
                    "try: watchdog.main()\n"
                    "except Exception as error:\n"
                    " print(watchdog.encoded(watchdog.error_evidence(error)),flush=True)\n"
                    " sys.exit(4)\n")
                owned, observations = [], []

                def record(kind, value):
                    observations.append((kind, value))
                    if kind == "watchdog_registered":
                        owned.append(value["worker"])
                    if failed_journal and kind == "watchdog_error":
                        raise RuntimeError("fixture journal failed")

                with patch.object(supervisor, "__file__", str(directory / "supervisor.py")):
                    with self.assertRaises((Blocked, RuntimeError)):
                        run([sys.executable, "-c",
                             f"from pathlib import Path;import time;Path({str(marker)!r}).touch();time.sleep(60)"],
                            ROOT, directory / "output", record,
                            dict(LIMITS, step_seconds=3, cleanup_seconds=2, capture_seconds=1,
                                 owner_stall_seconds=2))
                self.assertTrue(marker.exists())
                self.assertTrue(owned)
                self.assertTrue(any(kind == "watchdog_error" for kind, _ in observations))
                evidence = read_json(directory / "output/watchdog-error.json")
                self.assertEqual(evidence["observation"]["error_type"], "ProcessLookupError")
                self.assertFalse(evidence["accepted_for_success"])
                current = incarnation(owned[0]["pid"])
                self.assertTrue(current is None or current["state"] == "Z")

    def test_completion_refresh_keeps_survivor_and_deadline_denial(self):
        from unittest.mock import patch
        import watchdog
        known = {123: {"pid": 123, "start": "fixture"}}
        with patch("watchdog.observe", return_value=[]) as refresh, \
                patch("watchdog.time.monotonic", return_value=1):
            self.assertEqual(watchdog.completion_reason(known, 123, 2), "finished")
            refresh.assert_called_once_with(known, 123)
        with patch("watchdog.observe", return_value=[known[123]]), \
                patch("watchdog.time.monotonic", return_value=1):
            self.assertEqual(watchdog.completion_reason(known, 123, 2), "owned_survivors")
        with patch("watchdog.observe", return_value=[]), \
                patch("watchdog.time.monotonic", return_value=2):
            self.assertEqual(watchdog.completion_reason(known, 123, 2), "execution_deadline")

    def run_fixture(self, code, seconds=2):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        limits = dict(LIMITS, step_seconds=seconds, cleanup_seconds=2,
                      capture_seconds=1, owner_stall_seconds=2, run_seconds=10,
                      max_bytes=65536)
        events = []
        outcome = run([sys.executable, "-B", "-c", code], ROOT, temporary.name,
                      lambda kind, value: events.append((kind, value)), limits)
        return outcome, events, Path(temporary.name)

    def test_real_exit_nonzero_and_registration_before_dispatch(self):
        result, events, path = self.run_fixture("print('registered workload')")
        self.assertTrue(result["pass"], result)
        names = [kind for kind, _ in events]
        self.assertLess(names.index("watchdog_registered"), names.index("confirmed_start"))
        self.assertIn(b"registered workload", read_bytes(path / "raw.log"))
        failed, _, _ = self.run_fixture("import sys;sys.exit(7)")
        self.assertEqual(failed["raw_exit"], 7)
        self.assertFalse(failed["pass"])
        self.assertTrue(failed["healthy_release"])

    def test_timeout_sync_block_and_owned_new_session_descendant(self):
        result, _, _ = self.run_fixture(
            "import subprocess,sys,time;"
            "subprocess.Popen([sys.executable,'-c','import time;time.sleep(60)'],start_new_session=True);"
            "time.sleep(60)", 1)
        self.assertEqual(result["reason"], "execution_deadline")
        self.assertFalse(result["pass"])
        self.assertTrue(result["stopped"])
        self.assertGreaterEqual(len(result["signals"]), 2)

    def test_output_bound_and_no_capture_success_on_overflow(self):
        result, _, path = self.run_fixture("print('x'*100000)")
        self.assertFalse(result["pass"])
        self.assertFalse(result["capture_complete"])
        self.assertLessEqual((path / "raw.log").stat().st_size, 65536)

    def test_failed_registration_journal_never_dispatches_user_work(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = Path(directory) / "dispatched"

            def event(kind, value):
                if kind == "watchdog_registered":
                    raise Blocked("injected journal failure")

            with self.assertRaises(Blocked):
                run([sys.executable, "-c", f"open({str(marker)!r},'w').write('bad')"],
                    ROOT, directory, event, dict(LIMITS, step_seconds=2, cleanup_seconds=2,
                                                capture_seconds=1, owner_stall_seconds=2))
            self.assertFalse(marker.exists())

    def test_owner_stall_and_owner_death_supervised_independently(self):
        for death in (False, True):
            with self.subTest(death=death), tempfile.TemporaryDirectory() as directory:
                # Only this deliberately owned fixture coordinator is stopped/killed.
                code = (
                    "import os,signal,sys,time;from pathlib import Path;"
                    f"sys.path.insert(0,{str(ROOT / 'scripts/failure_gate')!r});"
                    "from supervisor import run,LIMITS;"
                    "def callback(kind,value):\n"
                    " if kind=='confirmed_start':\n"
                    "  time.sleep(0.2)\n"
                    f"  os.kill(os.getpid(),signal.{'SIGKILL' if death else 'SIGSTOP'})\n"
                    "result=run([sys.executable,'-c','import os,time;"
                    "print(os.getpid(),flush=True);time.sleep(60)'],"
                    f"{str(ROOT)!r},{directory!r},callback,"
                    "dict(LIMITS,step_seconds=5,cleanup_seconds=2,capture_seconds=1,owner_stall_seconds=1))\n"
                    "print(result)"
                )
                # Compile this fixture by constructing normal newline-separated source.
                code = code.replace(";def callback", "\ndef callback").replace(
                    "\nrun(", "\nrun(")
                owner = subprocess.Popen([sys.executable, "-B", "-c", code],
                                         stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                         start_new_session=True)
                try:
                    began = time.monotonic()
                    config = Path(directory) / "supervision.json"
                    while not config.exists() and time.monotonic() - began < 2:
                        time.sleep(0.02)
                    self.assertTrue(config.exists())
                    # Wait for the independent watchdog to finish its owned work.
                    time.sleep(2.5)
                    if not death:
                        os.kill(owner.pid, __import__("signal").SIGCONT)
                    stdout, stderr = owner.communicate(timeout=3)
                    observations = stdout.decode() + stderr.decode()
                    self.assertNotIn("time.sleep(60)", observations)
                    # Its durable raw capture exists; stalled owner's final outcome is rejected.
                    self.assertTrue((Path(directory) / "raw.log").exists())
                    worker_pid = int((Path(directory) / "raw.log").read_text().strip())
                    current = incarnation(worker_pid)
                    self.assertTrue(current is None or current["state"] == "Z")
                    if not death:
                        self.assertEqual(owner.returncode, 0, observations)
                        self.assertIn("'reason': 'owner_stall'", observations)
                        self.assertIn("'healthy_release': False", observations)
                finally:
                    if owner.poll() is None:
                        os.kill(owner.pid, __import__("signal").SIGCONT)
                        owner.kill()
                        owner.wait(timeout=2)

    def test_watchdog_loss_stops_known_worker_and_never_releases_healthy(self):
        with tempfile.TemporaryDirectory() as directory:
            watchdog = None
            worker = None

            def event(kind, value):
                nonlocal watchdog, worker
                if kind == "watchdog_registered":
                    watchdog, worker = value["watchdog"], value["worker"]
                if kind == "confirmed_start":
                    os.kill(watchdog["pid"], __import__("signal").SIGKILL)

            with self.assertRaises(Blocked):
                run([sys.executable, "-c", "import time;time.sleep(60)"], ROOT, directory,
                    event, dict(LIMITS, step_seconds=3, cleanup_seconds=2, capture_seconds=1,
                                owner_stall_seconds=2))
            current = incarnation(worker["pid"])
            self.assertTrue(current is None or current["state"] == "Z")

    def test_node_supported_preload_default_named_nested_and_hook_limits(self):
        code = (
            "import test,{before,describe,it} from 'node:test';"
            "import assert from 'node:assert/strict';"
            "before(()=>{}, {timeout:100});"
            "test('named',async t=>{await t.test('nested',()=>{});t.after(()=>{});});"
            "test(()=>{});describe('suite',()=>{it('case',()=>{});});"
            "assert.throws(()=>before(()=>{}, {timeout:0}),/timeout/);"
            "assert.throws(()=>test('bad',{timeout:Infinity},()=>{}),/timeout/);"
        )
        with tempfile.TemporaryDirectory() as directory:
            script = Path(directory) / "node-fixture.mjs"
            script.write_text(code)
            limits = dict(LIMITS, step_seconds=3, cleanup_seconds=2, capture_seconds=1,
                          owner_stall_seconds=2, run_seconds=10)
            result = run(["node", "--test", str(script)], ROOT, Path(directory) / "output",
                         lambda *_: None, limits)
            self.assertTrue(result["pass"], read_bytes(Path(directory) / "output/raw.log").decode())


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    print(json.dumps({"failure_gate_suite": "PASSED" if result.wasSuccessful() else "FAILED",
                      "tests": result.testsRun, "isolated_fixtures": True}))
    raise SystemExit(0 if result.wasSuccessful() else 1)
