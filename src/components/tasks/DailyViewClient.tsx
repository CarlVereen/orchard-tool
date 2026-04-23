'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { TaskSection } from './TaskSection'
import { TaskItem, TaskGroup, CompletedTaskItem } from './TaskItem'
import {
  completeProjectTaskAction,
  uncompleteProjectTaskAction,
  completeTreeTaskAction,
  uncompleteTreeTaskAction,
  completeRowTaskAction,
  uncompleteRowTaskAction,
} from '@/lib/actions/tasks'
import type { DisplayTask } from '@/types/orchard'

interface DailyViewClientProps {
  todayTasks: DisplayTask[]
  comingUpTasks: DisplayTask[]
  permacultureTasks: DisplayTask[]
  completedTodayTasks: DisplayTask[]
}

type OptimisticAction =
  | { type: 'complete'; taskId: string }
  | { type: 'uncomplete'; taskId: string }

function applyOptimistic(
  state: {
    today: DisplayTask[]
    comingUp: DisplayTask[]
    permaculture: DisplayTask[]
    completed: DisplayTask[]
  },
  action: OptimisticAction
) {
  if (action.type === 'complete') {
    const allActive = [...state.today, ...state.comingUp, ...state.permaculture]
    const task = allActive.find((t) => t.id === action.taskId)
    if (!task) return state
    const remove = (arr: DisplayTask[]) => arr.filter((t) => t.id !== action.taskId)
    return {
      today: remove(state.today),
      comingUp: remove(state.comingUp),
      permaculture: remove(state.permaculture),
      completed: [{ ...task, completed_at: new Date().toISOString() }, ...state.completed],
    }
  }
  if (action.type === 'uncomplete') {
    const task = state.completed.find((t) => t.id === action.taskId)
    if (!task) return state
    const restored = { ...task, completed_at: null }
    return {
      ...state,
      today: [...state.today, restored],
      completed: state.completed.filter((t) => t.id !== action.taskId),
    }
  }
  return state
}

interface TaskGroupData {
  key: string
  title: string
  description: string | null
  projectName: string
  priority: number
  tasks: DisplayTask[]
}

function groupExpertTasks(tasks: DisplayTask[]): (DisplayTask | TaskGroupData)[] {
  const result: (DisplayTask | TaskGroupData)[] = []
  const expertByTitle = new Map<string, DisplayTask[]>()
  const order: string[] = []

  for (const task of tasks) {
    if (task.projectType === 'expert' && task.tree_id) {
      const key = `${task.title}|${task.species}`
      if (!expertByTitle.has(key)) {
        expertByTitle.set(key, [])
        order.push(key)
      }
      expertByTitle.get(key)!.push(task)
    } else {
      result.push(task)
    }
  }

  for (const key of order) {
    const groupTasks = expertByTitle.get(key)!
    const first = groupTasks[0]
    result.push({
      key,
      title: first.title,
      description: first.description,
      projectName: first.projectName,
      priority: first.priority,
      tasks: groupTasks,
    })
  }

  return result
}

function isGroup(item: DisplayTask | TaskGroupData): item is TaskGroupData {
  return 'tasks' in item && 'key' in item
}

export function DailyViewClient({
  todayTasks,
  comingUpTasks,
  permacultureTasks,
  completedTodayTasks,
}: DailyViewClientProps) {
  const [, startTransition] = useTransition()
  const [optimistic, addOptimistic] = useOptimistic(
    { today: todayTasks, comingUp: comingUpTasks, permaculture: permacultureTasks, completed: completedTodayTasks },
    applyOptimistic
  )

  const [completingId, setCompletingId] = useState<string | null>(null)

  const findTask = (taskId: string): DisplayTask | undefined => {
    const all = [...optimistic.today, ...optimistic.comingUp, ...optimistic.permaculture, ...optimistic.completed]
    return all.find((t) => t.id === taskId)
  }

  const handleComplete = (taskId: string) => {
    const task = findTask(taskId)
    setCompletingId(taskId)
    startTransition(async () => {
      addOptimistic({ type: 'complete', taskId })
      try {
        if (task?.source === 'tree') {
          const result = await completeTreeTaskAction(taskId)
          if (result.loggedCount > 0) {
            toast.success(`Logged ${result.logType}`)
          }
        } else if (task?.source === 'row' && task.rowId) {
          const result = await completeRowTaskAction(taskId, task.rowId)
          if (result.loggedCount > 0 && result.logType) {
            toast.success(`Logged ${result.logType} on row + ${result.loggedCount - 1} tree${result.loggedCount - 1 === 1 ? '' : 's'}`)
          }
        } else {
          const result = await completeProjectTaskAction(taskId)
          if (result.loggedCount > 0) {
            toast.success(`Logged ${result.logType} on ${result.species} tree`)
          }
        }
      } catch {
        toast.error('Failed to complete task')
      } finally {
        setCompletingId(null)
      }
    })
  }

  const handleUncomplete = (taskId: string) => {
    const task = findTask(taskId)
    startTransition(async () => {
      addOptimistic({ type: 'uncomplete', taskId })
      try {
        if (task?.source === 'tree') {
          await uncompleteTreeTaskAction(taskId)
        } else if (task?.source === 'row' && task.rowId) {
          await uncompleteRowTaskAction(taskId, task.rowId)
        } else {
          await uncompleteProjectTaskAction(taskId)
        }
      } catch {
        toast.error('Failed to undo completion')
      }
    })
  }

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const hasNoTasks =
    optimistic.today.length === 0 &&
    optimistic.comingUp.length === 0 &&
    optimistic.permaculture.length === 0 &&
    optimistic.completed.length === 0

  const todayItems = groupExpertTasks(optimistic.today)
  const comingUpItems = groupExpertTasks(optimistic.comingUp)

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">{dateLabel}</p>

      {hasNoTasks ? (
        <div className="text-center py-12">
          <p className="text-stone-400 text-sm">No tasks for today.</p>
          <p className="text-stone-300 text-xs mt-1">
            Add trees with species to get expert care recommendations, or create a project.
          </p>
        </div>
      ) : (
        <>
          {todayItems.length > 0 && (
            <TaskSection title="Today" count={optimistic.today.length} defaultOpen>
              {todayItems.map((item) =>
                isGroup(item) ? (
                  <TaskGroup
                    key={item.key}
                    title={item.title}
                    description={item.description}
                    projectName={item.projectName}
                    priority={item.priority}
                    tasks={item.tasks}
                    onComplete={handleComplete}
                    completingId={completingId}
                  />
                ) : (
                  <TaskItem
                    key={item.id}
                    task={item}
                    onComplete={handleComplete}
                    completing={completingId === item.id}
                  />
                )
              )}
            </TaskSection>
          )}

          {comingUpItems.length > 0 && (
            <TaskSection title="Coming Up" count={optimistic.comingUp.length} defaultOpen={false}>
              {comingUpItems.map((item) =>
                isGroup(item) ? (
                  <TaskGroup
                    key={item.key}
                    title={item.title}
                    description={item.description}
                    projectName={item.projectName}
                    priority={item.priority}
                    tasks={item.tasks}
                    onComplete={handleComplete}
                    completingId={completingId}
                  />
                ) : (
                  <TaskItem
                    key={item.id}
                    task={item}
                    onComplete={handleComplete}
                    completing={completingId === item.id}
                  />
                )
              )}
            </TaskSection>
          )}

          <TaskSection title="Permaculture" count={optimistic.permaculture.length} defaultOpen={false}>
            {optimistic.permaculture.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={handleComplete}
                completing={completingId === task.id}
              />
            ))}
          </TaskSection>

          <TaskSection title="Completed Today" count={optimistic.completed.length} defaultOpen={false}>
            {optimistic.completed.map((task) => (
              <CompletedTaskItem
                key={task.id}
                task={task}
                onUncomplete={handleUncomplete}
              />
            ))}
          </TaskSection>
        </>
      )}
    </div>
  )
}
