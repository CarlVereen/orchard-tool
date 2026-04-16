'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createTreeAction } from '@/lib/actions/orchard'

interface AddTreeDialogProps {
  rowId: string
  position: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTreeDialog({ rowId, position, open, onOpenChange }: AddTreeDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const action = createTreeAction.bind(null, rowId)

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setError(null) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tree</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setSubmitting(true)
            try {
              await action(new FormData(e.currentTarget))
              onOpenChange(false)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to add tree')
            } finally {
              setSubmitting(false)
            }
          }}
          className="space-y-4 mt-2"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="variety">Variety</Label>
              <Input id="variety" name="variety" placeholder="e.g. Honeycrisp" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="species">Species</Label>
              <Input id="species" name="species" placeholder="e.g. Apple" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="position">Position</Label>
              <Input id="position" name="position" type="number" min="1" defaultValue={position} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="planted_at">Date Planted</Label>
              <Input id="planted_at" name="planted_at" type="date" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting && (
                <svg className="animate-spin size-3.5 shrink-0 mr-1.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Add Tree
            </Button>
            <Button type="button" variant="ghost" disabled={submitting} onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
