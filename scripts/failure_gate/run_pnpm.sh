#!/bin/bash
set -e

if [ "$#" -eq 0 ]; then
  echo "Usage: bash scripts/failure_gate/run_pnpm.sh <pnpm arguments...>" >&2
  exit 2
fi

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
project_root=$(cd -- "$script_dir/../.." && pwd -P)
working_directory=$(pwd -P)
case "$working_directory" in
  "$project_root"|"$project_root"/*) ;;
  *)
    echo "Run this wrapper from the project root or one of its subdirectories." >&2
    exit 2
    ;;
esac

exec python3 -B "$script_dir/run_writer.py" --timeout 30 -- pnpm "$@"
