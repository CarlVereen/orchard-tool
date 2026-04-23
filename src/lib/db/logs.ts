import { createClient } from '@/lib/supabase/server'
import type { Log, LogType, LogWithTree } from '@/types/orchard'
import { randomUUID } from 'crypto'
import { insertRowLog } from './row-logs'

export async function getLogsForTree(treeId: string): Promise<Log[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('tree_id', treeId)
    .order('logged_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getRecentLogs(limit = 20): Promise<LogWithTree[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('logs')
    .select('*, tree:trees(*, row:rows(*))')
    .order('logged_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as LogWithTree[]
}

type LogFields = {
  quantity?: number
  unit?: string
  notes?: string
  loggedAt?: string
  target?: string
  severity?: number
  batchId?: string
}

export async function insertLog(
  treeId: string,
  logType: LogType,
  fields?: LogFields
): Promise<Log> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('logs')
    .insert({
      tree_id: treeId,
      log_type: logType,
      quantity: fields?.quantity ?? null,
      unit: fields?.unit ?? null,
      notes: fields?.notes ?? null,
      target: fields?.target ?? null,
      severity: fields?.severity ?? null,
      logged_at: fields?.loggedAt ?? new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function insertLogsForTrees(
  treeIds: string[],
  logType: LogType,
  fields?: LogFields
): Promise<Log[]> {
  if (treeIds.length === 0) return []
  const supabase = createClient()
  const batchId = fields?.batchId ?? randomUUID()
  const loggedAt = fields?.loggedAt ?? new Date().toISOString()

  const rows = treeIds.map((treeId) => ({
    tree_id: treeId,
    log_type: logType,
    quantity: fields?.quantity ?? null,
    unit: fields?.unit ?? null,
    notes: fields?.notes ?? null,
    target: fields?.target ?? null,
    severity: fields?.severity ?? null,
    batch_id: batchId,
    logged_at: loggedAt,
  }))

  const { data, error } = await supabase.from('logs').insert(rows).select()
  if (error) throw error
  return data ?? []
}

export async function deleteLog(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('logs').delete().eq('id', id)
  if (error) throw error
}

export async function deleteLogsByBatch(batchId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('logs').delete().eq('batch_id', batchId)
  if (error) throw error
}

// Creates one row_log and one log per tree in `treeIds`, all sharing a new batch_id.
// Returns the batch_id so callers can persist it for later undo/cleanup.
export async function logForRowAndTrees(
  rowId: string,
  treeIds: string[],
  logType: LogType,
  fields?: LogFields
): Promise<{ batchId: string }> {
  const batchId = randomUUID()
  const loggedAt = fields?.loggedAt ?? new Date().toISOString()

  await insertRowLog(rowId, logType, {
    notes: fields?.notes,
    batchId,
    loggedAt,
  })

  if (treeIds.length > 0) {
    await insertLogsForTrees(treeIds, logType, {
      ...fields,
      loggedAt,
      batchId,
    })
  }

  return { batchId }
}
