"""Bounded inputs and durable local files. Cooperative, not tamper-proof."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import stat
import time
import threading
from contextlib import contextmanager


class Blocked(RuntimeError):
    pass


def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def digest(value):
    return hashlib.sha256(encoded(value).encode()).hexdigest()


def read_bytes(path, maximum=8 * 1024 * 1024):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_size > maximum:
            raise Blocked(f"not a bounded regular file: {path}")
        data = bytearray()
        while len(data) <= maximum:
            chunk = os.read(fd, min(65536, maximum + 1 - len(data)))
            if not chunk:
                return bytes(data)
            data.extend(chunk)
        raise Blocked(f"file exceeded byte limit: {path}")
    finally:
        os.close(fd)


def read_json(path):
    try:
        return json.loads(read_bytes(path, 1024 * 1024))
    except (ValueError, OSError) as error:
        raise Blocked(f"unavailable or invalid JSON: {path}") from error


def inside(root, relative, must_exist=True):
    root = Path(root).resolve()
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute():
        raise Blocked("relative project path required")
    if any(part in (".", "..") for part in relative.split("/")):
        raise Blocked("path traversal denied")
    candidate = root / relative
    current = root
    for part in Path(relative).parts:
        current = current / part
        if current.is_symlink():
            raise Blocked("symlink path denied")
    if not candidate.resolve().is_relative_to(root):
        raise Blocked("project escape denied")
    if must_exist and not candidate.is_file():
        raise Blocked(f"missing project file: {relative}")
    return candidate


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    if path.is_symlink() or path.parent.is_symlink():
        raise Blocked("unsafe output path")
    temporary = path.with_name(path.name + f".pending-{os.getpid()}")
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        with os.fdopen(fd, "w") as stream:
            stream.write(encoded(value) + "\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        if temporary.exists():
            temporary.unlink()


_locks = threading.local()


@contextmanager
def writer_lock(directory, timeout=30):
    """Never unlink/replace the shared inode, including on errors."""
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    if directory.is_symlink():
        raise Blocked("unsafe state directory")
    path = directory / "writers.lock"
    key = str(path.absolute())
    held = getattr(_locks, "held", None)
    if held is None:
        held = _locks.held = {}
    if key in held:
        yield held[key]
        return
    fd = os.open(path, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600)
    start = time.monotonic()
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid():
            raise Blocked("unsafe writer lock")
        while True:
            try:
                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except BlockingIOError:
                if time.monotonic() - start >= timeout:
                    raise Blocked("writer lock queue expired")
                time.sleep(0.02)
        if (info.st_dev, info.st_ino) != (path.stat().st_dev, path.stat().st_ino):
            raise Blocked("writer lock inode changed")
        held[key] = fd
        try:
            yield fd
        finally:
            del held[key]
    finally:
        os.close(fd)


def incarnation(pid):
    try:
        text = Path(f"/proc/{pid}/stat").read_text()
        fields = text[text.rfind(")") + 2:].split()
        return {"pid": pid, "start": fields[19], "state": fields[0],
                "parent": int(fields[1]), "group": int(fields[2])}
    except FileNotFoundError:
        return None


def alive(identity):
    current = incarnation(identity["pid"])
    return bool(current and current["start"] == identity["start"]
                and current["state"] != "Z")
