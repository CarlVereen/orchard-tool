-- ============================================================================
-- Orchard Tool — project_tasks.log_type CHECK refresh
-- Adds 'mow' to project_tasks.log_type_check so it matches the LogType enum
-- and the constraints on logs / row_logs / row_tasks / task_templates.
-- Run this in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

ALTER TABLE project_tasks DROP CONSTRAINT IF EXISTS project_tasks_log_type_check;
ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_log_type_check
  CHECK (log_type IS NULL OR log_type IN
    ('water','fertilize','production','note','scout','prune','mow'));
