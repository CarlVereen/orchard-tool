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
