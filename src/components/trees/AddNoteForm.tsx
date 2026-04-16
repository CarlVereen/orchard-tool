'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addNoteAction } from '@/lib/actions/orchard'

interface AddNoteFormProps {
  treeId: string
}

export function AddNoteForm({ treeId }: AddNoteFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const action = addNoteAction.bind(null, treeId)

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd)
        formRef.current?.reset()
      }}
      className="space-y-2"
    >
      <Textarea
        name="content"
        placeholder="Add a note about this tree…"
        rows={3}
        required
      />
      <Button type="submit" size="sm">Add Note</Button>
    </form>
  )
}
