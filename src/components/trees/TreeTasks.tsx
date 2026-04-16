'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createManualTaskAction,
  completeTaskAction,
  uncompleteTaskAction,
  deleteTaskAction,
} from '@/lib/actions/orchard'
import type { TreeTask, LogType } from '@/types/orchard'

const LOG_TYPE_OPTIONS: { value: LogType; label: string }[] = [
  { value: 'water', label: 'Water' },
  { value: 'fertilize', label: 'Fertilize' },
  { value: 'prune', label: 'Prune' },
  { value: 'scout', label: 'Scout' },
  { value: 'production', label: 'Production' },
  { value: 'note', label: 'Note' },
]

function dueDateBadge(dueDate: string | null) {
  if (!dueDate) return null
  const today = new Date().toISOString().split('T')[0]
  const overdue = dueDate < today
  const label = new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
        overdue ? 'bg-red-50 text-red-500' : 'bg-stone-100 text-stone-500'
      }`}
    >
      {overdue ? 'Due ' : ''}{label}
    </span>
  )
}

interface TreeTasksProps {
  treeId: string
  rowId: string
  initialTasks: TreeTask[]
}

export function TreeTasks({ treeId, rowId, initialTasks }: TreeTasksProps) {
  const [completing, setCompleting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const pending = initialTasks.filter((t) => !t.completed_at)
  const completed = initialTasks.filter((t) => t.completed_at)

  const handleComplete = async (task: TreeTask) => {
    setCompleting(task.id)
    try {
      await completeTaskAction(task.id, treeId, rowId)
    } finally {
      setCompleting(null)
    }
  }

  const handleUncomplete = async (task: TreeTask) => {
    setCompleting(task.id)
    try {
      await uncompleteTaskAction(task.id, treeId)
    } finally {
      setCompleting(null)
    }
  }

  const handleDelete = async (taskId: string) => {
    setDeleting(taskId)
    try {
      await deleteTaskAction(taskId, treeId)
    } finally {
      setDeleting(null)
    }
  }

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setAddError(null)
    try {
      await createManualTaskAction(treeId, new FormData(e.currentTarget))
      setAddingTask(false)
      ;(e.currentTarget as HTMLFormElement).reset()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Pending tasks */}
      <div className="space-y-1.5">
        {pending.length === 0 && !addingTask && (
          <p className="text-sm text-stone-400 py-2">No pending tasks.</p>
        )}
        {pending.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2.5"
          >
            <button
              type="button"
              onClick={() => handleComplete(task)}
              disabled={completing === task.id}
              className="w-4 h-4 rounded border-2 border-stone-300 hover:border-green-500 transition-colors flex items-center justify-center shrink-0"
              aria-label="Complete task"
            >
              {completing === task.id && (
                <svg className="animate-spin size-2.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </button>
            <span className="flex-1 text-sm text-stone-800 min-w-0 truncate">{task.title}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {task.log_type && (
                <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full capitalize">
                  {task.log_type}
                </span>
              )}
              {dueDateBadge(task.due_date)}
              {task.template_id === null && (
                <button
                  type="button"
                  onClick={() => handleDelete(task.id)}
                  disabled={deleting === task.id}
                  className="text-stone-300 hover:text-red-400 transition-colors ml-1"
                  aria-label="Delete task"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add task form */}
        {addingTask ? (
          <form onSubmit={handleAdd} className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Task</Label>
              <Input id="task-title" name="title" placeholder="e.g. Check for pests" required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-log-type">Log type <span className="text-stone-400 font-normal">(optional)</span></Label>
                <select
                  id="task-log-type"
                  name="log_type"
                  className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  <option value="">None</option>
                  {LOG_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-due-date">Due date <span className="text-stone-400 font-normal">(optional)</span></Label>
                <Input id="task-due-date" name="due_date" type="date" />
              </div>
            </div>
            {addError && <p className="text-xs text-red-500">{addError}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>Add task</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingTask(false); setAddError(null) }}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAddingTask(true)}
            className="w-full py-2 border border-dashed border-stone-200 rounded-lg text-xs text-stone-400 hover:text-stone-600 hover:border-stone-300 transition-colors"
          >
            + Add task
          </button>
        )}
      </div>

      {/* Completed tasks */}
      {completed.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showCompleted ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
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
                    onClick={() => handleUncomplete(task)}
                    disabled={completing === task.id}
                    className="w-4 h-4 rounded border-2 border-green-400 bg-green-400 flex items-center justify-center shrink-0 hover:border-stone-300 hover:bg-white transition-colors"
                    aria-label="Mark incomplete"
                  >
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </button>
                  <span className="flex-1 text-sm text-stone-400 line-through min-w-0 truncate">{task.title}</span>
                  {task.completed_at && (
                    <span className="text-[10px] text-stone-300 shrink-0">
                      {new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
