#!/usr/bin/env python3
"""Restore a selected DB backup into a selected Postgres compose service.

Usage: python3 scripts/db_restore_cli.py [--backup-file PATH] [--backup-dir DIR]

If --backup-file is not provided the script lists files in BACKUP_DIR (default: db-backups)
and prompts you to choose one.

The script reads Postgres connection vars from the environment: POSTGRES_USER, POSTGRES_DB.
It resets the target schema by default, then runs:
docker compose ... exec -T db psql -U USER -d DB
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


def build_psql_cmd(
    pg_user: str,
    pg_db: str,
    compose_file: str,
    project_name: str | None,
    env_file: str | None,
) -> list[str]:
    cmd = ["docker", "compose"]
    if env_file:
        cmd.extend(["--env-file", env_file])
    if project_name:
        cmd.extend(["-p", project_name])
    cmd.extend(
        [
            "-f",
            compose_file,
            "exec",
            "-T",
            "db",
            "psql",
            "-v",
            "ON_ERROR_STOP=1",
            "-U",
            pg_user,
            "-d",
            pg_db,
        ]
    )
    return cmd


def run_sql(sql: str, cmd: list[str]) -> int:
    proc = subprocess.run(cmd, input=sql.encode("utf-8"))
    return proc.returncode


def run_restore(
    backup_file: Path,
    pg_user: str,
    pg_db: str,
    compose_file: str,
    project_name: str | None,
    env_file: str | None,
    reset_schema: bool,
) -> int:
    print(f"Restoring '{backup_file}' into database '{pg_db}' as user '{pg_user}'")
    cmd = build_psql_cmd(pg_user, pg_db, compose_file, project_name, env_file)

    if reset_schema:
        print("Resetting target public schema before restore")
        reset_sql = f"""
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO {pg_user};
GRANT ALL ON SCHEMA public TO PUBLIC;
"""
        reset_code = run_sql(reset_sql, cmd)
        if reset_code != 0:
            return reset_code

    print("Streaming backup into Postgres")

    # Stream the file into the psql command via stdin
    with backup_file.open("rb") as fh:
        proc = subprocess.run(cmd, stdin=fh)
    return proc.returncode


def main() -> int:
    ap = argparse.ArgumentParser(description="Select and restore a DB backup into a compose-managed DB")
    ap.add_argument("--backup-file", "-f", help="Path to a specific backup file to restore")
    ap.add_argument("--backup-dir", "-d", default=os.environ.get("BACKUP_DIR", "db-backups"), help="Directory containing backups")
    ap.add_argument("--compose-file", default="docker-compose.prod.yml", help="Compose file to target")
    ap.add_argument("--project-name", default=os.environ.get("COMPOSE_PROJECT_NAME"), help="Compose project name to target")
    ap.add_argument("--env-file", default=os.environ.get("APP_ENV_FILE"), help="Compose env file to target")
    ap.add_argument("--keep-existing", action="store_true", help="Do not reset the target public schema before restore")
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
        env_filename = args.env_file or ".env"
        env_path = Path(__file__).resolve().parents[1] / env_filename
        if env_path.exists():
            print(f"Loading DB creds from {env_path.name}")
            for line in env_path.read_text().splitlines():
                if "POSTGRES_USER" in line and "=" in line:
                    pg_user = pg_user or line.split("=", 1)[1].strip()
                if "POSTGRES_DB" in line and "=" in line:
                    pg_db = pg_db or line.split("=", 1)[1].strip()

    if not pg_user or not pg_db:
        print("POSTGRES_USER and POSTGRES_DB must be set in the environment or .env")
        return 4

    if not args.yes:
        confirm = input(
            f"Confirm restore of '{backup_path.name}' into '{pg_db}'? "
            "This will replace the target public schema. (yes/NO): "
        )
        if confirm.strip().lower() != "yes":
            print("Restore cancelled.")
            return 0

    code = run_restore(
        backup_path,
        pg_user,
        pg_db,
        args.compose_file,
        args.project_name,
        args.env_file,
        not args.keep_existing,
    )
    if code == 0:
        print("Restore completed successfully.")
    else:
        print(f"Restore failed with exit code {code}")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
