-- ============================================================================
-- Orchard Tool — task_templates CHECK constraint refresh
-- Extends target_scope to include 'per_row' (added in the row-level tasks
-- feature) and schedule_type to include 'interval' (added with flexible
-- schedules). Run this in the Supabase SQL Editor.
-- ============================================================================

ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS task_templates_target_scope_check;
ALTER TABLE task_templates ADD CONSTRAINT task_templates_target_scope_check
  CHECK (target_scope IN ('all','rows','trees','per_row'));

ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS task_templates_schedule_type_check;
ALTER TABLE task_templates ADD CONSTRAINT task_templates_schedule_type_check
  CHECK (schedule_type IN ('annual','monthly','weekly','daily','interval'));
