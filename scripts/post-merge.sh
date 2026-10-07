#!/bin/bash
set -e
python3 -B scripts/failure_gate/run_writer.py --timeout 30 -- \
  bash -c 'pnpm install --frozen-lockfile && pnpm --filter db push'
