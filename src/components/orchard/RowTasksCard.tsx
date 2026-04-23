'use client'

import type { RowTask } from '@/types/orchard'

function dueLabel(dueDate: string | null): { text: string; overdue: boolean } | null {
  if (!dueDate) return null
  const today = new Date().toISOString().split('T')[0]
  const overdue = dueDate < today
  const isToday = dueDate === today
  const formatted = new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  if (isToday) return { text: 'Today', overdue: false }
  if (overdue) return { text: `Overdue · ${formatted}`, overdue: true }
  return { text: formatted, overdue: false }
}

interface RowTasksCardProps {
  tasks: RowTask[]
  onComplete: (taskId: string) => void
  completingId: string | null
}

export function RowTasksCard({ tasks, onComplete, completingId }: RowTasksCardProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2">
      <p className="text-xs text-stone-400 font-medium">Row tasks</p>
      <ul className="space-y-1.5">
        {tasks.map((task) => {
          const due = dueLabel(task.due_date)
          const completing = completingId === task.id
          return (
            <li key={task.id} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onComplete(task.id)}
                disabled={completing}
                className="w-11 h-11 -m-1.5 flex items-center justify-center shrink-0"
                aria-label={`Complete ${task.title}`}
              >
                <span className="w-4 h-4 rounded border-2 border-stone-300 hover:border-green-500 transition-colors flex items-center justify-center">
                  {completing && (
                    <svg className="animate-spin size-2.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </span>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-800">{task.title}</p>
                <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  {task.log_type && (
                    <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full capitalize">
                      {task.log_type}
                    </span>
                  )}
                  {due && (
                    <span className={due.overdue ? 'text-red-500 font-medium' : ''}>
                      {due.text}
                    </span>
                  )}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
