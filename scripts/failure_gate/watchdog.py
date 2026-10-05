"""Independent Linux subreaper for the reviewed cooperative local workload."""
import ctypes
import json
import os
from pathlib import Path
import selectors
import signal
import stat
import subprocess
import sys
import time

from common import alive, encoded, incarnation, read_json


def observe(known, root_pid=None):
    """Only this isolated watchdog's descendants, including adopted sessions."""
    result = {}
    for directory in Path("/proc").iterdir():
        if directory.name.isdigit():
            item = incarnation(int(directory.name))
            if item:
                result[item["pid"]] = item
    owned = {os.getpid()}
    changed = True
    while changed:
        changed = False
        for pid, item in result.items():
            if pid not in owned and (item["parent"] in owned or
                    (pid in known and item["start"] == known[pid]["start"])):
                owned.add(pid)
                known[pid] = item
                changed = True
    live = []
    for pid, identity in known.items():
        current = result.get(pid)
        if current and current["start"] == identity["start"]:
            if current["state"] != "Z":
                live.append(current)
            elif pid != root_pid:
                try:
                    os.waitpid(pid, os.WNOHANG)
                except ChildProcessError:
                    pass
    return live


def main():
    config = read_json(sys.argv[1])
    if not stat.S_ISFIFO(os.fstat(sys.stdin.fileno()).st_mode):
        raise RuntimeError("private watchdog requires an IPC control pipe")
    parent = incarnation(os.getppid())
    if parent is None or parent["pid"] != config["owner"]["pid"] or parent["start"] != config["owner"]["start"]:
        raise RuntimeError("private watchdog owner binding mismatch")
    if ctypes.CDLL(None, use_errno=True).prctl(36, 1, 0, 0, 0) != 0:
        raise RuntimeError("Linux subreaper unavailable; no dispatch")
    # Each helper is a dedicated session and has no children from other operations.
    original = signal.getsignal(signal.SIGTERM)
    cancelled = False

    def cancel(*_):
        nonlocal cancelled
        cancelled = True

    signal.signal(signal.SIGTERM, cancel)
    signal.signal(signal.SIGINT, cancel)
    os.set_blocking(sys.stdin.fileno(), False)
    start = time.monotonic()
    remaining = config["execution_seconds"]
    deadline = start + remaining
    heartbeat = start
    registered = False
    known = {}
    delivered = set()
    signals = []
    gap = None
    raw_exit = None
    child = None
    gate_read, gate_write = os.pipe()
    output = Path(config["output"])
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    selector = selectors.DefaultSelector()
    captured = 0
    overflow = False
    reason = None
    stopped = False
    worker = (
        "import os,sys;fd=int(sys.argv[1]);"
        "ok=os.read(fd,1);os.close(fd);"
        "sys.exit(125) if ok!=b'G' else None;"
        "os.execvpe(sys.argv[2],sys.argv[2:],os.environ)"
    )
    try:
        child = subprocess.Popen(
            [sys.executable, "-B", "-c", worker, str(gate_read), *config["argv"]],
            cwd=config["cwd"], env=config["environment"], start_new_session=True,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            pass_fds=tuple([gate_read, *config.get("lock_fds", [])]))
        known[child.pid] = incarnation(child.pid)
        os.close(gate_read)
        for stream in (child.stdout, child.stderr):
            os.set_blocking(stream.fileno(), False)
            selector.register(stream, selectors.EVENT_READ)
        print(encoded({"event": "registered", "watchdog": incarnation(os.getpid()),
                       "worker": known[child.pid], "gate": config["gate"]}), flush=True)
        while True:
            now = time.monotonic()
            try:
                control = os.read(sys.stdin.fileno(), 4096)
                if b"G" in control and not registered:
                    registered = True
                    os.write(gate_write, b"G")
                    os.close(gate_write)
                    gate_write = None
                    print(encoded({"event": "started", "worker": known[child.pid]}), flush=True)
                if control:
                    heartbeat = now
                if b"C" in control:
                    cancelled = True
            except BlockingIOError:
                pass
            live = observe(known, child.pid)
            raw_exit = child.poll()
            for key, _ in selector.select(0.02):
                chunk = os.read(key.fileobj.fileno(), 65536)
                if not chunk:
                    selector.unregister(key.fileobj)
                else:
                    capacity = config["max_bytes"] - captured
                    if len(chunk) > capacity:
                        overflow = True
                    keep = chunk[:max(0, capacity)]
                    os.write(fd, keep)
                    captured += len(keep)
            now = time.monotonic()
            if now >= deadline:
                reason = "execution_deadline"
            elif cancelled:
                reason = "cancelled"
            elif not alive(config["owner"]):
                reason = "owner_death"
            elif now - heartbeat > config["owner_stall_seconds"]:
                reason = "owner_stall"
            elif not registered and now - start > config["registration_seconds"]:
                reason = "registration_timeout"
            elif overflow:
                reason = "output_overflow"
            elif raw_exit is not None and not selector.get_map():
                reason = "owned_survivors" if live else "finished"
            if reason:
                break
        execution_elapsed = time.monotonic() - start
        cleanup_start = time.monotonic()
        cleanup_end = cleanup_start + config["cleanup_seconds"]
        while time.monotonic() < cleanup_end:
            live = observe(known, child.pid)
            if not live:
                stopped = True
                break
            signum = (signal.SIGTERM if time.monotonic() - cleanup_start
                      < min(1, config["cleanup_seconds"] / 2) else signal.SIGKILL)
            for identity in live:
                key = (identity["pid"], identity["start"], signum)
                if key not in delivered and alive(identity):
                    try:
                        os.kill(identity["pid"], signum)
                        delivered.add(key)
                        signals.append({"process": identity, "signal": signum.name})
                    except ProcessLookupError:
                        pass
                    except OSError:
                        gap = "owned termination uncertain"
            time.sleep(0.01)
        raw_exit = child.poll()
        capture_end = time.monotonic() + config["capture_seconds"]
        while selector.get_map() and time.monotonic() < capture_end:
            for key, _ in selector.select(0.01):
                chunk = os.read(key.fileobj.fileno(), 65536)
                if not chunk:
                    selector.unregister(key.fileobj)
                else:
                    capacity = config["max_bytes"] - captured
                    if len(chunk) > capacity:
                        overflow = True
                    keep = chunk[:max(0, capacity)]
                    os.write(fd, keep)
                    captured += len(keep)
        os.fsync(fd)
        complete = not selector.get_map() and not overflow
        healthy = (stopped is True and complete is True and gap is None
                   and reason in ("finished", "execution_deadline", "cancelled"))
        result = {"event": "result", "schema": 1, "reason": reason,
                  "raw_exit": raw_exit, "registered": registered,
                  "stopped": stopped, "capture_complete": complete,
                  "bytes": captured, "signals": signals, "gap": gap,
                  "elapsed": execution_elapsed, "healthy_release": healthy,
                  "pass": healthy and reason == "finished" and raw_exit == 0}
        print(encoded(result), flush=True)
        return 0 if healthy else 4
    finally:
        if gate_write is not None:
            os.close(gate_write)
        os.close(fd)
        selector.close()
        signal.signal(signal.SIGTERM, original)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        # No claimed clean release. Parent preserves its run/resource exclusion.
        print(encoded({"event": "error", "reason": type(error).__name__}), flush=True)
        raise SystemExit(4)
