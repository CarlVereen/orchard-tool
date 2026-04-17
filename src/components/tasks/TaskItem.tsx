'use client'

import type { DisplayTask } from '@/types/orchard'

const PRIORITY_BORDER: Record<number, string> = {
  1: 'border-l-red-400',
  2: 'border-l-amber-400',
  3: 'border-l-stone-200',
}

function dueDateLabel(dueDate: string | null): { text: string; overdue: boolean } | null {
  if (!dueDate) return null
  const today = new Date().toISOString().split('T')[0]
  const overdue = dueDate < today
  const isToday = dueDate === today
  const label = new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  if (isToday) return { text: 'Today', overdue: false }
  if (overdue) return { text: `Overdue · ${label}`, overdue: true }
  return { text: label, overdue: false }
}

interface TaskItemProps {
  task: DisplayTask
  onComplete: (taskId: string) => void
  completing?: boolean
}

export function TaskItem({ task, onComplete, completing }: TaskItemProps) {
  const due = dueDateLabel(task.due_date)
  const borderColor = PRIORITY_BORDER[task.priority] ?? 'border-l-stone-200'

  return (
    <div
      className={`flex items-start gap-3 bg-white border border-stone-200 rounded-lg px-3 py-2.5 border-l-[3px] ${borderColor}`}
    >
      <button
        type="button"
        onClick={() => onComplete(task.id)}
        disabled={completing}
        className="w-11 h-11 -m-1.5 flex items-center justify-center shrink-0"
        aria-label="Complete task"
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
          <span>{task.projectName}</span>
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
    </div>
  )
}

interface CompletedTaskItemProps {
  task: DisplayTask
  onUncomplete: (taskId: string) => void
}

export function CompletedTaskItem({ task, onUncomplete }: CompletedTaskItemProps) {
  return (
    <div className="flex items-center gap-3 bg-white border border-stone-100 rounded-lg px-3 py-2">
      <button
        type="button"
        onClick={() => onUncomplete(task.id)}
        className="w-11 h-11 -m-1.5 flex items-center justify-center shrink-0"
        aria-label="Mark incomplete"
      >
        <span className="w-4 h-4 rounded border-2 border-green-400 bg-green-400 flex items-center justify-center hover:border-stone-300 hover:bg-white transition-colors">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
            <path
              d="M10 3L5 8.5 2 5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </span>
      </button>
      <span className="flex-1 text-sm text-stone-400 line-through min-w-0 truncate">
        {task.title}
      </span>
      {task.completed_at && (
        <span className="text-[10px] text-stone-300 shrink-0">
          {new Date(task.completed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}
