'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LogTypeIcon } from './LogTypeIcon'
import type { ActionFailure } from '@/lib/errors'
import type { LogType } from '@/types/orchard'

const LOG_TYPES: LogType[] = ['water', 'fertilize', 'production', 'prune', 'mow', 'scout', 'note']

const LOG_LABELS: Record<LogType, string> = {
  water: 'Water',
  fertilize: 'Fertilize',
  production: 'Harvest',
  prune: 'Prune',
  mow: 'Mow',
  scout: 'Scout',
  note: 'Note',
}

interface LogFormProps {
  action: (formData: FormData) => Promise<{ ok: true } | ActionFailure>
  onSuccess?: () => void
  submitLabel?: string
}

export function LogForm({ action, onSuccess, submitLabel = 'Add Log' }: LogFormProps) {
  const [logType, setLogType] = useState<LogType>('water')
  const [severity, setSeverity] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showQuantity = logType === 'production' || logType === 'fertilize'
  const showScout = logType === 'scout'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.append('log_type', logType)
    if (showScout) fd.append('severity', String(severity))
    try {
      const result = await action(fd)
      if (result.ok) {
        onSuccess?.()
      } else {
        setError(result.error)
        setSubmitting(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save log')
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Log type selector — 3-col grid (2 rows of 3) */}
      <div className="space-y-1.5">
        <Label>Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {LOG_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setLogType(type)}
              className={`
                flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all
                ${logType === type
                  ? 'border-stone-800 bg-stone-800 text-white'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }
              `}
            >
              <LogTypeIcon type={type} />
              <span>{LOG_LABELS[type]}</span>
            </button>
          ))}
        </div>
        {logType === 'water' && (
          <p className="text-xs text-stone-400">Log out-of-cycle or supplemental watering events.</p>
        )}
      </div>

      {/* Quantity + unit (production / fertilize) */}
      {showQuantity && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              name="unit"
              placeholder={logType === 'production' ? 'lbs, kg, count…' : 'oz, cups…'}
            />
          </div>
        </div>
      )}

      {/* Scout-specific fields */}
      {showScout && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="target">Pest / Disease Observed</Label>
            <Input
              id="target"
              name="target"
              placeholder="e.g. aphids, fire blight, codling moth…"
            />
          </div>
          <div className="space-y-2">
            <Label>Severity (0 = none, 5 = severe)</Label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSeverity(n)}
                  className={`
                    w-9 h-9 rounded-lg border text-sm font-medium transition-all
                    ${severity === n
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : 'border-stone-200 text-stone-600 hover:border-stone-400'
                    }
                  `}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="logged_at">Date</Label>
        <Input
          id="logged_at"
          name="logged_at"
          type="datetime-local"
          defaultValue={new Date().toISOString().slice(0, 16)}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any observations…"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitLabel}
      </Button>
    </form>
  )
}
