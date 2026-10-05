"""Single local SQLite authority, permanent IDs and transactional file journal."""
import json
import os
from pathlib import Path
import sqlite3
import time
import uuid
from contextlib import contextmanager

from common import Blocked, atomic_json, digest, encoded, read_bytes, writer_lock


SCHEMA = """
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks(
 id INTEGER PRIMARY KEY AUTOINCREMENT, public_id TEXT UNIQUE,
 status TEXT NOT NULL DEFAULT 'draft', plan TEXT, plan_digest TEXT,
 tier TEXT, tier_digest TEXT, policy_digest TEXT,
 auth INTEGER NOT NULL DEFAULT 0, suspended INTEGER NOT NULL DEFAULT 0,
 mode TEXT, assessment TEXT, decision TEXT);
CREATE TABLE IF NOT EXISTS decisions(
 id TEXT PRIMARY KEY, kind TEXT NOT NULL, task_id TEXT,
 payload TEXT NOT NULL, digest TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS runs(
 id TEXT PRIMARY KEY, task_id TEXT NOT NULL, purpose TEXT NOT NULL,
 auth INTEGER NOT NULL, tier TEXT NOT NULL, status TEXT NOT NULL,
 recovery_required INTEGER NOT NULL DEFAULT 1, payload TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS single_flight ON runs(task_id)
 WHERE recovery_required=1;
CREATE TABLE IF NOT EXISTS events(
 seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL,
 timestamp REAL NOT NULL, kind TEXT NOT NULL, task_id TEXT, run_id TEXT,
 payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS repairs(
 task_id TEXT NOT NULL, signature TEXT NOT NULL, payload TEXT NOT NULL,
 PRIMARY KEY(task_id, signature));
"""


class Store:
    def __init__(self, directory, initialize=False, read_only=False):
        self.directory = Path(directory)
        self.file = self.directory / "coordinator.sqlite3"
        if not initialize and not self.file.is_file():
            raise Blocked("coordinator never initialized")
        if self.directory.is_symlink() or self.file.is_symlink():
            raise Blocked("unsafe coordinator path")
        self.read_only = read_only
        if not read_only:
            self.directory.mkdir(parents=True, exist_ok=True, mode=0o700)
            os.chmod(self.directory, 0o700)
        connection = f"file:{self.file.resolve()}?mode=ro" if read_only else str(self.file)
        self.db = sqlite3.connect(connection, timeout=5, isolation_level=None, uri=read_only)
        if not read_only:
            os.chmod(self.file, 0o600)
        self.db.row_factory = sqlite3.Row
        if not read_only:
            self.db.execute("PRAGMA journal_mode=DELETE")
            self.db.execute("PRAGMA synchronous=FULL")
        self.db.execute("PRAGMA foreign_keys=ON")
        if initialize:
            self.db.executescript(SCHEMA)
            with self.transaction():
                if not self.meta("namespace"):
                    self.set_meta("namespace", str(uuid.uuid4()))
                    self.set_meta("schema", "1")
                    self.set_meta("governance", "STAGED")
                    self.set_meta("allocation", "live")
                    self.event("initialized", payload={"schema": 1})
        if self.meta("schema") != "1":
            raise Blocked("incompatible coordinator schema")
        self.check_journal()

    def close(self):
        self.db.close()

    @contextmanager
    def transaction(self):
        if self.read_only:
            raise Blocked("read-only evidence view cannot mutate authority")
        with writer_lock(self.directory):
            self.db.execute("BEGIN IMMEDIATE")
            try:
                yield
                self.db.execute("COMMIT")
            except BaseException:
                self.db.execute("ROLLBACK")
                raise

    def meta(self, key):
        row = self.db.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
        return row[0] if row else None

    def set_meta(self, key, value):
        self.db.execute("INSERT OR REPLACE INTO meta VALUES(?,?)", (key, value))

    def event(self, kind, task=None, run=None, payload=None):
        """File first, transaction second: crash gaps block rather than disappear."""
        event = {"schema": 1, "id": str(uuid.uuid4()), "timestamp": time.time(),
                 "namespace": self.meta("namespace"), "kind": kind,
                 "task_id": task, "run_id": run, "payload": payload or {}}
        trail = self.directory / "events"
        trail.mkdir(mode=0o700, exist_ok=True)
        atomic_json(trail / (event["id"] + ".json"), event)
        self.db.execute("INSERT INTO events(id,timestamp,kind,task_id,run_id,payload)"
                        " VALUES(?,?,?,?,?,?)",
                        (event["id"], event["timestamp"], kind, task, run, encoded(event)))
        return event["id"]

    def check_journal(self):
        if self.read_only:
            self._check_journal_locked()
            return
        with writer_lock(self.directory):
            self._check_journal_locked()

    def _check_journal_locked(self):
        trail = self.directory / "events"
        files = list(trail.glob("*.json")) if trail.exists() else []
        if len(files) > 10000:
            raise Blocked("journal segment limit: explicit retention review required")
        rows = self.db.execute("SELECT id,payload FROM events ORDER BY seq").fetchall()
        expected = {row["id"]: row["payload"] for row in rows}
        if {p.stem for p in files} != set(expected):
            raise Blocked("journal/coordinator gap retains exclusion; recovery required")
        for file in files:
            if read_bytes(file, 1048576).decode().strip() != expected[file.stem]:
                raise Blocked("journal integrity gap")

    def allocate(self):
        if self.meta("allocation") != "live":
            raise Blocked("restored allocation is fenced")
        with self.transaction():
            result = self.db.execute("INSERT INTO tasks DEFAULT VALUES")
            task = f"FG-{result.lastrowid:08d}"
            self.db.execute("UPDATE tasks SET public_id=? WHERE id=?", (task, result.lastrowid))
            self.event("allocated", task)
        return task

    def task(self, task):
        row = self.db.execute("SELECT * FROM tasks WHERE public_id=?", (task,)).fetchone()
        if not row:
            raise Blocked("unknown local ID; platform task numbers are not local IDs")
        return dict(row)

    def decision(self, kind, task, payload):
        decision = str(uuid.uuid4())
        self.db.execute("INSERT INTO decisions VALUES(?,?,?,?,?)",
                        (decision, kind, task, encoded(payload), digest(payload)))
        return decision

    def checkpoint(self, destination):
        destination = Path(destination)
        if destination.exists() or destination.is_symlink():
            raise Blocked("checkpoint destination must be new")
        copy = sqlite3.connect(destination)
        try:
            self.db.backup(copy)
            if copy.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise Blocked("checkpoint failed integrity check")
        finally:
            copy.close()
        os.chmod(destination, 0o600)
        with destination.open("rb") as stream:
            os.fsync(stream.fileno())
        return {"schema": 1, "namespace": self.meta("namespace"),
                "high_water": self.db.execute("SELECT coalesce(max(id),0) FROM tasks").fetchone()[0]}

    @staticmethod
    def restore_fenced(checkpoint, destination):
        """Isolated restore only. Never makes a second allocator/grants live."""
        destination = Path(destination)
        if destination.exists():
            raise Blocked("restore destination must be absent")
        destination.mkdir(mode=0o700, parents=True)
        source = sqlite3.connect(f"file:{Path(checkpoint).resolve()}?mode=ro", uri=True)
        target = sqlite3.connect(destination / "coordinator.sqlite3")
        try:
            source.backup(target)
            target.execute("UPDATE meta SET value='fenced' WHERE key='allocation'")
            target.execute("UPDATE meta SET value='STAGED' WHERE key='governance'")
            target.execute("UPDATE tasks SET suspended=1 WHERE status='active'")
            target.commit()
            if target.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise Blocked("restored checkpoint corrupt")
            for row in target.execute("SELECT id,payload FROM events"):
                atomic_json(destination / "events" / (row[0] + ".json"), json.loads(row[1]))
            os.chmod(destination / "coordinator.sqlite3", 0o600)
            return {"allocation": "fenced", "governance": "STAGED",
                    "namespace": target.execute("SELECT value FROM meta WHERE key='namespace'").fetchone()[0],
                    "reason": "post-checkpoint IDs and current permissions require reconciliation"}
        finally:
            source.close()
            target.close()
