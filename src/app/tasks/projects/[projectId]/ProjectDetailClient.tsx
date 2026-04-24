'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  completeProjectTaskAction,
  uncompleteProjectTaskAction,
  deleteProjectTaskAction,
} from '@/lib/actions/tasks'
import type { ProjectTask, ProjectType } from '@/types/orchard'

const PRIORITY_BORDER: Record<number, string> = {
  1: 'border-l-red-400',
  2: 'border-l-amber-400',
  3: 'border-l-stone-200',
}

interface ProjectDetailClientProps {
  projectId: string
  tasks: ProjectTask[]
  projectType: ProjectType
}

export function ProjectDetailClient({ projectId, tasks, projectType }: ProjectDetailClientProps) {
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const pending = tasks.filter((t) => !t.completed_at)
  const completed = tasks.filter((t) => t.completed_at && t.notes !== 'skipped')

  const handleComplete = (taskId: string) => {
    setCompletingId(taskId)
    startTransition(async () => {
      try {
        const result = await completeProjectTaskAction(taskId)
        if (!result.ok) {
          toast.error(result.error)
        } else if (result.loggedCount > 0) {
          toast.success(`Logged ${result.logType} on ${result.loggedCount} tree${result.loggedCount === 1 ? '' : 's'}`)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to complete task')
      } finally {
        setCompletingId(null)
      }
    })
  }

  const handleUncomplete = (taskId: string) => {
    startTransition(async () => {
      try {
        const result = await uncompleteProjectTaskAction(taskId)
        if (!result.ok) toast.error(result.error)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to undo')
      }
    })
  }

  const handleDelete = (taskId: string) => {
    setDeletingId(taskId)
    startTransition(async () => {
      try {
        await deleteProjectTaskAction(taskId)
      } catch {
        toast.error('Failed to delete task')
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        {pending.length === 0 && (
          <p className="text-sm text-stone-400 py-2">No pending tasks.</p>
        )}
        {pending.map((task) => {
          const borderColor = PRIORITY_BORDER[task.priority] ?? 'border-l-stone-200'
          return (
            <div
              key={task.id}
              className={`flex items-start gap-3 bg-white border border-stone-200 rounded-lg px-3 py-2.5 border-l-[3px] ${borderColor}`}
            >
              <button
                type="button"
                onClick={() => handleComplete(task.id)}
                disabled={completingId === task.id}
                className="w-11 h-11 -m-1.5 flex items-center justify-center shrink-0"
                aria-label="Complete task"
              >
                <span className="w-4 h-4 rounded border-2 border-stone-300 hover:border-green-500 transition-colors flex items-center justify-center">
                  {completingId === task.id && (
                    <svg className="animate-spin size-2.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </span>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-800">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-stone-400 mt-0.5">{task.description}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {task.log_type && (
                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full capitalize">
                      {task.log_type}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="text-[10px] text-stone-400">
                      {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
              {!task.period && (
                <button
                  type="button"
                  onClick={() => handleDelete(task.id)}
                  disabled={deletingId === task.id}
                  className="text-stone-300 hover:text-red-400 transition-colors mt-1"
                  aria-label="Delete task"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {completed.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showCompleted ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {completed.length} completed
          </button>
          {showCompleted && (
            <div className="mt-1.5 space-y-1">
              {completed.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 bg-white border border-stone-100 rounded-lg px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => handleUncomplete(task.id)}
                    className="w-11 h-11 -m-1.5 flex items-center justify-center shrink-0"
                    aria-label="Mark incomplete"
                  >
                    <span className="w-4 h-4 rounded border-2 border-green-400 bg-green-400 flex items-center justify-center hover:border-stone-300 hover:bg-white transition-colors">
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </span>
                  </button>
                  <span className="flex-1 text-sm text-stone-400 line-through min-w-0 truncate">
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
