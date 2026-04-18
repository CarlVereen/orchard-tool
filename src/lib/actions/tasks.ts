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
import { generatePermaculturePhaseTasks } from '@/lib/tasks/generate-permaculture-tasks'
import type { LogType } from '@/types/orchard'

function revalidateTaskPaths() {
  revalidatePath('/tasks')
  revalidatePath('/tasks/projects')
  revalidatePath('/')
}

export async function completeTreeTaskAction(taskId: string) {
  const supabase = createClient()
  const { data: task } = await supabase
    .from('tree_tasks')
    .select('*, tree:trees(row_id)')
    .eq('id', taskId)
    .single()
  if (!task) throw new Error('Task not found')

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
  return { loggedCount, logType: completed.log_type }
}

export async function uncompleteTreeTaskAction(taskId: string) {
  const { uncompleteTask } = await import('@/lib/db/tasks')
  await uncompleteTask(taskId)
  revalidateTaskPaths()
}

export async function completeProjectTaskAction(taskId: string) {
  const supabase = createClient()

  const { data: task } = await supabase
    .from('project_tasks')
    .select('*, project:projects!inner(*)')
    .eq('id', taskId)
    .single()
  if (!task) throw new Error('Task not found')

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
  return { loggedCount, logType: task.log_type, species: task.species }
}

export async function uncompleteProjectTaskAction(taskId: string) {
  await uncompleteProjectTask(taskId)
  revalidateTaskPaths()
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
