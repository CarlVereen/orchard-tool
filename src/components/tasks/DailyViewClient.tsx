'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { TaskSection } from './TaskSection'
import { TaskItem, CompletedTaskItem } from './TaskItem'
import {
  completeProjectTaskAction,
  uncompleteProjectTaskAction,
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

export function DailyViewClient({
  todayTasks,
  comingUpTasks,
  permacultureTasks,
  completedTodayTasks,
}: DailyViewClientProps) {
  const [isPending, startTransition] = useTransition()
  const [optimistic, addOptimistic] = useOptimistic(
    { today: todayTasks, comingUp: comingUpTasks, permaculture: permacultureTasks, completed: completedTodayTasks },
    applyOptimistic
  )

  const [completingId, setCompletingId] = useState<string | null>(null)

  const handleComplete = (taskId: string) => {
    setCompletingId(taskId)
    startTransition(async () => {
      addOptimistic({ type: 'complete', taskId })
      try {
        const result = await completeProjectTaskAction(taskId)
        if (result.loggedCount > 0) {
          toast.success(`Logged ${result.logType} on ${result.loggedCount} ${result.species} tree${result.loggedCount === 1 ? '' : 's'}`)
        }
      } catch {
        toast.error('Failed to complete task')
      } finally {
        setCompletingId(null)
      }
    })
  }

  const handleUncomplete = (taskId: string) => {
    startTransition(async () => {
      addOptimistic({ type: 'uncomplete', taskId })
      try {
        await uncompleteProjectTaskAction(taskId)
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
          {optimistic.today.length > 0 && (
            <TaskSection title="Today" count={optimistic.today.length} defaultOpen>
              {optimistic.today.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  completing={completingId === task.id}
                />
              ))}
            </TaskSection>
          )}

          <TaskSection title="Coming Up" count={optimistic.comingUp.length} defaultOpen={false}>
            {optimistic.comingUp.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={handleComplete}
                completing={completingId === task.id}
              />
            ))}
          </TaskSection>

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

