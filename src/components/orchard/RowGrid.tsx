'use client'

import { useState } from 'react'
import { TreeCell, EmptyCell } from './TreeCell'
import { Button } from '@/components/ui/button'
import type { RowWithTrees } from '@/types/orchard'

interface RowGridProps {
  row: RowWithTrees
  compact?: boolean
  selectable?: boolean
  onBulkLog?: (treeIds: string[]) => void
}

export function RowGrid({ row, compact = false, selectable = false, onBulkLog }: RowGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)

  const sortedTrees = [...row.trees].sort((a, b) => a.position - b.position)
  const nextPosition = sortedTrees.length > 0 ? sortedTrees[sortedTrees.length - 1].position + 1 : 1

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(row.trees.map((t) => t.id)))
  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkLog = () => {
    if (selectedIds.size === 0) return
    onBulkLog?.(Array.from(selectedIds))
  }

  const handleLogEntireRow = () => {
    onBulkLog?.(row.trees.map((t) => t.id))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {(selectable || onBulkLog) && (
          <>
            <Button
              type="button"
              variant={selectMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectMode(!selectMode)
                if (selectMode) clearSelection()
              }}
            >
              {selectMode ? 'Cancel select' : 'Select trees'}
            </Button>
            {selectMode && (
              <>
                <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                  Select all
                </Button>
                {selectedIds.size > 0 && (
                  <Button type="button" size="sm" onClick={handleBulkLog} className="ml-auto">
                    Log {selectedIds.size} tree{selectedIds.size !== 1 ? 's' : ''}
                  </Button>
                )}
              </>
            )}
            {!selectMode && onBulkLog && row.trees.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={handleLogEntireRow}>
                Log entire row
              </Button>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 pb-1">
        {sortedTrees.map((tree) => (
          <TreeCell
            key={tree.id}
            tree={tree}
            compact={compact}
            selectable={selectMode}
            selected={selectedIds.has(tree.id)}
            onSelect={toggleSelect}
          />
        ))}
        {!selectMode && (
          <EmptyCell position={nextPosition} rowId={row.id} compact={compact} />
        )}
      </div>
    </div>
  )
}
