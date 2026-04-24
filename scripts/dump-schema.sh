#!/usr/bin/env bash
# Dump the live Supabase Postgres schema (public namespace) so you can
# refresh supabase/schema.sql when the version-controlled copy drifts.
#
# This script writes to supabase/schema.dump.sql and never touches
# supabase/schema.sql directly — review the dump first, then replace
# manually if you're happy with it.
#
# Usage:
#   DATABASE_URL='postgresql://postgres:...:5432/postgres' ./scripts/dump-schema.sh

set -euo pipefail

OUT="supabase/schema.dump.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  cat >&2 <<'ERR'
DATABASE_URL is not set. To get it:

  1. Open the Supabase dashboard for this project.
  2. Project Settings → Database → Connection string.
  3. Pick the entry labeled "Direct connection" (port 5432).
     Do NOT use the connection pooler (port 6543) — pg_dump can't
     speak the pooler's protocol.
  4. Copy the URI. It looks like:
       postgresql://postgres:<your-password>@db.<ref>.supabase.co:5432/postgres

Then run, substituting your URL:

  DATABASE_URL='postgresql://postgres:...:5432/postgres' \
    ./scripts/dump-schema.sh

Tip: do not paste the URL into chat or commit messages — it contains
your DB password.
ERR
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  cat >&2 <<'ERR'
pg_dump is not installed. On macOS the lightest install is libpq (the
Postgres client tools, no server):

  brew install libpq
  brew link --force libpq

Then re-run this script.
ERR
  exit 1
fi

if [[ "$DATABASE_URL" == *":6543"* || "$DATABASE_URL" == *"pgbouncer"* ]]; then
  cat >&2 <<'ERR'
DATABASE_URL points at Supabase's connection pooler (pgbouncer, port
6543). pg_dump can't use it. Switch to the direct connection — port
5432 — from the same Supabase dashboard page.
ERR
  exit 1
fi

echo "→ Dumping public schema to $OUT"
pg_dump \
  --schema-only \
  --schema=public \
  --no-owner \
  --no-privileges \
  "$DATABASE_URL" > "$OUT"

cat <<MSG

✓ Wrote $OUT — structure-only, no data, no GRANTs.

Next steps:
  1. Open $OUT and skim. That's the real shape of your live DB.
  2. Diff against the version-controlled copy to spot drift:
       diff supabase/schema.sql $OUT
  3. If you want to make the dump the new source of truth:
       mv $OUT supabase/schema.sql
     Then commit. Otherwise leave $OUT alone — it's gitignored.
MSG
