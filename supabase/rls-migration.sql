-- ============================================================================
-- Orchard Tool — RLS Migration
-- Run this in the Supabase SQL Editor BEFORE deploying the auth code changes.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- PHASE A: Run BEFORE deploying code
-- Enables RLS with transition policies so existing data stays accessible
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Add user_id column to orchards (nullable initially)
ALTER TABLE orchards ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 2. Helper function: returns all tree IDs owned by the current user
--    Used in policies for logs, tree_notes, tree_photos, tree_tasks
CREATE OR REPLACE FUNCTION owned_tree_ids()
RETURNS SETOF uuid AS $$
  SELECT t.id FROM trees t
  JOIN rows r ON t.row_id = r.id
  JOIN orchards o ON r.orchard_id = o.id
  WHERE o.user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Helper function: returns all orchard IDs owned by the current user
CREATE OR REPLACE FUNCTION owned_orchard_ids()
RETURNS SETOF uuid AS $$
  SELECT id FROM orchards WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Enable RLS on all tables
ALTER TABLE orchards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_template_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_template_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- 5. Create TRANSITION policies (allow access when user_id IS NULL so
--    existing data works until you claim it in Phase B)

-- orchards
CREATE POLICY "orchards_access" ON orchards FOR ALL
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid());

-- rows (via orchards)
CREATE POLICY "rows_access" ON rows FOR ALL
  USING (orchard_id IN (SELECT id FROM orchards WHERE user_id = auth.uid() OR user_id IS NULL))
  WITH CHECK (orchard_id IN (SELECT owned_orchard_ids()));

-- trees (via rows -> orchards)
CREATE POLICY "trees_access" ON trees FOR ALL
  USING (row_id IN (SELECT id FROM rows WHERE orchard_id IN (SELECT id FROM orchards WHERE user_id = auth.uid() OR user_id IS NULL)))
  WITH CHECK (row_id IN (SELECT r.id FROM rows r JOIN orchards o ON r.orchard_id = o.id WHERE o.user_id = auth.uid()));

-- logs (via trees)
CREATE POLICY "logs_access" ON logs FOR ALL
  USING (tree_id IN (SELECT owned_tree_ids()) OR tree_id IN (SELECT t.id FROM trees t JOIN rows r ON t.row_id = r.id JOIN orchards o ON r.orchard_id = o.id WHERE o.user_id IS NULL))
  WITH CHECK (tree_id IN (SELECT owned_tree_ids()));

-- tree_notes (via trees)
CREATE POLICY "tree_notes_access" ON tree_notes FOR ALL
  USING (tree_id IN (SELECT owned_tree_ids()) OR tree_id IN (SELECT t.id FROM trees t JOIN rows r ON t.row_id = r.id JOIN orchards o ON r.orchard_id = o.id WHERE o.user_id IS NULL))
  WITH CHECK (tree_id IN (SELECT owned_tree_ids()));

-- tree_photos (via trees)
CREATE POLICY "tree_photos_access" ON tree_photos FOR ALL
  USING (tree_id IN (SELECT owned_tree_ids()) OR tree_id IN (SELECT t.id FROM trees t JOIN rows r ON t.row_id = r.id JOIN orchards o ON r.orchard_id = o.id WHERE o.user_id IS NULL))
  WITH CHECK (tree_id IN (SELECT owned_tree_ids()));

-- tree_tasks (via trees)
CREATE POLICY "tree_tasks_access" ON tree_tasks FOR ALL
  USING (tree_id IN (SELECT owned_tree_ids()) OR tree_id IN (SELECT t.id FROM trees t JOIN rows r ON t.row_id = r.id JOIN orchards o ON r.orchard_id = o.id WHERE o.user_id IS NULL))
  WITH CHECK (tree_id IN (SELECT owned_tree_ids()));

-- task_templates (via orchards)
CREATE POLICY "task_templates_access" ON task_templates FOR ALL
  USING (orchard_id IN (SELECT id FROM orchards WHERE user_id = auth.uid() OR user_id IS NULL))
  WITH CHECK (orchard_id IN (SELECT owned_orchard_ids()));

-- task_template_rows (via task_templates -> orchards)
CREATE POLICY "task_template_rows_access" ON task_template_rows FOR ALL
  USING (template_id IN (SELECT id FROM task_templates WHERE orchard_id IN (SELECT id FROM orchards WHERE user_id = auth.uid() OR user_id IS NULL)))
  WITH CHECK (template_id IN (SELECT id FROM task_templates WHERE orchard_id IN (SELECT owned_orchard_ids())));

-- task_template_trees (via task_templates -> orchards)
CREATE POLICY "task_template_trees_access" ON task_template_trees FOR ALL
  USING (template_id IN (SELECT id FROM task_templates WHERE orchard_id IN (SELECT id FROM orchards WHERE user_id = auth.uid() OR user_id IS NULL)))
  WITH CHECK (template_id IN (SELECT id FROM task_templates WHERE orchard_id IN (SELECT owned_orchard_ids())));

-- projects (via orchards)
CREATE POLICY "projects_access" ON projects FOR ALL
  USING (orchard_id IN (SELECT id FROM orchards WHERE user_id = auth.uid() OR user_id IS NULL))
  WITH CHECK (orchard_id IN (SELECT owned_orchard_ids()));

-- project_tasks (via projects -> orchards)
CREATE POLICY "project_tasks_access" ON project_tasks FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE orchard_id IN (SELECT id FROM orchards WHERE user_id = auth.uid() OR user_id IS NULL)))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE orchard_id IN (SELECT owned_orchard_ids())));

-- 6. Storage policies for tree-photos bucket
-- These use RLS on the storage.objects table, which is how Supabase manages storage access.

CREATE POLICY "auth_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tree-photos');

CREATE POLICY "auth_read" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'tree-photos');

CREATE POLICY "auth_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tree-photos');

CREATE POLICY "auth_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tree-photos');


-- ────────────────────────────────────────────────────────────────────────────
-- PHASE B: Run AFTER signing up and copying your auth UID
-- Claims your existing data and tightens all policies
-- ────────────────────────────────────────────────────────────────────────────
-- IMPORTANT: Replace YOUR_AUTH_UID_HERE with your actual user ID from
-- Supabase Dashboard > Authentication > Users > click your email > copy UID

/*

-- B1. Claim your existing orchard
UPDATE orchards SET user_id = 'YOUR_AUTH_UID_HERE' WHERE user_id IS NULL;

-- B2. Make user_id required
ALTER TABLE orchards ALTER COLUMN user_id SET NOT NULL;

-- B3. Drop transition policies and recreate strict ones

-- orchards
DROP POLICY "orchards_access" ON orchards;
CREATE POLICY "orchards_access" ON orchards FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- rows
DROP POLICY "rows_access" ON rows;
CREATE POLICY "rows_access" ON rows FOR ALL
  USING (orchard_id IN (SELECT owned_orchard_ids()))
  WITH CHECK (orchard_id IN (SELECT owned_orchard_ids()));

-- trees
DROP POLICY "trees_access" ON trees;
CREATE POLICY "trees_access" ON trees FOR ALL
  USING (row_id IN (SELECT r.id FROM rows r WHERE r.orchard_id IN (SELECT owned_orchard_ids())))
  WITH CHECK (row_id IN (SELECT r.id FROM rows r WHERE r.orchard_id IN (SELECT owned_orchard_ids())));

-- logs
DROP POLICY "logs_access" ON logs;
CREATE POLICY "logs_access" ON logs FOR ALL
  USING (tree_id IN (SELECT owned_tree_ids()))
  WITH CHECK (tree_id IN (SELECT owned_tree_ids()));

-- tree_notes
DROP POLICY "tree_notes_access" ON tree_notes;
CREATE POLICY "tree_notes_access" ON tree_notes FOR ALL
  USING (tree_id IN (SELECT owned_tree_ids()))
  WITH CHECK (tree_id IN (SELECT owned_tree_ids()));

-- tree_photos
DROP POLICY "tree_photos_access" ON tree_photos;
CREATE POLICY "tree_photos_access" ON tree_photos FOR ALL
  USING (tree_id IN (SELECT owned_tree_ids()))
  WITH CHECK (tree_id IN (SELECT owned_tree_ids()));

-- tree_tasks
DROP POLICY "tree_tasks_access" ON tree_tasks;
CREATE POLICY "tree_tasks_access" ON tree_tasks FOR ALL
  USING (tree_id IN (SELECT owned_tree_ids()))
  WITH CHECK (tree_id IN (SELECT owned_tree_ids()));

-- task_templates
DROP POLICY "task_templates_access" ON task_templates;
CREATE POLICY "task_templates_access" ON task_templates FOR ALL
  USING (orchard_id IN (SELECT owned_orchard_ids()))
  WITH CHECK (orchard_id IN (SELECT owned_orchard_ids()));

-- task_template_rows
DROP POLICY "task_template_rows_access" ON task_template_rows;
CREATE POLICY "task_template_rows_access" ON task_template_rows FOR ALL
  USING (template_id IN (SELECT id FROM task_templates WHERE orchard_id IN (SELECT owned_orchard_ids())))
  WITH CHECK (template_id IN (SELECT id FROM task_templates WHERE orchard_id IN (SELECT owned_orchard_ids())));

-- task_template_trees
DROP POLICY "task_template_trees_access" ON task_template_trees;
CREATE POLICY "task_template_trees_access" ON task_template_trees FOR ALL
  USING (template_id IN (SELECT id FROM task_templates WHERE orchard_id IN (SELECT owned_orchard_ids())))
  WITH CHECK (template_id IN (SELECT id FROM task_templates WHERE orchard_id IN (SELECT owned_orchard_ids())));

-- projects
DROP POLICY "projects_access" ON projects;
CREATE POLICY "projects_access" ON projects FOR ALL
  USING (orchard_id IN (SELECT owned_orchard_ids()))
  WITH CHECK (orchard_id IN (SELECT owned_orchard_ids()));

-- project_tasks
DROP POLICY "project_tasks_access" ON project_tasks;
CREATE POLICY "project_tasks_access" ON project_tasks FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE orchard_id IN (SELECT owned_orchard_ids())))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE orchard_id IN (SELECT owned_orchard_ids())));

-- B4. After verifying everything works, disable signups:
-- Go to Supabase Dashboard > Authentication > Settings
-- Toggle OFF "Allow new users to sign up"

*/
