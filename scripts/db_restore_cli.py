#!/usr/bin/env python3
"""Restore a selected DB backup into the prod Postgres container.

Usage: python3 scripts/db_restore_cli.py [--backup-file PATH] [--backup-dir DIR]

If --backup-file is not provided the script lists files in BACKUP_DIR (default: db-backups)
and prompts you to choose one.

The script reads Postgres connection vars from the environment: POSTGRES_USER, POSTGRES_DB.
It runs: docker compose -f docker-compose.prod.yml exec -T db psql -U USER -d DB
and streams the SQL file into the container.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


def human_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024.0:
            return f"{n:.1f}{unit}"
        n /= 1024.0
    return f"{n:.1f}PB"


def human_age(ts: float) -> str:
    dt = datetime.now(timezone.utc) - datetime.fromtimestamp(ts, tz=timezone.utc)
    days = dt.days
    secs = dt.seconds
    if days > 365:
        return f"{days//365}y"
    if days > 30:
        return f"{days//30}mo"
    if days > 0:
        return f"{days}d"
    if secs > 3600:
        return f"{secs//3600}h"
    if secs > 60:
        return f"{secs//60}m"
    return f"{secs}s"


def list_backups(dirpath: Path) -> list[Path]:
    if not dirpath.exists():
        return []
    files = [p for p in dirpath.iterdir() if p.is_file()]
    files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return files


def choose_file(files: list[Path]) -> Optional[Path]:
    print("Available backups:")
    for i, p in enumerate(files, start=1):
        st = p.stat()
        mtime = datetime.fromtimestamp(st.st_mtime, tz=timezone.utc)
        print(f"{i}. {p.name} — {human_size(st.st_size)} — {mtime.isoformat()} — {human_age(st.st_mtime)} ago")
    print()
    while True:
        choice = input("Enter number to restore (or q to quit): ").strip()
        if choice.lower() in ("q", "quit"):
            return None
        if choice.isdigit():
            idx = int(choice)
            if 1 <= idx <= len(files):
                return files[idx - 1]
        print("Invalid choice — try again.")


def run_restore(backup_file: Path, pg_user: str, pg_db: str) -> int:
    print(f"Restoring '{backup_file}' into database '{pg_db}' as user '{pg_user}'")
    cmd = [
        "docker",
        "compose",
        "-f",
        "docker-compose.prod.yml",
        "exec",
        "-T",
        "db",
        "psql",
        "-U",
        pg_user,
        "-d",
        pg_db,
    ]

    # Stream the file into the psql command via stdin
    with backup_file.open("rb") as fh:
        proc = subprocess.run(cmd, stdin=fh)
    return proc.returncode


def main() -> int:
    ap = argparse.ArgumentParser(description="Select and restore a DB backup into prod DB")
    ap.add_argument("--backup-file", "-f", help="Path to a specific backup file to restore")
    ap.add_argument("--backup-dir", "-d", default=os.environ.get("BACKUP_DIR", "db-backups"), help="Directory containing backups")
    ap.add_argument("--yes", "-y", action="store_true", help="Skip confirmation prompt")
    args = ap.parse_args()

    backup_dir = Path(args.backup_dir)

    if args.backup_file:
        backup_path = Path(args.backup_file)
        if not backup_path.exists():
            print(f"Backup file not found: {backup_path}")
            return 2
    else:
        files = list_backups(backup_dir)
        if not files:
            print(f"No backup files found in {backup_dir}")
            return 3
        backup_path = choose_file(files)
        if backup_path is None:
            print("Aborted by user.")
            return 0

    # Load connection details from environment
    pg_user = os.environ.get("POSTGRES_USER")
    pg_db = os.environ.get("POSTGRES_DB")
    if not pg_user or not pg_db:
        # Try reading .env from repo root
        env_path = Path(__file__).resolve().parents[1] / ".env"
        if env_path.exists():
            print("Loading DB creds from .env")
            for line in env_path.read_text().splitlines():
                if "POSTGRES_USER" in line and "=" in line:
                    pg_user = pg_user or line.split("=", 1)[1].strip()
                if "POSTGRES_DB" in line and "=" in line:
                    pg_db = pg_db or line.split("=", 1)[1].strip()

    if not pg_user or not pg_db:
        print("POSTGRES_USER and POSTGRES_DB must be set in the environment or .env")
        return 4

    if not args.yes:
        confirm = input(f"Confirm restore of '{backup_path.name}' into '{pg_db}'? This will overwrite data. (yes/NO): ")
        if confirm.strip().lower() != "yes":
            print("Restore cancelled.")
            return 0

    code = run_restore(backup_path, pg_user, pg_db)
    if code == 0:
        print("Restore completed successfully.")
    else:
        print(f"Restore failed with exit code {code}")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
