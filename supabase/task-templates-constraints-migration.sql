-- ============================================================================
-- Orchard Tool — task_templates CHECK constraint refresh
-- Brings three constraints back in sync with recent feature work:
--   target_scope: adds 'per_row' (row-level tasks)
--   schedule_type: adds 'interval' (flexible schedules)
--   log_type: adds 'mow' (row-level activity)
-- Re-running is safe — every statement uses DROP ... IF EXISTS + ADD.
-- Run this in the Supabase SQL Editor.
-- ============================================================================

ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS task_templates_target_scope_check;
ALTER TABLE task_templates ADD CONSTRAINT task_templates_target_scope_check
  CHECK (target_scope IN ('all','rows','trees','per_row'));

ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS task_templates_schedule_type_check;
ALTER TABLE task_templates ADD CONSTRAINT task_templates_schedule_type_check
  CHECK (schedule_type IN ('annual','monthly','weekly','daily','interval'));

ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS task_templates_log_type_check;
ALTER TABLE task_templates ADD CONSTRAINT task_templates_log_type_check
  CHECK (log_type IS NULL OR log_type IN
    ('water','fertilize','production','note','scout','prune','mow'));
