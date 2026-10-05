#!/usr/bin/env python3
"""One-command Home Depot mailbox parsing, matching, and LeadFlow import."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mailbox_export", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--overrides", type=Path)
    parser.add_argument("--org-id", type=int, default=1)
    parser.add_argument("--entered-by-id", type=int, default=1)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true")
    mode.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            sys.executable,
            str(repo / "scripts" / "home_depot_receipt_parser.py"),
            str(args.mailbox_export),
            str(args.output_dir),
        ],
        check=True,
    )

    command = [
        sys.executable,
        str(repo / "scripts" / "home_depot_receipt_importer.py"),
        str(args.output_dir / "parsed_and_matched.json"),
        "--attachments",
        str(args.output_dir / "attachments"),
        "--org-id",
        str(args.org_id),
        "--entered-by-id",
        str(args.entered_by_id),
        "--report",
        str(args.output_dir / "import_report.json"),
        "--apply" if args.apply else "--dry-run",
    ]
    if args.overrides:
        command.extend(["--overrides", str(args.overrides)])
    subprocess.run(command, check=True)


if __name__ == "__main__":
    main()
