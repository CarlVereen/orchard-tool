'use client'

import { useState } from 'react'
import { RowHeader } from './RowHeader'
import { RowGrid } from './RowGrid'
import { BulkLogSheet } from '@/components/logs/BulkLogSheet'
import { AddTreeDialog } from './AddTreeDialog'
import type { RowWithTrees } from '@/types/orchard'

interface RowDetailProps {
  row: RowWithTrees
  addAtPosition?: number
}

export function RowDetail({ row, addAtPosition }: RowDetailProps) {
  const [bulkIds, setBulkIds] = useState<string[]>([])
  const [bulkOpen, setBulkOpen] = useState(false)
  const [addTreePos, setAddTreePos] = useState<number | null>(addAtPosition ?? null)

  const handleBulkLog = (ids: string[]) => {
    setBulkIds(ids)
    setBulkOpen(true)
  }

  return (
    <div className="space-y-4">
      <RowHeader row={row} showLink={false} />

      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <RowGrid
          row={row}
          selectable
          onBulkLog={handleBulkLog}
        />
      </div>

      {addTreePos !== null && (
        <AddTreeDialog
          rowId={row.id}
          position={addTreePos}
          open
          onOpenChange={(open) => !open && setAddTreePos(null)}
        />
      )}

      <BulkLogSheet
        treeIds={bulkIds}
        rowId={row.id}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
      />
    </div>
  )
}
