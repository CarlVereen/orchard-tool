export type LogType = 'water' | 'fertilize' | 'production' | 'note' | 'scout' | 'prune' | 'mow'
export type TreeCondition = 'good' | 'fair' | 'poor' | 'dead'

export interface Orchard {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Row {
  id: string
  orchard_id: string
  label: string
  sort_order: number
  created_at: string
}

export interface Tree {
  id: string
  row_id: string
  position: number
  variety: string | null
  species: string | null
  planted_at: string | null
  notes: string | null
  rootstock: string | null
  condition: TreeCondition
  condition_notes: string | null
  watering_cycle_days: number | null
  archived_at: string | null
  archive_reason: string | null
  created_at: string
}

export interface Log {
  id: string
  tree_id: string
  log_type: LogType
  quantity: number | null
  unit: string | null
  notes: string | null
  batch_id: string | null
  target: string | null       // scout: pest/disease observed
  severity: number | null     // scout: 0-5 severity rating
  logged_at: string
  created_at: string
}

export interface TreeNote {
  id: string
  tree_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface TreePhoto {
  id: string
  tree_id: string
  storage_path: string
  caption: string | null
  taken_at: string
  created_at: string
}

export interface TreeSummary {
  last_watered: string | null
  last_fertilized: string | null
  last_pruned: string | null
  season_production_total: number | null
  season_production_unit: string | null
  logs_this_month: number
  next_water_due_in_days: number | null
}

// Enriched types for joined queries
export interface TreeWithLastLog extends Tree {
  last_log: Log | null
}

export interface RowWithTrees extends Row {
  trees: TreeWithLastLog[]
}

export interface LogWithTree extends Log {
  tree: Tree & { row: Row }
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export type TaskTargetScope = 'all' | 'rows' | 'trees' | 'per_row'

export type TaskScheduleType = 'annual' | 'monthly' | 'weekly' | 'daily' | 'interval'

export interface TaskTemplate {
  id: string
  orchard_id: string
  title: string
  description: string | null
  schedule_type: TaskScheduleType
  month_start: number
  month_end: number
  stagger_by_row: boolean
  target_scope: TaskTargetScope
  log_type: LogType | null
  active: boolean
  interval_days: number | null
  weekdays: number[] | null
  created_at: string
  row_ids: string[]
  tree_ids: string[]
}

export interface TreeTask {
  id: string
  tree_id: string
  template_id: string | null
  title: string
  log_type: LogType | null
  due_date: string | null
  completed_at: string | null
  period: string | null
  notes: string | null
  created_at: string
}

export interface RowTask {
  id: string
  row_id: string
  template_id: string | null
  title: string
  log_type: LogType | null
  due_date: string | null
  completed_at: string | null
  completed_batch_id: string | null
  period: string | null
  notes: string | null
  created_at: string
}

export interface RowLog {
  id: string
  row_id: string
  log_type: LogType
  notes: string | null
  batch_id: string | null
  logged_at: string
  created_at: string
}

// ── Projects & Project Tasks ─────────────────────────────────────────────────

export type ProjectType = 'expert' | 'permaculture' | 'user'

export interface Project {
  id: string
  orchard_id: string
  name: string
  project_type: ProjectType
  species: string | null
  start_year: number | null
  current_phase: number
  archived_at: string | null
  created_at: string
}

export interface ProjectTask {
  id: string
  project_id: string
  tree_id: string | null
  title: string
  description: string | null
  priority: 1 | 2 | 3
  due_date: string | null
  log_type: LogType | null
  species: string | null
  phase: number | null
  period: string | null
  completed_at: string | null
  completed_batch_id: string | null
  notes: string | null
  created_at: string
}

export interface ProjectWithTasks extends Project {
  tasks: ProjectTask[]
}

export interface DisplayTask extends ProjectTask {
  projectName: string
  projectType: ProjectType
  treeLabel?: string
  rowId?: string
  source: 'project' | 'tree' | 'row'
}
