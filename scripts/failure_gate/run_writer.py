"""Run one cooperative workspace writer under Failure Gate's shared lock."""
import argparse
import hashlib
import os
from pathlib import Path
import stat
import subprocess
import sys
from contextlib import contextmanager

from common import Blocked, inside, inherited_writer_lock, read_bytes, writer_lock


ROOT = Path(__file__).resolve().parents[2]
MAX_WRITE_BYTES = 1024 * 1024
WRITER_FD_ENV = "FAILURE_GATE_WRITER_FD"


@contextmanager
def writer_guard(root, timeout, inherited_fd):
    if inherited_fd is None:
        with writer_lock(root / ".failure-gate", timeout) as fd:
            yield fd
    else:
        with inherited_writer_lock(root / ".failure-gate", inherited_fd) as fd:
            yield fd


def write_if_unchanged(root, relative, expected_digest, content, timeout=30,
                       inherited_fd=None):
    """Write one existing project file without overwriting a concurrent edit."""
    root = Path(root).resolve()
    target = inside(root, relative, must_exist=False)
    if len(content) > MAX_WRITE_BYTES:
        raise Blocked("writer input exceeded byte limit")
    if expected_digest != "missing" and (
            len(expected_digest) != 64 or
            any(character not in "0123456789abcdef" for character in expected_digest)):
        raise Blocked("writer expected digest is invalid")
    with writer_guard(root, timeout, inherited_fd):
        target = inside(root, relative, must_exist=False)
        if expected_digest == "missing":
            if target.exists():
                raise Blocked(f"stale writer input: {relative}")
            target.parent.mkdir(parents=True, exist_ok=True)
            target = inside(root, relative, must_exist=False)
            flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_NONBLOCK
            fd = os.open(target, flags, 0o666)
        else:
            current = read_bytes(target, MAX_WRITE_BYTES)
            if hashlib.sha256(current).hexdigest() != expected_digest:
                raise Blocked(f"stale writer input: {relative}")
            flags = os.O_WRONLY | os.O_NOFOLLOW | os.O_NONBLOCK
            fd = os.open(target, flags)
        try:
            info = os.fstat(fd)
            if not stat.S_ISREG(info.st_mode):
                raise Blocked("writer target is not a regular file")
            os.ftruncate(fd, 0)
            with os.fdopen(fd, "wb") as stream:
                stream.write(content)
                stream.flush()
                os.fsync(stream.fileno())
        except Exception:
            try:
                os.close(fd)
            except OSError:
                pass
            raise


def ensure_directory(root, relative, timeout=30, inherited_fd=None):
    root = Path(root).resolve()
    target = inside(root, relative, must_exist=False)
    with writer_guard(root, timeout, inherited_fd):
        target.mkdir(parents=True, exist_ok=True)
        if target.is_symlink() or not target.is_dir():
            raise Blocked("unsafe writer directory")


def run_command(argv, root=ROOT, cwd=None, timeout=30, env=None,
                inherited_fd=None):
    if not argv:
        raise Blocked("writer command is empty")
    root = Path(root).resolve()
    working_directory = Path(cwd).resolve() if cwd else Path.cwd()
    if not working_directory.is_dir():
        raise Blocked("writer working directory is unavailable")
    with writer_guard(root, timeout, inherited_fd) as fd:
        child_env = os.environ.copy()
        if env is not None:
            child_env.update(env)
        child_env[WRITER_FD_ENV] = str(fd)
        result = subprocess.run(
            argv, cwd=working_directory, check=False, env=child_env,
            pass_fds=(fd,),
        )
    return 128 - result.returncode if result.returncode < 0 else result.returncode


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--write-stdin", nargs=2, metavar=("PATH", "EXPECTED_SHA256"))
    parser.add_argument("--mkdir", metavar="PATH")
    parser.add_argument("--inherited-lock-fd", type=int)
    parser.add_argument("--verify-lock-fd", action="store_true")
    parser.add_argument("command", nargs=argparse.REMAINDER)
    options = parser.parse_args(argv)
    if options.timeout <= 0 or options.timeout > 30:
        parser.error("--timeout must be greater than 0 and no more than 30 seconds")
    selected = int(options.write_stdin is not None) + int(options.mkdir is not None)
    selected += int(bool(options.command))
    selected += int(options.verify_lock_fd)
    if selected != 1:
        parser.error("choose exactly one write, mkdir, verify, or command action")
    if options.verify_lock_fd and options.inherited_lock_fd is None:
        parser.error("--verify-lock-fd requires --inherited-lock-fd")

    try:
        if options.verify_lock_fd:
            with inherited_writer_lock(ROOT / ".failure-gate", options.inherited_lock_fd):
                return 0
        if options.write_stdin:
            relative, expected = options.write_stdin
            content = sys.stdin.buffer.read(MAX_WRITE_BYTES + 1)
            if len(content) > MAX_WRITE_BYTES:
                raise Blocked("writer input exceeded byte limit")
            write_if_unchanged(
                ROOT, relative, expected, content, options.timeout,
                options.inherited_lock_fd,
            )
            return 0
        if options.mkdir:
            ensure_directory(
                ROOT, options.mkdir, options.timeout, options.inherited_lock_fd,
            )
            return 0
        command = options.command
        if command and command[0] == "--":
            command = command[1:]
        return run_command(
            command, root=ROOT, timeout=options.timeout,
            inherited_fd=options.inherited_lock_fd,
        )
    except (Blocked, OSError) as error:
        print(f"failure-gate writer: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
