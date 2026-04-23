'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createOrchard, updateOrchard } from '@/lib/db/orchards'
import { createRow, updateRow, deleteRow } from '@/lib/db/rows'
import { createTree, updateTree, deleteTree, archiveTree, moveTree } from '@/lib/db/trees'
import { insertLog, insertLogsForTrees, deleteLog } from '@/lib/db/logs'
import { createNote, updateNote, deleteNote } from '@/lib/db/notes'
import { createPhoto, deletePhoto } from '@/lib/db/photos'
import {
  createManualTask,
  completeTask,
  uncompleteTask,
  deleteTask,
  createTemplate,
  updateTemplate,
  toggleTemplateActive,
  deleteTemplate,
} from '@/lib/db/tasks'
import type { LogType, TreeCondition, TaskTargetScope, TaskScheduleType } from '@/types/orchard'

// ── Orchard ──────────────────────────────────────────────────────────────────

export async function setupOrchardAction(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string | undefined
  if (!name?.trim()) throw new Error('Orchard name is required')
  await createOrchard(name.trim(), description?.trim() || undefined)
  redirect('/')
}

export async function updateOrchardAction(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string | undefined
  if (!name?.trim()) throw new Error('Orchard name is required')
  await updateOrchard(id, { name: name.trim(), description: description?.trim() ?? null })
  revalidatePath('/')
}

// ── Rows ─────────────────────────────────────────────────────────────────────

export async function createRowAction(orchardId: string, formData: FormData) {
  const label = formData.get('label') as string
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0
  if (!label?.trim()) throw new Error('Row label is required')
  const row = await createRow(orchardId, label.trim(), sortOrder)
  revalidatePath('/')
  return row
}

export async function updateRowAction(rowId: string, formData: FormData) {
  const label = formData.get('label') as string
  if (!label?.trim()) throw new Error('Row label is required')
  await updateRow(rowId, { label: label.trim() })
  revalidatePath('/')
  revalidatePath(`/rows/${rowId}`)
}

export async function deleteRowAction(rowId: string) {
  await deleteRow(rowId)
  revalidatePath('/')
  redirect('/')
}

// ── Trees ────────────────────────────────────────────────────────────────────

export async function createTreeAction(rowId: string, formData: FormData) {
  const position = parseInt(formData.get('position') as string)
  const variety = formData.get('variety') as string | undefined
  const species = formData.get('species') as string | undefined
  const plantedAt = formData.get('planted_at') as string | undefined
  const notes = formData.get('notes') as string | undefined
  if (!position) throw new Error('Position is required')
  const tree = await createTree(rowId, position, {
    variety: variety?.trim() || undefined,
    species: species?.trim() || undefined,
    planted_at: plantedAt || undefined,
    notes: notes?.trim() || undefined,
  })
  revalidatePath(`/rows/${rowId}`)
  revalidatePath('/')
  return tree
}

export async function updateTreeAction(treeId: string, rowId: string, formData: FormData) {
  const variety = formData.get('variety') as string | undefined
  const species = formData.get('species') as string | undefined
  const plantedAt = formData.get('planted_at') as string | undefined
  const notes = formData.get('notes') as string | undefined
  const rootstock = formData.get('rootstock') as string | undefined
  const condition = formData.get('condition') as TreeCondition | undefined
  const conditionNotes = formData.get('condition_notes') as string | undefined
  const wateringCycleRaw = formData.get('watering_cycle_days') as string | undefined
  const positionRaw = formData.get('position') as string | undefined

  await updateTree(treeId, {
    variety: variety?.trim() ?? null,
    species: species?.trim() ?? null,
    planted_at: plantedAt?.trim() ? plantedAt : null,
    notes: notes?.trim() ?? null,
    rootstock: rootstock?.trim() ?? null,
    condition: condition ?? 'good',
    condition_notes: conditionNotes?.trim() ?? null,
    watering_cycle_days: wateringCycleRaw ? parseInt(wateringCycleRaw) : null,
    position: positionRaw ? parseInt(positionRaw) : undefined,
  })
  revalidatePath(`/trees/${treeId}`)
  revalidatePath(`/rows/${rowId}`)
  revalidatePath('/')
}

export async function deleteTreeAction(treeId: string, rowId: string) {
  await deleteTree(treeId)
  revalidatePath(`/rows/${rowId}`)
  revalidatePath('/')
  revalidatePath('/attention')
}

export async function archiveTreeAction(treeId: string, rowId: string, formData: FormData) {
  const reason = (formData.get('reason') as string)?.trim() || 'No reason given'
  await archiveTree(treeId, reason)
  revalidatePath(`/rows/${rowId}`)
  revalidatePath('/')
  revalidatePath('/attention')
}

export async function moveTreeAction(treeId: string, oldRowId: string, newRowId: string, newPosition: number) {
  if (!newRowId) throw new Error('Target row is required')
  if (!newPosition || isNaN(newPosition)) throw new Error('Position is required')
  await moveTree(treeId, newRowId, newPosition)
  revalidatePath(`/rows/${oldRowId}`)
  revalidatePath(`/rows/${newRowId}`)
  revalidatePath('/')
}

// ── Logs ─────────────────────────────────────────────────────────────────────

export async function addLogAction(treeId: string, rowId: string, formData: FormData) {
  const logType = formData.get('log_type') as LogType
  const quantityRaw = formData.get('quantity') as string | undefined
  const unit = formData.get('unit') as string | undefined
  const notes = formData.get('notes') as string | undefined
  const loggedAt = formData.get('logged_at') as string | undefined
  const target = formData.get('target') as string | undefined
  const severityRaw = formData.get('severity') as string | undefined

  if (!logType) throw new Error('Log type is required')

  await insertLog(treeId, logType, {
    quantity: quantityRaw ? parseFloat(quantityRaw) : undefined,
    unit: unit?.trim() || undefined,
    notes: notes?.trim() || undefined,
    loggedAt: loggedAt || undefined,
    target: target?.trim() || undefined,
    severity: severityRaw ? parseInt(severityRaw) : undefined,
  })

  revalidatePath(`/trees/${treeId}`)
  revalidatePath(`/rows/${rowId}`)
  revalidatePath('/')
}

export async function addBulkLogAction(treeIds: string[], orchardRowId: string, formData: FormData) {
  const logType = formData.get('log_type') as LogType
  const quantityRaw = formData.get('quantity') as string | undefined
  const unit = formData.get('unit') as string | undefined
  const notes = formData.get('notes') as string | undefined
  const loggedAt = formData.get('logged_at') as string | undefined
  const target = formData.get('target') as string | undefined
  const severityRaw = formData.get('severity') as string | undefined

  if (!logType) throw new Error('Log type is required')
  if (treeIds.length === 0) throw new Error('No trees selected')

  await insertLogsForTrees(treeIds, logType, {
    quantity: quantityRaw ? parseFloat(quantityRaw) : undefined,
    unit: unit?.trim() || undefined,
    notes: notes?.trim() || undefined,
    loggedAt: loggedAt || undefined,
    target: target?.trim() || undefined,
    severity: severityRaw ? parseInt(severityRaw) : undefined,
  })

  revalidatePath(`/rows/${orchardRowId}`)
  revalidatePath('/')
  treeIds.forEach((id) => revalidatePath(`/trees/${id}`))
}

export async function deleteLogAction(logId: string, treeId: string, rowId: string) {
  await deleteLog(logId)
  revalidatePath(`/trees/${treeId}`)
  revalidatePath(`/rows/${rowId}`)
  revalidatePath('/')
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function addNoteAction(treeId: string, formData: FormData) {
  const content = (formData.get('content') as string)?.trim()
  if (!content) throw new Error('Note content is required')
  await createNote(treeId, content)
  revalidatePath(`/trees/${treeId}`)
}

export async function updateNoteAction(noteId: string, treeId: string, formData: FormData) {
  const content = (formData.get('content') as string)?.trim()
  if (!content) throw new Error('Note content is required')
  await updateNote(noteId, content)
  revalidatePath(`/trees/${treeId}`)
}

export async function deleteNoteAction(noteId: string, treeId: string) {
  await deleteNote(noteId)
  revalidatePath(`/trees/${treeId}`)
}

// ── Photos ────────────────────────────────────────────────────────────────────

export async function addPhotoMetaAction(treeId: string, storagePath: string, caption?: string) {
  const photo = await createPhoto(treeId, storagePath, caption)
  revalidatePath(`/trees/${treeId}`)
  return photo
}

export async function deletePhotoAction(photoId: string, storagePath: string, treeId: string) {
  await deletePhoto(photoId, storagePath)
  revalidatePath(`/trees/${treeId}`)
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function createManualTaskAction(treeId: string, formData: FormData) {
  const title = (formData.get('title') as string)?.trim()
  if (!title) throw new Error('Task title is required')
  const logType = (formData.get('log_type') as LogType | '') || undefined
  const dueDate = (formData.get('due_date') as string) || undefined
  const notes = (formData.get('notes') as string)?.trim() || undefined
  await createManualTask(treeId, title, logType || undefined, dueDate, notes)
  revalidatePath(`/trees/${treeId}`)
  revalidatePath('/')
}

export async function completeTaskAction(taskId: string, treeId: string, rowId: string) {
  const task = await completeTask(taskId)
  if (task.log_type) {
    await insertLog(treeId, task.log_type, { notes: task.title })
  }
  revalidatePath(`/trees/${treeId}`)
  revalidatePath(`/rows/${rowId}`)
  revalidatePath('/')
  revalidatePath('/attention')
}

export async function uncompleteTaskAction(taskId: string, treeId: string) {
  await uncompleteTask(taskId)
  revalidatePath(`/trees/${treeId}`)
  revalidatePath('/')
}

export async function deleteTaskAction(taskId: string, treeId: string) {
  await deleteTask(taskId)
  revalidatePath(`/trees/${treeId}`)
  revalidatePath('/')
}

// ── Task Templates ────────────────────────────────────────────────────────────

function parseScheduleFields(formData: FormData) {
  const scheduleType = formData.get('schedule_type') as TaskScheduleType
  const monthStart = parseInt(formData.get('month_start') as string) || 1
  const monthEnd = parseInt(formData.get('month_end') as string) || 12
  const staggerByRow = formData.get('stagger_by_row') === 'true'

  let intervalDays: number | null = null
  if (scheduleType === 'interval') {
    const raw = parseInt(formData.get('interval_days') as string)
    if (!raw || raw < 1) throw new Error('Interval (days) must be a positive number')
    intervalDays = raw
  }

  let weekdays: number[] | null = null
  if (scheduleType === 'weekly') {
    const picked = formData
      .getAll('weekdays')
      .map((v) => parseInt(v as string))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    weekdays = picked.length > 0 ? Array.from(new Set(picked)).sort((a, b) => a - b) : null
  }

  return {
    schedule_type: scheduleType,
    month_start: monthStart,
    month_end: monthEnd,
    stagger_by_row: staggerByRow,
    interval_days: intervalDays,
    weekdays,
  }
}

export async function createTemplateAction(
  orchardId: string,
  formData: FormData,
  rowIds: string[],
  treeIds: string[]
) {
  const title = (formData.get('title') as string)?.trim()
  if (!title) throw new Error('Template title is required')
  const targetScope = (formData.get('target_scope') as TaskTargetScope) || 'all'
  const logType = (formData.get('log_type') as LogType | '') || null

  await createTemplate(
    orchardId,
    {
      title,
      description: (formData.get('description') as string)?.trim() || null,
      ...parseScheduleFields(formData),
      target_scope: targetScope,
      log_type: logType || null,
      active: true,
    },
    rowIds,
    treeIds
  )
  revalidatePath('/settings/tasks')
}

export async function updateTemplateAction(
  templateId: string,
  formData: FormData,
  rowIds: string[],
  treeIds: string[]
) {
  const title = (formData.get('title') as string)?.trim()
  if (!title) throw new Error('Template title is required')
  const targetScope = (formData.get('target_scope') as TaskTargetScope) || 'all'
  const logType = (formData.get('log_type') as LogType | '') || null

  await updateTemplate(
    templateId,
    {
      title,
      description: (formData.get('description') as string)?.trim() || null,
      ...parseScheduleFields(formData),
      target_scope: targetScope,
      log_type: logType || null,
      active: formData.get('active') !== 'false',
    },
    rowIds,
    treeIds
  )
  revalidatePath('/settings/tasks')
}

export async function toggleTemplateActiveAction(templateId: string, active: boolean) {
  await toggleTemplateActive(templateId, active)
  revalidatePath('/settings/tasks')
  revalidatePath('/')
}

export async function deleteTemplateAction(templateId: string) {
  await deleteTemplate(templateId)
  revalidatePath('/settings/tasks')
  revalidatePath('/')
}
