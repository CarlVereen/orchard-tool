'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createRowAction, updateRowAction, deleteRowAction } from '@/lib/actions/orchard'
import type { Orchard, Row } from '@/types/orchard'

interface ManageRowsFormProps {
  orchard: Orchard
  rows: Row[]
}

export function ManageRowsForm({ orchard, rows }: ManageRowsFormProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="bg-white border border-stone-200 rounded-lg p-4 flex items-center gap-3">
          {editingId === row.id ? (
            <form
              action={async (fd) => {
                await updateRowAction(row.id, fd)
                setEditingId(null)
              }}
              className="flex-1 flex gap-2"
            >
              <Input name="label" defaultValue={row.label} required className="flex-1" />
              <Button type="submit" size="sm">Save</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            </form>
          ) : (
            <>
              <span className="flex-1 font-medium text-stone-800">{row.label}</span>
              <Button variant="ghost" size="sm" onClick={() => setEditingId(row.id)}>
                Edit
              </Button>
              <form action={deleteRowAction.bind(null, row.id)}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </Button>
              </form>
            </>
          )}
        </div>
      ))}

      <form
        action={async (fd) => {
          fd.append('sort_order', String(rows.length))
          await createRowAction(orchard.id, fd)
        }}
        className="bg-white border border-dashed border-stone-300 rounded-lg p-4 flex gap-2"
      >
        <Input name="label" placeholder="New row label, e.g. Row 4" required className="flex-1" />
        <Button type="submit" variant="outline">Add Row</Button>
      </form>
    </div>
  )
}
