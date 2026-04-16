'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteTreeAction, archiveTreeAction, moveTreeAction } from '@/lib/actions/orchard'
import type { Row } from '@/types/orchard'

interface TreeDangerZoneProps {
  treeId: string
  rowId: string
  allRows: Row[]
}

type Mode = 'idle' | 'delete-confirm' | 'archive' | 'move'

export function TreeDangerZone({ treeId, rowId, allRows }: TreeDangerZoneProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('idle')
  const [deleting, setDeleting] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [moving, setMoving] = useState(false)
  const [moveError, setMoveError] = useState<string | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [selectedRowId, setSelectedRowId] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')

  const otherRows = allRows.filter((r) => r.id !== rowId)

  const handleDelete = async () => {
    setDeleting(true)
    await deleteTreeAction(treeId, rowId)
    router.push(`/rows/${rowId}`)
  }

  const handleMove = async () => {
    const position = parseInt(selectedPosition)
    if (!selectedRowId || !position || isNaN(position)) return
    setMoving(true)
    setMoveError(null)
    try {
      await moveTreeAction(treeId, rowId, selectedRowId, position)
      router.push(`/rows/${selectedRowId}`)
    } catch (err) {
      setMoveError(err instanceof Error ? err.message : 'Move failed')
      setMoving(false)
    }
  }

  const archiveAction = archiveTreeAction.bind(null, treeId, rowId)

  return (
    <div className="border-t border-red-100 mt-6 pt-5 space-y-3">
      <p className="text-xs font-medium text-red-400 uppercase tracking-wider">Danger Zone</p>

      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('archive')}
            className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:border-stone-400 transition-all active:scale-[0.97]"
          >
            Archive tree…
          </button>
          <button
            type="button"
            onClick={() => setMode('move')}
            className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:border-stone-400 transition-all active:scale-[0.97]"
          >
            Move to row…
          </button>
          <button
            type="button"
            onClick={() => setMode('delete-confirm')}
            className="text-sm px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-all active:scale-[0.97]"
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
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting && (
                <svg className="animate-spin size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Yes, delete
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={deleting} onClick={() => setMode('idle')}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === 'archive' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setArchiving(true)
            setArchiveError(null)
            try {
              await archiveAction(new FormData(e.currentTarget))
              router.push(`/rows/${rowId}`)
            } catch (err) {
              setArchiveError(err instanceof Error ? err.message : 'Archive failed')
              setArchiving(false)
            }
          }}
          className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3"
        >
          <p className="text-sm text-stone-700 font-medium">Archive this tree</p>
          <p className="text-xs text-stone-400">Archived trees are hidden from all views but their data is preserved.</p>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" placeholder="e.g. tree died, removed, replanted…" required />
          </div>
          {archiveError && (
            <p className="text-xs text-red-500">{archiveError}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={archiving}>
              {archiving && <svg className="animate-spin size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              Archive
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={archiving} onClick={() => setMode('idle')}>Cancel</Button>
          </div>
        </form>
      )}

      {mode === 'move' && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3">
          <p className="text-sm text-stone-700 font-medium">Move to another row</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new_row_id">Target row</Label>
              <select
                id="new_row_id"
                value={selectedRowId}
                onChange={(e) => setSelectedRowId(e.target.value)}
                className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                <option value="">Select row…</option>
                {otherRows.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_position">Position</Label>
              <Input
                id="new_position"
                type="number"
                min="1"
                placeholder="e.g. 12"
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
              />
            </div>
          </div>
          {moveError && (
            <p className="text-xs text-red-500">{moveError}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={moving || !selectedRowId || !selectedPosition}
              onClick={handleMove}
            >
              {moving && <svg className="animate-spin size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              Move
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={moving} onClick={() => { setMode('idle'); setMoveError(null); setSelectedRowId(''); setSelectedPosition('') }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
