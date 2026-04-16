'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { LogForm } from './LogForm'
import { addBulkLogAction } from '@/lib/actions/orchard'

interface BulkLogSheetProps {
  treeIds: string[]
  rowId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkLogSheet({ treeIds, rowId, open, onOpenChange }: BulkLogSheetProps) {
  const boundAction = addBulkLogAction.bind(null, treeIds, rowId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            Log {treeIds.length} tree{treeIds.length !== 1 ? 's' : ''}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <LogForm
            action={boundAction}
            onSuccess={() => onOpenChange(false)}
            submitLabel={`Log ${treeIds.length} Tree${treeIds.length !== 1 ? 's' : ''}`}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
