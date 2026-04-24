'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { setupOrchardAction, updateOrchardAction } from '@/lib/actions/orchard'
import type { Orchard } from '@/types/orchard'

interface SetupFormProps {
  orchard?: Orchard
}

export function SetupForm({ orchard }: SetupFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    try {
      const result = orchard
        ? await updateOrchardAction(orchard.id, fd)
        : await setupOrchardAction(fd)
      if (result.ok) {
        if (!orchard) router.push('/')
      } else {
        setError(result.error)
        setSaving(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white border border-stone-200 rounded-lg p-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Orchard Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={orchard?.name ?? ''}
          placeholder="e.g. Home Orchard"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={orchard?.description ?? ''}
          placeholder="Location, notes about the orchard..."
          rows={3}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={saving} className="w-full">
        {orchard ? 'Save Changes' : 'Create Orchard'}
      </Button>
    </form>
  )
}
