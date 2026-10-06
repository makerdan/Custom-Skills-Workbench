"""Promote staged Orval output and run its nested build as one writer."""
import os
from pathlib import Path
import re
import shutil
import sys
import uuid

from common import Blocked, writer_lock
from run_writer import run_command


ROOT = Path(__file__).resolve().parents[2]
API_SPEC = ROOT / "lib" / "api-spec"
STAGE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,80}$")
STAGED_OUTPUTS = (
    (
        Path("lib/api-client-react/dist"),
        Path("lib/api-client-react/src"),
        Path("lib/api-client-react/src/generated"),
        ("api.ts", "api.schemas.ts"),
    ),
    (
        Path("lib/api-zod/dist"),
        Path("lib/api-zod/src"),
        Path("lib/api-zod/src/generated"),
        ("api.ts", "types/index.ts"),
    ),
)


def shell_status(returncode):
    return 128 - returncode if returncode < 0 else returncode


def _ensure_safe_tree(directory):
    if directory.is_symlink() or not directory.is_dir():
        raise Blocked(f"unsafe generated output directory: {directory}")
    for current, dirnames, filenames in os.walk(directory, followlinks=False):
        for name in dirnames + filenames:
            candidate = Path(current) / name
            if candidate.is_symlink():
                raise Blocked(f"symlink in generated output: {candidate}")
            if not (candidate.is_dir() or candidate.is_file()):
                raise Blocked(f"unsupported generated output: {candidate}")


def _remove_path(target):
    if target.is_symlink():
        raise Blocked(f"symlink in generated output: {target}")
    if target.is_dir():
        shutil.rmtree(target)
    elif target.exists():
        target.unlink()


def _preserve_declarations(source, staged):
    for declaration in source.rglob("*.d.ts"):
        if declaration.is_symlink() or not declaration.is_file():
            raise Blocked(f"unsafe declaration file: {declaration}")
        relative = declaration.relative_to(source)
        destination = staged / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(declaration, destination)


def promote_staged_outputs(root, stage_id):
    """Replace generated source trees from safe per-run staging directories."""
    if not isinstance(stage_id, str) or not STAGE_ID_PATTERN.fullmatch(stage_id):
        raise Blocked("Orval stage identifier is invalid")

    root = Path(root).resolve()
    pairs = []
    for stage_parent_relative, source_relative, destination_relative, required in STAGED_OUTPUTS:
        source_root = root / source_relative
        stage_parent = root / stage_parent_relative
        destination = root / destination_relative
        stage_root = stage_parent / f".orval-stage-{stage_id}"
        staged = stage_root / "generated"
        staged_index = stage_root / "index.ts"
        _ensure_safe_tree(stage_root)
        _ensure_safe_tree(staged)
        for relative in required:
            required_file = staged / relative
            if required_file.is_symlink() or not required_file.is_file():
                raise Blocked(f"Orval output is incomplete: {required_file}")
        if staged_index.is_symlink() or not staged_index.is_file():
            raise Blocked(f"Orval workspace barrel is missing: {staged_index}")
        if destination.is_symlink():
            raise Blocked(f"unsafe generated output directory: {destination}")
        if destination.exists():
            _ensure_safe_tree(destination)
            _preserve_declarations(destination, staged)
        destination_index = source_root / "index.ts"
        if destination_index.is_symlink() or (
                destination_index.exists() and not destination_index.is_file()):
            raise Blocked(f"unsafe generated workspace barrel: {destination_index}")
        pairs.extend(((staged, destination), (staged_index, destination_index)))

    backups = []
    promoted = []
    try:
        for staged, destination in pairs:
            backup = destination.with_name(
                f".{destination.name}.failure-gate-backup-{stage_id}"
            )
            if backup.exists() or backup.is_symlink():
                raise Blocked(f"generated output backup already exists: {backup}")
            if destination.exists():
                os.replace(destination, backup)
                backups.append((destination, backup))
            os.replace(staged, destination)
            promoted.append(destination)
    except Exception:
        for destination in reversed(promoted):
            if destination.exists():
                _remove_path(destination)
        for destination, backup in reversed(backups):
            if backup.exists() and not destination.exists():
                os.replace(backup, destination)
        raise

    for _, backup in backups:
        _remove_path(backup)


def cleanup_stages(root, stage_id):
    if not STAGE_ID_PATTERN.fullmatch(stage_id):
        raise Blocked("Orval stage identifier is invalid")
    root = Path(root).resolve()
    for stage_parent_relative, _, _, _ in STAGED_OUTPUTS:
        staged = root / stage_parent_relative / f".orval-stage-{stage_id}"
        if staged.is_symlink():
            raise Blocked(f"unsafe Orval stage directory: {staged}")
        if staged.exists():
            if not staged.is_dir():
                raise Blocked(f"unsafe Orval stage directory: {staged}")
            _ensure_safe_tree(staged)
            shutil.rmtree(staged)


def main():
    stage_id = f"codegen-{os.getpid()}-{uuid.uuid4().hex}"
    try:
        with writer_lock(ROOT / ".failure-gate"):
            generate_status = run_command(
                ["pnpm", "exec", "orval", "--config", "./orval.config.ts"],
                root=ROOT,
                cwd=API_SPEC,
                env={"WORKSPACE_ORVAL_STAGE_ID": stage_id},
            )
            if generate_status:
                return generate_status
            promote_staged_outputs(ROOT, stage_id)
            # Keep generated source promotion and the dependent build in one
            # lock so a completion snapshot cannot observe an intermediate tree.
            return run_command(
                ["pnpm", "exec", "tsc", "--build"],
                root=ROOT,
                cwd=ROOT,
            )
    except (Blocked, OSError) as error:
        print(f"failure-gate writer: {error}", file=sys.stderr)
        return 2
    finally:
        try:
            with writer_lock(ROOT / ".failure-gate"):
                cleanup_stages(ROOT, stage_id)
        except (Blocked, OSError) as error:
            print(f"failure-gate writer cleanup: {error}", file=sys.stderr)


if __name__ == "__main__":
    raise SystemExit(main())
