import { createClient } from '@/lib/supabase/server'
import type { Project, ProjectTask, ProjectWithTasks, ProjectType, LogType } from '@/types/orchard'

// ── Project CRUD ─────────────────────────────────────────────────────────────

export async function getProjectsWithTasks(orchardId: string): Promise<ProjectWithTasks[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_tasks(*)')
    .eq('orchard_id', orchardId)
    .is('archived_at', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((p) => ({
    ...p,
    tasks: (p.project_tasks as ProjectTask[]) ?? [],
  }))
}

export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function getProjectWithTasks(projectId: string): Promise<ProjectWithTasks | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_tasks(*)')
    .eq('id', projectId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return {
    ...data,
    tasks: (data.project_tasks as ProjectTask[]) ?? [],
  }
}

export async function createProject(
  orchardId: string,
  name: string,
  projectType: ProjectType,
  options?: { species?: string; startYear?: number }
): Promise<Project> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({
      orchard_id: orchardId,
      name,
      project_type: projectType,
      species: options?.species ?? null,
      start_year: options?.startYear ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function archiveProject(projectId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', projectId)
  if (error) throw error
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) throw error
}

export async function advancePhase(projectId: string): Promise<void> {
  const supabase = createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('current_phase')
    .eq('id', projectId)
    .single()
  if (!project) throw new Error('Project not found')

  const { error } = await supabase
    .from('projects')
    .update({ current_phase: project.current_phase + 1 })
    .eq('id', projectId)
  if (error) throw error
}

// ── Project Task CRUD ────────────────────────────────────────────────────────

export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createProjectTask(
  projectId: string,
  fields: {
    title: string
    description?: string | null
    priority?: 1 | 2 | 3
    dueDate?: string | null
    logType?: LogType | null
    species?: string | null
    phase?: number | null
    period?: string | null
  }
): Promise<ProjectTask> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .insert({
      project_id: projectId,
      title: fields.title,
      description: fields.description ?? null,
      priority: fields.priority ?? 2,
      due_date: fields.dueDate ?? null,
      log_type: fields.logType ?? null,
      species: fields.species ?? null,
      phase: fields.phase ?? null,
      period: fields.period ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProjectTask(
  taskId: string,
  fields: {
    title?: string
    description?: string | null
    priority?: 1 | 2 | 3
    dueDate?: string | null
    notes?: string | null
  }
): Promise<void> {
  const supabase = createClient()
  const update: Record<string, unknown> = {}
  if (fields.title !== undefined) update.title = fields.title
  if (fields.description !== undefined) update.description = fields.description
  if (fields.priority !== undefined) update.priority = fields.priority
  if (fields.dueDate !== undefined) update.due_date = fields.dueDate
  if (fields.notes !== undefined) update.notes = fields.notes

  const { error } = await supabase
    .from('project_tasks')
    .update(update)
    .eq('id', taskId)
  if (error) throw error
}

export async function completeProjectTask(taskId: string): Promise<ProjectTask> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uncompleteProjectTask(taskId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('project_tasks')
    .update({ completed_at: null, completed_batch_id: null })
    .eq('id', taskId)
  if (error) throw error
}

export async function deleteProjectTask(taskId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('project_tasks').delete().eq('id', taskId)
  if (error) throw error
}

export async function setTaskBatchId(taskId: string, batchId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('project_tasks')
    .update({ completed_batch_id: batchId })
    .eq('id', taskId)
  if (error) throw error
}

// ── Bulk operations ──────────────────────────────────────────────────────────

export async function upsertProjectTasks(
  tasks: {
    project_id: string
    title: string
    description?: string | null
    priority?: number
    due_date?: string | null
    log_type?: string | null
    species?: string | null
    phase?: number | null
    period?: string | null
  }[]
): Promise<void> {
  if (tasks.length === 0) return
  const supabase = createClient()
  const { error } = await supabase
    .from('project_tasks')
    .upsert(tasks, { onConflict: 'project_id,title,period', ignoreDuplicates: true })
  if (error) throw error
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getIncompleteTasksByOrchard(orchardId: string): Promise<(ProjectTask & { project_name: string; project_type: ProjectType })[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*, project:projects!inner(name, project_type, orchard_id, archived_at)')
    .eq('projects.orchard_id', orchardId)
    .is('projects.archived_at', null)
    .is('completed_at', null)
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []).map((t) => {
    const project = t.project as unknown as { name: string; project_type: ProjectType }
    return {
      ...t,
      project_name: project.name,
      project_type: project.project_type,
    }
  })
}

export async function getCompletedTodayByOrchard(orchardId: string): Promise<(ProjectTask & { project_name: string; project_type: ProjectType })[]> {
  const supabase = createClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('project_tasks')
    .select('*, project:projects!inner(name, project_type, orchard_id, archived_at)')
    .eq('projects.orchard_id', orchardId)
    .is('projects.archived_at', null)
    .gte('completed_at', todayStart.toISOString())
    .order('completed_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((t) => {
    const project = t.project as unknown as { name: string; project_type: ProjectType }
    return {
      ...t,
      project_name: project.name,
      project_type: project.project_type,
    }
  })
}

export async function getExpertTaskLastGenerated(orchardId: string, period: string): Promise<Date | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .select('created_at, project:projects!inner(orchard_id, project_type)')
    .eq('projects.orchard_id', orchardId)
    .eq('projects.project_type', 'expert')
    .eq('period', period)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw error
  if (!data || data.length === 0) return null
  return new Date(data[0].created_at)
}

export async function getExpertProjectBySpecies(orchardId: string, species: string): Promise<Project | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('orchard_id', orchardId)
    .eq('project_type', 'expert')
    .eq('species', species)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function getPermacultureProject(orchardId: string): Promise<Project | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('orchard_id', orchardId)
    .eq('project_type', 'permaculture')
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function skipPhaseTasks(projectId: string, phase: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('project_tasks')
    .update({ completed_at: new Date().toISOString(), notes: 'skipped' })
    .eq('project_id', projectId)
    .eq('phase', phase)
    .is('completed_at', null)
  if (error) throw error
}
