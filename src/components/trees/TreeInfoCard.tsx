'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateTreeAction } from '@/lib/actions/orchard'
import { TreeDangerZone } from './TreeDangerZone'
import type { Tree, TreeCondition, Row } from '@/types/orchard'

interface TreeInfoCardProps {
  tree: Tree
  rowLabel: string
  rowId: string
  orchardId: string
  allRows: Row[]
}

const CONDITIONS: { value: TreeCondition; label: string; color: string }[] = [
  { value: 'good',  label: 'Good',  color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'fair',  label: 'Fair',  color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'poor',  label: 'Poor',  color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'dead',  label: 'Dead',  color: 'bg-stone-100 text-stone-500 border-stone-300' },
]

function conditionStyle(cond: TreeCondition) {
  return CONDITIONS.find((c) => c.value === cond)?.color ?? ''
}

export function TreeInfoCard({ tree, rowLabel, rowId, orchardId, allRows }: TreeInfoCardProps) {
  const [editing, setEditing] = useState(false)
  const [condition, setCondition] = useState<TreeCondition>(tree.condition ?? 'good')

  const action = updateTreeAction.bind(null, tree.id, rowId)

  if (!editing) {
    return (
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-stone-400 mb-0.5">{rowLabel} · Position {tree.position}</p>
            <h2 className="text-xl font-semibold text-stone-800">
              {tree.variety ?? 'Unnamed tree'}
            </h2>
            {tree.species && (
              <p className="text-sm text-stone-500 mt-0.5">{tree.species}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${conditionStyle(tree.condition ?? 'good')}`}>
              {CONDITIONS.find((c) => c.value === (tree.condition ?? 'good'))?.label}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>
        </div>
        <div className="space-y-1.5 pt-3 border-t border-stone-100">
          {tree.planted_at && (
            <p className="text-sm text-stone-500">
              <span className="font-medium text-stone-600">Planted: </span>
              {new Date(tree.planted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
          {tree.rootstock && (
            <p className="text-sm text-stone-500">
              <span className="font-medium text-stone-600">Rootstock: </span>{tree.rootstock}
            </p>
          )}
          {tree.watering_cycle_days && (
            <p className="text-sm text-stone-500">
              <span className="font-medium text-stone-600">Watering cycle: </span>every {tree.watering_cycle_days} days
            </p>
          )}
          {tree.condition_notes && (
            <p className="text-sm text-stone-400 italic">{tree.condition_notes}</p>
          )}
          {tree.notes && (
            <p className="text-sm text-stone-500 mt-1">{tree.notes}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <form
      action={async (fd) => {
        fd.append('condition', condition)
        await action(fd)
        setEditing(false)
      }}
      className="bg-white border border-stone-200 rounded-lg p-5 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="variety">Variety</Label>
          <Input id="variety" name="variety" defaultValue={tree.variety ?? ''} placeholder="e.g. Honeycrisp" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="species">Species</Label>
          <Input id="species" name="species" defaultValue={tree.species ?? ''} placeholder="e.g. Apple" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="rootstock">Rootstock</Label>
          <Input id="rootstock" name="rootstock" defaultValue={tree.rootstock ?? ''} placeholder="e.g. M.9, Geneva 41" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="watering_cycle_days">Watering cycle (days)</Label>
          <Input
            id="watering_cycle_days"
            name="watering_cycle_days"
            type="number"
            min="1"
            defaultValue={tree.watering_cycle_days ?? ''}
            placeholder="e.g. 7"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Condition</Label>
        <div className="flex gap-2 flex-wrap">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCondition(c.value)}
              className={`
                px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
                ${condition === c.value ? c.color + ' ring-2 ring-offset-1 ring-stone-400' : 'border-stone-200 text-stone-500 hover:border-stone-300'}
              `}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="condition_notes">Condition notes</Label>
        <Input
          id="condition_notes"
          name="condition_notes"
          defaultValue={tree.condition_notes ?? ''}
          placeholder="Brief description of current condition"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="planted_at">Date Planted</Label>
        <Input id="planted_at" name="planted_at" type="date" defaultValue={tree.planted_at ?? ''} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={tree.notes ?? ''} rows={3} />
      </div>

      <div className="flex gap-2">
        <SubmitButton>Save</SubmitButton>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
      </div>

      <TreeDangerZone treeId={tree.id} rowId={rowId} allRows={allRows} />
    </form>
  )
}
