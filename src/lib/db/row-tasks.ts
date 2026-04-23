import { createClient } from '@/lib/supabase/server'
import type { RowTask } from '@/types/orchard'

export async function getRowTask(id: string): Promise<RowTask | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('row_tasks')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getOpenRowTasksForRow(rowId: string): Promise<RowTask[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('row_tasks')
    .select('*')
    .eq('row_id', rowId)
    .is('completed_at', null)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getIncompleteRowTasksByOrchard(
  orchardId: string
): Promise<(RowTask & { row_label: string })[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('row_tasks')
    .select('*, row:rows!inner(label, orchard_id)')
    .eq('rows.orchard_id', orchardId)
    .is('completed_at', null)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((t) => {
    const row = t.row as unknown as { label: string } | null
    return { ...t, row_label: row?.label ?? '' }
  })
}

export async function completeRowTask(id: string, batchId: string | null): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('row_tasks')
    .update({
      completed_at: new Date().toISOString(),
      completed_batch_id: batchId,
    })
    .eq('id', id)
  if (error) throw error
}

// Clears completion state and returns the prior batch_id so the caller can delete matching logs.
export async function uncompleteRowTask(id: string): Promise<string | null> {
  const supabase = createClient()
  const { data: prior, error: fetchErr } = await supabase
    .from('row_tasks')
    .select('completed_batch_id')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr
  const batchId = (prior?.completed_batch_id as string | null) ?? null

  const { error } = await supabase
    .from('row_tasks')
    .update({ completed_at: null, completed_batch_id: null })
    .eq('id', id)
  if (error) throw error
  return batchId
}
