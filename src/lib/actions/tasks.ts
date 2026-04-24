'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  completeProjectTask,
  uncompleteProjectTask,
  deleteProjectTask,
  createProjectTask,
  createProject,
  archiveProject,
  setTaskBatchId,
  advancePhase,
  skipPhaseTasks,
  updateProjectTask,
} from '@/lib/db/projects'
import {
  getRowTask,
  completeRowTask,
  uncompleteRowTask,
} from '@/lib/db/row-tasks'
import { getActiveTreeIdsForRow } from '@/lib/db/rows'
import { logForRowAndTrees, deleteLogsByBatch } from '@/lib/db/logs'
import { deleteRowLogsByBatch } from '@/lib/db/row-logs'
import { generatePermaculturePhaseTasks } from '@/lib/tasks/generate-permaculture-tasks'
import type { LogType } from '@/types/orchard'
import { type ActionFailure, extractErrorMessage } from '@/lib/errors'

function revalidateTaskPaths() {
  revalidatePath('/tasks')
  revalidatePath('/tasks/projects')
  revalidatePath('/')
}

export async function completeTreeTaskAction(
  taskId: string
): Promise<{ ok: true; loggedCount: number; logType: LogType | null } | ActionFailure> {
  try {
    const supabase = createClient()
    const { data: task } = await supabase
      .from('tree_tasks')
      .select('*, tree:trees(row_id)')
      .eq('id', taskId)
      .single()
    if (!task) return { ok: false, error: 'Task not found' }

    const { completeTask } = await import('@/lib/db/tasks')
    const completed = await completeTask(taskId)

    // Auto-log if the task has a log_type
    let loggedCount = 0
    if (completed.log_type && task.tree_id) {
      const { insertLog } = await import('@/lib/db/logs')
      await insertLog(task.tree_id, completed.log_type as LogType, {
        notes: completed.title,
      })
      loggedCount = 1
    }

    const rowId = (task.tree as unknown as { row_id: string })?.row_id
    revalidateTaskPaths()
    if (task.tree_id) revalidatePath(`/trees/${task.tree_id}`)
    if (rowId) revalidatePath(`/rows/${rowId}`)
    revalidatePath('/attention')
    return { ok: true, loggedCount, logType: completed.log_type as LogType | null }
  } catch (err) {
    console.error('completeTreeTaskAction failed', err)
    return { ok: false, error: extractErrorMessage(err) }
  }
}

export async function uncompleteTreeTaskAction(
  taskId: string
): Promise<{ ok: true } | ActionFailure> {
  try {
    const { uncompleteTask } = await import('@/lib/db/tasks')
    await uncompleteTask(taskId)
    revalidateTaskPaths()
    return { ok: true }
  } catch (err) {
    console.error('uncompleteTreeTaskAction failed', err)
    return { ok: false, error: extractErrorMessage(err) }
  }
}

export async function completeRowTaskAction(
  rowTaskId: string,
  rowId: string
): Promise<{ ok: true; loggedCount: number; logType: LogType | null } | ActionFailure> {
  try {
    const task = await getRowTask(rowTaskId)
    if (!task) return { ok: false, error: 'Row task not found' }
    if (task.completed_at) return { ok: true, loggedCount: 0, logType: task.log_type as LogType | null }

    let batchId: string | null = null
    let loggedCount = 0
    if (task.log_type) {
      const treeIds = await getActiveTreeIdsForRow(rowId)
      const result = await logForRowAndTrees(rowId, treeIds, task.log_type, {
        notes: task.title,
      })
      batchId = result.batchId
      loggedCount = treeIds.length + 1
    }

    await completeRowTask(rowTaskId, batchId)

    revalidateTaskPaths()
    revalidatePath(`/rows/${rowId}`)
    revalidatePath('/attention')
    return { ok: true, loggedCount, logType: task.log_type as LogType | null }
  } catch (err) {
    console.error('completeRowTaskAction failed', err)
    return { ok: false, error: extractErrorMessage(err) }
  }
}

export async function uncompleteRowTaskAction(
  rowTaskId: string,
  rowId: string
): Promise<{ ok: true } | ActionFailure> {
  try {
    const batchId = await uncompleteRowTask(rowTaskId)
    if (batchId) {
      await deleteRowLogsByBatch(batchId)
      await deleteLogsByBatch(batchId)
    }
    revalidateTaskPaths()
    revalidatePath(`/rows/${rowId}`)
    revalidatePath('/attention')
    return { ok: true }
  } catch (err) {
    console.error('uncompleteRowTaskAction failed', err)
    return { ok: false, error: extractErrorMessage(err) }
  }
}

export async function completeProjectTaskAction(
  taskId: string
): Promise<
  | { ok: true; loggedCount: number; logType: LogType | null; species: string | null }
  | ActionFailure
> {
  try {
    const supabase = createClient()

    const { data: task } = await supabase
      .from('project_tasks')
      .select('*, project:projects!inner(*)')
      .eq('id', taskId)
      .single()
    if (!task) return { ok: false, error: 'Task not found' }

    await completeProjectTask(taskId)

    const project = task.project as { orchard_id: string; project_type: string }
    let loggedCount = 0

    if (project.project_type === 'expert' && task.log_type && task.tree_id) {
      const { insertLog } = await import('@/lib/db/logs')
      const log = await insertLog(task.tree_id, task.log_type as LogType, {
        notes: task.title,
      })
      loggedCount = 1
      await setTaskBatchId(taskId, log.id)
    }

    revalidateTaskPaths()
    return {
      ok: true,
      loggedCount,
      logType: task.log_type as LogType | null,
      species: task.species as string | null,
    }
  } catch (err) {
    console.error('completeProjectTaskAction failed', err)
    return { ok: false, error: extractErrorMessage(err) }
  }
}

export async function uncompleteProjectTaskAction(
  taskId: string
): Promise<{ ok: true } | ActionFailure> {
  try {
    await uncompleteProjectTask(taskId)
    revalidateTaskPaths()
    return { ok: true }
  } catch (err) {
    console.error('uncompleteProjectTaskAction failed', err)
    return { ok: false, error: extractErrorMessage(err) }
  }
}

export async function deleteProjectTaskAction(taskId: string) {
  await deleteProjectTask(taskId)
  revalidateTaskPaths()
}

export async function createProjectTaskAction(projectId: string, formData: FormData) {
  const title = formData.get('title') as string
  if (!title?.trim()) throw new Error('Title is required')

  const dueDate = formData.get('due_date') as string | null
  const priority = parseInt(formData.get('priority') as string) || 2
  const description = formData.get('description') as string | null
  const phase = formData.get('phase') ? parseInt(formData.get('phase') as string) : null

  await createProjectTask(projectId, {
    title: title.trim(),
    description: description || null,
    priority: priority as 1 | 2 | 3,
    dueDate: dueDate || null,
    phase,
  })

  revalidateTaskPaths()
}

export async function updateProjectTaskAction(taskId: string, formData: FormData) {
  const title = formData.get('title') as string | undefined
  const description = formData.get('description') as string | undefined
  const priority = formData.get('priority') ? parseInt(formData.get('priority') as string) as 1 | 2 | 3 : undefined
  const dueDate = formData.get('due_date') as string | undefined

  await updateProjectTask(taskId, {
    title,
    description: description ?? undefined,
    priority,
    dueDate: dueDate ?? undefined,
  })

  revalidateTaskPaths()
}

export async function createUserProjectAction(orchardId: string, formData: FormData) {
  const name = formData.get('name') as string
  if (!name?.trim()) throw new Error('Project name is required')

  await createProject(orchardId, name.trim(), 'user')
  revalidateTaskPaths()
}

export async function archiveProjectAction(projectId: string) {
  await archiveProject(projectId)
  revalidateTaskPaths()
}

export async function enablePermacultureAction(orchardId: string, startYear: number) {
  const project = await createProject(orchardId, 'Permaculture Conversion', 'permaculture', {
    startYear,
  })
  await generatePermaculturePhaseTasks(project)
  revalidateTaskPaths()
}

export async function completePhaseAction(projectId: string) {
  const supabase = createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  if (!project) throw new Error('Project not found')

  await skipPhaseTasks(projectId, project.current_phase)
  await advancePhase(projectId)

  const updatedProject = { ...project, current_phase: project.current_phase + 1 }
  await generatePermaculturePhaseTasks(updatedProject)

  revalidateTaskPaths()
  revalidatePath(`/tasks/projects/${projectId}`)
}
