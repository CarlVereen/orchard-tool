'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createProjectTaskAction } from '@/lib/actions/tasks'
import { toast } from 'sonner'

interface AddProjectTaskFormProps {
  projectId: string
  phase?: number
}

export function AddProjectTaskForm({ projectId, phase }: AddProjectTaskFormProps) {
  const [adding, setAdding] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      if (phase) formData.set('phase', String(phase))
      await createProjectTaskAction(projectId, formData)
      setAdding(false)
      ;(e.currentTarget as HTMLFormElement).reset()
    } catch {
      toast.error('Failed to add task')
    } finally {
      setSubmitting(false)
    }
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="w-full py-2 border border-dashed border-stone-200 rounded-lg text-xs text-stone-400 hover:text-stone-600 hover:border-stone-300 transition-colors"
      >
        + Add task
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="task-title">Task</Label>
        <Input id="task-title" name="title" placeholder="e.g., Order compost" required autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="task-priority">Priority</Label>
          <select
            id="task-priority"
            name="priority"
            defaultValue="2"
            className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="1">High</option>
            <option value="2">Medium</option>
            <option value="3">Low</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-due-date">
            Due date <span className="text-stone-400 font-normal">(opt.)</span>
          </Label>
          <Input id="task-due-date" name="due_date" type="date" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          Add task
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
