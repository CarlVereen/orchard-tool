-- Orchard Tool — Live Schema Snapshot (public namespace)
--
-- Captured from the Supabase dashboard's schema visualizer. This is a
-- structural REFERENCE — not directly runnable. The visualizer omits
-- indexes, RLS policies, triggers, and functions, and emits CREATE
-- TABLE statements in alphabetical (not FK-dependency) order.
--
-- For from-scratch setup, apply the migration files in this folder.
-- Refresh this snapshot after schema changes via:
--   Supabase dashboard → Database → Schema Visualizer → "Copy as SQL"

CREATE TABLE public.logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL,
  log_type text NOT NULL CHECK (log_type = ANY (ARRAY['water'::text, 'fertilize'::text, 'production'::text, 'note'::text, 'scout'::text, 'prune'::text, 'mow'::text])),
  quantity numeric,
  unit text,
  notes text,
  batch_id uuid,
  logged_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  target text,
  severity integer CHECK (severity IS NULL OR severity >= 0 AND severity <= 5),
  CONSTRAINT logs_pkey PRIMARY KEY (id),
  CONSTRAINT logs_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id)
);
CREATE TABLE public.orchards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL,
  CONSTRAINT orchards_pkey PRIMARY KEY (id),
  CONSTRAINT orchards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.project_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  priority integer NOT NULL DEFAULT 2 CHECK (priority = ANY (ARRAY[1, 2, 3])),
  due_date date,
  log_type text CHECK (log_type IS NULL OR (log_type = ANY (ARRAY['water'::text, 'fertilize'::text, 'production'::text, 'note'::text, 'scout'::text, 'prune'::text, 'mow'::text]))),
  species text,
  phase integer,
  period text,
  completed_at timestamp with time zone,
  completed_batch_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  tree_id uuid,
  CONSTRAINT project_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT project_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_tasks_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  orchard_id uuid NOT NULL,
  name text NOT NULL,
  project_type text NOT NULL CHECK (project_type = ANY (ARRAY['expert'::text, 'permaculture'::text, 'user'::text])),
  species text,
  start_year integer,
  current_phase integer DEFAULT 1,
  archived_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_orchard_id_fkey FOREIGN KEY (orchard_id) REFERENCES public.orchards(id)
);
CREATE TABLE public.row_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  row_id uuid NOT NULL,
  log_type text NOT NULL CHECK (log_type = ANY (ARRAY['water'::text, 'fertilize'::text, 'production'::text, 'note'::text, 'scout'::text, 'prune'::text, 'mow'::text])),
  notes text,
  batch_id uuid,
  logged_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT row_logs_pkey PRIMARY KEY (id),
  CONSTRAINT row_logs_row_id_fkey FOREIGN KEY (row_id) REFERENCES public.rows(id)
);
CREATE TABLE public.row_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  row_id uuid NOT NULL,
  template_id uuid,
  title text NOT NULL,
  log_type text CHECK (log_type IS NULL OR (log_type = ANY (ARRAY['water'::text, 'fertilize'::text, 'production'::text, 'note'::text, 'scout'::text, 'prune'::text, 'mow'::text]))),
  due_date date,
  completed_at timestamp with time zone,
  completed_batch_id uuid,
  period text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT row_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT row_tasks_row_id_fkey FOREIGN KEY (row_id) REFERENCES public.rows(id),
  CONSTRAINT row_tasks_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.task_templates(id)
);
CREATE TABLE public.rows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  orchard_id uuid NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rows_pkey PRIMARY KEY (id),
  CONSTRAINT rows_orchard_id_fkey FOREIGN KEY (orchard_id) REFERENCES public.orchards(id)
);
CREATE TABLE public.task_template_rows (
  template_id uuid NOT NULL,
  row_id uuid NOT NULL,
  CONSTRAINT task_template_rows_pkey PRIMARY KEY (template_id, row_id),
  CONSTRAINT task_template_rows_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.task_templates(id),
  CONSTRAINT task_template_rows_row_id_fkey FOREIGN KEY (row_id) REFERENCES public.rows(id)
);
CREATE TABLE public.task_template_trees (
  template_id uuid NOT NULL,
  tree_id uuid NOT NULL,
  CONSTRAINT task_template_trees_pkey PRIMARY KEY (template_id, tree_id),
  CONSTRAINT task_template_trees_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.task_templates(id),
  CONSTRAINT task_template_trees_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id)
);
CREATE TABLE public.task_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  orchard_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  schedule_type text NOT NULL CHECK (schedule_type = ANY (ARRAY['annual'::text, 'monthly'::text, 'weekly'::text, 'daily'::text, 'interval'::text])),
  month_start integer NOT NULL DEFAULT 1 CHECK (month_start >= 1 AND month_start <= 12),
  month_end integer NOT NULL DEFAULT 12 CHECK (month_end >= 1 AND month_end <= 12),
  stagger_by_row boolean NOT NULL DEFAULT false,
  target_scope text NOT NULL DEFAULT 'all'::text CHECK (target_scope = ANY (ARRAY['all'::text, 'rows'::text, 'trees'::text, 'per_row'::text])),
  log_type text CHECK (log_type IS NULL OR (log_type = ANY (ARRAY['water'::text, 'fertilize'::text, 'production'::text, 'note'::text, 'scout'::text, 'prune'::text, 'mow'::text]))),
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  interval_days integer CHECK (interval_days IS NULL OR interval_days > 0),
  weekdays smallint[] CHECK (weekdays IS NULL OR array_length(weekdays, 1) >= 1 AND array_length(weekdays, 1) <= 7 AND weekdays <@ ARRAY[0::smallint, 1::smallint, 2::smallint, 3::smallint, 4::smallint, 5::smallint, 6::smallint]),
  CONSTRAINT task_templates_pkey PRIMARY KEY (id),
  CONSTRAINT task_templates_orchard_id_fkey FOREIGN KEY (orchard_id) REFERENCES public.orchards(id)
);
CREATE TABLE public.tree_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tree_notes_pkey PRIMARY KEY (id),
  CONSTRAINT tree_notes_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id)
);
CREATE TABLE public.tree_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL,
  storage_path text NOT NULL,
  caption text,
  taken_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tree_photos_pkey PRIMARY KEY (id),
  CONSTRAINT tree_photos_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id)
);
CREATE TABLE public.tree_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL,
  template_id uuid,
  title text NOT NULL,
  log_type text CHECK (log_type = ANY (ARRAY['water'::text, 'fertilize'::text, 'production'::text, 'note'::text, 'scout'::text, 'prune'::text])),
  due_date date,
  completed_at timestamp with time zone,
  period text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tree_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tree_tasks_tree_id_fkey FOREIGN KEY (tree_id) REFERENCES public.trees(id),
  CONSTRAINT tree_tasks_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.task_templates(id)
);
CREATE TABLE public.trees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  row_id uuid NOT NULL,
  position integer NOT NULL,
  variety text,
  species text,
  planted_at date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  rootstock text,
  condition text DEFAULT 'good'::text CHECK (condition = ANY (ARRAY['good'::text, 'fair'::text, 'poor'::text, 'dead'::text])),
  condition_notes text,
  watering_cycle_days integer,
  archived_at timestamp with time zone,
  archive_reason text,
  CONSTRAINT trees_pkey PRIMARY KEY (id),
  CONSTRAINT trees_row_id_fkey FOREIGN KEY (row_id) REFERENCES public.rows(id)
);