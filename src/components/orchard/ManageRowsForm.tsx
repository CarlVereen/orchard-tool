'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createRowAction, updateRowAction, deleteRowAction } from '@/lib/actions/orchard'
import type { Orchard, Row } from '@/types/orchard'

interface ManageRowsFormProps {
  orchard: Orchard
  rows: Row[]
}

export function ManageRowsForm({ orchard, rows }: ManageRowsFormProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = async (rowId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusyId(rowId)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const result = await updateRowAction(rowId, fd)
    if (result.ok) {
      setEditingId(null)
    } else {
      setError(result.error)
    }
    setBusyId(null)
  }

  const handleDelete = async (rowId: string) => {
    setBusyId(rowId)
    setError(null)
    const result = await deleteRowAction(rowId)
    if (result.ok) {
      router.push('/')
    } else {
      setError(result.error)
      setBusyId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.append('sort_order', String(rows.length))
    const result = await createRowAction(orchard.id, fd)
    if (result.ok) {
      ;(e.currentTarget as HTMLFormElement).reset()
    } else {
      setError(result.error)
    }
    setCreating(false)
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {rows.map((row) => (
        <div key={row.id} className="bg-white border border-stone-200 rounded-lg p-4 flex items-center gap-3">
          {editingId === row.id ? (
            <form
              onSubmit={(e) => handleUpdate(row.id, e)}
              className="flex-1 flex gap-2"
            >
              <Input name="label" defaultValue={row.label} required className="flex-1" />
              <Button type="submit" size="sm" disabled={busyId === row.id}>Save</Button>
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busyId === row.id}
                onClick={() => handleDelete(row.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      ))}

      <form
        onSubmit={handleCreate}
        className="bg-white border border-dashed border-stone-300 rounded-lg p-4 flex gap-2"
      >
        <Input name="label" placeholder="New row label, e.g. Row 4" required className="flex-1" />
        <Button type="submit" variant="outline" disabled={creating}>Add Row</Button>
      </form>
    </div>
  )
}
