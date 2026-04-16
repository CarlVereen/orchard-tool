'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteTreeAction, archiveTreeAction, moveTreeAction } from '@/lib/actions/orchard'
import type { Row } from '@/types/orchard'

interface TreeDangerZoneProps {
  treeId: string
  rowId: string
  orchardId: string
}

type Mode = 'idle' | 'delete-confirm' | 'archive' | 'move'

export function TreeDangerZone({ treeId, rowId, orchardId }: TreeDangerZoneProps) {
  const [mode, setMode] = useState<Mode>('idle')
  const [rows, setRows] = useState<Row[]>([])
  const [loadingRows, setLoadingRows] = useState(false)

  const deleteAction = deleteTreeAction.bind(null, treeId, rowId)
  const archiveAction = archiveTreeAction.bind(null, treeId, rowId)
  const moveAction = moveTreeAction.bind(null, treeId, rowId)

  // Load rows when move mode is opened
  useEffect(() => {
    if (mode !== 'move') return
    setLoadingRows(true)
    fetch(`/api/rows?orchardId=${orchardId}`)
      .then((r) => r.json())
      .then((data: Row[]) => setRows(data.filter((r) => r.id !== rowId)))
      .catch(() => setRows([]))
      .finally(() => setLoadingRows(false))
  }, [mode, orchardId, rowId])

  return (
    <div className="border-t border-red-100 mt-6 pt-5 space-y-3">
      <p className="text-xs font-medium text-red-400 uppercase tracking-wider">Danger Zone</p>

      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('archive')}
            className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:border-stone-400 transition-colors"
          >
            Archive tree…
          </button>
          <button
            type="button"
            onClick={() => setMode('move')}
            className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:border-stone-400 transition-colors"
          >
            Move to row…
          </button>
          <button
            type="button"
            onClick={() => setMode('delete-confirm')}
            className="text-sm px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete tree
          </button>
        </div>
      )}

      {mode === 'delete-confirm' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
          <p className="text-sm text-red-700 font-medium">Delete this tree permanently?</p>
          <p className="text-xs text-red-500">All logs, notes, and photos will be deleted. This cannot be undone.</p>
          <div className="flex gap-2">
            <form action={deleteAction}>
              <Button type="submit" variant="destructive" size="sm">
                Yes, delete
              </Button>
            </form>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode('idle')}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === 'archive' && (
        <form
          action={async (fd) => { await archiveAction(fd) }}
          className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3"
        >
          <p className="text-sm text-stone-700 font-medium">Archive this tree</p>
          <p className="text-xs text-stone-400">Archived trees are hidden from all views but their data is preserved.</p>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" placeholder="e.g. tree died, removed, replanted…" required />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Archive</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode('idle')}>Cancel</Button>
          </div>
        </form>
      )}

      {mode === 'move' && (
        <form
          action={async (fd) => { await moveAction(fd) }}
          className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3"
        >
          <p className="text-sm text-stone-700 font-medium">Move to another row</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new_row_id">Target row</Label>
              {loadingRows ? (
                <p className="text-xs text-stone-400">Loading…</p>
              ) : (
                <select
                  id="new_row_id"
                  name="new_row_id"
                  required
                  className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  <option value="">Select row…</option>
                  {rows.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_position">Position</Label>
              <Input id="new_position" name="new_position" type="number" min="1" placeholder="e.g. 5" required />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Move</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode('idle')}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  )
}
