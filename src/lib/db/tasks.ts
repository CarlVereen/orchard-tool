import { createClient } from '@/lib/supabase/server'
import type { TreeTask, TaskTemplate, TaskTargetScope, LogType } from '@/types/orchard'

// ── Task CRUD ─────────────────────────────────────────────────────────────────

export async function getTasksForTree(treeId: string): Promise<TreeTask[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tree_tasks')
    .select('*')
    .eq('tree_id', treeId)
    .order('completed_at', { ascending: true, nullsFirst: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createManualTask(
  treeId: string,
  title: string,
  logType?: LogType,
  dueDate?: string,
  notes?: string
): Promise<TreeTask> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tree_tasks')
    .insert({
      tree_id: treeId,
      title,
      log_type: logType ?? null,
      due_date: dueDate ?? null,
      notes: notes ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function completeTask(id: string): Promise<TreeTask> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tree_tasks')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uncompleteTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('tree_tasks')
    .update({ completed_at: null })
    .eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tree_tasks').delete().eq('id', id)
  if (error) throw error
}

// ── Template CRUD ─────────────────────────────────────────────────────────────

type TemplateFields = {
  title: string
  description?: string | null
  schedule_type: 'annual' | 'monthly' | 'weekly' | 'daily'
  month_start: number
  month_end: number
  stagger_by_row: boolean
  target_scope: TaskTargetScope
  log_type: LogType | null
  active: boolean
}

export async function getTemplates(orchardId: string): Promise<TaskTemplate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('task_templates')
    .select('*, task_template_rows(row_id), task_template_trees(tree_id)')
    .eq('orchard_id', orchardId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((t) => ({
    ...t,
    row_ids: (t.task_template_rows as { row_id: string }[]).map((r) => r.row_id),
    tree_ids: (t.task_template_trees as { tree_id: string }[]).map((r) => r.tree_id),
  }))
}

export async function createTemplate(
  orchardId: string,
  fields: TemplateFields,
  rowIds: string[],
  treeIds: string[]
): Promise<TaskTemplate> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('task_templates')
    .insert({ orchard_id: orchardId, ...fields })
    .select()
    .single()
  if (error) throw error

  if ((fields.target_scope === 'rows' || fields.target_scope === 'per_row') && rowIds.length > 0) {
    await supabase
      .from('task_template_rows')
      .insert(rowIds.map((row_id) => ({ template_id: data.id, row_id })))
  }
  if (fields.target_scope === 'trees' && treeIds.length > 0) {
    await supabase
      .from('task_template_trees')
      .insert(treeIds.map((tree_id) => ({ template_id: data.id, tree_id })))
  }

  return { ...data, row_ids: rowIds, tree_ids: treeIds }
}

export async function updateTemplate(
  id: string,
  fields: TemplateFields,
  rowIds: string[],
  treeIds: string[]
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('task_templates').update(fields).eq('id', id)
  if (error) throw error

  // Re-sync junction tables
  await supabase.from('task_template_rows').delete().eq('template_id', id)
  await supabase.from('task_template_trees').delete().eq('template_id', id)

  if ((fields.target_scope === 'rows' || fields.target_scope === 'per_row') && rowIds.length > 0) {
    await supabase
      .from('task_template_rows')
      .insert(rowIds.map((row_id) => ({ template_id: id, row_id })))
  }
  if (fields.target_scope === 'trees' && treeIds.length > 0) {
    await supabase
      .from('task_template_trees')
      .insert(treeIds.map((tree_id) => ({ template_id: id, tree_id })))
  }
}

export async function toggleTemplateActive(id: string, active: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('task_templates').update({ active }).eq('id', id)
  if (error) throw error
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('task_templates').delete().eq('id', id)
  if (error) throw error
}

// ── Generation ────────────────────────────────────────────────────────────────

export async function generateTasksForCurrentPeriod(orchardId: string): Promise<void> {
  const supabase = createClient()
  const templates = await getTemplates(orchardId)
  const activeTemplates = templates.filter((t) => t.active)
  if (activeTemplates.length === 0) return

  // Fetch all rows with non-archived trees
  const { data: rows } = await supabase
    .from('rows')
    .select('id, sort_order, trees!inner(id, row_id, archived_at)')
    .eq('orchard_id', orchardId)
    .is('trees.archived_at', null)
    .order('sort_order', { ascending: true })

  if (!rows || rows.length === 0) return

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const pad = (n: number) => String(n).padStart(2, '0')

  const tasksToInsert: {
    tree_id: string
    template_id: string
    title: string
    log_type: LogType | null
    due_date: string
    period: string
  }[] = []

  const rowTasksToInsert: {
    row_id: string
    template_id: string
    title: string
    log_type: LogType | null
    due_date: string
    period: string
  }[] = []

  // ISO week number helper
  const isoWeek = (d: Date) => {
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
    return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  for (const template of activeTemplates) {
    let period: string
    let inWindow: boolean

    if (template.schedule_type === 'annual') {
      period = String(currentYear)
      inWindow = currentMonth >= template.month_start && currentMonth <= template.month_end
    } else if (template.schedule_type === 'weekly') {
      period = `${currentYear}-W${pad(isoWeek(now))}`
      inWindow = true
    } else if (template.schedule_type === 'daily') {
      period = `${currentYear}-${pad(currentMonth)}-${pad(now.getDate())}`
      inWindow = true
    } else {
      period = `${currentYear}-${pad(currentMonth)}`
      inWindow = true
    }

    if (!inWindow) continue

    // Determine target rows
    type RowWithTrees = { id: string; sort_order: number; trees: { id: string }[] }
    let targetRows: RowWithTrees[]
    if (template.target_scope === 'rows' || template.target_scope === 'per_row') {
      targetRows = (rows as RowWithTrees[]).filter((r) => template.row_ids.includes(r.id))
    } else if (template.target_scope === 'trees') {
      targetRows = (rows as RowWithTrees[]).map((r) => ({
        ...r,
        trees: r.trees.filter((t) => template.tree_ids.includes(t.id)),
      })).filter((r) => r.trees.length > 0)
    } else {
      targetRows = rows as RowWithTrees[]
    }

    if (targetRows.length === 0) continue

    targetRows.forEach((row, rowIndex) => {
      let dueDate: string
      if (template.schedule_type === 'annual') {
        dueDate = `${currentYear}-${pad(template.month_start)}-01`
      } else if (template.schedule_type === 'daily') {
        dueDate = `${currentYear}-${pad(currentMonth)}-${pad(now.getDate())}`
      } else if (template.schedule_type === 'weekly') {
        // Due on Monday of the current week
        const dayOfWeek = now.getDay() // 0=Sun
        const monday = new Date(now)
        monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
        dueDate = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`
      } else if (template.stagger_by_row && template.target_scope !== 'trees') {
        const day = Math.floor((rowIndex / targetRows.length) * daysInMonth) + 1
        dueDate = `${currentYear}-${pad(currentMonth)}-${pad(day)}`
      } else {
        dueDate = `${currentYear}-${pad(currentMonth)}-01`
      }

      if (template.target_scope === 'per_row') {
        rowTasksToInsert.push({
          row_id: row.id,
          template_id: template.id,
          title: template.title,
          log_type: template.log_type,
          due_date: dueDate,
          period,
        })
        return
      }

      for (const tree of row.trees) {
        tasksToInsert.push({
          tree_id: tree.id,
          template_id: template.id,
          title: template.title,
          log_type: template.log_type,
          due_date: dueDate,
          period,
        })
      }
    })
  }

  if (tasksToInsert.length > 0) {
    await supabase
      .from('tree_tasks')
      .upsert(tasksToInsert, { onConflict: 'tree_id,template_id,period', ignoreDuplicates: true })
  }

  if (rowTasksToInsert.length > 0) {
    await supabase
      .from('row_tasks')
      .upsert(rowTasksToInsert, { onConflict: 'row_id,template_id,period', ignoreDuplicates: true })
  }
}

// ── Orchard-wide tree task queries ───────────────────────────────────────────

export async function getIncompleteTreeTasksByOrchard(orchardId: string): Promise<(TreeTask & { tree_label: string | null })[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tree_tasks')
    .select('*, tree:trees!inner(variety, position, archived_at, row:rows!inner(label, orchard_id))')
    .eq('trees.rows.orchard_id', orchardId)
    .is('trees.archived_at', null)
    .is('completed_at', null)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((t) => {
    const tree = t.tree as unknown as { variety: string | null; position: number; row: { label: string } } | null
    return {
      ...t,
      tree_label: tree ? `${tree.variety ?? tree.row.label} #${tree.position}` : null,
    }
  })
}

// ── Attention queries ─────────────────────────────────────────────────────────

export async function getPendingTaskTreeIds(treeIds: string[]): Promise<Set<string>> {
  if (treeIds.length === 0) return new Set()
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('tree_tasks')
    .select('tree_id')
    .in('tree_id', treeIds)
    .is('completed_at', null)
    .or(`due_date.is.null,due_date.lte.${today}`)
  if (error) throw error
  return new Set((data ?? []).map((r) => r.tree_id))
}

export async function getPendingTaskCountByTree(
  treeIds: string[]
): Promise<Map<string, number>> {
  if (treeIds.length === 0) return new Map()
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('tree_tasks')
    .select('tree_id')
    .in('tree_id', treeIds)
    .is('completed_at', null)
    .or(`due_date.is.null,due_date.lte.${today}`)
  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    counts.set(row.tree_id, (counts.get(row.tree_id) ?? 0) + 1)
  }
  return counts
}
