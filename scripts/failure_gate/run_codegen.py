"""Run Orval cleanup/generation and its nested library build as one writer."""
from pathlib import Path
import subprocess
import sys

from common import Blocked, writer_lock


ROOT = Path(__file__).resolve().parents[2]
API_SPEC = ROOT / "lib" / "api-spec"


def shell_status(returncode):
    return 128 - returncode if returncode < 0 else returncode


def run(argv, cwd):
    return shell_status(subprocess.run(argv, cwd=cwd, check=False).returncode)


def main():
    try:
        with writer_lock(ROOT / ".failure-gate"):
            generate_status = run(
                ["pnpm", "exec", "orval", "--config", "./orval.config.ts"],
                API_SPEC,
            )
            if generate_status:
                return generate_status
            # This is the underlying command of the standalone typecheck:libs
            # script, kept inside the same lock as Orval's clean-and-write pass.
            return run(
                ["pnpm", "exec", "tsc", "--build"],
                ROOT,
            )
    except (Blocked, OSError) as error:
        print(f"failure-gate writer: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
