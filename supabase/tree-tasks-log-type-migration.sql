-- ============================================================================
-- Orchard Tool — tree_tasks.log_type CHECK refresh
-- Adds 'mow' to tree_tasks.log_type_check so it matches the LogType enum
-- and every other *_log_type_check in the schema. Run in the Supabase
-- SQL Editor. Safe to re-run.
-- ============================================================================

ALTER TABLE tree_tasks DROP CONSTRAINT IF EXISTS tree_tasks_log_type_check;
ALTER TABLE tree_tasks ADD CONSTRAINT tree_tasks_log_type_check
  CHECK (log_type IS NULL OR log_type IN
    ('water','fertilize','production','note','scout','prune','mow'));
