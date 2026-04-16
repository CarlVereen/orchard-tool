'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createOrchard, updateOrchard } from '@/lib/db/orchards'
import { createRow, updateRow, deleteRow } from '@/lib/db/rows'
import { createTree, updateTree, deleteTree, archiveTree, moveTree } from '@/lib/db/trees'
import { insertLog, insertLogsForTrees, deleteLog } from '@/lib/db/logs'
import { createNote, updateNote, deleteNote } from '@/lib/db/notes'
import { createPhoto, deletePhoto } from '@/lib/db/photos'
import type { LogType, TreeCondition } from '@/types/orchard'

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

  await updateTree(treeId, {
    variety: variety?.trim() ?? null,
    species: species?.trim() ?? null,
    planted_at: plantedAt ?? null,
    notes: notes?.trim() ?? null,
    rootstock: rootstock?.trim() ?? null,
    condition: condition ?? 'good',
    condition_notes: conditionNotes?.trim() ?? null,
    watering_cycle_days: wateringCycleRaw ? parseInt(wateringCycleRaw) : null,
  })
  revalidatePath(`/trees/${treeId}`)
  revalidatePath(`/rows/${rowId}`)
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

export async function moveTreeAction(treeId: string, oldRowId: string, formData: FormData) {
  const newRowId = formData.get('new_row_id') as string
  const newPosition = parseInt(formData.get('new_position') as string)
  if (!newRowId) throw new Error('Target row is required')
  if (!newPosition) throw new Error('Position is required')
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
