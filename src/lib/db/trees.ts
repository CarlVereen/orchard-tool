import { createClient } from '@/lib/supabase/server'
import type { Tree, TreeSummary } from '@/types/orchard'

export async function getTree(treeId: string): Promise<Tree | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .eq('id', treeId)
    .single()
  if (error) throw error
  return data
}

export async function createTree(
  rowId: string,
  position: number,
  fields?: Partial<Pick<Tree, 'variety' | 'species' | 'planted_at' | 'notes'>>
): Promise<Tree> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trees')
    .insert({ row_id: rowId, position, ...fields })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTree(
  id: string,
  updates: Partial<Pick<Tree,
    'variety' | 'species' | 'planted_at' | 'notes' |
    'rootstock' | 'condition' | 'condition_notes' | 'watering_cycle_days'
  >>
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('trees').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteTree(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('trees').delete().eq('id', id)
  if (error) throw error
}

export async function archiveTree(id: string, reason: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('trees')
    .update({ archived_at: new Date().toISOString(), archive_reason: reason })
    .eq('id', id)
  if (error) throw error
}

export async function moveTree(id: string, newRowId: string, newPosition: number): Promise<void> {
  const supabase = createClient()
  // Check for position conflict in target row
  const { data: conflict } = await supabase
    .from('trees')
    .select('id')
    .eq('row_id', newRowId)
    .eq('position', newPosition)
    .neq('id', id)
    .single()
  if (conflict) throw new Error(`Position ${newPosition} is already occupied in that row`)
  const { error } = await supabase
    .from('trees')
    .update({ row_id: newRowId, position: newPosition })
    .eq('id', id)
  if (error) throw error
}

export async function getTreeSummary(treeId: string, wateringCycleDays: number | null): Promise<TreeSummary> {
  const supabase = createClient()

  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: logs } = await supabase
    .from('logs')
    .select('log_type, quantity, unit, logged_at')
    .eq('tree_id', treeId)
    .order('logged_at', { ascending: false })

  const allLogs = logs ?? []

  const lastOf = (type: string) =>
    allLogs.find((l) => l.log_type === type)?.logged_at ?? null

  const productionLogs = allLogs.filter(
    (l) => l.log_type === 'production' && l.logged_at >= yearStart
  )
  const seasonTotal = productionLogs.reduce((sum, l) => sum + (l.quantity ?? 0), 0)
  const seasonUnit = productionLogs.find((l) => l.unit)?.unit ?? null

  const logsThisMonth = allLogs.filter((l) => l.logged_at >= monthStart).length

  const lastWatered = lastOf('water')
  let nextWaterDueInDays: number | null = null
  if (wateringCycleDays && lastWatered) {
    const daysSince = (now.getTime() - new Date(lastWatered).getTime()) / (1000 * 60 * 60 * 24)
    nextWaterDueInDays = Math.round(wateringCycleDays - daysSince)
  } else if (wateringCycleDays && !lastWatered) {
    nextWaterDueInDays = 0 // overdue — never watered
  }

  return {
    last_watered: lastWatered,
    last_fertilized: lastOf('fertilize'),
    last_pruned: lastOf('prune'),
    season_production_total: seasonTotal > 0 ? seasonTotal : null,
    season_production_unit: seasonUnit,
    logs_this_month: logsThisMonth,
    next_water_due_in_days: nextWaterDueInDays,
  }
}
