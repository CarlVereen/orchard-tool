'use client'

import { useRef } from 'react'
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
  const formRef = useRef<HTMLFormElement>(null)

  const action = orchard
    ? updateOrchardAction.bind(null, orchard.id)
    : setupOrchardAction

  return (
    <form
      ref={formRef}
      action={action}
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
      <Button type="submit" className="w-full">
        {orchard ? 'Save Changes' : 'Create Orchard'}
      </Button>
    </form>
  )
}
