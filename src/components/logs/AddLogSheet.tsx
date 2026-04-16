'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { LogForm } from './LogForm'
import { addLogAction } from '@/lib/actions/orchard'

interface AddLogSheetProps {
  treeId: string
  rowId: string
  treeName?: string
}

export function AddLogSheet({ treeId, rowId, treeName }: AddLogSheetProps) {
  const [open, setOpen] = useState(false)
  const boundAction = addLogAction.bind(null, treeId, rowId)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button />}>Add Log</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add Log{treeName ? ` — ${treeName}` : ''}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <LogForm action={boundAction} onSuccess={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
