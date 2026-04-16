import { createClient } from '@/lib/supabase/server'
import type { Row, RowWithTrees, TreeWithLastLog } from '@/types/orchard'

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

  // Fetch last log for each tree
  const treeIds = (trees ?? []).map((t) => t.id)
  const treesWithLogs: TreeWithLastLog[] = await Promise.all(
    (trees ?? []).map(async (tree) => {
      const { data: logs } = await supabase
        .from('logs')
        .select('*')
        .eq('tree_id', tree.id)
        .order('logged_at', { ascending: false })
        .limit(1)
      return { ...tree, last_log: logs?.[0] ?? null }
    })
  )

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
  const { error } = await supabase.from('rows').delete().eq('id', id)
  if (error) throw error
}
