'use client'

import { useState, useTransition } from 'react'
import { EXPERT_CARE_SCHEDULES, type ExpertSpecies } from '@/lib/data/care-schedules'
import { completeProjectTaskAction, uncompleteProjectTaskAction } from '@/lib/actions/tasks'
import { toast } from 'sonner'
import type { ProjectTask } from '@/types/orchard'

interface AnnualCalendarProps {
  species: ExpertSpecies
  existingTasks: ProjectTask[]
}

interface MonthGroup {
  label: string
  monthStart: number
  monthEnd: number
  tasks: {
    title: string
    description: string
    logType: string | null
    existingTask: ProjectTask | null
    isCurrent: boolean
    isPast: boolean
  }[]
}

export function AnnualCalendar({ species, existingTasks }: AnnualCalendarProps) {
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const speciesTasks = EXPERT_CARE_SCHEDULES.filter((t) => t.species === species)

  const tasksByTitle = new Map(existingTasks.map((t) => [t.title, t]))

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const groups: MonthGroup[] = []
  const seen = new Set<string>()

  for (const task of speciesTasks) {
    const key = `${task.monthStart}-${task.monthEnd}`
    const label =
      task.monthStart === task.monthEnd
        ? monthNames[task.monthStart - 1]
        : `${monthNames[task.monthStart - 1]}–${monthNames[task.monthEnd - 1]}`

    let group = groups.find(
      (g) => g.monthStart === task.monthStart && g.monthEnd === task.monthEnd
    )
    if (!group) {
      group = { label, monthStart: task.monthStart, monthEnd: task.monthEnd, tasks: [] }
      groups.push(group)
    }

    const taskKey = `${task.species}-${task.title}`
    if (seen.has(taskKey)) continue
    seen.add(taskKey)

    const isCurrent = currentMonth >= task.monthStart && currentMonth <= task.monthEnd
    const isPast = currentMonth > task.monthEnd

    group.tasks.push({
      title: task.title,
      description: task.description,
      logType: task.logType,
      existingTask: tasksByTitle.get(task.title) ?? null,
      isCurrent,
      isPast,
    })
  }

  groups.sort((a, b) => a.monthStart - b.monthStart)

  const handleComplete = (taskId: string) => {
    setCompletingId(taskId)
    startTransition(async () => {
      try {
        const result = await completeProjectTaskAction(taskId)
        if (result.loggedCount > 0) {
          toast.success(`Logged ${result.logType} on ${result.loggedCount} tree${result.loggedCount === 1 ? '' : 's'}`)
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
      try {
        await uncompleteProjectTaskAction(taskId)
      } catch {
        toast.error('Failed to undo')
      }
    })
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isCurrentGroup = group.tasks.some((t) => t.isCurrent)
        const isPastGroup = group.tasks.every((t) => t.isPast)

        return (
          <div
            key={group.label}
            className={`rounded-lg border ${
              isCurrentGroup
                ? 'border-stone-300 bg-white'
                : isPastGroup
                ? 'border-stone-100 bg-stone-50 opacity-60'
                : 'border-stone-100 bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
              <span className={`text-xs font-semibold ${isCurrentGroup ? 'text-stone-700' : 'text-stone-400'}`}>
                {group.label}
              </span>
              {isCurrentGroup && (
                <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                  Current
                </span>
              )}
            </div>
            <div className="p-2 space-y-1.5">
              {group.tasks.map((task) => {
                const completed = task.existingTask?.completed_at
                const canComplete = task.isCurrent && task.existingTask && !completed
                const canUncomplete = completed && task.existingTask

                return (
                  <div key={task.title} className="flex items-start gap-2 px-1 py-1">
                    {canComplete ? (
                      <button
                        type="button"
                        onClick={() => handleComplete(task.existingTask!.id)}
                        disabled={completingId === task.existingTask!.id}
                        className="w-11 h-11 -m-1.5 flex items-center justify-center shrink-0"
                      >
                        <span className="w-4 h-4 rounded border-2 border-stone-300 hover:border-green-500 transition-colors flex items-center justify-center">
                          {completingId === task.existingTask!.id && (
                            <svg className="animate-spin size-2.5" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          )}
                        </span>
                      </button>
                    ) : canUncomplete ? (
                      <button
                        type="button"
                        onClick={() => handleUncomplete(task.existingTask!.id)}
                        className="w-11 h-11 -m-1.5 flex items-center justify-center shrink-0"
                      >
                        <span className="w-4 h-4 rounded border-2 border-green-400 bg-green-400 flex items-center justify-center hover:border-stone-300 hover:bg-white transition-colors">
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12">
                            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        </span>
                      </button>
                    ) : (
                      <div className="w-4 h-4 shrink-0 mt-0.5">
                        <span className={`block w-2 h-2 rounded-full mt-1 ml-1 ${
                          task.isPast ? 'bg-stone-200' : 'bg-stone-300'
                        }`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${completed ? 'text-stone-400 line-through' : task.isPast && !completed ? 'text-stone-400' : 'text-stone-700'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">{task.description}</p>
                      {task.logType && (
                        <span className="inline-block text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full capitalize mt-1">
                          {task.logType}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
