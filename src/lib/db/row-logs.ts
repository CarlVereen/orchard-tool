import { createClient } from '@/lib/supabase/server'
import type { RowLog, LogType } from '@/types/orchard'

type RowLogFields = {
  notes?: string
  batchId?: string
  loggedAt?: string
}

export async function insertRowLog(
  rowId: string,
  logType: LogType,
  fields?: RowLogFields
): Promise<RowLog> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('row_logs')
    .insert({
      row_id: rowId,
      log_type: logType,
      notes: fields?.notes ?? null,
      batch_id: fields?.batchId ?? null,
      logged_at: fields?.loggedAt ?? new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRowLogsByBatch(batchId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('row_logs').delete().eq('batch_id', batchId)
  if (error) throw error
}

export async function getRowLogs(rowId: string): Promise<RowLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('row_logs')
    .select('*')
    .eq('row_id', rowId)
    .order('logged_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
