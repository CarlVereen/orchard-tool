import { createClient } from '@/lib/supabase/server'
import type { Row, RowWithTrees, TreeWithLastLog, Log } from '@/types/orchard'

export async function getRows(orchardId: string): Promise<Row[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rows')
    .select('*')
    .eq('orchard_id', orchardId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getActiveTreeIdsForRow(rowId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trees')
    .select('id')
    .eq('row_id', rowId)
    .is('archived_at', null)
  if (error) throw error
  return (data ?? []).map((t) => t.id)
}

export async function getRowWithTrees(rowId: string): Promise<RowWithTrees | null> {
  const supabase = createClient()
  const { data: row, error: rowError } = await supabase
    .from('rows')
    .select('*')
    .eq('id', rowId)
    .single()
  if (rowError) throw rowError

  const { data: trees, error: treesError } = await supabase
    .from('trees')
    .select('*')
    .eq('row_id', rowId)
    .is('archived_at', null)
    .order('position', { ascending: true })
  if (treesError) throw treesError

  // Batch-fetch the most recent log per tree in a single query
  const treeIds = (trees ?? []).map((t) => t.id)
  const lastLogByTreeId = new Map<string, Log>()
  if (treeIds.length > 0) {
    const { data: allLogs, error: logsError } = await supabase
      .from('logs')
      .select('*')
      .in('tree_id', treeIds)
      .order('logged_at', { ascending: false })
    if (logsError) throw logsError

    for (const log of (allLogs ?? []) as Log[]) {
      if (!lastLogByTreeId.has(log.tree_id)) {
        lastLogByTreeId.set(log.tree_id, log)
      }
    }
  }

  const treesWithLogs: TreeWithLastLog[] = (trees ?? []).map((tree) => ({
    ...tree,
    last_log: lastLogByTreeId.get(tree.id) ?? null,
  }))

  return { ...row, trees: treesWithLogs }
}

export async function getRowsWithTrees(orchardId: string): Promise<RowWithTrees[]> {
  const rows = await getRows(orchardId)
  return Promise.all(rows.map((row) => getRowWithTrees(row.id) as Promise<RowWithTrees>))
}

export async function createRow(orchardId: string, label: string, sortOrder: number): Promise<Row> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rows')
    .insert({ orchard_id: orchardId, label, sort_order: sortOrder })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRow(id: string, updates: Partial<Pick<Row, 'label' | 'sort_order'>>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('rows').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteRow(id: string): Promise<void> {
  const supabase = createClient()

  // Guard: prevent deleting rows that still contain trees
  const { count, error: countError } = await supabase
    .from('trees')
    .select('*', { count: 'exact', head: true })
    .eq('row_id', id)
  if (countError) throw countError
  if (count && count > 0) {
    throw new Error(`Cannot delete row: it still contains ${count} tree${count !== 1 ? 's' : ''}. Remove or move all trees first.`)
  }

  const { error } = await supabase.from('rows').delete().eq('id', id)
  if (error) throw error
}
