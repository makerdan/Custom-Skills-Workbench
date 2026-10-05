#!/usr/bin/env python3
"""Approved FIRST-PROOF fixture route, not ordinary task validation."""
import hashlib
import argparse
import json
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".agents/skills/failure-gate-v4/tests"))
sys.path.insert(0, str(ROOT / "scripts/failure_gate"))
from authoring_supervision import supervise_static
from common import atomic_json, read_bytes
from gate import tooling


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--phase", choices=("first", "caller-fixtures"), default="first")
    phase = parser.parse_args().phase
    destination = ROOT / ".failure-gate" / ("first-proof.json" if phase == "first" else "caller-fixtures.json")
    if destination.exists():
        print("BLOCKED: first-proof already attempted; preserve evidence and request scoped continuation")
        return 4
    began = time.monotonic()
    if phase != "first":
        from common import read_json
        original = read_json(ROOT / ".failure-gate/first-proof.json")
        if original.get("status") != "PASSED" or began - original["started_monotonic"] >= 2700 - 34:
            print("BLOCKED: original installation proof/budget unavailable")
            return 4
    binding = {
        "schema": 1, "purpose": phase + ": contained fixture proof; not ordinary acceptance",
        "approval_reference": "inv_1iUbbTUza9TH58xPL4PH3cad9hYOhmvsMF:call_0C7pg6uWTpHoxjZo93mlN1Tl",
        "started_monotonic": began,
        "boot": read_bytes("/proc/sys/kernel/random/boot_id", 100).decode().strip(),
        "tooling_digest": tooling(ROOT), "status": "STARTED",
        "canonical_supervisor": hashlib.sha256(read_bytes(
            ROOT / ".agents/skills/failure-gate-v4/tests/authoring_supervision.py")).hexdigest(),
    }
    atomic_json(destination, binding)
    result = supervise_static([sys.executable, "-B", str(ROOT / "scripts/failure_gate/tests.py")],
                              execution=30, grace=0.2, verification=2,
                              capture=1, max_bytes=1048576)
    output = result.pop("output")
    print(output, end="")
    binding.update(status="PASSED" if result["pass_"] else "FAILED",
                   fixture_outcome=result, elapsed=time.monotonic() - began)
    atomic_json(destination, binding)
    print(json.dumps({"first_proof": binding["status"], "outcome": result,
                      "ordinary_cutover": "NOT APPROVED"}))
    return 0 if result["pass_"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
