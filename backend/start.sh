#!/bin/sh
set -e

max_attempts="${DB_STARTUP_MAX_ATTEMPTS:-30}"
sleep_seconds="${DB_STARTUP_SLEEP_SECONDS:-2}"
attempt=1

while [ "$attempt" -le "$max_attempts" ]; do
  if alembic upgrade head; then
    exec "$@"
  fi

  echo "Migration attempt ${attempt}/${max_attempts} failed; waiting for database..."
  attempt=$((attempt + 1))
  sleep "$sleep_seconds"
done

echo "Database migrations did not succeed after ${max_attempts} attempts." >&2
exit 1
