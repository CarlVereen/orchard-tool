-- Orchard Tool — Database Schema
-- Run this in the Supabase SQL Editor to set up the database.

CREATE TABLE orchards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE rows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orchard_id  uuid NOT NULL REFERENCES orchards(id) ON DELETE CASCADE,
  label       text NOT NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE trees (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id      uuid NOT NULL REFERENCES rows(id) ON DELETE CASCADE,
  position    int  NOT NULL,
  variety     text,
  species     text,
  planted_at  date,
  notes       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (row_id, position)
);

CREATE TABLE logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id     uuid NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  log_type    text NOT NULL CHECK (log_type IN ('water','fertilize','production','note')),
  quantity    numeric,
  unit        text,
  notes       text,
  batch_id    uuid,
  logged_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX ON logs(tree_id, logged_at DESC);
CREATE INDEX ON trees(row_id, position);
CREATE INDEX ON rows(orchard_id, sort_order);

-- ── Projects & Project Tasks (v3) ────────────────────────────────────────────

CREATE TABLE projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orchard_id    uuid NOT NULL REFERENCES orchards(id) ON DELETE CASCADE,
  name          text NOT NULL,
  project_type  text NOT NULL CHECK (project_type IN ('expert', 'permaculture', 'user')),
  species       text,
  start_year    int,
  current_phase int DEFAULT 1,
  archived_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX projects_orchard_id_idx ON projects(orchard_id, project_type);
CREATE UNIQUE INDEX projects_expert_species_idx
  ON projects(orchard_id, project_type, species) WHERE project_type = 'expert';

CREATE TABLE project_tasks (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tree_id            uuid REFERENCES trees(id) ON DELETE SET NULL,
  title              text NOT NULL,
  description        text,
  priority           int NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  due_date           date,
  log_type           text CHECK (log_type IS NULL OR log_type IN ('water','fertilize','production','note','scout','prune')),
  species            text,
  phase              int,
  period             text,
  completed_at       timestamptz,
  completed_batch_id uuid,
  notes              text,
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX project_tasks_project_id_idx ON project_tasks(project_id);
CREATE INDEX project_tasks_due_date_idx ON project_tasks(due_date) WHERE completed_at IS NULL;
