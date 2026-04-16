import { NoteItem } from './NoteItem'
import { AddNoteForm } from './AddNoteForm'
import type { TreeNote } from '@/types/orchard'

interface NotesListProps {
  notes: TreeNote[]
  treeId: string
}

export function NotesList({ notes, treeId }: NotesListProps) {
  return (
    <div className="space-y-4">
      <AddNoteForm treeId={treeId} />

      {notes.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-8">No notes yet. Add observations above.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}
