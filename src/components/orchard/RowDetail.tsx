'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { RowHeader } from './RowHeader'
import { RowGrid } from './RowGrid'
import { BulkLogSheet } from '@/components/logs/BulkLogSheet'
import { AddTreeDialog } from './AddTreeDialog'
import { RowTasksCard } from './RowTasksCard'
import { completeRowTaskAction } from '@/lib/actions/tasks'
import type { RowWithTrees, RowTask } from '@/types/orchard'

interface RowDetailProps {
  row: RowWithTrees
  rowTasks: RowTask[]
  addAtPosition?: number
}

export function RowDetail({ row, rowTasks, addAtPosition }: RowDetailProps) {
  const [bulkIds, setBulkIds] = useState<string[]>([])
  const [bulkOpen, setBulkOpen] = useState(false)
  const [addTreePos, setAddTreePos] = useState<number | null>(addAtPosition ?? null)
  const [tasks, setTasks] = useState<RowTask[]>(rowTasks)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (addAtPosition !== undefined) {
      setAddTreePos(addAtPosition)
    }
  }, [addAtPosition])

  useEffect(() => {
    setTasks(rowTasks)
  }, [rowTasks])

  const handleBulkLog = (ids: string[]) => {
    setBulkIds(ids)
    setBulkOpen(true)
  }

  const handleCompleteRowTask = (taskId: string) => {
    setCompletingId(taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    startTransition(async () => {
      const restoreOnFailure = () => {
        setTasks((prev) => [
          ...prev,
          ...rowTasks.filter((t) => t.id === taskId && !prev.some((p) => p.id === taskId)),
        ])
      }
      try {
        const result = await completeRowTaskAction(taskId, row.id)
        if (!result.ok) {
          toast.error(result.error)
          restoreOnFailure()
        } else if (result.loggedCount > 0 && result.logType) {
          toast.success(`Logged ${result.logType} on row and ${result.loggedCount - 1} tree${result.loggedCount - 1 === 1 ? '' : 's'}`)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to complete row task')
        restoreOnFailure()
      } finally {
        setCompletingId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      <RowHeader row={row} showLink={false} />

      {tasks.length > 0 && (
        <RowTasksCard tasks={tasks} onComplete={handleCompleteRowTask} completingId={completingId} />
      )}

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
