'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { Textarea } from '@/components/ui/textarea'
import { updateNoteAction, deleteNoteAction } from '@/lib/actions/orchard'
import type { TreeNote } from '@/types/orchard'

interface NoteItemProps {
  note: TreeNote
}

function formatNoteDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function NoteItem({ note }: NoteItemProps) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const updateAction = updateNoteAction.bind(null, note.id, note.tree_id)
  const deleteAction = deleteNoteAction.bind(null, note.id, note.tree_id)

  if (editing) {
    return (
      <form
        action={async (fd) => {
          await updateAction(fd)
          setEditing(false)
        }}
        className="bg-white border border-stone-200 rounded-lg p-4 space-y-2"
      >
        <Textarea name="content" defaultValue={note.content} rows={3} required autoFocus />
        <div className="flex gap-2">
          <SubmitButton size="sm">Save</SubmitButton>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </form>
    )
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <p className="text-sm text-stone-700 whitespace-pre-wrap">{note.content}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-stone-400">{formatNoteDate(note.created_at)}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-stone-400 hover:text-stone-600 px-2 py-0.5 transition-colors"
          >
            Edit
          </button>
          {confirmDelete ? (
            <>
              <form action={deleteAction} className="inline">
                <button type="submit" className="text-xs text-red-500 hover:text-red-700 px-2 py-0.5 transition-all active:scale-[0.97]">
                  Confirm
                </button>
              </form>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-stone-400 hover:text-stone-600 px-2 py-0.5 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-stone-400 hover:text-red-500 px-2 py-0.5 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
