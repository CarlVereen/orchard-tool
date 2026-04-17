'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { createUserProjectAction } from '@/lib/actions/tasks'
import { toast } from 'sonner'

interface CreateProjectSheetProps {
  orchardId: string
}

export function CreateProjectSheet({ orchardId }: CreateProjectSheetProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createUserProjectAction(orchardId, new FormData(e.currentTarget))
      toast.success('Project created')
      setOpen(false)
    } catch {
      toast.error('Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className="w-full py-3 border border-dashed border-stone-200 rounded-lg text-sm text-stone-400 hover:text-stone-600 hover:border-stone-300 transition-colors"
          />
        }
      >
        + New Project
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New Project</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              name="name"
              placeholder="e.g., Fix irrigation, Build deer fence"
              required
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Project'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
