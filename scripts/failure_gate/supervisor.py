"""Parent adapter. User workload waits for durable watchdog registration."""
import json
import os
from pathlib import Path
import select
import signal
import subprocess
import sys
import time
import uuid

from common import Blocked, alive, atomic_json, encoded, incarnation


LIMITS = {
    "queue_seconds": 30, "step_seconds": 480, "startup_seconds": 15,
    "test_ms": 30000, "hook_ms": 15000, "owner_stall_seconds": 15,
    "registration_seconds": 2, "cleanup_seconds": 20, "capture_seconds": 10,
    "run_seconds": 1200, "installation_seconds": 2700,
    "max_bytes": 8 * 1024 * 1024,
}


def validate_limits(values):
    if not isinstance(values, dict) or set(values) != set(LIMITS):
        raise Blocked("complete exact budget mapping required")
    for key, maximum in LIMITS.items():
        value = values.get(key)
        if type(value) is not int or not 0 < value <= min(maximum, 2147483647):
            raise Blocked(f"invalid or enlarged limit: {key}")
    if values["run_seconds"] > values["installation_seconds"]:
        raise Blocked("parent deadline exceeded")


def preserve_error(directory, event, observation, gate):
    """Bounded non-success evidence; write/callback failure still reaches cleanup."""
    detail = {key: observation[key] for key in
              ("event", "schema", "reason", "error_type", "errno", "phase", "frames")
              if key in observation}
    value = {"schema": 1, "gate": gate, "accepted_for_success": False,
             "disposition": "BLOCKED; retain exclusion", "observation": detail}
    if len(encoded(value).encode()) > 8192:
        value["observation"] = {"event": "error", "reason": "overbound_error_evidence",
                                "detail_truncated": True}
    atomic_json(Path(directory) / "watchdog-error.json", value)
    event("watchdog_error", value)


def run(argv, cwd, directory, event, limits=None, lock_fd=None, parent_deadline=None):
    limits = dict(LIMITS if limits is None else limits)
    validate_limits(limits)
    directory = Path(directory)
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    config = directory / "supervision.json"
    output = directory / "raw.log"
    gate = str(uuid.uuid4())
    environment = {key: value for key, value in os.environ.items()
                   if key in ("PATH", "HOME", "TMPDIR", "PNPM_HOME", "LANG", "LC_ALL")}
    preload = Path(__file__).with_name("register-test-bounds.mjs").resolve()
    environment["NODE_OPTIONS"] = f"--import={preload}"
    elapsed_deadline = time.monotonic() + min(limits["step_seconds"], limits["run_seconds"])
    if parent_deadline is not None:
        if (type(parent_deadline) not in (float, int) or
                not time.monotonic() < parent_deadline <= elapsed_deadline):
            raise Blocked("invalid or enlarged effective parent deadline")
        elapsed_deadline = parent_deadline
        environment["FAILURE_GATE_PARENT_DEADLINE"] = repr(parent_deadline)
    payload = {
        "argv": argv, "cwd": str(Path(cwd).resolve()), "environment": environment,
        "owner": incarnation(os.getpid()), "gate": gate, "output": str(output.resolve()),
        "execution_seconds": elapsed_deadline - time.monotonic(),
        "owner_stall_seconds": limits["owner_stall_seconds"],
        "registration_seconds": limits["registration_seconds"],
        "cleanup_seconds": limits["cleanup_seconds"],
        "capture_seconds": limits["capture_seconds"], "max_bytes": limits["max_bytes"],
        "lock_fds": [] if lock_fd is None else [lock_fd],
    }
    if payload["execution_seconds"] <= 0:
        raise Blocked("parent expired before dispatch")
    atomic_json(config, payload)
    event("launch_intent", {"gate": gate, "argv": argv, "limits": limits})
    child = subprocess.Popen([sys.executable, "-B", str(Path(__file__).with_name("watchdog.py")), str(config)],
                             stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                             start_new_session=True, pass_fds=tuple(payload["lock_fds"]))
    os.set_blocking(child.stdout.fileno(), False)
    os.set_blocking(child.stderr.fileno(), False)
    buffer = bytearray()
    total = 0
    registered = False
    started = time.monotonic()
    deadline = started + payload["execution_seconds"] + limits["cleanup_seconds"] + limits["capture_seconds"]
    result = None
    journal_failure = False
    watchdog = incarnation(child.pid)
    owned = {}
    try:
        while time.monotonic() < deadline:
            readable, _, _ = select.select([child.stdout, child.stderr], [], [], 0.05)
            for stream in readable:
                chunk = os.read(stream.fileno(), 65536)
                total += len(chunk)
                if total > 1048576:
                    raise Blocked("watchdog evidence overflow")
                if stream is child.stdout:
                    buffer.extend(chunk)
                    while b"\n" in buffer:
                        line, _, remainder = buffer.partition(b"\n")
                        buffer = bytearray(remainder)
                        observation = json.loads(line)
                        if observation.get("event") == "registered":
                            if registered or observation["gate"] != gate:
                                raise Blocked("wrong watchdog registration")
                            event("watchdog_registered", observation)
                            owned[observation["worker"]["pid"]] = observation["worker"]
                            registered = True
                            child.stdin.write(b"G")
                            child.stdin.flush()
                        elif observation.get("event") == "started":
                            event("confirmed_start", observation)
                        elif observation.get("event") == "result":
                            result = observation
                        else:
                            preserve_error(directory, event, observation, gate)
                            raise Blocked("watchdog failed; retain exclusion")
            if child.poll() is not None:
                # Drain already available result bytes before deciding anything.
                if result is not None:
                    break
                if not readable:
                    raise Blocked("watchdog lost; retain exclusion")
            if not registered and time.monotonic() - started > limits["registration_seconds"] + 1:
                raise Blocked("no independent registration")
            if child.poll() is None:
                child.stdin.write(b"H")
                child.stdin.flush()
        if result is None or alive(watchdog):
            raise Blocked("incomplete watchdog outcome")
        if result.get("stopped") is not True or result.get("capture_complete") is not True:
            result["pass"] = False
            result["healthy_release"] = False
        event("step_outcome", result)
        return result
    except BaseException:
        journal_failure = True
        if child.poll() is None:
            try:
                child.stdin.write(b"C")
                child.stdin.flush()
            except (OSError, ValueError):
                pass
            # Already-owned cleanup remains authorized independently of journal health.
            try:
                child.wait(timeout=limits["cleanup_seconds"] + limits["capture_seconds"] + 1)
            except subprocess.TimeoutExpired:
                pass
        # Watchdog loss: stop only already-known exact owned incarnations.
        # Unknown escaped/adopted work still retains exclusion; this is not reclaim.
        cleanup_end = time.monotonic() + limits["cleanup_seconds"]
        delivered = set()
        while time.monotonic() < cleanup_end and any(alive(value) for value in owned.values()):
            signum = signal.SIGKILL
            for identity in owned.values():
                key = (identity["pid"], identity["start"], signum)
                if key not in delivered and alive(identity):
                    try:
                        os.kill(identity["pid"], signum)
                        delivered.add(key)
                    except ProcessLookupError:
                        pass
            time.sleep(0.01)
        raise
    finally:
        for stream in (child.stdin, child.stdout, child.stderr):
            stream.close()
        if journal_failure:
            # No DB/file write here can falsely finalize the original run.
            pass
