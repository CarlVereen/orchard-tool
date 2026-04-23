-- ============================================================================
-- Orchard Tool — Flexible Schedules Migration
-- Adds interval-based scheduling and per-weekday support on weekly templates.
-- Run this in the Supabase SQL Editor.
-- ============================================================================

ALTER TABLE task_templates
  ADD COLUMN IF NOT EXISTS interval_days int,
  ADD COLUMN IF NOT EXISTS weekdays      smallint[];

-- Interval must be a positive integer when set.
ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS task_templates_interval_days_check;
ALTER TABLE task_templates ADD CONSTRAINT task_templates_interval_days_check
  CHECK (interval_days IS NULL OR interval_days > 0);

-- Weekday values must each be 0..6 (0=Sun..6=Sat).
ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS task_templates_weekdays_check;
ALTER TABLE task_templates ADD CONSTRAINT task_templates_weekdays_check
  CHECK (weekdays IS NULL OR (
    array_length(weekdays, 1) BETWEEN 1 AND 7
    AND weekdays <@ ARRAY[0,1,2,3,4,5,6]::smallint[]
  ));
