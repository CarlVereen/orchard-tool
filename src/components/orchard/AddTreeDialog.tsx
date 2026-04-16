'use client'

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
  const action = createTreeAction.bind(null, rowId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tree — Position {position}</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            fd.append('position', String(position))
            await action(fd)
            onOpenChange(false)
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
          <div className="space-y-1.5">
            <Label htmlFor="planted_at">Date Planted</Label>
            <Input id="planted_at" name="planted_at" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <div className="flex gap-2">
            <SubmitButton className="flex-1">Add Tree</SubmitButton>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
