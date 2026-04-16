'use client'

import { useState } from 'react'
import { TreeCell, EmptyCell } from './TreeCell'
import { Button } from '@/components/ui/button'
import type { RowWithTrees, TreeWithLastLog } from '@/types/orchard'

interface RowGridProps {
  row: RowWithTrees
  maxPosition?: number
  compact?: boolean
  selectable?: boolean
  onBulkLog?: (treeIds: string[]) => void
}

export function RowGrid({ row, maxPosition, compact = false, selectable = false, onBulkLog }: RowGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)

  const treeMap = new Map(row.trees.map((t) => [t.position, t]))
  const maxPos = maxPosition ?? Math.max(...row.trees.map((t) => t.position), 0)

  const cells: (TreeWithLastLog | null)[] = Array.from({ length: maxPos }, (_, i) => treeMap.get(i + 1) ?? null)

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
        {cells.map((tree, i) =>
          tree ? (
            <TreeCell
              key={tree.id}
              tree={tree}
              compact={compact}
              selectable={selectMode}
              selected={selectedIds.has(tree.id)}
              onSelect={toggleSelect}
            />
          ) : (
            <EmptyCell key={i} position={i + 1} rowId={row.id} compact={compact} />
          )
        )}
        {/* Append slot to add at next position */}
        {!selectMode && (
          <EmptyCell position={maxPos + 1} rowId={row.id} compact={compact} />
        )}
      </div>
    </div>
  )
}
