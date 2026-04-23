-- ============================================================================
-- Orchard Tool — Row Tasks & Row Logs Migration
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- ── 1. row_logs: row-level logs (mow, etc.) ──────────────────────────────────
CREATE TABLE row_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id     uuid NOT NULL REFERENCES rows(id) ON DELETE CASCADE,
  log_type   text NOT NULL
             CHECK (log_type IN ('water','fertilize','production','note','scout','prune','mow')),
  notes      text,
  batch_id   uuid,
  logged_at  timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX row_logs_row_id_idx   ON row_logs(row_id, logged_at DESC);
CREATE INDEX row_logs_batch_id_idx ON row_logs(batch_id) WHERE batch_id IS NOT NULL;

-- ── 2. Extend logs.log_type to include 'mow' ─────────────────────────────────
-- Discover the current constraint name first if this fails:
--   SELECT conname FROM pg_constraint WHERE conrelid='logs'::regclass AND contype='c';
ALTER TABLE logs DROP CONSTRAINT IF EXISTS logs_log_type_check;
ALTER TABLE logs ADD CONSTRAINT logs_log_type_check
  CHECK (log_type IN ('water','fertilize','production','note','scout','prune','mow'));

-- ── 3. row_tasks: tasks scoped to a whole row ────────────────────────────────
CREATE TABLE row_tasks (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id             uuid NOT NULL REFERENCES rows(id) ON DELETE CASCADE,
  template_id        uuid REFERENCES task_templates(id) ON DELETE CASCADE,
  title              text NOT NULL,
  log_type           text CHECK (log_type IS NULL OR log_type IN
                       ('water','fertilize','production','note','scout','prune','mow')),
  due_date           date,
  completed_at       timestamptz,
  completed_batch_id uuid,
  period             text,
  notes              text,
  created_at         timestamptz DEFAULT now(),
  UNIQUE (row_id, template_id, period)
);
CREATE INDEX row_tasks_row_id_idx   ON row_tasks(row_id);
CREATE INDEX row_tasks_due_date_idx ON row_tasks(due_date) WHERE completed_at IS NULL;

-- ── 4. RLS (mirrors the strict style from rls-migration.sql Phase B) ─────────
ALTER TABLE row_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE row_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "row_logs_access" ON row_logs FOR ALL
  USING (row_id IN (SELECT r.id FROM rows r WHERE r.orchard_id IN (SELECT owned_orchard_ids())))
  WITH CHECK (row_id IN (SELECT r.id FROM rows r WHERE r.orchard_id IN (SELECT owned_orchard_ids())));

CREATE POLICY "row_tasks_access" ON row_tasks FOR ALL
  USING (row_id IN (SELECT r.id FROM rows r WHERE r.orchard_id IN (SELECT owned_orchard_ids())))
  WITH CHECK (row_id IN (SELECT r.id FROM rows r WHERE r.orchard_id IN (SELECT owned_orchard_ids())));
