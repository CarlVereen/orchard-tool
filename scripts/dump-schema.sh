#!/usr/bin/env bash
# Dump the live Supabase Postgres schema (public namespace) so you can
# refresh supabase/schema.sql when the version-controlled copy drifts.
#
# Uses the Supabase CLI via npx, so nothing has to be installed
# globally — npx fetches and caches the CLI on first run.
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
     Do NOT use the connection pooler (port 6543) — the dump needs a
     real Postgres session, which the pooler doesn't support.
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

if ! command -v npx >/dev/null 2>&1; then
  cat >&2 <<'ERR'
npx is not on PATH. It ships with Node.js / npm, which the project
already needs. If you're on a fresh shell, try opening a new terminal
or installing Node from https://nodejs.org.
ERR
  exit 1
fi

if [[ "$DATABASE_URL" == *":6543"* || "$DATABASE_URL" == *"pgbouncer"* ]]; then
  cat >&2 <<'ERR'
DATABASE_URL points at Supabase's connection pooler (pgbouncer, port
6543). The dump needs the direct connection — port 5432 — from the
same Supabase dashboard page.
ERR
  exit 1
fi

echo "→ Dumping public schema to $OUT (via npx supabase, may download CLI on first run)"
npx --yes supabase db dump \
  --db-url "$DATABASE_URL" \
  --schema public \
  -f "$OUT"

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
